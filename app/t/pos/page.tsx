"use client";

import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useMemo, useRef, useState } from "react";

import type {
  POSCategory,
  PosTicketLine,
  PublicMenuItemDetail,
  PublicModifierGroup,
} from "@/types";

import {
  useGetMenuCategoriesQuery,
  useGetMenuItemsQuery,
  useListPosTicketsQuery,
  useMenuItemDetailQuery,
  useMyPosTicketQuery,
  useQuotePosTicketQuery,
} from "@/lib/tan-stack/pos/query";

import {
  useAddPosPaymentByOrderIdMutation,
  useApplyPosPromoMutation,
  useConvertPosTicketMutation,
  useCreatePosTicketMutation,
  useHoldPosTicketMutation,
  useRecallPosTicketByTokenMutation,
  useRemovePosPromoMutation,
  useSetPosTicketItemsMutation,
  useUpdatePosTicketContextMutation,
} from "@/lib/tan-stack/pos/mutation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePermissions } from "@/lib/permissions/usePermissions";
import {
  clearTicketToken,
  loadTicketToken,
  saveTicketToken,
} from "@/lib/tan-stack/pos/ticket-token";
import { Plus } from "lucide-react";

type MenuItem = {
  id: string;
  sku?: string | null;
  name?: string | null;
  slug?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  basePrice?: string | number | null;
};

type MenuItemsQuery = {
  data?: {
    pages?: Array<{
      data?: {
        items?: MenuItem[];
        hasMore?: boolean;
        nextCursor?: string | null;
      };
    }>;
  };
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  hasNextPage?: boolean;
  fetchNextPage?: () => Promise<unknown>;
};

function formatMoney(raw?: string | number | null) {
  const n =
    typeof raw === "number"
      ? raw
      : typeof raw === "string"
        ? Number.parseFloat(raw)
        : 0;
  if (!Number.isFinite(n)) return "0.00";
  return n.toFixed(2);
}

export default function POSPage() {
  // -------------------------
  // Ticket token + order id
  // -------------------------
  const [ticketToken, setTicketToken] = useState<string | null>(() =>
    loadTicketToken(),
  );
  const [orderId, setOrderId] = useState<string | null>(null);

  // -------------------------
  // Menu data
  // -------------------------
  const categoriesQ = useGetMenuCategoriesQuery();
  const categories = useMemo<POSCategory[]>(
    () => (categoriesQ?.data?.meta?.categories as POSCategory[]) ?? [],
    [categoriesQ.data?.meta?.categories],
  );
  const menu = categoriesQ?.data?.meta?.menu;

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [search, setSearch] = useState("");
  const activeCategoryId = selectedCategoryId || categories[0]?.id || "";

  const [heldOpen, setHeldOpen] = useState(false);
  const [discountOpen, setDiscountOpen] = useState(false);
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [contextOpen, setContextOpen] = useState(false);
  const [barcodeOpen, setBarcodeOpen] = useState(false);
  const [lastScan, setLastScan] = useState<string | null>(null);
  const [lastScanError, setLastScanError] = useState<string | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentMethodDraft, setPaymentMethodDraft] = useState<"cash" | "card">(
    "cash",
  );
  const [paymentAmountDraft, setPaymentAmountDraft] = useState("");
  const [paymentTipDraft, setPaymentTipDraft] = useState("");
  const [uiError, setUiError] = useState<string | null>(null);

  const [orderTypeDraft, setOrderTypeDraft] = useState<
    "dine_in" | "takeaway" | "delivery" | "catering"
  >("takeaway");
  const [tableNumberDraft, setTableNumberDraft] = useState("");
  const [customerNotesDraft, setCustomerNotesDraft] = useState("");
  const [kitchenNotesDraft, setKitchenNotesDraft] = useState("");
  const { can } = usePermissions();
  const canManagePos = can("pos", "manage");

  // -------------------------
  // Item customization (modifier groups)
  // -------------------------
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [customizeSlug, setCustomizeSlug] = useState<string | null>(null);
  const [customizeIndex, setCustomizeIndex] = useState<number | null>(null); // edit existing line when not null
  const [selectedModsByGroup, setSelectedModsByGroup] = useState<
    Record<string, string[]>
  >({});
  const [customizeError, setCustomizeError] = useState<string | null>(null);

  const itemDetailQ = useMenuItemDetailQuery(customizeSlug, canManagePos);
  const itemDetail = (
    itemDetailQ.data as
      | { success: boolean; data: PublicMenuItemDetail }
      | undefined
  )?.data;

  // If we entered edit mode with a flat list (from a cart line), remap it to groupIds once detail loads.
  useEffect(() => {
    if (!itemDetail?.modifierGroups?.length) return;
    if (!selectedModsByGroup["__flat__"]?.length) return;
    const flat = selectedModsByGroup["__flat__"];
    const next: Record<string, string[]> = {};
    for (const g of itemDetail.modifierGroups) {
      const allowed = new Set(g.modifiers.map((m) => m.id));
      const picked = flat.filter((id) => allowed.has(id));
      if (picked.length) next[g.id] = picked;
    }
    // eslint-disable-next-line
    setSelectedModsByGroup(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemDetail?.id]);

  function resetCustomization() {
    setSelectedModsByGroup({});
    setCustomizeError(null);
  }

  function validateGroups(groups: PublicModifierGroup[] | undefined) {
    if (!groups?.length) return { ok: true as const };
    for (const g of groups) {
      const selected = selectedModsByGroup[g.id] ?? [];
      const min = Math.max(0, g.minSelections ?? 0);
      const max = g.maxSelections ?? null;
      const requiredMin = g.isRequired ? Math.max(1, min) : min;

      if (selected.length < requiredMin) {
        return {
          ok: false as const,
          message: `Select at least ${requiredMin} for "${g.name}"`,
        };
      }
      if (max != null && selected.length > max) {
        return {
          ok: false as const,
          message: `Select at most ${max} for "${g.name}"`,
        };
      }
      if (g.selectionType === "exactly" && selected.length !== min) {
        return {
          ok: false as const,
          message: `Select exactly ${min} for "${g.name}"`,
        };
      }
      if (g.selectionType === "single" && selected.length > 1) {
        return {
          ok: false as const,
          message: `"${g.name}" allows 1 selection`,
        };
      }
    }
    return { ok: true as const };
  }

  const itemsQ = useGetMenuItemsQuery(
    activeCategoryId,
    menu?.id ?? "",
    canManagePos,
  ) as unknown as MenuItemsQuery;
  const items = useMemo<MenuItem[]>(() => {
    const pages = itemsQ.data?.pages ?? [];
    const out: MenuItem[] = [];
    for (const p of pages) out.push(...(p.data?.items ?? []));
    return out;
  }, [itemsQ.data?.pages]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => {
      return (
        it.name?.toLowerCase().includes(q) ||
        it.slug?.toLowerCase().includes(q) ||
        it.description?.toLowerCase().includes(q)
      );
    });
  }, [items, search]);
  console.log(filteredItems);

  // -------------------------
  // Ticket data
  // -------------------------
  const ticketQ = useMyPosTicketQuery(ticketToken, canManagePos);
  const quoteQ = useQuotePosTicketQuery(ticketToken, canManagePos);
  const heldTicketsQ = useListPosTicketsQuery({ status: "held", limit: 50 });

  // Local cart (optimistic UI) — sync via PUT items
  const [cartItems, setCartItems] = useState<PosTicketLine[]>([]);
  const ticketUpdatedAt = ticketQ.data?.updatedAt;

  useEffect(() => {
    // When server ticket loads/changes, sync local cart
    if (ticketQ.data?.cartItems) {
      // eslint-disable-next-line
      setCartItems(ticketQ.data.cartItems);
    } else if (!ticketToken) {
      setCartItems([]);
    }
  }, [ticketQ.data?.id, ticketQ.data?.cartItems, ticketToken]);

  // Build item lookup for nicer cart rendering (best-effort)
  const itemById = useMemo(() => {
    const m = new Map<string, MenuItem>();
    for (const it of items) m.set(it.id, it);
    return m;
  }, [items]);

  const itemBySku = useMemo(() => {
    const m = new Map<string, MenuItem>();
    for (const it of items) {
      const sku = it.sku?.trim();
      if (sku) m.set(sku, it);
    }
    return m;
  }, [items]);

  // -------------------------
  // Mutations
  // -------------------------
  const createTicketM = useCreatePosTicketMutation();

  const setItemsM = useSetPosTicketItemsMutation(ticketToken ?? "");
  const holdM = useHoldPosTicketMutation(ticketToken ?? "");
  const convertM = useConvertPosTicketMutation(ticketToken ?? "");
  const payByOrderIdM = useAddPosPaymentByOrderIdMutation();
  const recallByTokenM = useRecallPosTicketByTokenMutation();
  const applyPromoM = useApplyPosPromoMutation(ticketToken ?? "");
  const removePromoM = useRemovePosPromoMutation(ticketToken ?? "");
  const updateContextM = useUpdatePosTicketContextMutation(ticketToken ?? "");

  // -------------------------
  // Helpers
  // -------------------------
  async function ensureTicket(): Promise<string> {
    if (ticketToken) return ticketToken;

    const t = await createTicketM.mutateAsync({ orderType: "takeaway" });
    await saveTicketToken(t.sessionToken);
    setTicketToken(t.sessionToken);
    setOrderId(null);
    return t.sessionToken;
  }

  async function syncCart(next: PosTicketLine[]) {
    await ensureTicket();
    const prev = cartItems;
    setCartItems(next);

    // server sync (idempotent)
    if (!setItemsM) return;
    try {
      await setItemsM.mutateAsync({
        items: next,
        clientUpdatedAt: ticketUpdatedAt,
      });
    } catch {
      setCartItems(prev);
      setUiError("Failed to sync cart. Check backend connection and retry.");
    }
  }

  function upsertLineAddOne(menuItemId: string) {
    // Only merge into a plain line (no modifiers/notes). If there are multiple
    // customized variants of the same item, keep them as separate lines.
    const idx = cartItems.findIndex(
      (l) =>
        l.menuItemId === menuItemId &&
        (!l.modifiers || l.modifiers.length === 0) &&
        !l.specialInstructions,
    );
    if (idx === -1) return [...cartItems, { menuItemId, quantity: 1 }];
    return cartItems.map((l, i) =>
      i === idx ? { ...l, quantity: l.quantity + 1 } : l,
    );
  }

  const syncCartRef = useRef(syncCart);
  const upsertRef = useRef(upsertLineAddOne);
  const itemBySkuRef = useRef(itemBySku);

  useEffect(() => {
    syncCartRef.current = syncCart;
    upsertRef.current = upsertLineAddOne;
    itemBySkuRef.current = itemBySku;
  });

  // -------------------------
  // Barcode scanning (keyboard-wedge)
  // -------------------------
  useEffect(() => {
    let buffer = "";
    let lastTs = 0;

    const onKeyDown = (e: KeyboardEvent) => {
      const el = document.activeElement as HTMLElement | null;
      const tag = el?.tagName?.toLowerCase();
      const isTypingTarget =
        tag === "input" ||
        tag === "textarea" ||
        (el?.getAttribute?.("contenteditable") ?? "false") === "true";
      if (isTypingTarget) return;

      const now = Date.now();
      if (now - lastTs > 200) buffer = "";
      lastTs = now;

      if (e.key === "Enter") {
        const code = buffer.trim();
        buffer = "";
        if (!code) return;

        setLastScan(code);
        const it = itemBySkuRef.current.get(code);
        if (!it) {
          setLastScanError(`Unknown barcode/SKU: ${code}`);
          setBarcodeOpen(true);
          return;
        }
        setLastScanError(null);
        // If item has modifiers, open customization; otherwise quick add.
        if (it.slug) {
          setCustomizeSlug(it.slug);
          setCustomizeIndex(null);
          resetCustomization();
          setCustomizeOpen(true);
        } else {
          void syncCartRef.current(upsertRef.current(it.id));
        }
        return;
      }

      if (e.key === "Escape") {
        buffer = "";
        return;
      }

      if (e.key.length === 1) buffer += e.key;
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function incAt(index: number) {
    return cartItems.map((l, i) =>
      i === index ? { ...l, quantity: l.quantity + 1 } : l,
    );
  }

  function decAt(index: number) {
    return cartItems.map((l, i) =>
      i === index ? { ...l, quantity: Math.max(1, l.quantity - 1) } : l,
    );
  }

  function removeAt(index: number) {
    return cartItems.filter((_, i) => i !== index);
  }

  const totals = quoteQ.data;
  const subtotal = totals?.subtotal ?? "0.00";
  const tax = totals?.taxAmount ?? "0.00";
  const total = totals?.total ?? "0.00";

  const busy =
    createTicketM.isPending ||
    Boolean(setItemsM?.isPending) ||
    Boolean(convertM?.isPending) ||
    Boolean(holdM?.isPending) ||
    Boolean(payByOrderIdM.isPending);

  // -------------------------
  // Actions wired to UI
  // -------------------------
  async function onNewTicket() {
    const t = await createTicketM.mutateAsync({ orderType: "takeaway" });
    await saveTicketToken(t.sessionToken);
    setTicketToken(t.sessionToken);
    setOrderId(null);
    setCartItems(t.cartItems ?? []);
  }

  async function onClearTicket() {
    if (!ticketToken) return;
    await syncCart([]);
    setOrderId(null);
  }

  async function onHold() {
    if (!ticketToken) return;
    await holdM?.mutateAsync();
  }

  async function onSend() {
    if (!ticketToken) return;
    const res = await convertM?.mutateAsync({
      clientTotal: total,
      customerNotes: customerNotesDraft.trim() || undefined,
      kitchenNotes: kitchenNotesDraft.trim() || undefined,
      tableNumber:
        orderTypeDraft === "dine_in"
          ? tableNumberDraft.trim() || undefined
          : undefined,
    });
    if (res?.id) setOrderId(res.id);
  }

  async function onOpenPayment() {
    if (!ticketToken) return;
    setPaymentAmountDraft(formatMoney(total));
    setPaymentTipDraft("");
    setPaymentMethodDraft("cash");
    setPaymentOpen(true);
  }

  async function onLogoutTicketOnly() {
    // optional helper if you want to drop the local ticket pointer
    await clearTicketToken();
    setTicketToken(null);
    setOrderId(null);
    setCartItems([]);
  }

  // -------------------------
  // Render
  // -------------------------

  if (!canManagePos) {
    return <div>You do not have permission to view the POS.</div>;
  }
  return (
    <div className="h-dvh bg-background">
      {uiError ? (
        <div className="p-3">
          <Alert variant="destructive">
            <AlertTitle>POS error</AlertTitle>
            <AlertDescription>{uiError}</AlertDescription>
            <AlertAction>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUiError(null)}
              >
                Dismiss
              </Button>
            </AlertAction>
          </Alert>
        </div>
      ) : null}

      <Sheet open={heldOpen} onOpenChange={setHeldOpen}>
        <SheetContent side="left" className="p-0">
          <SheetHeader className="p-6 pb-3">
            <SheetTitle>Held tickets</SheetTitle>
            <SheetDescription>
              Recall a held ticket to continue editing.
            </SheetDescription>
          </SheetHeader>

          <div className="px-6 pb-6">
            {heldTicketsQ.isLoading ? (
              <div className="space-y-2">
                <div className="h-12 rounded-md bg-muted" />
                <div className="h-12 rounded-md bg-muted" />
                <div className="h-12 rounded-md bg-muted" />
              </div>
            ) : heldTicketsQ.isError ? (
              <Card>
                <CardContent className="p-4 text-sm text-muted-foreground">
                  Failed to load held tickets.
                </CardContent>
              </Card>
            ) : !heldTicketsQ.data?.items?.length ? (
              <div className="text-sm text-muted-foreground">
                No held tickets.
              </div>
            ) : (
              <div className="space-y-2">
                {heldTicketsQ.data.items.map((t) => (
                  <button
                    key={t.sessionToken}
                    className="w-full rounded-lg border p-3 text-left hover:bg-muted/50 transition-colors"
                    onClick={async () => {
                      await saveTicketToken(t.sessionToken);
                      setTicketToken(t.sessionToken);
                      setOrderId(null);
                      setCartItems(t.cartItems ?? []);
                      await recallByTokenM.mutateAsync(t.sessionToken);
                      setHeldOpen(false);
                    }}
                    disabled={busy || recallByTokenM.isPending}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate">
                          {t.orderType ?? "ticket"}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {t.sessionToken}
                        </div>
                      </div>
                      <Badge variant="outline">{t.status}</Badge>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <SheetFooter className="p-6 pt-0">
            <Button
              variant="outline"
              onClick={async () => {
                await onLogoutTicketOnly();
                setHeldOpen(false);
              }}
              disabled={busy}
            >
              Clear local ticket token
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={discountOpen} onOpenChange={setDiscountOpen}>
        <SheetContent side="right" className="p-0">
          <SheetHeader className="p-6 pb-3">
            <SheetTitle>Discount</SheetTitle>
            <SheetDescription>Apply or remove a promo code.</SheetDescription>
          </SheetHeader>

          <div className="px-6 pb-6 space-y-3">
            <div className="text-xs text-muted-foreground">
              Current promo:{" "}
              <span className="font-medium text-foreground">
                {ticketQ.data?.promoCode ?? "—"}
              </span>
            </div>

            <Input
              value={promoCodeInput}
              onChange={(e) => setPromoCodeInput(e.target.value)}
              placeholder="Enter promo code"
              disabled={busy || !ticketToken}
            />

            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={async () => {
                  if (!ticketToken) return;
                  const code = promoCodeInput.trim();
                  if (!code) return;
                  await applyPromoM.mutateAsync(code);
                  setPromoCodeInput("");
                }}
                disabled={busy || !ticketToken || applyPromoM.isPending}
              >
                Apply
              </Button>
              <Button
                className="flex-1"
                variant="outline"
                onClick={async () => {
                  if (!ticketToken) return;
                  await removePromoM.mutateAsync();
                }}
                disabled={
                  busy ||
                  !ticketToken ||
                  !ticketQ.data?.promoCode ||
                  removePromoM.isPending
                }
              >
                Remove
              </Button>
            </div>

            {(applyPromoM.isError || removePromoM.isError) && (
              <div className="text-xs text-destructive">
                Failed to update promo code.
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={contextOpen} onOpenChange={setContextOpen}>
        <SheetContent side="right" className="p-0">
          <SheetHeader className="p-6 pb-3">
            <SheetTitle>Ticket context</SheetTitle>
            <SheetDescription>
              Order type, table number, and notes for kitchen/customer.
            </SheetDescription>
          </SheetHeader>

          <div className="px-6 pb-6 space-y-4">
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Order type</div>
              <Select
                value={orderTypeDraft}
                onValueChange={(v) =>
                  setOrderTypeDraft(
                    v as "dine_in" | "takeaway" | "delivery" | "catering",
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select order type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="takeaway">Takeaway</SelectItem>
                  <SelectItem value="dine_in">Dine in</SelectItem>
                  <SelectItem value="delivery">Delivery</SelectItem>
                  <SelectItem value="catering">Catering</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Table number</div>
              <Input
                value={tableNumberDraft}
                onChange={(e) => setTableNumberDraft(e.target.value)}
                placeholder="e.g. T12"
                disabled={orderTypeDraft !== "dine_in"}
              />
              <div className="text-xs text-muted-foreground">
                Table number will be stored on the order when you Send/Pay.
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">
                Customer notes
              </div>
              <Textarea
                value={customerNotesDraft}
                onChange={(e) => setCustomerNotesDraft(e.target.value)}
                placeholder="Optional"
              />
            </div>

            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Kitchen notes</div>
              <Textarea
                value={kitchenNotesDraft}
                onChange={(e) => setKitchenNotesDraft(e.target.value)}
                placeholder="Optional"
              />
            </div>

            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={async () => {
                  if (!ticketToken) return;
                  await updateContextM.mutateAsync({
                    orderType: orderTypeDraft,
                    tableNumber:
                      orderTypeDraft === "dine_in"
                        ? tableNumberDraft.trim() || undefined
                        : undefined,
                  });
                  setContextOpen(false);
                }}
                disabled={busy || !ticketToken || updateContextM.isPending}
              >
                Save
              </Button>
              <Button
                className="flex-1"
                variant="outline"
                onClick={() => setContextOpen(false)}
                disabled={busy}
              >
                Close
              </Button>
            </div>

            {updateContextM.isError && (
              <div className="text-xs text-destructive">
                Failed to update ticket context.
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={barcodeOpen} onOpenChange={setBarcodeOpen}>
        <SheetContent side="right" className="p-0">
          <SheetHeader className="p-6 pb-3">
            <SheetTitle>Barcode</SheetTitle>
            <SheetDescription>
              Scan an item barcode/SKU (keyboard scanner). Last scan shown
              below.
            </SheetDescription>
          </SheetHeader>

          <div className="px-6 pb-6 space-y-2">
            <div className="text-xs text-muted-foreground">
              Last scan:{" "}
              <span className="font-medium text-foreground">
                {lastScan ?? "—"}
              </span>
            </div>
            {lastScanError ? (
              <div className="text-xs text-destructive">{lastScanError}</div>
            ) : (
              <div className="text-xs text-muted-foreground">
                Tip: ensure focus is not inside an input field while scanning.
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={paymentOpen} onOpenChange={setPaymentOpen}>
        <SheetContent side="right" className="p-0">
          <SheetHeader className="p-6 pb-3">
            <SheetTitle>Payment</SheetTitle>
            <SheetDescription>
              Cash/Card + optional tip (single payment).
            </SheetDescription>
          </SheetHeader>

          <div className="px-6 pb-6 space-y-4">
            <div className="text-xs text-muted-foreground">
              Total due:{" "}
              <span className="font-medium text-foreground">
                {formatMoney(total)}
              </span>
            </div>

            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Method</div>
              <Select
                value={paymentMethodDraft}
                onValueChange={(v) =>
                  setPaymentMethodDraft(v as "cash" | "card")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">Amount</div>
                <Input
                  value={paymentAmountDraft}
                  onChange={(e) => setPaymentAmountDraft(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">Tip</div>
                <Input
                  value={paymentTipDraft}
                  onChange={(e) => setPaymentTipDraft(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={async () => {
                  if (!ticketToken) return;

                  let oid = orderId;
                  if (!oid) {
                    const res = await convertM?.mutateAsync({
                      clientTotal: total,
                      customerNotes: customerNotesDraft.trim() || undefined,
                      kitchenNotes: kitchenNotesDraft.trim() || undefined,
                      tableNumber:
                        orderTypeDraft === "dine_in"
                          ? tableNumberDraft.trim() || undefined
                          : undefined,
                    });
                    if (!res?.id) return;
                    oid = res.id;
                    setOrderId(oid);
                  }

                  await payByOrderIdM.mutateAsync({
                    orderId: oid,
                    paymentMethod: paymentMethodDraft,
                    amount: paymentAmountDraft.trim() || "0.00",
                    tipAmount: paymentTipDraft.trim() || undefined,
                  });
                  setPaymentOpen(false);
                }}
                disabled={busy || !ticketToken || payByOrderIdM.isPending}
              >
                Take payment
              </Button>
              <Button
                className="flex-1"
                variant="outline"
                onClick={() => setPaymentOpen(false)}
                disabled={busy}
              >
                Close
              </Button>
            </div>

            {payByOrderIdM.isError && (
              <div className="text-xs text-destructive">Payment failed.</div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet
        open={customizeOpen}
        onOpenChange={(open) => {
          setCustomizeOpen(open);
          if (!open) {
            setCustomizeSlug(null);
            setCustomizeIndex(null);
            resetCustomization();
          }
        }}
      >
        <SheetContent side="right" className="p-0">
          <SheetHeader className="p-6 pb-3">
            <SheetTitle>Customize item</SheetTitle>
            <SheetDescription>
              Select required options before adding to cart.
            </SheetDescription>
          </SheetHeader>

          <div className="px-6 pb-6 space-y-4">
            {itemDetailQ.isLoading ? (
              <div className="space-y-2">
                <div className="h-12 rounded-md bg-muted" />
                <div className="h-12 rounded-md bg-muted" />
                <div className="h-12 rounded-md bg-muted" />
              </div>
            ) : itemDetailQ.isError || !itemDetail ? (
              <div className="text-sm text-muted-foreground">
                Failed to load item details.
              </div>
            ) : (
              <>
                <div>
                  <div className="text-sm font-semibold">{itemDetail.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {itemDetail.slug} • SKU: {itemDetail.sku}
                  </div>
                </div>

                {itemDetail.modifierGroups?.length ? (
                  <div className="space-y-4">
                    {itemDetail.modifierGroups.map((g) => {
                      const selected = selectedModsByGroup[g.id] ?? [];
                      const max = g.maxSelections ?? null;
                      const min = g.minSelections ?? 0;
                      return (
                        <div key={g.id} className="rounded-lg border p-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="font-medium">{g.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {g.isRequired ? "Required" : "Optional"}
                              {g.selectionType === "single"
                                ? " • single"
                                : g.selectionType === "exactly"
                                  ? ` • exactly ${min}`
                                  : max != null
                                    ? ` • up to ${max}`
                                    : ""}
                            </div>
                          </div>

                          <div className="mt-2 space-y-2">
                            {g.modifiers.map((m) => {
                              const active = selected.includes(m.id);
                              return (
                                <button
                                  key={m.id}
                                  className={[
                                    "w-full rounded-md border px-3 py-2 text-left flex items-center justify-between gap-3",
                                    active
                                      ? "bg-primary text-primary-foreground border-primary"
                                      : "hover:bg-muted/50",
                                  ].join(" ")}
                                  onClick={() => {
                                    setSelectedModsByGroup((prev) => {
                                      const cur = prev[g.id] ?? [];
                                      const exists = cur.includes(m.id);

                                      if (g.selectionType === "single") {
                                        return {
                                          ...prev,
                                          [g.id]: exists ? [] : [m.id],
                                        };
                                      }

                                      if (g.selectionType === "exactly") {
                                        // treat like multi with hard cap at minSelections
                                        const cap = Math.max(0, min);
                                        if (exists) {
                                          return {
                                            ...prev,
                                            [g.id]: cur.filter(
                                              (x) => x !== m.id,
                                            ),
                                          };
                                        }
                                        if (cap > 0 && cur.length >= cap)
                                          return prev;
                                        return {
                                          ...prev,
                                          [g.id]: [...cur, m.id],
                                        };
                                      }

                                      // multiple
                                      if (exists) {
                                        return {
                                          ...prev,
                                          [g.id]: cur.filter((x) => x !== m.id),
                                        };
                                      }
                                      if (max != null && cur.length >= max)
                                        return prev;
                                      return {
                                        ...prev,
                                        [g.id]: [...cur, m.id],
                                      };
                                    });
                                  }}
                                >
                                  <span className="min-w-0 truncate">
                                    {m.name}
                                  </span>
                                  <span className="text-xs tabular-nums opacity-90">
                                    {m.priceDelta && m.priceDelta !== "0"
                                      ? `+${formatMoney(m.priceDelta)}`
                                      : ""}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No modifiers for this item.
                  </div>
                )}

                {customizeError ? (
                  <div className="text-xs text-destructive">
                    {customizeError}
                  </div>
                ) : null}
              </>
            )}
          </div>

          <SheetFooter className="p-6 pt-0">
            <div className="flex gap-2 w-full">
              <Button
                className="flex-1"
                disabled={busy || itemDetailQ.isLoading || !itemDetail}
                onClick={async () => {
                  if (!itemDetail) return;

                  const check = validateGroups(itemDetail.modifierGroups);
                  if (!check.ok) {
                    setCustomizeError(check.message);
                    return;
                  }

                  const modifiers =
                    itemDetail.modifierGroups?.flatMap((g) =>
                      (selectedModsByGroup[g.id] ?? []).map((modifierId) => ({
                        modifierId,
                        quantity: 1,
                      })),
                    ) ?? [];

                  const nextLine: PosTicketLine = {
                    menuItemId: itemDetail.id,
                    quantity: 1,
                    modifiers: modifiers.length ? modifiers : undefined,
                  };

                  const next =
                    customizeIndex == null
                      ? [...cartItems, nextLine]
                      : cartItems.map((l, i) =>
                          i === customizeIndex ? nextLine : l,
                        );

                  await syncCart(next);
                  setCustomizeOpen(false);
                }}
              >
                {customizeIndex == null ? "Add to cart" : "Save changes"}
              </Button>
              <Button
                className="flex-1"
                variant="outline"
                disabled={busy}
                onClick={() => setCustomizeOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Top bar */}
      <div className="h-14 border-b flex items-center gap-3 px-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold leading-none truncate">
            {menu?.name ?? "POS"}
          </div>
          <div className="text-xs text-muted-foreground leading-none truncate">
            {categoriesQ.data?.meta?.location?.name ?? "—"}
          </div>
        </div>

        <div className="flex-1" />

        <div className="w-[420px] max-w-[55vw]">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items…"
          />
        </div>

        <Button
          variant="secondary"
          onClick={onNewTicket}
          disabled={busy || createTicketM.isPending}
        >
          New Ticket
        </Button>

        <Button
          variant="outline"
          onClick={() => setHeldOpen(true)}
          disabled={busy}
          title="Recall held tickets"
        >
          Held
        </Button>

        <Button
          variant="outline"
          onClick={() => {
            setOrderTypeDraft(
              (ticketQ.data?.orderType as
                | "dine_in"
                | "takeaway"
                | "delivery"
                | "catering"
                | undefined) ?? orderTypeDraft,
            );
            setContextOpen(true);
          }}
          disabled={busy}
          title="Order type and notes"
        >
          Context
        </Button>
      </div>

      {/* 3 columns */}
      <div className="h-[calc(100dvh-3.5rem)] grid grid-cols-[10vw_1fr_380px]">
        {/* Categories */}
        <aside className="border-r">
          <ScrollArea className="h-full">
            <div className="p-3 space-y-2">
              <div className="text-xs font-medium text-muted-foreground px-1">
                Categories
              </div>

              {categoriesQ.isLoading ? (
                <div className="space-y-2">
                  <div className="h-10 rounded-md bg-muted" />
                  <div className="h-10 rounded-md bg-muted" />
                  <div className="h-10 rounded-md bg-muted" />
                </div>
              ) : categoriesQ.isError ? (
                <Card>
                  <CardContent className="p-4 text-sm text-muted-foreground">
                    Failed to load categories.
                  </CardContent>
                </Card>
              ) : (
                categories.map((c) => {
                  const active = c.id === selectedCategoryId;

                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCategoryId(c.id)}
                      className={[
                        "w-full rounded-xl border p-3 transition-all duration-200",
                        "flex flex-col relative justify-center items-center gap-3 text-left shadow-sm",
                        active
                          ? "bg-primary text-primary-foreground border-primary shadow-md"
                          : "bg-background hover:bg-muted/50 border-border",
                      ].join(" ")}
                    >
                      {/* Category Image / Icon */}
                      <div>
                        <Avatar
                          className={[
                            "h-12 w-12  flex items-center justify-center overflow-hidden shrink-0",
                            active ? "bg-primary-foreground/10" : "bg-muted",
                          ].join(" ")}
                        >
                          <AvatarImage src={c.image ?? ""} alt={c.name ?? ""} />
                          <AvatarFallback>{c.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                      </div>

                      {/* Category Content */}
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium truncate text-sm">{c.name}</p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </aside>

        {/* Items */}
        <main className="min-w-0">
          <ScrollArea className="h-full">
            <div className="p-3">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">
                    {categories.find((c) => c.id === activeCategoryId)?.name ??
                      "Items"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {itemsQ.isFetching
                      ? "Refreshing…"
                      : `${filteredItems.length} items`}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBarcodeOpen(true)}
                  >
                    Barcode
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!ticketToken || busy}
                    onClick={() => setDiscountOpen(true)}
                  >
                    Discount
                  </Button>
                </div>
              </div>

              {itemsQ.isLoading ? (
                <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="h-28 rounded-xl bg-muted" />
                  ))}
                </div>
              ) : itemsQ.isError ? (
                <Card>
                  <CardContent className="p-4 text-sm text-muted-foreground">
                    Failed to load items.
                  </CardContent>
                </Card>
              ) : filteredItems.length === 0 ? (
                <div className="py-20 text-center text-muted-foreground">
                  <div className="text-sm font-medium">No items found</div>
                  <div className="text-xs mt-1">
                    Try another category or clear search.
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
                  {filteredItems.map((it) => (
                    <button
                      key={it.id}
                      onClick={async () => {
                        if (it.slug) {
                          setCustomizeSlug(it.slug);
                          setCustomizeIndex(null);
                          resetCustomization();
                          setCustomizeOpen(true);
                          return;
                        }
                        const next = upsertLineAddOne(it.id);
                        await syncCart(next);
                      }}
                      disabled={busy}
                      className="group space-y-2 rounded-xl border p-3 text-left hover:bg-muted/50 transition-colors disabled:opacity-60"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <Avatar className="h-12 w-12 flex items-center justify-center overflow-hidden shrink-0">
                          <AvatarImage
                            src={it.imageUrl ?? ""}
                            alt={it.name ?? ""}
                          />
                          <AvatarFallback>{it.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>Rs. {Number(it.basePrice).toLocaleString()}</div>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-semibold truncate">{it.name}</div>
                        <div>
                          <Plus />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {itemsQ.hasNextPage ? (
                <div className="flex justify-center mt-4">
                  <Button
                    variant="secondary"
                    disabled={busy || itemsQ.isFetching}
                    onClick={async () => {
                      if (itemsQ.fetchNextPage) await itemsQ.fetchNextPage();
                    }}
                  >
                    Load more
                  </Button>
                </div>
              ) : null}
            </div>
          </ScrollArea>
        </main>
        {/* Cart */}
        <aside className="border-l">
          <div className="h-full grid grid-rows-[auto_1fr_auto]">
            <div className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">
                    Ticket{" "}
                    {ticketToken ? (
                      <span className="text-xs text-muted-foreground">
                        • {ticketQ.data?.status ?? "—"}
                      </span>
                    ) : null}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {ticketQ.data?.orderType ?? "—"}{" "}
                    {orderId ? `• Order: ${orderId}` : ""}
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClearTicket}
                  disabled={busy || !ticketToken}
                >
                  Clear
                </Button>
              </div>

              <Separator className="mt-3" />

              {quoteQ.data?.issues?.length ? (
                <div className="mt-3 rounded-lg border p-2 text-xs">
                  <div className="font-semibold mb-1">Issues</div>
                  <ul className="space-y-1 text-muted-foreground">
                    {quoteQ.data.issues.slice(0, 3).map((i, idx) => (
                      <li key={`${i.code}-${idx}`}>
                        {i.code}: {i.message}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

            <ScrollArea className="h-[55dvh]" scrollHideDelay={0}>
              <div className="p-3 space-y-2">
                {!ticketToken ? (
                  <div className="text-xs text-muted-foreground text-center py-10">
                    Click <span className="font-medium">New Ticket</span> to
                    start.
                  </div>
                ) : ticketQ.isLoading ? (
                  <div className="space-y-2">
                    <div className="h-20 rounded-xl bg-muted" />
                    <div className="h-20 rounded-xl bg-muted" />
                  </div>
                ) : cartItems.length === 0 ? (
                  <div className="text-xs text-muted-foreground text-center py-10">
                    Add items to start a ticket.
                  </div>
                ) : (
                  cartItems.map((line, idx) => {
                    const it = itemById.get(line.menuItemId);
                    const name = it?.name ?? line.menuItemId;
                    const price = it?.basePrice ?? null;

                    return (
                      <Card key={`${line.menuItemId}-${idx}`}>
                        <CardContent className="px-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="font-medium truncate">{name}</div>
                              {line.specialInstructions ? (
                                <div className="text-xs text-muted-foreground line-clamp-2">
                                  {line.specialInstructions}
                                </div>
                              ) : (
                                <div className="text-xs text-muted-foreground">
                                  {it?.slug ?? ""}
                                </div>
                              )}
                            </div>
                            <div className="text-sm font-semibold tabular-nums">
                              {price != null
                                ? Number(price).toLocaleString()
                                : "—"}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 mt-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => syncCart(decAt(idx))}
                              disabled={busy}
                            >
                              -
                            </Button>
                            <div className="w-10 text-center text-sm tabular-nums">
                              {line.quantity}
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => syncCart(incAt(idx))}
                              disabled={busy}
                            >
                              +
                            </Button>
                            <div className="flex-1" />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                // Open customization for editing, if we have a slug to fetch detail.
                                const slug = it?.slug ?? null;
                                if (!slug) return;
                                setCustomizeSlug(slug);
                                setCustomizeIndex(idx);
                                resetCustomization();
                                // prefill from existing line modifiers
                                const next: Record<string, string[]> = {};
                                for (const m of line.modifiers ?? []) {
                                  // group id is unknown here without item detail; we will map later once loaded
                                  // simplest: keep as a flat list under a special key; remap after load
                                  next["__flat__"] = [
                                    ...(next["__flat__"] ?? []),
                                    m.modifierId,
                                  ];
                                }
                                setSelectedModsByGroup(next);
                                setCustomizeOpen(true);
                              }}
                              disabled={busy || !it?.slug}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={async () => syncCart(removeAt(idx))}
                              disabled={busy}
                            >
                              Remove
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
              {/* <ScrollBar orientation="horizontal" /> */}
            </ScrollArea>

            <div className="p-3 border-t bg-background">
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="tabular-nums">
                    {quoteQ.isFetching ? "…" : formatMoney(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="tabular-nums">
                    {quoteQ.isFetching ? "…" : formatMoney(tax)}
                  </span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span className="tabular-nums">
                    {quoteQ.isFetching ? "…" : formatMoney(total)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-3">
                <Button
                  variant="secondary"
                  onClick={onHold}
                  disabled={busy || !ticketToken}
                >
                  Hold
                </Button>

                <Button
                  variant="outline"
                  onClick={onSend}
                  disabled={busy || !ticketToken || cartItems.length === 0}
                >
                  Send
                </Button>

                <Button
                  className="col-span-2"
                  onClick={onOpenPayment}
                  disabled={busy || !ticketToken || cartItems.length === 0}
                >
                  Pay
                </Button>
              </div>

              {ticketQ.isError ? (
                <div className="text-xs text-destructive mt-2">
                  Failed to load ticket. Clear token and retry.
                </div>
              ) : null}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
