"use client";

import { useState, type FormEvent } from "react";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type ChatSidebarProps = {
  isOpen: boolean;
  isSending: boolean;
  messages: ChatMessage[];
  error?: string;
  isMock: boolean;
  onToggle: () => void;
  onSend: (message: string) => void;
  onClear: () => void;
  onToggleMock: () => void;
};

export const ChatSidebar = ({
  isOpen,
  isSending,
  messages,
  error,
  isMock,
  onToggle,
  onSend,
  onClear,
  onToggleMock,
}: ChatSidebarProps) => {
  const [draft, setDraft] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.trim()) {
      return;
    }
    onSend(draft.trim());
    setDraft("");
  };

  return (
    <aside
      className={`absolute bottom-6 right-6 top-36 z-20 h-auto w-[min(360px,calc(100vw-3rem))] rounded-[18px] border border-[rgba(3,33,71,0.14)] bg-[linear-gradient(165deg,_rgba(255,255,255,0.98)_0%,_rgba(246,248,251,0.98)_100%)] shadow-[0_16px_30px_rgba(3,33,71,0.14)] transition duration-300 ${
        isOpen ? "translate-x-0 opacity-100" : "pointer-events-none translate-x-6 opacity-0"
      }`}
      aria-label="AI chat sidebar"
    >
      <div className="flex h-full flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-[var(--stroke)] bg-white/86 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--gray-text)]">
              Assistant
            </p>
            <h2 className="font-display text-lg font-semibold text-[var(--navy-dark)]">
              Kanban Copilot
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleMock}
              className={`rounded-full border px-3 py-2 text-[11px] font-semibold uppercase tracking-wide transition ${
                isMock
                  ? "border-[var(--navy-dark)] bg-white text-[var(--navy-dark)]"
                  : "border-[var(--stroke)] bg-white/80 text-[var(--gray-text)]"
              }`}
            >
              {isMock ? "Mock on" : "Mock off"}
            </button>
            <button
              type="button"
              onClick={onToggle}
              className="rounded-md border border-[var(--stroke)] bg-white/90 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--navy-dark)] transition hover:border-[var(--stroke-strong)]"
            >
              Close
            </button>
          </div>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {messages.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--stroke)] bg-white/70 px-4 py-6 text-center text-xs font-semibold uppercase tracking-[0.24em] text-[var(--gray-text)]">
              Ask for updates, new cards, or column changes.
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-[0_12px_24px_rgba(3,33,71,0.08)] ${
                  message.role === "user"
                    ? "ml-auto bg-[var(--navy-dark)] text-white"
                    : "bg-white text-[var(--navy-dark)]"
                }`}
              >
                {message.content}
              </div>
            ))
          )}
        </div>

        <div className="border-t border-[var(--stroke)] bg-white/70 px-5 py-4">
          {error ? (
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--secondary-purple)]">
              {error}
            </p>
          ) : null}
          <form onSubmit={handleSubmit} className="space-y-3">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask the assistant to update the board..."
              rows={3}
              className="w-full resize-none rounded-2xl border border-[var(--stroke)] bg-white px-3 py-2 text-sm text-[var(--navy-dark)] outline-none transition focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[rgba(32,157,215,0.2)]"
              aria-label="Chat message"
            />
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={onClear}
                className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gray-text)] transition hover:text-[var(--navy-dark)]"
              >
                Clear
              </button>
              <button
                type="submit"
                disabled={isSending}
                className="rounded-md bg-[var(--navy-dark)] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-[#0b3469] disabled:opacity-60"
              >
                {isSending ? "Sending" : "Send"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </aside>
  );
};
