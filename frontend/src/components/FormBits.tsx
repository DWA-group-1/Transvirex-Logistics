export function Labeled({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 13, fontWeight: 600 }}>{label}</label>
      {children}
    </div>
  );
}

export const inputStyle: React.CSSProperties = {
  padding: "8px 10px",
  border: "1px solid #d1d5db",
  borderRadius: 6,
  fontSize: 14,
};

export function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ padding: "10px 12px", fontSize: 13 }}>{children}</th>;
}

export function Td({
  children,
  colSpan,
}: {
  children: React.ReactNode;
  colSpan?: number;
}) {
  return (
    <td colSpan={colSpan} style={{ padding: "10px 12px" }}>
      {children}
    </td>
  );
}

export const pageHeaderRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-end",
  marginBottom: 20,
};

export const newButton: React.CSSProperties = {
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: 6,
  padding: "9px 16px",
  fontWeight: 600,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

export function SortableTh({
  label,
  col,
  sortKey,
  sortDir,
  onSort,
}: {
  label: string;
  col: string;
  sortKey: string | null;
  sortDir: "asc" | "desc";
  onSort: (col: string) => void;
}) {
  const active = sortKey === col;
  return (
    <th
      onClick={() => onSort(col)}
      style={{
        padding: "10px 12px",
        fontSize: 13,
        cursor: "pointer",
        userSelect: "none",
        whiteSpace: "nowrap",
      }}
    >
      {label}
      <span style={{ marginLeft: 6, opacity: active ? 1 : 0.3, fontSize: 11 }}>
        {active ? (sortDir === "asc" ? "▲" : "▼") : "↕"}
      </span>
    </th>
  );
}

export function SearchBar({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div style={{ position: "relative", maxWidth: 320, margin: "8px 0 16px" }}>
      <i
        className="bi bi-search"
        style={{
          position: "absolute",
          left: 12,
          top: "50%",
          transform: "translateY(-50%)",
          opacity: 0.5,
          fontSize: 14,
        }}
      />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "Search…"}
        style={{
          width: "100%",
          padding: "8px 30px 8px 34px",
          borderRadius: 8,
          fontSize: 14,
          background: "var(--selected-color)",
          color: "var(--font-color)",
          border:
            "1px solid color-mix(in srgb, var(--font-color) 20%, transparent)",
        }}
      />
      {value && (
        <button
          onClick={() => onChange("")}
          aria-label="Clear"
          style={{
            position: "absolute",
            right: 8,
            top: "50%",
            transform: "translateY(-50%)",
            border: "none",
            background: "none",
            cursor: "pointer",
            color: "var(--font-color)",
            opacity: 0.6,
            fontSize: 18,
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}
