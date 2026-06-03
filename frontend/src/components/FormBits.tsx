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
