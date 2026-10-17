import { toast } from "@/hooks/use-toast";
import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

const SESSION_KEY = "chat_sesion_id";
const BUBBLE_SIZE = 56;
const EDGE_GAP = 16;
const DRAG_THRESHOLD = 6;
const REQUEST_TIMEOUT_MS = 45_000;
const MAX_INPUT_LENGTH = 1000;

const WELCOME = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi, I'm Travel Tribe Assistant! Ask me anything about Travel Tribe Hostel.",
};

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
const viewport = () => ({ w: window.innerWidth, h: window.innerHeight });

const clampPosition = ({ left, top }) => {
  const { w, h } = viewport();
  return {
    left: clamp(left, EDGE_GAP, w - BUBBLE_SIZE - EDGE_GAP),
    top: clamp(top, EDGE_GAP, h - BUBBLE_SIZE - EDGE_GAP),
  };
};

const snapToSide = (pos) => {
  const { w } = viewport();
  const onLeftHalf = pos.left + BUBBLE_SIZE / 2 < w / 2;
  return {
    ...pos,
    left: onLeftHalf ? EDGE_GAP : w - BUBBLE_SIZE - EDGE_GAP,
  };
};

const uid = () =>
  window.crypto?.randomUUID?.() ??
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const getSessionId = () => {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = uid();
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return uid();
  }
};

const markdownComponents = {
  p: (props) => <p className="mb-2 last:mb-0" {...props} />,
  ul: (props) => <ul className="list-disc ml-4 mb-2 space-y-1" {...props} />,
  ol: (props) => <ol className="list-decimal ml-4 mb-2 space-y-1" {...props} />,
  li: (props) => <li className="leading-snug" {...props} />,
  strong: (props) => (
    <strong className="font-semibold text-zinc-900" {...props} />
  ),
  a: ({ node, ...props }) => (
    <a
      target="_blank"
      rel="noopener noreferrer"
      className="underline underline-offset-2 text-zinc-900"
      {...props}
    />
  ),
  code: ({ node, className, ...props }) => (
    <code
      className={`bg-zinc-100 px-1 rounded text-[0.85em] ${className ?? ""}`}
      {...props}
    />
  ),
  pre: ({ node, ...props }) => (
    <pre
      className="overflow-x-auto bg-zinc-100 p-2 rounded-md my-2 text-xs"
      {...props}
    />
  ),
};

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([WELCOME]);
  const [isSending, setIsSending] = useState(false);
  const [sessionId] = useState(getSessionId);

  const [pos, setPos] = useState(() => {
    const { w, h } = viewport();
    return { left: w - BUBBLE_SIZE - EDGE_GAP, top: h - 80 };
  });
  const [isDragging, setIsDragging] = useState(false);

  const dragRef = useRef(null);
  const movedRef = useRef(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const bubbleBtnRef = useRef(null);

  useEffect(() => {
    const onResize = () => setPos((p) => clampPosition(p));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e) => {
      if (e.key === "Escape") closeChat();
    };
    window.addEventListener("keydown", onKey);
    inputRef.current?.focus({ preventScroll: true });

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, isSending]);

  const closeChat = useCallback(() => {
    setIsOpen(false);
    requestAnimationFrame(() =>
      bubbleBtnRef.current?.focus({ preventScroll: true }),
    );
  }, []);
  const handlePointerDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    movedRef.current = false;
    dragRef.current = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      origin: pos,
      latest: pos,
    };
  };

  const handlePointerMove = (e) => {
    const d = dragRef.current;
    if (!d || e.pointerId !== d.id) return;

    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!movedRef.current) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      movedRef.current = true;
      setIsDragging(true);
      e.currentTarget.setPointerCapture(e.pointerId);
    }

    d.latest = clampPosition({
      left: d.origin.left + dx,
      top: d.origin.top + dy,
    });
    setPos(d.latest);
  };

  const handlePointerUp = (e) => {
    const d = dragRef.current;
    if (!d || e.pointerId !== d.id) return;
    dragRef.current = null;
    if (movedRef.current) setPos(snapToSide(d.latest)); 
    setIsDragging(false);
  };

  const handleBubbleClick = () => {
    if (movedRef.current) return; 
    setIsOpen(true);
  };

  const requestReply = async (text) => {
    const API_URL = import.meta.env.VITE_AI_URL;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, session_id: sessionId }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data?.reply || "No reply from server.";
    } finally {
      clearTimeout(timer);
    }
  };

  const sendMessage = async (rawText, { retry = false } = {}) => {
    const text = rawText.trim();
    if (!text || isSending) return;

    if (!import.meta.env.VITE_AI_URL) {
      toast("VITE_AI_URL is not defined");
      return;
    }

    if (!retry) {
      setMessages((prev) => [
        ...prev,
        { id: uid(), role: "user", content: text },
      ]);
      setInput("");
    }
    setIsSending(true);

    try {
      const reply = await requestReply(text);
      setMessages((prev) => [
        ...prev,
        { id: uid(), role: "assistant", content: reply },
      ]);
    } catch (err) {
      console.error("ChatBot error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "error",
          content:
            err.name === "AbortError"
              ? "The request timed out. The server may be waking up."
              : "Sorry, I couldn't reach the server.",
          retryText: text,
        },
      ]);
    } finally {
      setIsSending(false);
      inputRef.current?.focus({ preventScroll: true });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const canSend = input.trim().length > 0 && !isSending;

  return (
    <>
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          left: pos.left,
          top: pos.top,
          visibility: isOpen ? "hidden" : "visible",
          opacity: isOpen ? 0 : 1,
          pointerEvents: isOpen ? "none" : "auto",
          transition: isDragging
            ? "none"
            : "left 250ms ease-out, top 250ms ease-out, opacity 200ms ease-out",
        }}
        className={`fixed z-[9998] touch-none select-none font-sans ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
      >
        <button
          ref={bubbleBtnRef}
          type="button"
          onClick={handleBubbleClick}
          aria-label="Open chat"
          title="Drag to move, click to chat"
          className="w-14 h-14 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white shadow-xl flex items-center justify-center active:scale-95 transition-transform duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6 pointer-events-none"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
            />
          </svg>
        </button>
      </div>

      {/* CHAT DIALOG */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="chatbot-title"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={closeChat}
          />

          {/* Panel: full screen on phones, centered card on larger screens */}
          <div className="relative flex flex-col bg-white overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 w-full h-[100dvh] sm:w-[380px] sm:h-[min(520px,calc(100dvh-2rem))] sm:rounded-2xl sm:border sm:border-zinc-200">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-zinc-100 pt-[max(1rem,env(safe-area-inset-top))]">
              <span
                id="chatbot-title"
                className="font-semibold text-zinc-800 text-sm"
              >
                Travel Tribe Assistant
              </span>
              <button
                type="button"
                onClick={closeChat}
                className="p-1 -m-1 text-zinc-400 hover:text-zinc-800 transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
                aria-label="Close chat"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              role="log"
              aria-live="polite"
              className="flex-1 overflow-y-auto overscroll-contain overflow-x-hidden px-4 py-4 space-y-4 bg-zinc-50"
            >
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  onRetry={() => sendMessage(msg.retryText, { retry: true })}
                  disabled={isSending}
                />
              ))}

              {isSending && (
                <div
                  className="flex justify-start"
                  role="status"
                  aria-label="Assistant is typing"
                >
                  <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-white border border-zinc-100 shadow-sm flex gap-1">
                    <span className="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <form
              onSubmit={handleSubmit}
              className="p-3 bg-white border-t border-zinc-100 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
            >
              <div className="flex items-center gap-2 bg-zinc-100 rounded-full px-2 py-1 focus-within:ring-2 focus-within:ring-zinc-400 transition-shadow">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  maxLength={MAX_INPUT_LENGTH}
                  placeholder="Ask about hostels..."
                  aria-label="Type your message"
                  autoComplete="off"
                  enterKeyHint="send"
                  // text-base (16px) prevents iOS from zooming in on focus
                  className="flex-1 bg-transparent h-9 px-3 outline-none text-base sm:text-sm text-zinc-800 placeholder-zinc-400 min-w-0"
                />
                <button
                  type="submit"
                  disabled={!canSend}
                  aria-label="Send message"
                  className="w-9 h-9 shrink-0 rounded-full bg-zinc-900 text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-800 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-4 h-4 ml-0.5"
                    aria-hidden="true"
                  >
                    <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function MessageBubble({ msg, onRetry, disabled }) {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-br-sm text-sm shadow-sm bg-zinc-900 text-white break-words whitespace-pre-wrap">
          {msg.content}
        </div>
      </div>
    );
  }

  if (msg.role === "error") {
    return (
      <div className="flex justify-start">
        <div className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-bl-sm text-sm bg-red-50 text-red-800 border border-red-100 shadow-sm">
          <p>{msg.content}</p>
          <button
            type="button"
            onClick={onRetry}
            disabled={disabled}
            className="mt-2 text-xs font-medium underline underline-offset-2 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 rounded"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-bl-sm text-sm shadow-sm bg-white text-zinc-800 border border-zinc-100 break-words overflow-hidden">
        <ReactMarkdown components={markdownComponents}>
          {msg.content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
