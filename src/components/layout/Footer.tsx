import React from "react";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-200 dark:border-slate-850 py-6 mt-16 bg-slate-50/50 dark:bg-slate-950/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
        <p>© {new Date().getFullYear()} EventWise AI. Built with Google Gemini & Next.js.</p>
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Vercel Ready
          </span>
          <span>•</span>
          <span>WCAG 2.2 AA Accessible</span>
        </div>
      </div>
    </footer>
  );
};
