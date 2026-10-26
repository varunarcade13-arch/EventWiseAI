export function formatDate(dateString: string): string {
  if (!dateString) return "Date not set";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Invalid date";

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDaysRemaining(days: number): {
  label: string;
  isPast: boolean;
  isToday: boolean;
} {
  if (days < 0) {
    const absDays = Math.abs(days);
    return {
      label: `${absDays} ${absDays === 1 ? "day" : "days"} ago`,
      isPast: true,
      isToday: false,
    };
  }
  if (days === 0) {
    return {
      label: "Today!",
      isPast: false,
      isToday: true,
    };
  }
  return {
    label: `${days} ${days === 1 ? "day" : "days"} left`,
    isPast: false,
    isToday: false,
  };
}

export function formatPercentage(percentage: number): string {
  const safe = Number.isFinite(percentage) ? percentage : 0;
  return `${Math.round(safe)}%`;
}
