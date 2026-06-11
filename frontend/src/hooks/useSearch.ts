import { useMemo, useState } from "react";
export function useSearch<T>(
  rows: T[],
  toSearchable: (row: T) => (string | null | undefined)[],
) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      toSearchable(row).some(
        (v) => v != null && String(v).toLowerCase().includes(q),
      ),
    );
  }, [rows, query, toSearchable]);

  return { query, setQuery, filtered };
}
