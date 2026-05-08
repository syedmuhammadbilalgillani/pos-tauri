"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

import { OfflineBanner } from "@/features/pos/components/OfflineBanner";
import { PosHeader } from "@/features/pos/components/PosHeader";
import { CategoryRail } from "@/features/pos/components/CategoryRail";
import { ProductGrid } from "@/features/pos/components/ProductGrid";
import { CartPanel } from "@/features/pos/components/CartPanel";
import { CheckoutSheet } from "@/features/pos/components/CheckoutSheet";
import { ModifierSheet } from "@/features/pos/components/ModifierSheet";

import {
  useGetMenuCategoriesQuery,
  useGetMenuItemsQuery,
  useListPosTicketsQuery,
  useMenuItemDetailQuery,
  useQuotePosTicketQuery,
} from "@/lib/tan-stack/pos/query";

import {
  useAddPosPaymentByOrderIdMutation,
  useCreatePosTicketMutation,
  useHoldPosTicketMutation,
  useRecallPosTicketByTokenMutation,
  useSetPosTicketItemsMutation,
} from "@/lib/tan-stack/pos/mutation";

import {
  clearTicketToken,
  saveTicketToken,
} from "@/lib/tan-stack/pos/ticket-token";
import { useOfflineOrder } from "@/features/pos/hooks/useOfflineOrder";
import { useAuthSession } from "@/lib/tan-stack/auth/query";
import { useOfflineStore } from "@/store/offline";
import { useCartStore } from "@/store/cart";
import { calculateOfflineQuote } from "@/lib/offline/quote";
import {
  getLocalHeldTickets,
  saveLocalTicket,
  getLocalTicket,
  deleteLocalTicket,
} from "@/lib/offline/db";

import type { CartItem, CartModifier, OrderType } from "@/features/pos/types";
import type {
  POSCategory,
  PosTicketLine,
  PublicMenuItemDetail,
  PublicModifierGroup,
} from "@/types";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeLocalId() {
  return uuidv4();
}

function validateGroups(
  groups: PublicMenuItemDetail["modifierGroups"],
  selectedByGroup: Record<string, string[]>,
): { ok: true } | { ok: false; message: string } {
  if (!groups?.length) return { ok: true };
  for (const g of groups) {
    const selected = selectedByGroup[g.id] ?? [];
    const min = g.isRequired ? Math.max(1, g.minSelections ?? 0) : (g.minSelections ?? 0);
    const max = g.maxSelections ?? null;
    if (selected.length < min)
      return { ok: false, message: `Select at least ${min} for "${g.name}"` };
    if (max != null && selected.length > max)
      return { ok: false, message: `Select at most ${max} for "${g.name}"` };
    if (g.selectionType === "single" && selected.length > 1)
      return { ok: false, message: `"${g.name}" allows only 1 selection` };
    if (g.selectionType === "exactly" && selected.length !== (g.minSelections ?? 0))
      return { ok: false, message: `Select exactly ${g.minSelections} for "${g.name}"` };
  }
  return { ok: true };
}

// ─── Local held tickets (offline-aware) ──────────────────────────────────────

type LocalHeldTicket = {
  token: string;
  orderType: string;
  tableNumber?: string;
  cartItems: CartItem[];
  createdAt: number;
  source: "local" | "server";
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function POSPage() {
  const { data: session } = useAuthSession();
  const { networkStatus } = useOfflineStore();
  const isOnline = networkStatus === "online";

  // ── Cart store (persisted across refreshes) ──────────────────────────────
  const {
    items: cartItems,
    orderType,
    tableNumber,
    customerNotes,
    kitchenNotes,
    ticketToken,
    orderId,
    setItems: setCartItems,
    addItem: addCartItem,
    updateItem,
    removeItem,
    incQty,
    decQty,
    setOrderType,
    setTableNumber,
    setCustomerNotes,
    setKitchenNotes,
    setTicketToken,
    setOrderId,
    clear: clearCart,
  } = useCartStore();

  // ── UI state ────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [heldOpen, setHeldOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [localHeldTickets, setLocalHeldTickets] = useState<LocalHeldTicket[]>([]);

  // Modifier sheet
  const [modifierOpen, setModifierOpen] = useState(false);
  const [modifierSlug, setModifierSlug] = useState<string | null>(null);
  const [editingLocalId, setEditingLocalId] = useState<string | null>(null);
  const [selectedMods, setSelectedMods] = useState<Record<string, string[]>>({});
  const [modError, setModError] = useState<string | null>(null);

  // ── Queries ─────────────────────────────────────────────────────────────
  const categoriesQ = useGetMenuCategoriesQuery();
  const categories = useMemo<POSCategory[]>(
    () => (categoriesQ.data?.meta?.categories as POSCategory[]) ?? [],
    [categoriesQ.data?.meta?.categories],
  );
  const menu = categoriesQ.data?.meta?.menu;
  const locationName = categoriesQ.data?.meta?.location?.name;

  const activeCategoryId = selectedCategoryId || categories[0]?.id || "";

  const itemsQ = useGetMenuItemsQuery(activeCategoryId, menu?.id ?? "", true);
  const rawItems = useMemo(() => {
    const pages = (itemsQ.data as any)?.pages ?? [];
    return pages.flatMap((p: any) => p?.data?.items ?? []);
  }, [(itemsQ.data as any)?.pages]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rawItems;
    return rawItems.filter(
      (it: any) =>
        it.name?.toLowerCase().includes(q) ||
        it.sku?.toLowerCase().includes(q) ||
        it.description?.toLowerCase().includes(q),
    );
  }, [rawItems, search]);

  const itemById = useMemo(() => {
    const m = new Map<string, (typeof rawItems)[0]>();
    for (const it of rawItems) m.set(it.id, it);
    return m;
  }, [rawItems]);

  const itemBySku = useMemo(() => {
    const m = new Map<string, (typeof rawItems)[0]>();
    for (const it of rawItems) {
      const sku = it.sku?.trim();
      if (sku) m.set(sku, it);
    }
    return m;
  }, [rawItems]);

  const itemDetailQ = useMenuItemDetailQuery(modifierSlug, true);
  const itemDetail = (itemDetailQ.data as any)?.data as PublicMenuItemDetail | undefined;

  // Server-held tickets (online only)
  const heldQ = useListPosTicketsQuery({ status: "held", limit: 50 });

  // Server quote (with offline fallback)
  const quoteQ = useQuotePosTicketQuery(ticketToken, isOnline && !!ticketToken);
  const offlineQuote = useMemo(
    () => (cartItems.length ? calculateOfflineQuote(cartItems) : null),
    [cartItems],
  );
  const quote = quoteQ.data ?? (cartItems.length ? offlineQuote : null);
  const quoteLoading = quoteQ.isFetching && isOnline;

  // ── Mutations ───────────────────────────────────────────────────────────
  const createTicketM = useCreatePosTicketMutation();
  const setItemsM = useSetPosTicketItemsMutation(ticketToken ?? "");
  const holdM = useHoldPosTicketMutation(ticketToken ?? "");
  const payM = useAddPosPaymentByOrderIdMutation();
  const recallM = useRecallPosTicketByTokenMutation();

  const { sendOrder } = useOfflineOrder();

  const busy =
    createTicketM.isPending ||
    (setItemsM?.isPending ?? false) ||
    (holdM?.isPending ?? false) ||
    payM.isPending;

  // ── Sync item names/prices when menu loads ──────────────────────────────
  useEffect(() => {
    if (!rawItems.length || !cartItems.length) return;
    const updated = cartItems.map((line) => {
      const it = itemById.get(line.menuItemId ?? "");
      if (!it) return line;
      return {
        ...line,
        _name: line._name ?? it.name ?? undefined,
        _price: line._price ?? (it.basePrice != null ? Number(it.basePrice) : undefined),
      };
    });
    const changed = updated.some((u, i) => u !== cartItems[i]);
    if (changed) setCartItems(updated);
  }, [rawItems]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load local held tickets when held drawer opens ─────────────────────
  useEffect(() => {
    if (!heldOpen) return;
    getLocalHeldTickets().then((rows) => {
      const local: LocalHeldTicket[] = rows.map((r) => ({
        token: r.token,
        orderType: r.order_type,
        tableNumber: r.table_number ?? undefined,
        cartItems: JSON.parse(r.cart_items),
        createdAt: r.created_at,
        source: "local",
      }));
      setLocalHeldTickets(local);
    });
  }, [heldOpen]);

  // ── Remap flat modifiers to groups after itemDetail loads ───────────────
  useEffect(() => {
    if (!itemDetail?.modifierGroups?.length) return;
    if (!selectedMods["__flat__"]?.length) return;
    const flat = selectedMods["__flat__"];
    const next: Record<string, string[]> = {};
    for (const g of itemDetail.modifierGroups) {
      const picked = flat.filter((id) => g.modifiers.some((m) => m.id === id));
      if (picked.length) next[g.id] = picked;
    }
    setSelectedMods(next);
  }, [itemDetail?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Cart helpers ────────────────────────────────────────────────────────
  async function ensureTicket(): Promise<string> {
    if (ticketToken) return ticketToken;
    const t = await createTicketM.mutateAsync({ orderType });
    await saveTicketToken(t.sessionToken);
    setTicketToken(t.sessionToken);
    setOrderId(null);
    return t.sessionToken;
  }

  async function syncToServer(next: CartItem[]) {
    if (!isOnline) return;
    const lines: PosTicketLine[] = next.map(({ _localId, _name, _price, ...line }) => line);
    try {
      await ensureTicket();
      await setItemsM?.mutateAsync({
        items: lines,
        clientUpdatedAt: undefined,
      });
    } catch {
      // Non-fatal: cart is local-first
    }
  }

  function addItemToCart(item: any, modifiers?: CartModifier[]) {
    const newLine: CartItem = {
      menuItemId: item.id,
      quantity: 1,
      modifiers: modifiers?.length ? modifiers : undefined,
      _localId: makeLocalId(),
      _name: item.name,
      _price: item.basePrice != null ? Number(item.basePrice) : undefined,
    };
    addCartItem(newLine);
    void syncToServer([...cartItems, newLine]);
  }

  function updateQty(localId: string, delta: 1 | -1) {
    if (delta === 1) incQty(localId);
    else decQty(localId);
    const next = cartItems.map((l) =>
      l._localId === localId ? { ...l, quantity: Math.max(1, l.quantity + delta) } : l,
    );
    void syncToServer(next);
  }

  function removeFromCart(localId: string) {
    removeItem(localId);
    const next = cartItems.filter((l) => l._localId !== localId);
    void syncToServer(next);
  }

  function onItemClick(item: any) {
    if (item.modifierGroups?.length || !itemById.has(item.id)) {
      setModifierSlug(item.slug);
      setEditingLocalId(null);
      setSelectedMods({});
      setModError(null);
      setModifierOpen(true);
    } else {
      addItemToCart(item);
    }
  }

  function onEditCartItem(localId: string) {
    const line = cartItems.find((l) => l._localId === localId);
    if (!line) return;
    const item = itemById.get(line.menuItemId ?? "");
    if (!item?.slug) return;
    setModifierSlug(item.slug);
    setEditingLocalId(localId);
    const flatMods = line.modifiers?.map((m) => m.modifierId).filter(Boolean) as string[];
    setSelectedMods({ __flat__: flatMods ?? [] });
    setModError(null);
    setModifierOpen(true);
  }

  function toggleMod(groupId: string, modId: string, group: PublicModifierGroup) {
    setSelectedMods((prev) => {
      const cur = prev[groupId] ?? [];
      const exists = cur.includes(modId);
      if (group.selectionType === "single") {
        return { ...prev, [groupId]: exists ? [] : [modId] };
      }
      const max = group.maxSelections;
      if (exists) return { ...prev, [groupId]: cur.filter((x) => x !== modId) };
      if (max != null && cur.length >= max) return prev;
      return { ...prev, [groupId]: [...cur, modId] };
    });
  }

  function onModifierAdd() {
    if (!itemDetail) return;
    const check = validateGroups(itemDetail.modifierGroups, selectedMods);
    if (!check.ok) {
      setModError(check.message);
      return;
    }
    const modifiers: CartModifier[] = itemDetail.modifierGroups?.flatMap((g) =>
      (selectedMods[g.id] ?? []).map((modifierId) => {
        const mod = g.modifiers.find((m) => m.id === modifierId)!;
        return {
          modifierId,
          modifierNameSnapshot: mod.name,
          groupNameSnapshot: g.name,
          priceDeltaSnapshot: String(mod.priceDelta),
          quantity: 1,
        };
      }),
    ) ?? [];

    if (editingLocalId) {
      updateItem(editingLocalId, { modifiers: modifiers.length ? modifiers : undefined });
      const next = cartItems.map((l) =>
        l._localId === editingLocalId
          ? { ...l, modifiers: modifiers.length ? modifiers : undefined }
          : l,
      );
      void syncToServer(next);
    } else {
      const item = rawItems.find((i: any) => i.slug === modifierSlug);
      if (item) addItemToCart(item, modifiers);
    }
    setModifierOpen(false);
  }

  // ── Send to kitchen (no payment) ────────────────────────────────────────
  async function onSendToKitchen() {
    if (!cartItems.length) return;
    const locationId = session?.user?.activeLocationId ?? "";

    const result = await sendOrder({
      locationId,
      orderType,
      orderSource: "pos",
      tableNumber: orderType === "dine_in" ? tableNumber || undefined : undefined,
      customerNotes: customerNotes || undefined,
      kitchenNotes: kitchenNotes || undefined,
      items: buildOrderItems(),
    });

    if (!result.ok) { toast.error(result.error); return; }

    if (result.offline) {
      toast.success("Order queued — will appear on KDS when online", {
        description: `${cartItems.length} item${cartItems.length > 1 ? "s" : ""} in queue`,
        icon: "📶",
      });
    } else {
      setOrderId(result.orderId);
      toast.success(`Order #${result.orderNumber} sent to kitchen`);
    }

    clearCart();
    if (ticketToken) {
      try { await setItemsM?.mutateAsync({ items: [] }); } catch { /* ignore */ }
    }
  }

  // ── Pay ─────────────────────────────────────────────────────────────────
  async function onPay(method: string, amount: string, tip: string) {
    const locationId = session?.user?.activeLocationId ?? "";
    let oid = orderId;

    if (!oid) {
      const result = await sendOrder(
        {
          locationId,
          orderType,
          orderSource: "pos",
          tableNumber: orderType === "dine_in" ? tableNumber || undefined : undefined,
          customerNotes: customerNotes || undefined,
          kitchenNotes: kitchenNotes || undefined,
          items: buildOrderItems(),
        },
        { paymentMethod: method, amount, tipAmount: tip !== "0" ? tip : undefined },
      );

      if (!result.ok) { toast.error(result.error); return; }

      if (result.offline) {
        toast.success("Order queued — payment saved, will sync when online", { icon: "📶" });
        setCheckoutOpen(false);
        clearCart();
        return;
      }

      oid = result.orderId;
      setOrderId(oid);
    }

    try {
      await payM.mutateAsync({
        orderId: oid,
        paymentMethod: method as any,
        amount,
        tipAmount: tip !== "0" ? tip : undefined,
      });
      toast.success("Payment recorded");
      setCheckoutOpen(false);
      clearCart();
      await clearTicketToken();
      setTicketToken(null);
    } catch {
      // toast already fired
    }
  }

  // ── Hold (offline-first: SQLite + server) ───────────────────────────────
  async function onHold() {
    if (!cartItems.length) return;

    const token = ticketToken ?? makeLocalId();
    // Always save locally first
    await saveLocalTicket({
      token,
      orderType,
      tableNumber: tableNumber || undefined,
      cartItems,
      status: "held",
    });

    // Try server hold if online
    if (isOnline && ticketToken) {
      try {
        await holdM?.mutateAsync();
      } catch {
        // offline hold already persisted locally
      }
    }

    toast.success("Ticket held");
    clearCart();
    setTicketToken(null);
    setOrderId(null);
  }

  // ── Recall held ticket ──────────────────────────────────────────────────
  async function recallHeld(ticket: LocalHeldTicket) {
    if (ticket.source === "local") {
      // Restore from SQLite
      const row = await getLocalTicket(ticket.token);
      if (row) {
        const items: CartItem[] = JSON.parse(row.cart_items);
        setCartItems(items.map((l) => ({ ...l, _localId: l._localId || makeLocalId() })));
        setOrderType((row.order_type as OrderType) ?? "takeaway");
        if (row.table_number) setTableNumber(row.table_number);
        await deleteLocalTicket(ticket.token);
      }
    } else {
      // Server recall
      try {
        const data = await recallM.mutateAsync(ticket.token);
        await saveTicketToken(ticket.token);
        setTicketToken(ticket.token);
        setOrderId(null);
        const lines = (data as any)?.cartItems ?? [];
        setCartItems(
          lines.map((line: PosTicketLine) => ({
            ...line,
            _localId: makeLocalId(),
            _name: itemById.get(line.menuItemId ?? "")?.name ?? undefined,
            _price: (() => {
              const it = itemById.get(line.menuItemId ?? "");
              return it?.basePrice != null ? Number(it.basePrice) : undefined;
            })(),
          })),
        );
      } catch { /* toast fired */ }
    }
    setHeldOpen(false);
  }

  // ── New ticket ───────────────────────────────────────────────────────────
  function onNewTicket() {
    clearCart();
    setTicketToken(null);
    setOrderId(null);
    setSelectedCategoryId("");
  }

  // ── Build order items from cart ──────────────────────────────────────────
  function buildOrderItems() {
    return cartItems.map((line) => {
      const item = itemById.get(line.menuItemId ?? "");
      return {
        menuItemId: line.menuItemId,
        itemNameSnapshot: line._name ?? item?.name ?? "Item",
        itemSkuSnapshot: item?.sku ?? undefined,
        unitPriceSnapshot: String(line._price ?? item?.basePrice ?? "0"),
        quantity: line.quantity,
        specialInstructions: line.specialInstructions,
        modifiers: line.modifiers?.map((m) => ({
          modifierId: m.modifierId,
          modifierNameSnapshot: m.modifierNameSnapshot ?? m.modifierId ?? "",
          groupNameSnapshot: m.groupNameSnapshot ?? undefined,
          priceDeltaSnapshot: String(m.priceDeltaSnapshot ?? "0"),
          quantity: m.quantity ?? 1,
        })),
      };
    });
  }

  // ── Barcode scanner (keyboard wedge) ────────────────────────────────────
  const itemBySkuRef = useRef(itemBySku);
  useEffect(() => { itemBySkuRef.current = itemBySku; });

  useEffect(() => {
    let buf = "", lastTs = 0;
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement as HTMLElement | null;
      const tag = el?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      const now = Date.now();
      if (now - lastTs > 200) buf = "";
      lastTs = now;
      if (e.key === "Enter") {
        const code = buf.trim(); buf = "";
        if (!code) return;
        const it = itemBySkuRef.current.get(code);
        if (!it) { toast.error(`Unknown SKU: ${code}`); return; }
        onItemClick(it);
        return;
      }
      if (e.key === "Escape") { buf = ""; return; }
      if (e.key.length === 1) buf += e.key;
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Merge server + local held tickets ──────────────────────────────────
  const allHeldTickets = useMemo<LocalHeldTicket[]>(() => {
    const serverTokens = new Set(localHeldTickets.map((t) => t.token));
    const server: LocalHeldTicket[] =
      (heldQ.data?.items ?? [])
        .filter((t: any) => !serverTokens.has(t.sessionToken))
        .map((t: any) => ({
          token: t.sessionToken,
          orderType: t.orderType ?? "takeaway",
          tableNumber: t.tableNumber ?? undefined,
          cartItems: (t.cartItems ?? []).map((l: PosTicketLine) => ({
            ...l,
            _localId: makeLocalId(),
          })),
          createdAt: new Date(t.createdAt ?? Date.now()).getTime(),
          source: "server" as const,
        }));
    return [...localHeldTickets, ...server].sort((a, b) => b.createdAt - a.createdAt);
  }, [localHeldTickets, heldQ.data]);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex h-dvh flex-col bg-background overflow-hidden">
      <OfflineBanner />

      <PosHeader
        menuName={menu?.name}
        locationName={locationName}
        search={search}
        onSearchChange={setSearch}
        heldCount={allHeldTickets.length}
        onHeldClick={() => setHeldOpen(true)}
        onNewTicket={onNewTicket}
        busy={busy}
      />

      <CategoryRail
        categories={categories}
        activeCategoryId={activeCategoryId}
        onSelect={setSelectedCategoryId}
        isLoading={categoriesQ.isLoading}
      />

      <div className="flex flex-1 min-h-0">
        <main className="flex-1 min-w-0">
          <ProductGrid
            items={filteredItems}
            isLoading={(itemsQ as any).isLoading}
            isError={(itemsQ as any).isError}
            searchQuery={search}
            onItemClick={onItemClick}
            onLoadMore={() => (itemsQ as any).fetchNextPage?.()}
            hasNextPage={(itemsQ as any).hasNextPage}
            isFetching={(itemsQ as any).isFetching}
            disabled={busy}
          />
        </main>

        <div className="w-80 xl:w-96 shrink-0">
          <CartPanel
            cartItems={cartItems}
            orderType={orderType}
            tableNumber={tableNumber}
            quote={quote}
            quoteLoading={quoteLoading}
            isOfflineQuote={!quoteQ.data && !!offlineQuote}
            busy={busy}
            onOrderTypeChange={setOrderType}
            onInc={(id) => updateQty(id, 1)}
            onDec={(id) => updateQty(id, -1)}
            onRemove={removeFromCart}
            onEdit={onEditCartItem}
            onHold={onHold}
            onSendToKitchen={onSendToKitchen}
            onPay={() => setCheckoutOpen(true)}
          />
        </div>
      </div>

      {/* Held tickets drawer */}
      <Sheet open={heldOpen} onOpenChange={setHeldOpen}>
        <SheetContent side="left" className="w-80 p-0 flex flex-col">
          <SheetHeader className="border-b px-6 py-4">
            <SheetTitle>Held Tickets</SheetTitle>
            <SheetDescription>Recall to continue an order.</SheetDescription>
          </SheetHeader>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-2">
              {(heldQ.isLoading && isOnline) ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
                ))
              ) : !allHeldTickets.length ? (
                <div className="py-12 text-center">
                  <p className="text-sm text-muted-foreground">No held tickets</p>
                  {!isOnline && (
                    <p className="text-xs text-amber-600 mt-1">Offline — showing local only</p>
                  )}
                </div>
              ) : (
                allHeldTickets.map((t) => (
                  <button
                    key={t.token}
                    className="w-full rounded-xl border p-3 text-left hover:bg-muted/50 transition-colors"
                    onClick={() => recallHeld(t)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold capitalize">
                        {t.orderType?.replace("_", " ") ?? "Ticket"}
                        {t.tableNumber ? ` · Table ${t.tableNumber}` : ""}
                      </span>
                      <Badge variant={t.source === "local" ? "secondary" : "outline"}>
                        {t.source === "local" ? "Local" : "Server"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t.cartItems.length} item{t.cartItems.length !== 1 ? "s" : ""}
                      {" · "}
                      {new Date(t.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Modifier sheet */}
      <ModifierSheet
        open={modifierOpen}
        onOpenChange={(o) => {
          setModifierOpen(o);
          if (!o) { setModifierSlug(null); setEditingLocalId(null); setSelectedMods({}); setModError(null); }
        }}
        item={itemDetail}
        isLoading={itemDetailQ.isLoading}
        selectedModsByGroup={selectedMods}
        onToggle={toggleMod}
        onAdd={onModifierAdd}
        validationError={modError}
        isEditing={!!editingLocalId}
        busy={busy}
      />

      {/* Checkout sheet */}
      <CheckoutSheet
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        total={quote?.total ?? "0"}
        busy={busy || payM.isPending}
        onConfirm={onPay}
      />
    </div>
  );
}
