import { describe, expect, it } from "vitest";
import { UpdateTaskStatusUseCase } from "./UpdateTaskStatusUseCase";
import { InMemoryEventRepository } from "@/infrastructure/repositories/InMemoryEventRepository";
import { EventModel } from "@/types/event";

describe("UpdateTaskStatusUseCase", () => {
  const sampleEvent: EventModel = {
    id: "evt_1",
    name: "Wedding",
    type: "wedding",
    date: "2027-01-01",
    location: "Hall",
    expectedGuests: 100,
    currency: "INR",
    totalBudget: 500000,
    budgetCategories: [],
    timeline: [
      { id: "t1", title: "Book Hall", dueDate: "2026-06-01", status: "not_started", priority: "high" },
    ],
    vendors: [],
    recommendations: [],
    risks: [],
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  };

  it("adds task successfully", async () => {
    const repo = new InMemoryEventRepository([sampleEvent]);
    const useCase = new UpdateTaskStatusUseCase(repo);

    const updated = await useCase.addTask({
      eventId: "evt_1",
      task: {
        title: "Order invites",
        dueDate: "2026-08-01",
        status: "not_started",
        priority: "medium",
        category: "Invitations",
        assignedTo: "Sarah",
      },
    });

    expect(updated.timeline.length).toBe(2);
    expect(updated.timeline[1]?.title).toBe("Order invites");

    // Add task with minimal fields
    const withDefaults = await useCase.addTask({
      eventId: "evt_1",
      task: {
        title: "Minimal task",
        dueDate: "2026-09-01",
      } as unknown as import("@/types/event").TimelineTask,
    });
    const minTask = withDefaults.timeline.find((t) => t.title === "Minimal task");
    expect(minTask?.status).toBe("not_started");
    expect(minTask?.priority).toBe("medium");
    expect(minTask?.category).toBe("General");
    expect(minTask?.assignedTo).toBe("");
  });

  it("validates task input and handles missing event", async () => {
    const repo = new InMemoryEventRepository([sampleEvent]);
    const useCase = new UpdateTaskStatusUseCase(repo);

    await expect(
      useCase.addTask({ eventId: "missing", task: { title: "A", dueDate: "2026-01-01", status: "not_started", priority: "low" } })
    ).rejects.toThrow('Event with ID "missing" not found.');

    await expect(
      useCase.addTask({ eventId: "evt_1", task: { title: "", dueDate: "2026-01-01", status: "not_started", priority: "low" } })
    ).rejects.toThrow("Task title is required.");

    await expect(
      useCase.addTask({ eventId: "evt_1", task: { title: "Title", dueDate: "", status: "not_started", priority: "low" } })
    ).rejects.toThrow("Task due date is required.");
  });

  it("updates task fields successfully", async () => {
    const repo = new InMemoryEventRepository([sampleEvent]);
    const useCase = new UpdateTaskStatusUseCase(repo);

    const updated = await useCase.updateTask({
      eventId: "evt_1",
      taskId: "t1",
      status: "completed",
      title: "Booked Grand Hall",
      priority: "medium",
      category: "Venue",
      assignedTo: "Lead Planner",
      dueDate: "2026-05-15",
    });

    const task = updated.timeline[0];
    expect(task?.status).toBe("completed");
    expect(task?.title).toBe("Booked Grand Hall");
    expect(task?.dueDate).toBe("2026-05-15");

    // Partial update without optional fields keeps existing values
    const partialUpdated = await useCase.updateTask({
      eventId: "evt_1",
      taskId: "t1",
    });
    expect(partialUpdated.timeline[0]?.title).toBe("Booked Grand Hall");
    expect(partialUpdated.timeline[0]?.category).toBe("Venue");
    expect(partialUpdated.timeline[0]?.assignedTo).toBe("Lead Planner");
  });

  it("handles errors when updating non-existent task or event", async () => {
    const repo = new InMemoryEventRepository([sampleEvent]);
    const useCase = new UpdateTaskStatusUseCase(repo);

    await expect(
      useCase.updateTask({ eventId: "missing", taskId: "t1" })
    ).rejects.toThrow('Event with ID "missing" not found.');

    await expect(
      useCase.updateTask({ eventId: "evt_1", taskId: "bad_task" })
    ).rejects.toThrow('Task "bad_task" not found.');
  });

  it("deletes task successfully", async () => {
    const repo = new InMemoryEventRepository([sampleEvent]);
    const useCase = new UpdateTaskStatusUseCase(repo);

    const updated = await useCase.deleteTask({ eventId: "evt_1", taskId: "t1" });
    expect(updated.timeline.length).toBe(0);

    await expect(
      useCase.deleteTask({ eventId: "missing", taskId: "t1" })
    ).rejects.toThrow('Event with ID "missing" not found.');
  });
});
