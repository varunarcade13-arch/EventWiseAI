import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/currency";
import { formatDaysRemaining } from "@/lib/formatters";
import { PlanningProgress, EventModel } from "@/types/event";
import { Calendar, Users, DollarSign, Target } from "lucide-react";
import React from "react";

export interface QuickStatsProps {
  event: EventModel;
  progress: PlanningProgress;
}

export const QuickStats: React.FC<QuickStatsProps> = ({ event, progress }) => {
  const daysInfo = formatDaysRemaining(progress.daysRemaining);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Days Remaining */}
      <Card className="flex items-center gap-3.5 p-4 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-850">
        <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
          <Calendar className="w-5 h-5" aria-hidden="true" />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Timeline
          </p>
          <p className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight">
            {daysInfo.label}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
            {event.date}
          </p>
        </div>
      </Card>

      {/* 2. Total Budget */}
      <Card className="flex items-center gap-3.5 p-4 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-850">
        <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
          <DollarSign className="w-5 h-5" aria-hidden="true" />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Total Budget
          </p>
          <p className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight">
            {formatCurrency(event.totalBudget, event.currency)}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
            {progress.budgetAllocatedPercentage}% allocated
          </p>
        </div>
      </Card>

      {/* 3. Expected Guests */}
      <Card className="flex items-center gap-3.5 p-4 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-850">
        <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
          <Users className="w-5 h-5" aria-hidden="true" />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Guest List
          </p>
          <p className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight">
            {event.expectedGuests} Guests
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
            Expected headcount
          </p>
        </div>
      </Card>

      {/* 4. Planning Progress */}
      <Card className="flex items-center gap-3.5 p-4 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-850">
        <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
          <Target className="w-5 h-5" aria-hidden="true" />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Planning Status
          </p>
          <p className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight">
            {progress.overallPercentage}% Done
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
            {progress.tasksCompleted}/{progress.totalTasks} tasks • {progress.vendorsBooked}/{progress.totalVendors} vendors
          </p>
        </div>
      </Card>
    </div>
  );
};
