import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ProgressTracker } from "@/domain/services/ProgressTracker";
import { formatCurrency } from "@/lib/currency";
import { formatDate } from "@/lib/formatters";
import { EventModel } from "@/types/event";
import { Calendar, Users, MapPin, ArrowRight } from "lucide-react";
import React from "react";

export interface EventCardProps {
  event: EventModel;
  isActive: boolean;
  onSelect: (id: string) => void;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  isActive,
  onSelect,
}) => {
  const progress = ProgressTracker.calculateProgress(event);

  const typeColorMap: Record<
    string,
    "purple" | "brand" | "success" | "neutral"
  > = {
    wedding: "purple",
    birthday: "brand",
    community: "success",
    other: "neutral",
  };

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onSelect(event.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(event.id);
        }
      }}
      className={`cursor-pointer transition-all duration-200 hover:shadow-md hover:border-brand-400 dark:hover:border-brand-600 ${
        isActive
          ? "border-2 border-brand-600 dark:border-brand-500 ring-2 ring-brand-500/20 bg-brand-50/20 dark:bg-brand-950/20"
          : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant={typeColorMap[event.type] || "neutral"}>
              {event.type.toUpperCase()}
            </Badge>
            {event.isDemo && (
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">
                Demo
              </span>
            )}
          </div>
          <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
            {event.name}
          </h4>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-bold text-brand-600 dark:text-brand-400">
            {formatCurrency(event.totalBudget, event.currency)}
          </p>
          <p className="text-[11px] text-slate-400">budget</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400 mb-4">
        <div className="flex items-center gap-1.5 truncate">
          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{formatDate(event.date)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{event.expectedGuests} guests</span>
        </div>
        <div className="flex items-center gap-1.5 col-span-2 truncate">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{event.location}</span>
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
        <ProgressBar
          value={progress.overallPercentage}
          label="Planning Progress"
          size="sm"
          color="brand"
        />
      </div>

      <div className="mt-3 flex items-center justify-end text-xs font-semibold text-brand-600 dark:text-brand-400 group">
        <span>{isActive ? "Currently viewing" : "Open event"}</span>
        <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-0.5" />
      </div>
    </Card>
  );
};
