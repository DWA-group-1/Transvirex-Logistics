import { createPortal } from "react-dom";

interface FormModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  onSubmit: () => void;
  submitting?: boolean;
  submitLabel?: string;
  error?: string | null;
  children: React.ReactNode;
}

export default function FormModal({
  open,
  title,
  onClose,
  onSubmit,
  submitting = false,
  submitLabel = "Save",
  error,
  children,
}: FormModalProps) {
  if (!open) return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: 80,
        zIndex: 2000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--bg-color, white)",
          color: "var(--font-color, #111)",
          borderRadius: 12,
          width: 480,
          maxWidth: "92vw",
          maxHeight: "85vh",
          overflowY: "auto",
          padding: 24,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 22 }}>{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              border: "none",
              background: "none",
              fontSize: 24,
              cursor: "pointer",
              color: "#6b7280",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {error && (
          <div
            style={{
              background: "#fee2e2",
              color: "#991b1b",
              padding: "10px 14px",
              borderRadius: 8,
              marginBottom: 16,
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {children}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            marginTop: 20,
          }}
        >
          <button onClick={onClose} disabled={submitting} style={secondaryBtn}>
            Cancel
          </button>
          <button onClick={onSubmit} disabled={submitting} style={primaryBtn}>
            {submitting ? "Saving…" : submitLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

const primaryBtn: React.CSSProperties = {
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: 6,
  padding: "9px 18px",
  fontWeight: 600,
  cursor: "pointer",
};
const secondaryBtn: React.CSSProperties = {
  background: "#e5e7eb",
  color: "#374151",
  border: "none",
  borderRadius: 6,
  padding: "9px 18px",
  fontWeight: 600,
  cursor: "pointer",
};
