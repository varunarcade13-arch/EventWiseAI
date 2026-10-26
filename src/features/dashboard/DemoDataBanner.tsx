import React from "react";
import { Info } from "lucide-react";

export interface DemoDataBannerProps {
  isDemo: boolean;
  onResetDemo: () => void;
}

export const DemoDataBanner: React.FC<DemoDataBannerProps> = ({ isDemo, onResetDemo }) => {
  if (!isDemo) return null;

  return (
    <div
      role="region"
      aria-label="Demo mode notice"
      className="w-full bg-gradient-to-r from-brand-50/90 via-indigo-50/80 to-purple-50/90 dark:from-brand-950/40 dark:via-slate-900/60 dark:to-purple-950/40 border-b border-brand-200/60 dark:border-brand-900/40 px-4 py-2.5"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-brand-900 dark:text-brand-200">
          <Info className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" aria-hidden="true" />
          <span>
            <strong>Demo Event Active:</strong> You are currently viewing sample data. Any AI planning requests will query the real Google Gemini API.
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onResetDemo}
            className="text-brand-700 dark:text-brand-300 font-semibold underline hover:text-brand-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
          >
            Reset demo data
          </button>
        </div>
      </div>
    </div>
  );
};
