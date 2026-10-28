import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EventPlan } from "@/types/ai";
import { EventModel } from "@/types/event";
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  AlertCircle,
  CheckCircle2,
  ListCheck,
  Calendar,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

export interface AIChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeEvent: EventModel | null;
  onApplyPlan?: (plan: EventPlan) => Promise<void>;
}

interface ChatEntry {
  id: string;
  role: "user" | "assistant";
  content: string;
  suggestedPlan?: EventPlan;
}

export const AIChatDrawer: React.FC<AIChatDrawerProps> = ({
  isOpen,
  onClose,
  activeEvent,
  onApplyPlan,
}) => {
  const [messages, setMessages] = useState<ChatEntry[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello! I am your EventWise AI planning assistant powered by Google Gemini. Ask me anything about budget allocation, timeline milestones, vendor recommendations, or contingency risks. How can I assist you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isApplyingPlan, setIsApplyingPlan] = useState(false);
  const [srAnnouncement, setSrAnnouncement] = useState("");

  const drawerRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    previouslyFocusedElement.current = document.activeElement as HTMLElement;
    document.body.style.overflow = "hidden";
    scrollToBottom();
    if (!drawerRef.current?.contains(document.activeElement)) {
      inputRef.current?.focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === "Tab" && drawerRef.current) {
        const focusable = Array.from(
          drawerRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        ).filter((el) => el.getAttribute("aria-hidden") !== "true");

        if (focusable.length === 0) {
          event.preventDefault();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey) {
          if (document.activeElement === first || !drawerRef.current.contains(document.activeElement)) {
            event.preventDefault();
            last?.focus();
          }
        } else {
          if (document.activeElement === last || !drawerRef.current.contains(document.activeElement)) {
            event.preventDefault();
            first?.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      abortControllerRef.current?.abort();
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
      if (previouslyFocusedElement.current && typeof previouslyFocusedElement.current.focus === "function") {
        previouslyFocusedElement.current.focus();
      }
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Suggested quick prompts as specified in prompt
  const suggestedPrompts = React.useMemo(() => [
    activeEvent
      ? `Plan my ${activeEvent.type} for ${activeEvent.expectedGuests} guests with budget ${activeEvent.currency} ${activeEvent.totalBudget.toLocaleString()}`
      : "Plan my wedding for 200 guests with a budget of ₹15 lakh",
    "What should I book first?",
    "How can I reduce my catering budget?",
    "Give me decoration ideas for a winter wedding",
    "Create a 6-month event planning timeline",
    "What vendors do I need?",
    "What could go wrong with this plan?",
    "Suggest alternatives if my budget is exceeded",
  ], [activeEvent]);

  const handleSend = async (messageText: string) => {
    const textToSend = messageText.trim();
    if (!textToSend || isLoading) return;

    setErrorMessage(null);
    setSrAnnouncement("AI is formulating your event response...");
    const userMsg: ChatEntry = {
      id: `user_${Date.now()}`,
      role: "user",
      content: textToSend,
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          context: activeEvent
            ? {
                name: activeEvent.name,
                type: activeEvent.type,
                date: activeEvent.date,
                location: activeEvent.location,
                expectedGuests: activeEvent.expectedGuests,
                totalBudget: activeEvent.totalBudget,
                currency: activeEvent.currency,
                budgetCategories: activeEvent.budgetCategories,
              }
            : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to communicate with AI assistant.");
      }

      const assistantMsg: ChatEntry = {
        id: `assistant_${Date.now()}`,
        role: "assistant",
        content: data.message,
        suggestedPlan: data.suggestedPlan,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setSrAnnouncement("AI finished responding. New message available in chat history.");
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      const errorStr =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      setErrorMessage(errorStr);
      setSrAnnouncement("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyPlan = async (plan: EventPlan) => {
    if (!onApplyPlan) return;
    try {
      setIsApplyingPlan(true);
      await onApplyPlan(plan);
      const appliedNotice: ChatEntry = {
        id: `applied_${Date.now()}`,
        role: "assistant",
        content: "Plan applied successfully to your active event!",
      };
      setMessages((prev) => [...prev, appliedNotice]);
      setSrAnnouncement("Event plan applied successfully to your active event!");
    } catch (err) {
      const errText = err instanceof Error ? err.message : "Failed to apply plan to event.";
      setErrorMessage(errText);
      setSrAnnouncement("");
    } finally {
      setIsApplyingPlan(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-slate-950/50 backdrop-blur-sm flex justify-end animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-chat-drawer-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Polite live region for screen-reader announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {srAnnouncement}
      </div>

      <div
        ref={drawerRef}
        tabIndex={-1}
        className="w-full max-w-md sm:max-w-lg bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-700/80 focus:outline-none"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700/80 flex items-center justify-between bg-slate-50/70 dark:bg-slate-850/60">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 via-indigo-600 to-accent-500 flex items-center justify-center text-white shadow-glow"
              aria-hidden="true"
            >
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2
                id="ai-chat-drawer-title"
                className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5"
              >
                EventWise AI Assistant
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-300">
                {activeEvent ? `Target: ${activeEvent.name}` : "General Planning"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close AI assistant"
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-300 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Message stream */}
        <div
          role="log"
          aria-label="Conversation messages"
          tabIndex={0}
          className="flex-1 overflow-y-auto p-4 space-y-4 focus:outline-none focus-visible:ring-1 focus-visible:ring-brand-500"
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "assistant" && (
                <div
                  className="w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-300 flex items-center justify-center shrink-0 mt-0.5"
                  aria-hidden="true"
                >
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-brand-600 text-white rounded-tr-none"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200/60 dark:border-slate-700/60"
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {/* Structured plan attachment preview if available */}
                {msg.suggestedPlan && (
                  <Card className="mt-3 p-3 bg-white dark:bg-slate-900 border-brand-300 dark:border-brand-700">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-brand-700 dark:text-brand-300 mb-1">
                      <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>AI Generated Complete Event Plan</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mb-2">
                      {msg.suggestedPlan.summary}
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 dark:text-slate-300 mb-3">
                      <span className="flex items-center gap-1">
                        <ListCheck className="w-3 h-3 text-brand-500" aria-hidden="true" />
                        {msg.suggestedPlan.estimatedBudget.length} budget items
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-brand-500" aria-hidden="true" />
                        {msg.suggestedPlan.timeline.length} milestones
                      </span>
                    </div>

                    {activeEvent && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleApplyPlan(msg.suggestedPlan!)}
                        isLoading={isApplyingPlan}
                        className="w-full text-xs"
                        leftIcon={<CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />}
                      >
                        Apply Plan to {activeEvent.name}
                      </Button>
                    )}
                  </Card>
                )}
              </div>

              {msg.role === "user" && (
                <div
                  className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 mt-0.5"
                  aria-hidden="true"
                >
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex items-center gap-3" role="status">
              <div
                className="w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-300 flex items-center justify-center shrink-0"
                aria-hidden="true"
              >
                <Bot className="w-4 h-4 animate-pulse" />
              </div>
              <div className="p-3 rounded-2xl rounded-tl-none bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 border border-transparent dark:border-slate-700/60 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-500 animate-ping" aria-hidden="true" />
                <span>Gemini is formulating event recommendations...</span>
              </div>
            </div>
          )}

          {/* Error notice */}
          {errorMessage && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <strong>AI Error:</strong> {errorMessage}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompt Chips */}
        <div
          role="region"
          aria-label="Suggested prompts"
          className="px-4 py-2 border-t border-slate-100 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-900/50"
        >
          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
            Suggested Prompts:
          </p>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {suggestedPrompts.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(prompt)}
                disabled={isLoading}
                className="px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap bg-white dark:bg-slate-800 hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:opacity-50 shrink-0"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Input box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="p-3 border-t border-slate-200 dark:border-slate-700/80 flex items-center gap-2 bg-white dark:bg-slate-900"
        >
          <label htmlFor="ai-chat-input" className="sr-only">
            Message EventWise AI Assistant
          </label>
          <input
            ref={inputRef}
            id="ai-chat-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about your event plan..."
            aria-label="Ask anything about your event plan"
            disabled={isLoading}
            maxLength={1000}
            className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          />
          <Button
            type="submit"
            size="md"
            variant="ai"
            disabled={!input.trim() || isLoading}
            aria-label="Send message to AI assistant"
            className="px-3"
          >
            <Send className="w-4 h-4" aria-hidden="true" />
          </Button>
        </form>
      </div>
    </div>
  );
};
