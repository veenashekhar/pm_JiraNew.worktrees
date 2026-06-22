"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { ChatSidebar, type ChatMessage } from "@/components/ChatSidebar";
import { KanbanBoard } from "@/components/KanbanBoard";
import { initialData, type BoardData } from "@/lib/kanban";

const AUTH_KEY = "pm-auth";
const USERNAME = "user";
const PASSWORD = "password";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

export const LoginGate = () => {
  const [isReady, setIsReady] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [board, setBoard] = useState<BoardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [chatError, setChatError] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isMockMode, setIsMockMode] = useState(true);

  const historyPayload = useMemo(
    () =>
      messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    [messages]
  );

  const loadBoard = useCallback(async () => {
    setIsLoading(true);
    setApiError("");
    try {
      const response = await fetch(`${API_BASE}/api/kanban/${USERNAME}`);
      if (!response.ok) {
        throw new Error("Failed to load board.");
      }
      const payload = (await response.json()) as BoardData;
      setBoard(payload);
    } catch {
      setBoard(initialData);
      setApiError("Unable to reach the server. Using local data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveBoard = useCallback(async (nextBoard: BoardData) => {
    setApiError("");
    try {
      const response = await fetch(`${API_BASE}/api/kanban/${USERNAME}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextBoard),
      });
      if (!response.ok) {
        throw new Error("Failed to save board.");
      }
    } catch {
      setApiError("Unable to save changes. Check the server and retry.");
    }
  }, []);

  const handleBoardChange = useCallback(
    (nextBoard: BoardData) => {
      setBoard(nextBoard);
      void saveBoard(nextBoard);
    },
    [saveBoard]
  );

  const handleSendMessage = useCallback(
    async (message: string) => {
      if (!board || isSending) {
        return;
      }

      setChatError("");
      const nextMessages: ChatMessage[] = [
        ...messages,
        { id: `user-${Date.now()}`, role: "user" as const, content: message },
      ];
      setMessages(nextMessages);
      setIsSending(true);

      try {
        const response = await fetch(`${API_BASE}/api/ai/kanban`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: USERNAME,
            board,
            history: historyPayload,
            message,
            mock: isMockMode,
          }),
        });
        if (!response.ok) {
          throw new Error("Failed to reach assistant.");
        }
        const payload = (await response.json()) as {
          response: string;
          board?: BoardData | null;
        };
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: payload.response,
          },
        ]);
        if (payload.board) {
          setBoard(payload.board);
        }
      } catch {
        setChatError("Unable to contact the assistant. Try again.");
      } finally {
        setIsSending(false);
      }
    },
    [API_BASE, board, historyPayload, isSending, messages]
  );

  const handleClearChat = useCallback(() => {
    setMessages([]);
    setChatError("");
  }, []);

  useEffect(() => {
    const storedAuth = window.localStorage.getItem(AUTH_KEY);
    const authed = storedAuth === "true";
    setIsAuthed(authed);
    if (authed) {
      void loadBoard();
    }
    setIsReady(true);
  }, [loadBoard]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (username.trim() === USERNAME && password === PASSWORD) {
      window.localStorage.setItem(AUTH_KEY, "true");
      setIsAuthed(true);
      void loadBoard();
      setError("");
      setPassword("");
      return;
    }

    setError("Invalid credentials. Try user / password.");
  };

  const handleLogout = () => {
    window.localStorage.removeItem(AUTH_KEY);
    setIsAuthed(false);
    setBoard(null);
    setIsLoading(false);
    setApiError("");
    setChatError("");
    setMessages([]);
    setUsername("");
    setPassword("");
    setError("");
  };

  if (!isReady) {
    return null;
  }

  if (!isAuthed) {
    return (
      <main className="soft-grid flex min-h-screen items-center justify-center px-6 py-16">
        <section className="panel-glass rise-in w-full max-w-md rounded-[20px] p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--gray-text)]">
            Project Workspace
          </p>
          <h1 className="mt-3 font-display text-3xl font-semibold text-[var(--navy-dark)]">
            Welcome back
          </h1>
          <p className="mt-2 text-sm leading-6 text-[var(--gray-text)]">
            Sign in to access your Kanban board.
          </p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gray-text)]">
              Username
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="user"
                className="rounded-xl border border-[var(--stroke)] bg-white px-3 py-2 text-sm font-medium text-[var(--navy-dark)] outline-none transition focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[rgba(32,157,215,0.2)]"
                autoComplete="username"
                required
              />
            </label>
            <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gray-text)]">
              Password
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                placeholder="password"
                className="rounded-xl border border-[var(--stroke)] bg-white px-3 py-2 text-sm font-medium text-[var(--navy-dark)] outline-none transition focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[rgba(32,157,215,0.2)]"
                autoComplete="current-password"
                required
              />
            </label>
            {error ? (
              <p role="alert" className="text-sm font-semibold text-[var(--secondary-purple)]">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              className="w-full rounded-lg bg-[var(--navy-dark)] px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-white shadow-[0_10px_20px_rgba(3,33,71,0.2)] transition hover:bg-[#0b3469]"
            >
              Sign in
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <div className="relative">
      <div className="pointer-events-none absolute right-6 top-6 z-10 flex items-center gap-3 rounded-md border border-[var(--stroke)] bg-white/92 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--gray-text)] shadow-[var(--card-shadow)]">
        Signed in
      </div>
      <button
        type="button"
        onClick={handleLogout}
        className="absolute right-6 top-16 z-10 rounded-md border border-[var(--stroke)] bg-white/92 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--navy-dark)] shadow-[var(--card-shadow)] transition hover:border-[var(--stroke-strong)]"
      >
        Log out
      </button>
      {apiError ? (
        <div className="absolute left-6 top-6 z-10 rounded-md border border-[var(--stroke)] bg-white/92 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--secondary-purple)] shadow-[var(--card-shadow)]">
          {apiError}
        </div>
      ) : null}
      <button
        type="button"
        onClick={() => setIsChatOpen((prev) => !prev)}
        className="absolute right-6 top-28 z-10 flex h-14 w-14 items-center justify-center rounded-xl border border-[rgba(3,33,71,0.14)] bg-white/92 shadow-[0_12px_22px_rgba(3,33,71,0.14)] transition hover:border-[var(--stroke-strong)]"
        aria-label={isChatOpen ? "Hide chat" : "Show chat"}
      >
        <img
          src="/ai-chatbot.svg"
          alt="AI chatbot"
          className="h-10 w-10"
        />
      </button>
      {isLoading || !board ? (
        <main className="flex min-h-screen items-center justify-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--gray-text)]">
            Loading board...
          </p>
        </main>
      ) : (
        <KanbanBoard initialBoard={board} onBoardChange={handleBoardChange} />
      )}
      <ChatSidebar
        isOpen={isChatOpen}
        isSending={isSending}
        messages={messages}
        error={chatError}
        isMock={isMockMode}
        onToggle={() => setIsChatOpen((prev) => !prev)}
        onSend={handleSendMessage}
        onClear={handleClearChat}
        onToggleMock={() => setIsMockMode((prev) => !prev)}
      />
    </div>
  );
};
