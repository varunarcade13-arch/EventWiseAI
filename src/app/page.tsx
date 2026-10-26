"use client";

import { Tabs } from "@/components/ui/Tabs";
import { useToast } from "@/components/ui/Toast";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ProgressTracker } from "@/domain/services/ProgressTracker";
import { AIAdvisorModal, AdvisorModalType } from "@/features/ai-assistant/AIAdvisorModal";
import { AIChatDrawer } from "@/features/ai-assistant/AIChatDrawer";
import { BudgetManager } from "@/features/budget/BudgetManager";
import { DashboardOverview } from "@/features/dashboard/DashboardOverview";
import { DemoDataBanner } from "@/features/dashboard/DemoDataBanner";
import { EventCard } from "@/features/dashboard/EventCard";
import { CreateEventModal } from "@/features/event-creation/CreateEventModal";
import { TimelineView } from "@/features/timeline/TimelineView";
import { VendorChecklist } from "@/features/vendors/VendorChecklist";
import { LocalStorageEventRepository } from "@/infrastructure/repositories/LocalStorageEventRepository";
import { BudgetAnalysis, EventPlan, IdeasPlan, RiskAnalysis } from "@/types/ai";
import {
  BudgetCategory,
  CurrencyCode,
  EventModel,
  EventType,
  TaskStatus,
  TimelineTask,
  VendorItem,
  VendorStatus,
} from "@/types/event";
import {
  LayoutDashboard,
  DollarSign,
  Calendar,
  Briefcase,
  Layers,
  Sparkles,
  Plus,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

export default function HomePage() {
  const { showToast } = useToast();
  const repository = useMemo(() => new LocalStorageEventRepository(), []);

  const [events, setEvents] = useState<EventModel[]>([]);
  const [activeEventId, setActiveEventId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [isLoaded, setIsLoaded] = useState(false);

  // Modals & Drawers state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [advisorModalType, setAdvisorModalType] = useState<AdvisorModalType>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  // Advisor result state
  const [budgetAnalysis, setBudgetAnalysis] = useState<BudgetAnalysis | null>(null);
  const [ideasPlan, setIdeasPlan] = useState<IdeasPlan | null>(null);
  const [riskAnalysis, setRiskAnalysis] = useState<RiskAnalysis | null>(null);

  // Dark mode theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem("eventwise_theme");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const shouldBeDark = saved === "dark" || (!saved && prefersDark);
      setIsDarkMode(shouldBeDark);
      if (shouldBeDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, []);

  const handleToggleTheme = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    if (typeof window !== "undefined") {
      if (nextDark) {
        document.documentElement.classList.add("dark");
        try {
          window.localStorage.setItem("eventwise_theme", "dark");
        } catch {}
      } else {
        document.documentElement.classList.remove("dark");
        try {
          window.localStorage.setItem("eventwise_theme", "light");
        } catch {}
      }
    }
  };

  // Load initial events from repository
  useEffect(() => {
    repository.getAll().then((loaded) => {
      setEvents(loaded);
      if (loaded.length > 0 && loaded[0]) {
        setActiveEventId(loaded[0].id);
      }
      setIsLoaded(true);
    });
  }, [repository]);

  const activeEvent = useMemo(() => {
    return events.find((e) => e.id === activeEventId) || events[0] || null;
  }, [events, activeEventId]);

  const planningProgress = useMemo(() => {
    if (!activeEvent) {
      return {
        overallPercentage: 0,
        tasksCompleted: 0,
        totalTasks: 0,
        vendorsBooked: 0,
        totalVendors: 0,
        budgetAllocatedPercentage: 0,
        daysRemaining: 0,
      };
    }
    return ProgressTracker.calculateProgress(activeEvent);
  }, [activeEvent]);

  // Helper to persist event updates
  const saveAndSyncEvent = async (updated: EventModel) => {
    const saved = await repository.save(updated);
    setEvents((prev) => prev.map((e) => (e.id === saved.id ? saved : e)));
    return saved;
  };

  // --- Handlers: Event Creation ---
  const handleCreateEvent = async (data: {
    name: string;
    type: EventType;
    date: string;
    location: string;
    expectedGuests: number;
    totalBudget: number;
    currency: CurrencyCode;
    autoGenerateAI: boolean;
  }) => {
    const now = new Date().toISOString();
    const newId = `event_${Date.now()}`;

    let initialPlan: EventPlan | undefined = undefined;

    if (data.autoGenerateAI) {
      try {
        showToast("Generating comprehensive AI plan with Gemini...", "info");
        const res = await fetch("/api/ai/plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventName: data.name,
            eventType: data.type,
            eventDate: data.date,
            location: data.location,
            expectedGuests: data.expectedGuests,
            totalBudget: data.totalBudget,
            currency: data.currency,
          }),
        });
        const json = await res.json();
        if (res.ok && json.plan) {
          initialPlan = json.plan;
        } else {
          showToast(
            json.error || "AI generation failed, creating event with standard defaults.",
            "error"
          );
        }
      } catch {
        showToast(
          "Network issue contacting Gemini API. Creating event with standard defaults.",
          "error"
        );
      }
    }

    const newEvent: EventModel = {
      id: newId,
      name: data.name,
      type: data.type,
      date: data.date,
      location: data.location,
      expectedGuests: data.expectedGuests,
      currency: data.currency,
      totalBudget: data.totalBudget,
      isDemo: false,
      createdAt: now,
      updatedAt: now,
      budgetCategories: initialPlan
        ? initialPlan.estimatedBudget.map((b, i) => ({
            id: `cat_${newId}_${i}`,
            name: b.name,
            allocated: b.allocated,
            actual: 0,
            notes: b.notes,
          }))
        : [
            {
              id: `cat_${newId}_venue`,
              name: "Venue",
              allocated: Math.round(data.totalBudget * 0.4),
              actual: 0,
            },
            {
              id: `cat_${newId}_catering`,
              name: "Catering",
              allocated: Math.round(data.totalBudget * 0.3),
              actual: 0,
            },
            {
              id: `cat_${newId}_decor`,
              name: "Decor & Production",
              allocated: Math.round(data.totalBudget * 0.2),
              actual: 0,
            },
            {
              id: `cat_${newId}_contingency`,
              name: "Contingency Fund",
              allocated: Math.round(data.totalBudget * 0.1),
              actual: 0,
            },
          ],
      timeline: initialPlan
        ? initialPlan.timeline.map((t, i) => ({
            id: `task_${newId}_${i}`,
            title: t.title,
            dueDate: t.dueDate,
            status: "not_started",
            priority: t.priority || "medium",
            category: t.category || "General",
            assignedTo: t.assignedTo || "",
          }))
        : [
            {
              id: `task_${newId}_1`,
              title: `Lock in venue for ${data.name}`,
              dueDate: data.date,
              status: "not_started",
              priority: "high",
              category: "Venue",
            },
            {
              id: `task_${newId}_2`,
              title: "Send invitations to guests",
              dueDate: data.date,
              status: "not_started",
              priority: "medium",
              category: "Invitations",
            },
          ],
      vendors: initialPlan
        ? initialPlan.vendors.map((v, i) => ({
            id: `vendor_${newId}_${i}`,
            name: v.name,
            category: v.category,
            status: "not_contacted",
            estimatedCost: v.estimatedCost,
            actualCost: v.actualCost,
            notes: v.notes,
          }))
        : [],
      recommendations: initialPlan
        ? initialPlan.recommendations.map((r, i) => ({
            ...r,
            id: r.id || `rec_${newId}_${i}`,
          }))
        : [],
      risks: initialPlan
        ? initialPlan.risks.map((rk, i) => ({
            ...rk,
            id: rk.id || `risk_${newId}_${i}`,
          }))
        : [],
    };

    const saved = await repository.save(newEvent);
    setEvents((prev) => [saved, ...prev]);
    setActiveEventId(saved.id);
    setActiveTab("overview");
    showToast(`"${saved.name}" created successfully!`, "success");
  };

  // --- Handlers: Budget ---
  const handleAddBudgetCategory = async (
    category: Omit<BudgetCategory, "id">
  ) => {
    if (!activeEvent) return;
    const newCategory: BudgetCategory = {
      ...category,
      id: `cat_${Date.now()}`,
    };
    const updated: EventModel = {
      ...activeEvent,
      budgetCategories: [...activeEvent.budgetCategories, newCategory],
      updatedAt: new Date().toISOString(),
    };
    await saveAndSyncEvent(updated);
    showToast(`Added category "${category.name}"`, "success");
  };

  const handleDeleteBudgetCategory = async (categoryId: string) => {
    if (!activeEvent) return;
    const updated: EventModel = {
      ...activeEvent,
      budgetCategories: activeEvent.budgetCategories.filter(
        (c) => c.id !== categoryId
      ),
      updatedAt: new Date().toISOString(),
    };
    await saveAndSyncEvent(updated);
    showToast("Category removed", "info");
  };

  // --- Handlers: Timeline Tasks ---
  const handleAddTask = async (task: Omit<TimelineTask, "id">) => {
    if (!activeEvent) return;
    const newTask: TimelineTask = {
      ...task,
      id: `task_${Date.now()}`,
    };
    const updated: EventModel = {
      ...activeEvent,
      timeline: [...activeEvent.timeline, newTask],
      updatedAt: new Date().toISOString(),
    };
    await saveAndSyncEvent(updated);
    showToast(`Task "${task.title}" added`, "success");
  };

  const handleUpdateTaskStatus = async (
    taskId: string,
    status: TaskStatus
  ) => {
    if (!activeEvent) return;
    const updatedTimeline = activeEvent.timeline.map((t) =>
      t.id === taskId ? { ...t, status } : t
    );
    const updated: EventModel = {
      ...activeEvent,
      timeline: updatedTimeline,
      updatedAt: new Date().toISOString(),
    };
    await saveAndSyncEvent(updated);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!activeEvent) return;
    const updated: EventModel = {
      ...activeEvent,
      timeline: activeEvent.timeline.filter((t) => t.id !== taskId),
      updatedAt: new Date().toISOString(),
    };
    await saveAndSyncEvent(updated);
    showToast("Task removed", "info");
  };

  // --- Handlers: Vendors ---
  const handleAddVendor = async (vendor: Omit<VendorItem, "id">) => {
    if (!activeEvent) return;
    const newVendor: VendorItem = {
      ...vendor,
      id: `vendor_${Date.now()}`,
    };
    const updated: EventModel = {
      ...activeEvent,
      vendors: [...activeEvent.vendors, newVendor],
      updatedAt: new Date().toISOString(),
    };
    await saveAndSyncEvent(updated);
    showToast(`Added vendor "${vendor.name}"`, "success");
  };

  const handleUpdateVendorStatus = async (
    vendorId: string,
    status: VendorStatus
  ) => {
    if (!activeEvent) return;
    const updatedVendors = activeEvent.vendors.map((v) =>
      v.id === vendorId ? { ...v, status } : v
    );
    const updated: EventModel = {
      ...activeEvent,
      vendors: updatedVendors,
      updatedAt: new Date().toISOString(),
    };
    await saveAndSyncEvent(updated);
  };

  const handleDeleteVendor = async (vendorId: string) => {
    if (!activeEvent) return;
    const updated: EventModel = {
      ...activeEvent,
      vendors: activeEvent.vendors.filter((v) => v.id !== vendorId),
      updatedAt: new Date().toISOString(),
    };
    await saveAndSyncEvent(updated);
    showToast("Vendor removed", "info");
  };

  // --- Handlers: AI Features ---
  const handleTriggerAIPlan = async () => {
    if (!activeEvent) return;
    try {
      setIsLoadingAI(true);
      showToast("Generating comprehensive event plan with Gemini...", "info");
      const res = await fetch("/api/ai/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventName: activeEvent.name,
          eventType: activeEvent.type,
          eventDate: activeEvent.date,
          location: activeEvent.location,
          expectedGuests: activeEvent.expectedGuests,
          totalBudget: activeEvent.totalBudget,
          currency: activeEvent.currency,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Apply to active event
      const plan: EventPlan = data.plan;
      const updated: EventModel = {
        ...activeEvent,
        budgetCategories: plan.estimatedBudget.map((b, i) => ({
          id: `ai_cat_${Date.now()}_${i}`,
          name: b.name,
          allocated: b.allocated,
          actual: 0,
          notes: b.notes,
        })),
        timeline: plan.timeline.map((t, i) => ({
          id: `ai_task_${Date.now()}_${i}`,
          title: t.title,
          dueDate: t.dueDate,
          status: "not_started",
          priority: t.priority || "medium",
          category: t.category || "General",
          assignedTo: t.assignedTo || "",
        })),
        vendors: plan.vendors.map((v, i) => ({
          id: `ai_vendor_${Date.now()}_${i}`,
          name: v.name,
          category: v.category,
          status: "not_contacted",
          estimatedCost: v.estimatedCost,
          actualCost: v.actualCost,
          notes: v.notes,
        })),
        recommendations: plan.recommendations.map((r, i) => ({
          ...r,
          id: r.id || `ai_rec_${Date.now()}_${i}`,
        })),
        risks: plan.risks.map((rk, i) => ({
          ...rk,
          id: rk.id || `ai_risk_${Date.now()}_${i}`,
        })),
        updatedAt: new Date().toISOString(),
      };

      await saveAndSyncEvent(updated);
      showToast("AI event plan generated and applied successfully!", "success");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to generate AI plan",
        "error"
      );
    } finally {
      setIsLoadingAI(false);
    }
  };

  const handleTriggerAIAdvisor = async () => {
    if (!activeEvent) return;
    try {
      setIsLoadingAI(true);
      showToast("Analyzing budget allocations with Gemini...", "info");
      const res = await fetch("/api/ai/budget-advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: activeEvent.name,
          type: activeEvent.type,
          totalBudget: activeEvent.totalBudget,
          currency: activeEvent.currency,
          expectedGuests: activeEvent.expectedGuests,
          budgetCategories: activeEvent.budgetCategories,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setBudgetAnalysis(data.analysis);
      setAdvisorModalType("budget");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to analyze budget",
        "error"
      );
    } finally {
      setIsLoadingAI(false);
    }
  };

  const handleTriggerAITimeline = async () => {
    if (!activeEvent) return;
    try {
      setIsLoadingAI(true);
      showToast("Generating milestones timeline with Gemini...", "info");
      const res = await fetch("/api/ai/timeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: activeEvent.name,
          type: activeEvent.type,
          date: activeEvent.date,
          expectedGuests: activeEvent.expectedGuests,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const newTasks: TimelineTask[] = data.tasks.map(
        (t: Omit<TimelineTask, "id">, i: number) => ({
          ...t,
          id: `ai_task_${Date.now()}_${i}`,
        })
      );

      const updated: EventModel = {
        ...activeEvent,
        timeline: [...activeEvent.timeline, ...newTasks],
        updatedAt: new Date().toISOString(),
      };

      await saveAndSyncEvent(updated);
      showToast(`Added ${newTasks.length} AI generated tasks to timeline!`, "success");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to generate timeline",
        "error"
      );
    } finally {
      setIsLoadingAI(false);
    }
  };

  const handleTriggerAIVendors = async () => {
    if (!activeEvent) return;
    try {
      setIsLoadingAI(true);
      showToast("Generating vendor recommendations with Gemini...", "info");
      const res = await fetch("/api/ai/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: activeEvent.name,
          type: activeEvent.type,
          totalBudget: activeEvent.totalBudget,
          expectedGuests: activeEvent.expectedGuests,
          currency: activeEvent.currency,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const newVendors: VendorItem[] = data.vendors.map(
        (v: Omit<VendorItem, "id">, i: number) => ({
          ...v,
          id: `ai_vendor_${Date.now()}_${i}`,
        })
      );

      const updated: EventModel = {
        ...activeEvent,
        vendors: [...activeEvent.vendors, ...newVendors],
        updatedAt: new Date().toISOString(),
      };

      await saveAndSyncEvent(updated);
      showToast(
        `Added ${newVendors.length} recommended vendors to your checklist!`,
        "success"
      );
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to generate vendors",
        "error"
      );
    } finally {
      setIsLoadingAI(false);
    }
  };

  const handleTriggerAIIdeas = async () => {
    if (!activeEvent) return;
    try {
      setIsLoadingAI(true);
      showToast("Generating creative ideas with Gemini...", "info");
      const res = await fetch("/api/ai/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: activeEvent.name,
          type: activeEvent.type,
          location: activeEvent.location,
          expectedGuests: activeEvent.expectedGuests,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setIdeasPlan(data.ideas);
      setAdvisorModalType("ideas");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to generate ideas",
        "error"
      );
    } finally {
      setIsLoadingAI(false);
    }
  };

  const handleTriggerAIRisks = async () => {
    if (!activeEvent) return;
    try {
      setIsLoadingAI(true);
      showToast("Assessing contingency risks with Gemini...", "info");
      const res = await fetch("/api/ai/risks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: activeEvent.name,
          type: activeEvent.type,
          date: activeEvent.date,
          location: activeEvent.location,
          expectedGuests: activeEvent.expectedGuests,
          totalBudget: activeEvent.totalBudget,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setRiskAnalysis(data.risks);
      setAdvisorModalType("risks");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to assess risks",
        "error"
      );
    } finally {
      setIsLoadingAI(false);
    }
  };

  const handleApplyRisksToEvent = async () => {
    if (!activeEvent || !riskAnalysis) return;
    const updated: EventModel = {
      ...activeEvent,
      risks: riskAnalysis.risks.map((r, i) => ({
        id: `ai_risk_${Date.now()}_${i}`,
        risk: r.risk,
        impact: r.impact,
        mitigation: r.mitigation,
      })),
      updatedAt: new Date().toISOString(),
    };
    await saveAndSyncEvent(updated);
    setAdvisorModalType(null);
    showToast("Contingency mitigations saved to your event plan!", "success");
  };

  const handleApplyPlanFromChat = async (plan: EventPlan) => {
    if (!activeEvent) return;
    const updated: EventModel = {
      ...activeEvent,
      budgetCategories: plan.estimatedBudget.map((b, i) => ({
        id: `ai_chat_cat_${Date.now()}_${i}`,
        name: b.name,
        allocated: b.allocated,
        actual: 0,
        notes: b.notes,
      })),
      timeline: plan.timeline.map((t, i) => ({
        id: `ai_chat_task_${Date.now()}_${i}`,
        title: t.title,
        dueDate: t.dueDate,
        status: "not_started",
        priority: t.priority || "medium",
        category: t.category || "General",
        assignedTo: t.assignedTo || "",
      })),
      vendors: plan.vendors.map((v, i) => ({
        id: `ai_chat_vendor_${Date.now()}_${i}`,
        name: v.name,
        category: v.category,
        status: "not_contacted",
        estimatedCost: v.estimatedCost,
        actualCost: v.actualCost,
        notes: v.notes,
      })),
      recommendations: plan.recommendations.map((r, i) => ({
        ...r,
        id: r.id || `ai_chat_rec_${Date.now()}_${i}`,
      })),
      risks: plan.risks.map((rk, i) => ({
        ...rk,
        id: rk.id || `ai_chat_risk_${Date.now()}_${i}`,
      })),
      updatedAt: new Date().toISOString(),
    };
    await saveAndSyncEvent(updated);
    showToast("Chat plan applied to event successfully!", "success");
  };

  const handleResetDemoData = async () => {
    const demoEvents = await repository.resetToDemo();
    setEvents(demoEvents);
    if (demoEvents.length > 0 && demoEvents[0]) {
      setActiveEventId(demoEvents[0].id);
    }
    showToast("Reset to sample demo events", "info");
  };

  if (!isLoaded || !activeEvent) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center animate-spin">
            <Sparkles className="w-5 h-5" />
          </div>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
            Initializing EventWise AI...
          </p>
        </div>
      </div>
    );
  }

  const navTabs = [
    {
      id: "overview",
      label: "Overview",
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: "budget",
      label: "Budget",
      icon: <DollarSign className="w-4 h-4" />,
      badge: activeEvent.budgetCategories.length,
    },
    {
      id: "timeline",
      label: "Timeline",
      icon: <Calendar className="w-4 h-4" />,
      badge: activeEvent.timeline.length,
    },
    {
      id: "vendors",
      label: "Vendors",
      icon: <Briefcase className="w-4 h-4" />,
      badge: activeEvent.vendors.length,
    },
    {
      id: "events",
      label: "All Events",
      icon: <Layers className="w-4 h-4" />,
      badge: events.length,
    },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      {/* Skip to Main Content Link for Keyboard Accessibility (WCAG 2.2 AA) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2.5 focus:bg-brand-600 focus:text-white focus:font-semibold focus:rounded-xl focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-brand-600 transition-all"
      >
        Skip to main content
      </a>

      {/* 1. Header */}
      <Header
        events={events}
        activeEvent={activeEvent}
        onSelectEvent={setActiveEventId}
        onCreateEventClick={() => setIsCreateModalOpen(true)}
        onToggleAIChat={() => setIsAIChatOpen(true)}
        onResetDemo={handleResetDemoData}
        isDarkMode={isDarkMode}
        onToggleTheme={handleToggleTheme}
      />

      {/* 2. Demo Data Notice */}
      <DemoDataBanner
        isDemo={Boolean(activeEvent.isDemo)}
        onResetDemo={handleResetDemoData}
      />

      {/* 3. Main Container */}
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6 focus:outline-none"
      >
        {/* Navigation Tabs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <Tabs
            tabs={navTabs}
            activeTab={activeTab}
            onChange={setActiveTab}
            className="w-full sm:w-auto"
          />

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setIsAIChatOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-brand-50 to-indigo-50 dark:from-brand-950/60 dark:to-indigo-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 hover:shadow-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              <span>Ask Gemini</span>
            </button>
          </div>
        </div>

        {/* Tab Panels */}
        <div
          role="tabpanel"
          id={`panel-${activeTab}`}
          aria-labelledby={`tab-${activeTab}`}
          className="flex-1"
        >
          {activeTab === "overview" && (
            <DashboardOverview
              event={activeEvent}
              progress={planningProgress}
              onNavigateTab={setActiveTab}
              onTriggerAIPlan={handleTriggerAIPlan}
              onTriggerAIIdeas={handleTriggerAIIdeas}
              onTriggerAIRisks={handleTriggerAIRisks}
              isLoadingAI={isLoadingAI}
            />
          )}

          {activeTab === "budget" && (
            <BudgetManager
              event={activeEvent}
              onAddCategory={handleAddBudgetCategory}
              onDeleteCategory={handleDeleteBudgetCategory}
              onTriggerAIAdvisor={handleTriggerAIAdvisor}
              isLoadingAI={isLoadingAI}
            />
          )}

          {activeTab === "timeline" && (
            <TimelineView
              event={activeEvent}
              onAddTask={handleAddTask}
              onUpdateTaskStatus={handleUpdateTaskStatus}
              onDeleteTask={handleDeleteTask}
              onTriggerAITimeline={handleTriggerAITimeline}
              isLoadingAI={isLoadingAI}
            />
          )}

          {activeTab === "vendors" && (
            <VendorChecklist
              event={activeEvent}
              onAddVendor={handleAddVendor}
              onUpdateVendorStatus={handleUpdateVendorStatus}
              onDeleteVendor={handleDeleteVendor}
              onTriggerAIVendors={handleTriggerAIVendors}
              isLoadingAI={isLoadingAI}
            />
          )}

          {activeTab === "events" && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    Your Events Directory
                  </h3>
                  <p className="text-xs text-slate-500">
                    Switch active event or create custom events
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create New Event</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {events.map((evt) => (
                  <EventCard
                    key={evt.id}
                    event={evt}
                    isActive={evt.id === activeEventId}
                    onSelect={(id) => {
                      setActiveEventId(id);
                      setActiveTab("overview");
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 4. Footer */}
      <Footer />

      {/* 5. Modals & Drawers */}
      <CreateEventModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateEvent}
      />

      <AIChatDrawer
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
        activeEvent={activeEvent}
        onApplyPlan={handleApplyPlanFromChat}
      />

      <AIAdvisorModal
        type={advisorModalType}
        isOpen={advisorModalType !== null}
        onClose={() => setAdvisorModalType(null)}
        currency={activeEvent.currency}
        budgetAnalysis={budgetAnalysis}
        ideasPlan={ideasPlan}
        riskAnalysis={riskAnalysis}
        onApplyRisks={handleApplyRisksToEvent}
      />
    </div>
  );
}
