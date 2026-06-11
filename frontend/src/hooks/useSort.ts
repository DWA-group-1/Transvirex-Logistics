import { useMemo, useState } from "react";

export type SortDir = "asc" | "desc";
type SortValue = string | number | boolean | null | undefined;

/**
 * Client-side sorting for bounded, fully-fetched lists.
 * `accessors` maps a column id to a value-getter (handles derived columns
 * like "first + last name" or a hub-name lookup). Memoize `accessors` in the
 * caller (useMemo) so the sort isn't recomputed every render.
 */
export function useSort<T>(
  rows: T[],
  accessors: Record<string, (row: T) => SortValue>,
  initial?: { key: string; dir?: SortDir },
) {
  const [sortKey, setSortKey] = useState<string | null>(initial?.key ?? null);
  const [sortDir, setSortDir] = useState<SortDir>(initial?.dir ?? "asc");

  const sorted = useMemo(() => {
    const get = sortKey ? accessors[sortKey] : undefined;
    if (!get) return rows;
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = get(a);
      const bv = get(b);
      if (av == null && bv == null) return 0;
      if (av == null) return 1; // nulls last
      if (bv == null) return -1;
      let cmp: number;
      if (typeof av === "number" && typeof bv === "number") cmp = av - bv;
      else if (typeof av === "boolean" && typeof bv === "boolean")
        cmp = av === bv ? 0 : av ? -1 : 1;
      else
        cmp = String(av).localeCompare(String(bv), undefined, {
          numeric: true,
          sensitivity: "base",
        });
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [rows, sortKey, sortDir, accessors]);

  const toggle = (col: string) => {
    if (sortKey === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(col);
      setSortDir("asc");
    }
  };

  return { sorted, sortKey, sortDir, toggle };
}
