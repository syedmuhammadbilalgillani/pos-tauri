"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/**
 * Customization constants (keep at top for future reuse)
 */
export const DATA_TABLE_DEFAULT_PAGE_SIZES = [10, 20, 50, 100] as const;
export const DATA_TABLE_DEFAULT_PAGE_SIZE = 10;
export const DATA_TABLE_DEFAULT_EMPTY_TEXT = "No records found.";
export const DATA_TABLE_DEFAULT_NA = "—";
export const DATA_TABLE_MOBILE_BREAKPOINT_CLASS = "md";
export const DATA_TABLE_DEFAULT_VISIBLE_DETAIL_FIELDS_ON_MOBILE = 3;
export const DATA_TABLE_SELECTION_COLUMN_WIDTH = 44;

export type DataTableColumnType =
  | "text"
  | "number"
  | "currency"
  | "badge"
  | "status"
  | "date"
  | "datetime"
  | "boolean"
  | "image"
  | "link"
  | "tags"
  | "progress"
  | "actions"
  | "custom";

export type DataTableColumn<Row> = {
  /**
   * Unique column id. Used for responsive visibility + React keying.
   */
  id: string;
  header: React.ReactNode;
  type?: DataTableColumnType;

  /**
   * accessor: read value from row
   * cell: custom render (overrides type rendering)
   */
  accessor?: (row: Row) => unknown;
  cell?: (ctx: {
    row: Row;
    value: unknown;
    rowIndex: number;
  }) => React.ReactNode;

  /**
   * Responsive behavior
   * - priority: smaller number = more important (stays visible)
   * - hideBelow: hide this column below given breakpoint (default: none)
   */
  priority?: number;
  hideBelow?: "sm" | "md" | "lg" | "xl";

  /**
   * Layout
   */
  align?: "left" | "center" | "right";
  width?: string | number;
  className?: string;
  headClassName?: string;
  cellClassName?: string;

  /**
   * Type helpers
   */
  format?: Intl.NumberFormatOptions | Intl.DateTimeFormatOptions;
  href?: (row: Row) => string;
  target?: React.HTMLAttributeAnchorTarget;
  badgeVariant?: React.ComponentProps<typeof Badge>["variant"];
  statusVariantMap?: Record<
    string,
    React.ComponentProps<typeof Badge>["variant"]
  >;
  statusLabelMap?: Record<string, string>;
  trueLabel?: string;
  falseLabel?: string;
  tagsSeparator?: string;
  maxTags?: number;
  progressMax?: number;
};

export type DataTableProps<Row> = {
  data: Row[];
  columns: DataTableColumn<Row>[];
  caption?: React.ReactNode;

  getRowId?: (row: Row, index: number) => string;
  onRowClick?: (row: Row) => void;
  /**
   * Optional row selection
   */
  enableRowSelection?: boolean;
  selectedRowKeys?: string[];
  defaultSelectedRowKeys?: string[];
  onSelectedRowKeysChange?: (keys: string[]) => void;
  onSelectedRowsChange?: (rows: Row[]) => void;

  /**
   * Basic table-level styling
   */
  className?: string;
  tableClassName?: string;

  /**
   * Empty/loading
   */
  isLoading?: boolean;
  emptyText?: string;

  /**
   * Pagination (client-side)
   */
  enablePagination?: boolean;
  pageSize?: number;
  pageSizes?: readonly number[];
  initialPage?: number;

  /**
   * Mobile details: when columns are hidden on mobile,
   * we can show a stacked "details" area using top N columns by priority.
   */
  showMobileDetails?: boolean;
  mobileDetailsMaxFields?: number;
};

function breakpointHiddenClass(
  hideBelow: DataTableColumn<unknown>["hideBelow"] | undefined,
) {
  if (!hideBelow) return "";
  // hide on smaller than breakpoint, show at breakpoint and above
  switch (hideBelow) {
    case "sm":
      return "hidden sm:table-cell";
    case "md":
      return "hidden md:table-cell";
    case "lg":
      return "hidden lg:table-cell";
    case "xl":
      return "hidden xl:table-cell";
    default:
      return "";
  }
}

function alignClass(align?: DataTableColumn<unknown>["align"]) {
  switch (align) {
    case "center":
      return "text-center";
    case "right":
      return "text-right";
    case "left":
    default:
      return "text-left";
  }
}

function formatCellValue<Row>(
  column: DataTableColumn<Row>,
  value: unknown,
  row: Row,
): React.ReactNode {
  if (column.cell) {
    return column.cell({ row, value, rowIndex: -1 });
  }

  const type = column.type ?? "text";
  if (value === null || value === undefined || value === "") {
    return DATA_TABLE_DEFAULT_NA;
  }

  switch (type) {
    case "number": {
      const num = typeof value === "number" ? value : Number(value);
      if (Number.isNaN(num)) return String(value);
      return new Intl.NumberFormat(
        undefined,
        column.format as Intl.NumberFormatOptions,
      ).format(num);
    }
    case "currency": {
      const num = typeof value === "number" ? value : Number(value);
      if (Number.isNaN(num)) return String(value);
      const format: Intl.NumberFormatOptions = {
        style: "currency",
        currency: "USD",
        ...(column.format as Intl.NumberFormatOptions | undefined),
      };
      return new Intl.NumberFormat(undefined, format).format(num);
    }
    case "date":
    case "datetime": {
      const date = value instanceof Date ? value : new Date(String(value));
      if (Number.isNaN(date.getTime())) return String(value);
      const format: Intl.DateTimeFormatOptions =
        type === "date"
          ? {
              year: "numeric",
              month: "short",
              day: "2-digit",
              ...(column.format as Intl.DateTimeFormatOptions),
            }
          : {
              year: "numeric",
              month: "short",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              ...(column.format as Intl.DateTimeFormatOptions),
            };
      return new Intl.DateTimeFormat(undefined, format).format(date);
    }
    case "boolean": {
      const bool = Boolean(value);
      return (
        <span
          className={cn(
            "text-sm",
            bool ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {bool ? (column.trueLabel ?? "Yes") : (column.falseLabel ?? "No")}
        </span>
      );
    }
    case "badge":
      return (
        <Badge variant={column.badgeVariant ?? "secondary"}>
          {String(value)}
        </Badge>
      );
    case "status": {
      const key = String(value);
      const label = column.statusLabelMap?.[key] ?? key;
      const variant = column.statusVariantMap?.[key] ?? ("secondary" as const);
      return <Badge variant={variant}>{label}</Badge>;
    }
    case "link": {
      const href = column.href ? column.href(row) : String(value);
      return (
        <a
          href={href}
          target={column.target ?? "_blank"}
          rel={column.target === "_self" ? undefined : "noreferrer"}
          className="text-primary underline underline-offset-4 hover:opacity-80"
        >
          {String(value)}
        </a>
      );
    }
    case "tags": {
      const tags = Array.isArray(value)
        ? value
        : String(value).split(column.tagsSeparator ?? ",");
      const cleaned = tags.map((t) => String(t).trim()).filter(Boolean);
      const max = column.maxTags ?? 3;
      const shown = cleaned.slice(0, max);
      const rest = cleaned.length - shown.length;
      return (
        <div className="flex flex-wrap gap-1">
          {shown.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
          {rest > 0 ? <Badge variant="outline">+{rest}</Badge> : null}
        </div>
      );
    }
    case "progress": {
      const num = typeof value === "number" ? value : Number(value);
      if (Number.isNaN(num)) return String(value);
      const max = column.progressMax ?? 100;
      const pct = Math.max(0, Math.min(100, (num / max) * 100));
      return (
        <div className="flex items-center gap-2">
          <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-xs text-muted-foreground">
            {Math.round(pct)}%
          </span>
        </div>
      );
    }
    case "image": {
      const src = String(value);
      return (
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt=""
            className="h-8 w-8 rounded-md border object-cover"
          />
          <span className="text-sm text-muted-foreground">Image</span>
        </div>
      );
    }
    case "actions":
    case "custom":
    case "text":
    default:
      return String(value);
  }
}

export function DataTable<Row>({
  data,
  columns,
  caption,
  getRowId,
  onRowClick,
  enableRowSelection = false,
  selectedRowKeys,
  defaultSelectedRowKeys = [],
  onSelectedRowKeysChange,
  onSelectedRowsChange,
  className,
  tableClassName,
  isLoading = false,
  emptyText = DATA_TABLE_DEFAULT_EMPTY_TEXT,
  enablePagination = true,
  pageSize = DATA_TABLE_DEFAULT_PAGE_SIZE,
  pageSizes = DATA_TABLE_DEFAULT_PAGE_SIZES,
  initialPage = 1,
  showMobileDetails = true,
  mobileDetailsMaxFields = DATA_TABLE_DEFAULT_VISIBLE_DETAIL_FIELDS_ON_MOBILE,
}: DataTableProps<Row>) {
  const [currentPage, setCurrentPage] = React.useState(initialPage);
  const [currentPageSize, setCurrentPageSize] = React.useState(pageSize);
  const [internalSelectedRowKeys, setInternalSelectedRowKeys] = React.useState<
    string[]
  >(defaultSelectedRowKeys);

  const resolvedSelectedRowKeys = selectedRowKeys ?? internalSelectedRowKeys;
  const selectedKeySet = React.useMemo(
    () => new Set(resolvedSelectedRowKeys),
    [resolvedSelectedRowKeys],
  );

  const setSelectedKeys = React.useCallback(
    (keys: string[]) => {
      if (selectedRowKeys === undefined) {
        setInternalSelectedRowKeys(keys);
      }
      onSelectedRowKeysChange?.(keys);
      if (onSelectedRowsChange) {
        const keySet = new Set(keys);
        const selectedRows = data.filter((row, index) => {
          const key = getRowId ? getRowId(row, index) : String(index);
          return keySet.has(key);
        });
        onSelectedRowsChange(selectedRows);
      }
    },
    [
      data,
      getRowId,
      onSelectedRowKeysChange,
      onSelectedRowsChange,
      selectedRowKeys,
    ],
  );

  React.useEffect(() => {
    React.startTransition(() => {
      setCurrentPage(1);
    });
  }, [currentPageSize, data.length]);

  const totalPages = enablePagination
    ? Math.max(1, Math.ceil(data.length / currentPageSize))
    : 1;
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = enablePagination ? (safePage - 1) * currentPageSize : 0;
  const endIndex = enablePagination
    ? startIndex + currentPageSize
    : data.length;
  const pageRows = enablePagination ? data.slice(startIndex, endIndex) : data;
  const pageRowKeys = React.useMemo(
    () =>
      pageRows.map((row, index) =>
        getRowId
          ? getRowId(row, startIndex + index)
          : String(startIndex + index),
      ),
    [getRowId, pageRows, startIndex],
  );
  const selectedCount = resolvedSelectedRowKeys.length;
  const pageSelectedCount = pageRowKeys.filter((key) =>
    selectedKeySet.has(key),
  ).length;
  const isPageAllSelected =
    pageRows.length > 0 && pageSelectedCount === pageRows.length;
  const isPagePartialSelected =
    pageSelectedCount > 0 && pageSelectedCount < pageRows.length;

  const sortedColumns = React.useMemo(() => {
    return [...columns].sort(
      (a, b) => (a.priority ?? 999) - (b.priority ?? 999),
    );
  }, [columns]);

  const mobileDetailsColumns = React.useMemo(() => {
    if (!showMobileDetails) return [];
    // Show details from columns that are hidden below md (most common)
    const candidates = sortedColumns.filter((c) => c.hideBelow);
    const fallback = sortedColumns.filter((c) => c.type !== "actions");
    const base = candidates.length ? candidates : fallback;
    return base.slice(0, mobileDetailsMaxFields);
  }, [mobileDetailsMaxFields, showMobileDetails, sortedColumns]);

  return (
    <div className={cn("space-y-3", className)}>
      <Table className={tableClassName}>
        {caption ? (
          <caption className="mt-2 text-sm text-muted-foreground">
            {caption}
          </caption>
        ) : null}
        <TableHeader>
          <TableRow>
            {enableRowSelection ? (
              <TableHead
                className="w-11"
                style={{ width: DATA_TABLE_SELECTION_COLUMN_WIDTH }}
              >
                <input
                  type="checkbox"
                  aria-label="Select all rows on current page"
                  checked={isPageAllSelected}
                  ref={(node) => {
                    if (node) {
                      node.indeterminate = isPagePartialSelected;
                    }
                  }}
                  onChange={(event) => {
                    if (event.target.checked) {
                      const merged = new Set(resolvedSelectedRowKeys);
                      pageRowKeys.forEach((key) => merged.add(key));
                      setSelectedKeys(Array.from(merged));
                    } else {
                      const pageKeySet = new Set(pageRowKeys);
                      const filtered = resolvedSelectedRowKeys.filter(
                        (key) => !pageKeySet.has(key),
                      );
                      setSelectedKeys(filtered);
                    }
                  }}
                  className="h-4 w-4 rounded border border-input accent-primary"
                />
              </TableHead>
            ) : null}
            {columns.map((column) => (
              <TableHead
                key={column.id}
                className={cn(
                  alignClass(column.align),
                  breakpointHiddenClass(column.hideBelow),
                  column.headClassName,
                )}
                style={column.width ? { width: column.width } : undefined}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell
                colSpan={columns.length + (enableRowSelection ? 1 : 0)}
                className="py-10 text-center text-sm text-muted-foreground"
              >
                Loading...
              </TableCell>
            </TableRow>
          ) : pageRows.length ? (
            pageRows.map((row, rowIndex) => {
              const rowId = getRowId
                ? getRowId(row, rowIndex)
                : String(rowIndex);
              return (
                <React.Fragment key={rowId}>
                  <TableRow
                    className={cn(onRowClick ? "cursor-pointer" : "")}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                  >
                    {enableRowSelection ? (
                      <TableCell>
                        <input
                          type="checkbox"
                          aria-label={`Select row ${rowId}`}
                          checked={selectedKeySet.has(rowId)}
                          onClick={(event) => event.stopPropagation()}
                          onChange={(event) => {
                            if (event.target.checked) {
                              setSelectedKeys(
                                Array.from(
                                  new Set([...resolvedSelectedRowKeys, rowId]),
                                ),
                              );
                            } else {
                              setSelectedKeys(
                                resolvedSelectedRowKeys.filter(
                                  (key) => key !== rowId,
                                ),
                              );
                            }
                          }}
                          className="h-4 w-4 rounded border border-input accent-primary"
                        />
                      </TableCell>
                    ) : null}
                    {columns.map((column) => {
                      const value = column.accessor
                        ? column.accessor(row)
                        : (row as never)[column.id];
                      const content = column.cell
                        ? column.cell({ row, value, rowIndex })
                        : formatCellValue(column, value, row);
                      return (
                        <TableCell
                          key={column.id}
                          className={cn(
                            alignClass(column.align),
                            breakpointHiddenClass(column.hideBelow),
                            column.cellClassName,
                          )}
                        >
                          {content}
                        </TableCell>
                      );
                    })}
                  </TableRow>

                  {showMobileDetails && mobileDetailsColumns.length ? (
                    <TableRow className="md:hidden">
                      <TableCell
                        colSpan={columns.length + (enableRowSelection ? 1 : 0)}
                        className="whitespace-normal"
                      >
                        <div className="grid gap-2 rounded-md bg-muted/40 p-3">
                          {mobileDetailsColumns.map((column) => {
                            const value = column.accessor
                              ? column.accessor(row)
                              : (row as never)[column.id];
                            const content = column.cell
                              ? column.cell({ row, value, rowIndex })
                              : formatCellValue(column, value, row);
                            return (
                              <div
                                key={column.id}
                                className="grid grid-cols-3 gap-3"
                              >
                                <div className="col-span-1 text-xs font-medium text-muted-foreground">
                                  {column.header}
                                </div>
                                <div className="col-span-2 text-sm">
                                  {content}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : null}
                </React.Fragment>
              );
            })
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length + (enableRowSelection ? 1 : 0)}
                className="py-10 text-center text-sm text-muted-foreground"
              >
                {emptyText}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {enablePagination ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-muted-foreground">
            Showing{" "}
            <span className="font-medium text-foreground">
              {pageRows.length}
            </span>{" "}
            of{" "}
            <span className="font-medium text-foreground">{data.length}</span>
            {enableRowSelection ? (
              <>
                {" "}
                | Selected{" "}
                <span className="font-medium text-foreground">
                  {selectedCount}
                </span>
              </>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="h-9 rounded-md border bg-background px-2 text-sm"
              value={currentPageSize}
              onChange={(e) => setCurrentPageSize(Number(e.target.value))}
            >
              {pageSizes.map((size) => (
                <option key={size} value={size}>
                  {size}/page
                </option>
              ))}
            </select>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={safePage === 1}
              >
                First
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
              >
                Prev
              </Button>
              <div className="px-1 text-sm">
                {safePage} / {totalPages}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={safePage === totalPages}
              >
                Next
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={safePage === totalPages}
              >
                Last
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
