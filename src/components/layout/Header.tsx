import { Button } from "@/components/ui/Button";
import { EventModel } from "@/types/event";
import { Sparkles, Plus, Calendar, RotateCcw, Moon, Sun } from "lucide-react";
import React from "react";

export interface HeaderProps {
  events: EventModel[];
  activeEvent: EventModel | null;
  onSelectEvent: (eventId: string) => void;
  onCreateEventClick: () => void;
  onToggleAIChat: () => void;
  onResetDemo: () => void;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  events,
  activeEvent,
  onSelectEvent,
  onCreateEventClick,
  onToggleAIChat,
  onResetDemo,
  isDarkMode = false,
  onToggleTheme,
}) => {

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800 bg-white/85 dark:bg-slate-950/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-accent-500 flex items-center justify-center shadow-glow text-white font-black text-lg">
            <Sparkles className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-slate-900 dark:text-slate-50 tracking-tight">
                EventWise<span className="text-brand-600 dark:text-brand-400"> AI</span>
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-md bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 border border-brand-200/60 dark:border-brand-800/60">
                PRO
              </span>
            </div>
            <p className="hidden md:block text-[11px] text-slate-500 dark:text-slate-400 leading-none">
              GenAI Planning Assistant
            </p>
          </div>
        </div>

        {/* Event selector & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {events.length > 0 && (
            <div className="relative">
              <label htmlFor="header-event-select" className="sr-only">
                Select Active Event
              </label>
              <div className="flex items-center bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-1.5 gap-2">
                <Calendar className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />
                <select
                  id="header-event-select"
                  value={activeEvent?.id || ""}
                  onChange={(e) => onSelectEvent(e.target.value)}
                  className="bg-transparent text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-lg cursor-pointer max-w-[130px] sm:max-w-[200px] truncate"
                >
                  {events.map((e) => (
                    <option key={e.id} value={e.id} className="text-slate-900 bg-white dark:bg-slate-900 dark:text-slate-100">
                      {e.name} {e.isDemo ? "(Demo)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Dark / Light Mode Toggle */}
          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
              title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4 text-amber-500" aria-hidden="true" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600 dark:text-slate-400" aria-hidden="true" />
              )}
            </button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={onResetDemo}
            title="Reset to demo data"
            className="hidden lg:flex text-xs px-2.5"
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Reset Demo
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={onCreateEventClick}
            leftIcon={<Plus className="w-4 h-4" />}
            className="text-xs sm:text-sm"
          >
            <span className="hidden sm:inline">New Event</span>
            <span className="sm:hidden">New</span>
          </Button>

          <Button
            size="sm"
            variant="ai"
            onClick={onToggleAIChat}
            leftIcon={<Sparkles className="w-4 h-4 animate-pulse-subtle" />}
            className="text-xs sm:text-sm"
          >
            <span>Ask AI</span>
          </Button>
        </div>
      </div>
    </header>
  );
};
