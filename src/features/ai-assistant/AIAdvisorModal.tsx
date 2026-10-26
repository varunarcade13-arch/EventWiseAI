import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { formatCurrency } from "@/lib/currency";
import { BudgetAnalysis, IdeasPlan, RiskAnalysis } from "@/types/ai";
import { CurrencyCode } from "@/types/event";
import {
  Sparkles,
  TrendingUp,
  Lightbulb,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react";
import React from "react";

export type AdvisorModalType = "budget" | "ideas" | "risks" | null;

export interface AIAdvisorModalProps {
  type: AdvisorModalType;
  isOpen: boolean;
  onClose: () => void;
  currency?: CurrencyCode;
  budgetAnalysis?: BudgetAnalysis | null;
  ideasPlan?: IdeasPlan | null;
  riskAnalysis?: RiskAnalysis | null;
  onApplyRisks?: () => Promise<void>;
}

export const AIAdvisorModal: React.FC<AIAdvisorModalProps> = ({
  type,
  isOpen,
  onClose,
  currency = "INR",
  budgetAnalysis,
  ideasPlan,
  riskAnalysis,
  onApplyRisks,
}) => {
  if (!isOpen || !type) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        type === "budget"
          ? "AI Budget Advisor"
          : type === "ideas"
          ? "AI Creative Ideation"
          : "AI Risk & Contingency Advisor"
      }
      description="Powered by Google Gemini — Actionable strategic recommendations tailored to your event parameters."
      size="xl"
    >
      <div className="flex flex-col gap-5 py-1">
        {/* BUDGET ADVISOR VIEW */}
        {type === "budget" && budgetAnalysis && (
          <div className="flex flex-col gap-4">
            <div className="p-4 rounded-xl bg-gradient-to-r from-brand-50 to-indigo-50 dark:from-brand-950/40 dark:to-indigo-950/40 border border-brand-200 dark:border-brand-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase font-bold tracking-wider text-brand-800 dark:text-brand-300">
                  Financial Health Score
                </span>
                <span className="text-xl font-black text-brand-700 dark:text-brand-300">
                  {budgetAnalysis.healthScore}/100
                </span>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                {budgetAnalysis.summary}
              </p>
            </div>

            {/* Potential Savings */}
            {budgetAnalysis.potentialSavings?.length > 0 && (
              <div>
                <h3 className="text-xs uppercase font-bold tracking-wider text-slate-500 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
                  Potential Savings Opportunities
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {budgetAnalysis.potentialSavings.map((saving, idx) => (
                    <Card key={idx} className="p-3 bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {saving.category}
                        </span>
                        <Badge variant="success" size="sm">
                          Save ~{formatCurrency(saving.estimatedSavings, currency)}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        {saving.tip}
                      </p>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Redistribution Suggestions */}
            {budgetAnalysis.redistributionSuggestions?.length > 0 && (
              <div>
                <h3 className="text-xs uppercase font-bold tracking-wider text-slate-500 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-brand-500" aria-hidden="true" />
                  Suggested Rebalancing
                </h3>
                <div className="space-y-2">
                  {budgetAnalysis.redistributionSuggestions.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"
                    >
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                          {item.category}
                        </span>
                        <p className="text-xs text-slate-500 dark:text-slate-300">{item.reason}</p>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-semibold shrink-0">
                        <span className="text-slate-500 dark:text-slate-400 line-through">
                          {formatCurrency(item.currentAllocation, currency)}
                        </span>
                        <span>→</span>
                        <span className="text-brand-600 dark:text-brand-400">
                          {formatCurrency(item.suggestedAllocation, currency)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* IDEAS GENERATOR VIEW */}
        {type === "ideas" && ideasPlan && (
          <div className="flex flex-col gap-4">
            <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-sm text-purple-900 dark:text-purple-200">
              <p className="font-semibold">{ideasPlan.summary}</p>
            </div>

            {/* Themes */}
            {ideasPlan.themes?.length > 0 && (
              <div>
                <h3 className="text-xs uppercase font-bold tracking-wider text-slate-500 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-purple-500" aria-hidden="true" />
                  Curated Themes
                </h3>
                <div className="flex flex-wrap gap-2">
                  {ideasPlan.themes.map((th, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-semibold"
                    >
                      {th}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Activities & Experiences */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {ideasPlan.activities?.length > 0 && (
                <Card className="p-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300 mb-2">
                    Activities & Entertainment
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 list-disc pl-4">
                    {ideasPlan.activities.map((act, i) => (
                      <li key={i}>{act}</li>
                    ))}
                  </ul>
                </Card>
              )}

              {ideasPlan.foodIdeas?.length > 0 && (
                <Card className="p-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300 mb-2">
                    Culinary & Food Touches
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 list-disc pl-4">
                    {ideasPlan.foodIdeas.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </Card>
              )}

              {ideasPlan.decorationIdeas?.length > 0 && (
                <Card className="p-4 sm:col-span-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300 mb-2">
                    Decoration & Aesthetic Accents
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700 dark:text-slate-300">
                    {ideasPlan.decorationIdeas.map((d, i) => (
                      <div key={i} className="flex items-start gap-1.5">
                        <span className="text-brand-500 font-bold">•</span>
                        <span>{d}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* RISKS VIEW */}
        {type === "risks" && riskAnalysis && (
          <div className="flex flex-col gap-4">
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-sm text-amber-900 dark:text-amber-200">
              <p className="font-semibold">{riskAnalysis.summary}</p>
            </div>

            <div className="space-y-3">
              {riskAnalysis.risks.map((r, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" aria-hidden="true" />
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {r.risk}
                      </h4>
                    </div>
                    <Badge
                      variant={
                        r.impact === "high"
                          ? "danger"
                          : r.impact === "medium"
                          ? "warning"
                          : "neutral"
                      }
                      size="sm"
                    >
                      {r.impact.toUpperCase()} IMPACT
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-transparent dark:border-slate-700/60 p-2.5 rounded-lg mt-2">
                    <strong>Mitigation Strategy:</strong> {r.mitigation}
                  </p>
                </div>
              ))}
            </div>

            {onApplyRisks && (
              <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-700/80">
                <Button
                  variant="primary"
                  onClick={onApplyRisks}
                  leftIcon={<CheckCircle2 className="w-4 h-4" />}
                >
                  Save Contingency Plan to Event
                </Button>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
