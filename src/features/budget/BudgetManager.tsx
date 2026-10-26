import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { BudgetCalculator } from "@/domain/services/BudgetCalculator";
import { AddCategoryModal } from "@/features/budget/AddCategoryModal";
import { formatCurrency } from "@/lib/currency";
import { BudgetCategory, EventModel } from "@/types/event";
import { Plus, Sparkles, Trash2, TrendingUp, AlertTriangle } from "lucide-react";
import React, { useState } from "react";

export interface BudgetManagerProps {
  event: EventModel;
  onAddCategory: (category: Omit<BudgetCategory, "id">) => Promise<void>;
  onDeleteCategory: (categoryId: string) => Promise<void>;
  onTriggerAIAdvisor: () => void;
  isLoadingAI?: boolean;
}

export const BudgetManager: React.FC<BudgetManagerProps> = ({
  event,
  onAddCategory,
  onDeleteCategory,
  onTriggerAIAdvisor,
  isLoadingAI = false,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const summary = BudgetCalculator.calculateSummary(
    event.totalBudget,
    event.budgetCategories
  );

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Top Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Budget Card */}
        <Card className="bg-slate-900 text-white dark:bg-slate-900 border-slate-800 dark:border-slate-700">
          <p className="text-xs font-semibold text-slate-300 dark:text-slate-300 uppercase tracking-wider">
            Total Target Budget
          </p>
          <p className="text-2xl font-black mt-1 text-white">
            {formatCurrency(summary.totalBudget, event.currency)}
          </p>
          <div className="mt-3">
            <ProgressBar
              value={summary.percentageAllocated}
              color={summary.isOverBudget ? "rose" : "brand"}
              size="sm"
            />
          </div>
        </Card>

        {/* Total Allocated Card */}
        <Card>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              Allocated
            </p>
            {summary.remainingAllocated < 0 ? (
              <Badge variant="danger" size="sm">
                Exceeded
              </Badge>
            ) : (
              <Badge variant="success" size="sm">
                Within Target
              </Badge>
            )}
          </div>
          <p className="text-2xl font-black mt-1 text-slate-900 dark:text-slate-100">
            {formatCurrency(summary.totalAllocated, event.currency)}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {summary.remainingAllocated >= 0
              ? `${formatCurrency(summary.remainingAllocated, event.currency)} unallocated`
              : `${formatCurrency(Math.abs(summary.remainingAllocated), event.currency)} over budget`}
          </p>
        </Card>

        {/* Total Actual Spent Card */}
        <Card>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              Actual Spent
            </p>
            <Badge variant="neutral" size="sm">
              {summary.percentageSpent}% spent
            </Badge>
          </div>
          <p className="text-2xl font-black mt-1 text-slate-900 dark:text-slate-100">
            {formatCurrency(summary.totalActual, event.currency)}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {summary.remainingActual >= 0
              ? `${formatCurrency(summary.remainingActual, event.currency)} remaining cash`
              : `${formatCurrency(Math.abs(summary.remainingActual), event.currency)} cash deficit`}
          </p>
        </Card>
      </div>

      {/* Warning banner if over budget */}
      {summary.isOverBudget && (
        <div
          role="alert"
          className="flex items-center gap-3 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-sm"
        >
          <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
          <div className="flex-1">
            <strong>Budget Exceeded:</strong> Total allocated or spent amounts exceed your planned budget of {formatCurrency(event.totalBudget, event.currency)}. Click &quot;AI Budget Advisor&quot; for instant redistribution suggestions.
          </div>
          <Button
            size="sm"
            variant="danger"
            onClick={onTriggerAIAdvisor}
            className="shrink-0 text-xs"
          >
            Fix with AI
          </Button>
        </div>
      )}

      {/* 2. Visual Distribution */}
      {event.budgetCategories.length > 0 && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Budget Allocation Breakdown</CardTitle>
              <CardDescription>
                Visual share of total budget across categories
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsAddModalOpen(true)}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Add Category
              </Button>
              <Button
                size="sm"
                variant="ai"
                onClick={onTriggerAIAdvisor}
                isLoading={isLoadingAI}
                leftIcon={<Sparkles className="w-4 h-4" />}
              >
                AI Budget Advisor
              </Button>
            </div>
          </CardHeader>

          {/* Color stacked distribution bar with accessible text representation */}
          <div className="mb-4">
            <div
              role="img"
              aria-label={`Visual budget allocation breakdown across ${event.budgetCategories.length} categories for total allocated ${formatCurrency(summary.totalAllocated, event.currency)}`}
              className="w-full h-4 rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800"
            >
              {event.budgetCategories.map((cat, idx) => {
                const pct =
                  summary.totalAllocated > 0
                    ? (cat.allocated / summary.totalAllocated) * 100
                    : 0;
                const palette = [
                  "bg-indigo-500",
                  "bg-purple-500",
                  "bg-emerald-500",
                  "bg-amber-500",
                  "bg-rose-500",
                  "bg-cyan-500",
                  "bg-blue-600",
                  "bg-fuchsia-500",
                ];
                const color = palette[idx % palette.length];
                return (
                  <div
                    key={cat.id}
                    style={{ width: `${pct}%` }}
                    className={`${color} h-full transition-all duration-300 relative group`}
                    title={`${cat.name}: ${Math.round(pct)}%`}
                    aria-hidden="true"
                  />
                );
              })}
            </div>

            {/* Screen-reader accessible textual representation of the chart (WCAG 1.1.1) */}
            <div className="sr-only">
              <h4>Budget breakdown summary:</h4>
              <ul>
                {event.budgetCategories.map((cat) => {
                  const pct =
                    summary.totalAllocated > 0
                      ? Math.round((cat.allocated / summary.totalAllocated) * 100)
                      : 0;
                  return (
                    <li key={cat.id}>
                      {cat.name}: {formatCurrency(cat.allocated, event.currency)} ({pct}% of allocated budget)
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* Categories Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm" aria-label="Budget categories table">
              <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-300 border-y border-slate-200 dark:border-slate-700">
                <tr>
                  <th scope="col" className="px-4 py-3">Category</th>
                  <th scope="col" className="px-4 py-3">Allocated</th>
                  <th scope="col" className="px-4 py-3">Actual Spent</th>
                  <th scope="col" className="px-4 py-3">Variance</th>
                  <th scope="col" className="px-4 py-3">Notes</th>
                  <th scope="col" className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {event.budgetCategories.map((cat) => {
                  const variance = cat.allocated - (cat.actual || 0);
                  return (
                    <tr
                      key={cat.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-850/40 transition-colors"
                    >
                      <td className="px-4 py-3.5 font-semibold text-slate-900 dark:text-slate-100">
                        {cat.name}
                      </td>
                      <td className="px-4 py-3.5 text-slate-700 dark:text-slate-200 font-medium">
                        {formatCurrency(cat.allocated, event.currency)}
                      </td>
                      <td className="px-4 py-3.5 text-slate-700 dark:text-slate-200">
                        {formatCurrency(cat.actual || 0, event.currency)}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`font-semibold text-xs ${
                            variance >= 0
                              ? "text-emerald-700 dark:text-emerald-300"
                              : "text-rose-700 dark:text-rose-300"
                          }`}
                        >
                          {variance >= 0
                            ? `+${formatCurrency(variance, event.currency)} left`
                            : `${formatCurrency(variance, event.currency)} over`}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-300 max-w-xs truncate">
                        {cat.notes || "—"}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => onDeleteCategory(cat.id)}
                          aria-label={`Delete ${cat.name} category`}
                          className="p-1 rounded-lg text-slate-400 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {event.budgetCategories.length === 0 && (
        <Card className="text-center py-12 px-4 border-dashed border-2 dark:border-slate-700">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-300 flex items-center justify-center mx-auto mb-3">
            <TrendingUp className="w-6 h-6" aria-hidden="true" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            No budget categories yet
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-5">
            Break down your {formatCurrency(event.totalBudget, event.currency)} budget across venue, catering, and decor, or let Gemini auto-optimize it.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="outline"
              onClick={() => setIsAddModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add First Category
            </Button>
            <Button
              variant="ai"
              onClick={onTriggerAIAdvisor}
              isLoading={isLoadingAI}
              leftIcon={<Sparkles className="w-4 h-4" />}
            >
              Generate Budget with AI
            </Button>
          </div>
        </Card>
      )}

      {/* Add Category Modal */}
      <AddCategoryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        currency={event.currency}
        onAdd={onAddCategory}
      />
    </div>
  );
};
