import { useState, useRef, useEffect } from "react";
import { Container } from "react-bootstrap";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const AGENT_URL = import.meta.env.VITE_AGENT_URL ?? "http://localhost:8007";

async function streamChat(
  message: string,
  history: Message[],
  token: string,
  onToken: (t: string) => void,
  onDone: () => void,
  onError: (e: string) => void
) {
  const res = await fetch(`${AGENT_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ message, history }),
  });

  if (!res.ok || !res.body) {
    onError(`HTTP ${res.status}`);
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6).trim();
      if (payload === "[DONE]") { onDone(); return; }
      if (payload.startsWith("[ERROR]")) { onError(payload.slice(7).trim()); return; }
      try {
        const { token: t } = JSON.parse(payload);
        if (t) onToken(t);
      } catch { /* ignore */ }
    }
  }
  onDone();
}

export default function AiAgent() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const token = localStorage.getItem("authToken") ?? "";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const msg = input.trim();
    if (!msg || loading) return;

    const newHistory: Message[] = [...messages, { role: "user", content: msg }];
    setMessages(newHistory);
    setInput("");
    setLoading(true);

    // Placeholder for streaming assistant message
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    await streamChat(
      msg,
      messages, // history = previous turns only
      token,
      (t) => {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: updated[updated.length - 1].content + t,
          };
          return updated;
        });
      },
      () => setLoading(false),
      (err) => {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: `⚠️ Error: ${err}`,
          };
          return updated;
        });
        setLoading(false);
      }
    );
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <Container fluid className="p-0" style={{ height: "calc(100vh - 64px)", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{
        padding: "16px 24px",
        borderBottom: "1px solid color-mix(in srgb, var(--font-color) 12%, transparent)",
        background: "var(--selected-color)",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: "color-mix(in srgb, var(--font-color) 90%, transparent)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <i className="bi bi-robot" style={{ color: "var(--selected-color)", fontSize: 16 }} />
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, color: "var(--font-color)" }}>Transvirex AI</div>
          <div style={{ fontSize: 11, color: "color-mix(in srgb, var(--font-color) 50%, transparent)" }}>
            {loading ? "Thinking…" : "Ready"}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}>
        {messages.length === 0 && (
          <div style={{
            margin: "auto",
            textAlign: "center",
            color: "color-mix(in srgb, var(--font-color) 40%, transparent)",
          }}>
            <i className="bi bi-stars" style={{ fontSize: 40, display: "block", marginBottom: 12 }} />
            <div style={{ fontSize: 15 }}>Ask me anything about your deliveries, drivers, or incidents.</div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{
            display: "flex",
            justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
          }}>
            <div style={{
              maxWidth: "72%",
              padding: "10px 14px",
              borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
              background: msg.role === "user"
                ? "color-mix(in srgb, var(--font-color) 90%, transparent)"
                : "var(--selected-color)",
              color: msg.role === "user"
                ? "var(--selected-color)"
                : "var(--font-color)",
              border: msg.role === "assistant"
                ? "1px solid color-mix(in srgb, var(--font-color) 12%, transparent)"
                : "none",
              fontSize: 14,
              lineHeight: 1.6,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}>
              {msg.content}
              {msg.role === "assistant" && loading && i === messages.length - 1 && msg.content === "" && (
                <span style={{ opacity: 0.5 }}>▌</span>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: "16px 24px",
        borderTop: "1px solid color-mix(in srgb, var(--font-color) 12%, transparent)",
        background: "var(--selected-color)",
        display: "flex",
        gap: 10,
        alignItems: "flex-end",
      }}>
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask about your deliveries… (Enter to send, Shift+Enter for newline)"
          disabled={loading}
          style={{
            flex: 1,
            resize: "none",
            border: "1px solid color-mix(in srgb, var(--font-color) 20%, transparent)",
            borderRadius: 10,
            padding: "10px 14px",
            fontSize: 14,
            lineHeight: 1.5,
            background: "color-mix(in srgb, var(--font-color) 6%, transparent)",
            color: "var(--font-color)",
            outline: "none",
            fontFamily: "inherit",
            maxHeight: 140,
            overflowY: "auto",
          }}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          style={{
            width: 40, height: 40,
            borderRadius: "50%",
            border: "none",
            background: loading || !input.trim()
              ? "color-mix(in srgb, var(--font-color) 20%, transparent)"
              : "color-mix(in srgb, var(--font-color) 90%, transparent)",
            color: "var(--selected-color)",
            cursor: loading || !input.trim() ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
            transition: "background 0.2s",
          }}
        >
          <i className="bi bi-send-fill" style={{ fontSize: 14 }} />
        </button>
      </div>
    </Container>
  );
}
