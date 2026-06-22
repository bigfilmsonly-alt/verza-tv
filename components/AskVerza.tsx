"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

const SYSTEM_CONTEXT =
  "You are Verza, the AI assistant for Verza TV, a vertical micro-drama streaming platform with 76 original series. Help users discover shows, get recommendations, and answer questions about the platform.";

const QUICK_CHIPS = [
  "Recommend a drama",
  "What's trending?",
  "How do I unlock a series?",
  "Best romance series",
];

const MAX_MESSAGES = 10;

export default function AskVerza() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hidden, setHidden] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Hide floating button on episode-immersive pages
  useEffect(() => {
    const check = () => {
      setHidden(!!document.querySelector(".episode-immersive"));
    };
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Focus input when opened
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || loading) return;

      const userMsg: ChatMessage = { role: "user", text: text.trim() };
      setMessages((prev) => {
        const next = [...prev, userMsg];
        return next.length > MAX_MESSAGES ? next.slice(next.length - MAX_MESSAGES) : next;
      });
      setInput("");
      setLoading(true);

      try {
        const res = await fetch("/api/ai-host", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: text.trim(), context: SYSTEM_CONTEXT }),
        });

        const data = await res.json();
        const reply: ChatMessage = {
          role: "assistant",
          text: data.response ?? "Sorry, I couldn't process that. Try again!",
        };
        setMessages((prev) => {
          const next = [...prev, reply];
          return next.length > MAX_MESSAGES ? next.slice(next.length - MAX_MESSAGES) : next;
        });
      } catch {
        setMessages((prev) => {
          const next = [
            ...prev,
            { role: "assistant" as const, text: "Something went wrong. Please try again." },
          ];
          return next.length > MAX_MESSAGES ? next.slice(next.length - MAX_MESSAGES) : next;
        });
      } finally {
        setLoading(false);
      }
    },
    [loading]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  if (hidden) return null;

  return (
    <>
      {/* Floating AI button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Ask Verza AI assistant"
          style={{
            position: "fixed",
            bottom: 80,
            right: 16,
            zIndex: 45,
            width: 52,
            height: 52,
            borderRadius: "50%",
            border: "none",
            cursor: "pointer",
            background: "linear-gradient(135deg, #E0115F 0%, #B80E4D 100%)",
            boxShadow: "0 4px 20px rgba(224, 17, 95, 0.4), 0 0 40px rgba(224, 17, 95, 0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.08)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
          }}
        >
          {/* Sparkle / AI icon */}
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2L13.09 8.26L18 6L14.74 10.91L21 12L14.74 13.09L18 18L13.09 15.74L12 22L10.91 15.74L6 18L9.26 13.09L3 12L9.26 10.91L6 6L10.91 8.26L12 2Z"
              fill="#FFFFFF"
              stroke="#FFFFFF"
              strokeWidth="0.5"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}

      {/* Chat overlay */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 50,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* Backdrop */}
          <div
            onClick={() => setOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0, 0, 0, 0.5)",
              zIndex: 50,
            }}
          />

          {/* Bottom sheet */}
          <div
            style={{
              position: "relative",
              zIndex: 51,
              width: "100%",
              maxWidth: 440,
              maxHeight: "75dvh",
              background: "rgba(7, 7, 14, 0.92)",
              backdropFilter: "blur(24px) saturate(1.4)",
              WebkitBackdropFilter: "blur(24px) saturate(1.4)",
              borderRadius: "20px 20px 0 0",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderBottom: "none",
              display: "flex",
              flexDirection: "column",
              animation: "askVerzaSlideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1) forwards",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 16px 12px",
                borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
                flexShrink: 0,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #E0115F, #B80E4D)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 2L13.09 8.26L18 6L14.74 10.91L21 12L14.74 13.09L18 18L13.09 15.74L12 22L10.91 15.74L6 18L9.26 13.09L3 12L9.26 10.91L6 6L10.91 8.26L12 2Z"
                      fill="#fff"
                    />
                  </svg>
                </div>
                <span
                  style={{
                    color: "#F5F4F8",
                    fontWeight: 700,
                    fontSize: 16,
                  }}
                >
                  Ask Verza
                </span>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  border: "none",
                  cursor: "pointer",
                  background: "rgba(255, 255, 255, 0.08)",
                  color: "#F5F4F8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  lineHeight: 1,
                }}
              >
                &times;
              </button>
            </div>

            {/* Messages area */}
            <div
              ref={scrollRef}
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "12px 16px",
                display: "flex",
                flexDirection: "column",
                gap: 10,
                minHeight: 180,
              }}
            >
              {messages.length === 0 && !loading && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "24px 8px",
                    color: "#6B6B7B",
                    fontSize: 14,
                    lineHeight: 1.5,
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #E0115F, #B80E4D)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 12px",
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 2L13.09 8.26L18 6L14.74 10.91L21 12L14.74 13.09L18 18L13.09 15.74L12 22L10.91 15.74L6 18L9.26 13.09L3 12L9.26 10.91L6 6L10.91 8.26L12 2Z"
                        fill="#fff"
                      />
                    </svg>
                  </div>
                  Hi! I'm Verza, your streaming assistant.
                  <br />
                  Ask me anything about our shows!
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "82%",
                      padding: "10px 14px",
                      borderRadius:
                        msg.role === "user"
                          ? "16px 16px 4px 16px"
                          : "16px 16px 16px 4px",
                      background:
                        msg.role === "user"
                          ? "#E0115F"
                          : "rgba(255, 255, 255, 0.07)",
                      color: "#F5F4F8",
                      fontSize: 14,
                      lineHeight: 1.5,
                      wordBreak: "break-word",
                    }}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <div style={{ display: "flex", justifyContent: "flex-start" }}>
                  <div
                    style={{
                      padding: "10px 18px",
                      borderRadius: "16px 16px 16px 4px",
                      background: "rgba(255, 255, 255, 0.07)",
                      display: "flex",
                      gap: 5,
                      alignItems: "center",
                    }}
                  >
                    <span className="askverza-dot" style={{ animationDelay: "0s" }} />
                    <span className="askverza-dot" style={{ animationDelay: "0.15s" }} />
                    <span className="askverza-dot" style={{ animationDelay: "0.3s" }} />
                  </div>
                </div>
              )}
            </div>

            {/* Quick chips */}
            {messages.length === 0 && !loading && (
              <div
                style={{
                  padding: "0 16px 8px",
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  flexShrink: 0,
                }}
              >
                {QUICK_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    onClick={() => sendMessage(chip)}
                    style={{
                      padding: "7px 14px",
                      borderRadius: 20,
                      border: "1px solid rgba(224, 17, 95, 0.35)",
                      background: "rgba(224, 17, 95, 0.1)",
                      color: "#E0115F",
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      transition: "background 0.15s, border-color 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "rgba(224, 17, 95, 0.2)";
                      (e.currentTarget as HTMLButtonElement).style.borderColor =
                        "rgba(224, 17, 95, 0.6)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "rgba(224, 17, 95, 0.1)";
                      (e.currentTarget as HTMLButtonElement).style.borderColor =
                        "rgba(224, 17, 95, 0.35)";
                    }}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}

            {/* Input area */}
            <form
              onSubmit={handleSubmit}
              style={{
                padding: "12px 16px",
                paddingBottom: "max(12px, env(safe-area-inset-bottom))",
                borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                display: "flex",
                gap: 8,
                alignItems: "center",
                flexShrink: 0,
              }}
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Verza anything..."
                maxLength={500}
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  borderRadius: 24,
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  background: "rgba(255, 255, 255, 0.06)",
                  color: "#F5F4F8",
                  fontSize: 14,
                  outline: "none",
                  fontFamily: "inherit",
                }}
                onFocus={(e) => {
                  (e.currentTarget as HTMLInputElement).style.borderColor =
                    "rgba(224, 17, 95, 0.5)";
                }}
                onBlur={(e) => {
                  (e.currentTarget as HTMLInputElement).style.borderColor =
                    "rgba(255, 255, 255, 0.1)";
                }}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                aria-label="Send message"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  border: "none",
                  cursor: input.trim() && !loading ? "pointer" : "default",
                  background:
                    input.trim() && !loading
                      ? "#E0115F"
                      : "rgba(255, 255, 255, 0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "background 0.15s",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M22 2L11 13"
                    stroke={input.trim() && !loading ? "#fff" : "#6B6B7B"}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M22 2L15 22L11 13L2 9L22 2Z"
                    stroke={input.trim() && !loading ? "#fff" : "#6B6B7B"}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Inline keyframe + dot styles */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes askVerzaSlideUp {
              from { transform: translateY(100%); opacity: 0; }
              to { transform: translateY(0); opacity: 1; }
            }
            @keyframes askVerzaDotBounce {
              0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
              30% { transform: translateY(-6px); opacity: 1; }
            }
            .askverza-dot {
              display: inline-block;
              width: 7px;
              height: 7px;
              border-radius: 50%;
              background: #A0A0B0;
              animation: askVerzaDotBounce 1.2s ease-in-out infinite;
            }
          `,
        }}
      />
    </>
  );
}
