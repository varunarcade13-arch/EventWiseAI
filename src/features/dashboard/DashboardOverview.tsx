import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { QuickStats } from "@/features/dashboard/QuickStats";
import { formatCurrency } from "@/lib/currency";
import { formatDate } from "@/lib/formatters";
import { EventModel, PlanningProgress } from "@/types/event";
import {
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldAlert,
  Lightbulb,
} from "lucide-react";
import React from "react";

export interface DashboardOverviewProps {
  event: EventModel;
  progress: PlanningProgress;
  onNavigateTab: (tabId: string) => void;
  onTriggerAIPlan: () => void;
  onTriggerAIIdeas: () => void;
  onTriggerAIRisks: () => void;
  isLoadingAI?: boolean;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  event,
  progress,
  onNavigateTab,
  onTriggerAIPlan,
  onTriggerAIIdeas,
  onTriggerAIRisks,
  isLoadingAI = false,
}) => {
  const upcomingTasks = event.timeline
    .filter((t) => t.status !== "completed")
    .slice(0, 4);

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Quick Stats */}
      <QuickStats event={event} progress={progress} />

      {/* 2. Hero Action Banner: AI Superpowers */}
      <Card
        variant="glass"
        className="p-6 bg-gradient-to-r from-brand-900 via-indigo-900 to-slate-900 text-white relative overflow-hidden shadow-glass border-brand-800"
      >
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-brand-200 mb-3 border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-accent-400" />
            <span>Google Gemini Strategic Planner</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Elevate &quot;{event.name}&quot; with AI
          </h2>
          <p className="text-xs sm:text-sm text-brand-100/90 mt-1.5 mb-5 leading-relaxed">
            Generate an end-to-end plan covering budget category breakdown, realistic timeline tasks, vendor requirements, creative ideas, and risk contingencies with a single click.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="ai"
              size="md"
              onClick={onTriggerAIPlan}
              isLoading={isLoadingAI}
              leftIcon={<Sparkles className="w-4 h-4" />}
            >
              Generate Complete AI Plan
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={onTriggerAIIdeas}
              leftIcon={<Lightbulb className="w-4 h-4 text-purple-600" />}
              className="bg-white/90 hover:bg-white text-slate-900"
            >
              Explore Creative Ideas
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={onTriggerAIRisks}
              leftIcon={<ShieldAlert className="w-4 h-4 text-amber-600" />}
              className="bg-white/90 hover:bg-white text-slate-900"
            >
              Check Contingency Risks
            </Button>
          </div>
        </div>

        {/* Ambient background decoration */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-brand-600/20 to-transparent pointer-events-none" />
      </Card>

      {/* 3. Two Columns: Upcoming Tasks & Budget Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Tasks */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Priority Milestones</CardTitle>
              <CardDescription>Tasks requiring immediate attention</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigateTab("timeline")}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              View all ({event.timeline.length})
            </Button>
          </CardHeader>

          {upcomingTasks.length > 0 ? (
            <div className="space-y-2.5">
              {upcomingTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200/60 dark:border-slate-700/80 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Clock className="w-4 h-4 text-brand-500 shrink-0" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {task.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-slate-500 dark:text-slate-300">{formatDate(task.dueDate)}</span>
                    <Badge
                      variant={
                        task.priority === "high"
                          ? "danger"
                          : task.priority === "medium"
                          ? "warning"
                          : "neutral"
                      }
                      size="sm"
                    >
                      {task.priority}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-xs text-slate-500 dark:text-slate-400">All planned tasks are completed!</p>
            </div>
          )}
        </Card>

        {/* Budget Allocation Snapshot */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Budget Health</CardTitle>
              <CardDescription>
                Allocation across {event.budgetCategories.length} categories
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigateTab("budget")}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Manage budget
            </Button>
          </CardHeader>

          <div className="space-y-3.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-600 dark:text-slate-300">Allocation Progress</span>
              <span className="text-slate-900 dark:text-slate-100">
                {progress.budgetAllocatedPercentage}% of target
              </span>
            </div>
            <ProgressBar
              value={progress.budgetAllocatedPercentage}
              showPercentage={false}
              size="md"
            />

            <div className="grid grid-cols-2 gap-3 pt-2">
              {event.budgetCategories.slice(0, 4).map((c) => (
                <div
                  key={c.id}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200/60 dark:border-slate-700/80"
                >
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate block">
                    {c.name}
                  </span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {formatCurrency(c.allocated, event.currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* 4. Recommendations & Contingencies Section */}
      {(event.recommendations?.length > 0 || event.risks?.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {event.recommendations?.length > 0 && (
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>AI Planning Recommendations</CardTitle>
                  <CardDescription>Tailored suggestions</CardDescription>
                </div>
              </CardHeader>
              <div className="space-y-2.5">
                {event.recommendations.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200/60 dark:border-slate-700/80 text-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {rec.title}
                      </span>
                      {rec.estimatedSavingsOrCost && (
                        <Badge variant="success" size="sm">
                          {rec.estimatedSavingsOrCost}
                        </Badge>
                      )}
                    </div>
                    <p className="text-slate-600 dark:text-slate-300">
                      {rec.description}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {event.risks?.length > 0 && (
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Contingencies & Risk Watch</CardTitle>
                  <CardDescription>Identified vulnerabilities and mitigations</CardDescription>
                </div>
              </CardHeader>
              <div className="space-y-2.5">
                {event.risks.map((risk) => (
                  <div
                    key={risk.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200/60 dark:border-slate-700/80 text-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {risk.risk}
                      </span>
                      <Badge
                        variant={
                          risk.impact === "high"
                            ? "danger"
                            : risk.impact === "medium"
                            ? "warning"
                            : "neutral"
                        }
                        size="sm"
                      >
                        {risk.impact} impact
                      </Badge>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300">
                      <strong>Mitigation:</strong> {risk.mitigation}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
