import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { TaskPriority, TaskStatus, TimelineTask } from "@/types/event";
import React, { useRef, useState } from "react";

export interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: string;
  onAdd: (task: Omit<TimelineTask, "id">) => Promise<void>;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({
  isOpen,
  onClose,
  defaultDate,
  onAdd,
}) => {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState(defaultDate || "");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [category, setCategory] = useState("General");
  const [assignedTo, setAssignedTo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Task title is required.");
      titleInputRef.current?.focus();
      return;
    }
    if (!dueDate) {
      setError("Due date is required.");
      dateInputRef.current?.focus();
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      await onAdd({
        title: title.trim(),
        dueDate,
        status: "not_started" as TaskStatus,
        priority,
        category: category.trim() || "General",
        assignedTo: assignedTo.trim(),
      });
      setTitle("");
      setDueDate(defaultDate || "");
      setPriority("medium");
      setCategory("General");
      setAssignedTo("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add task");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Milestone / Task"
      description="Track deadlines leading up to the big day."
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Input
          ref={titleInputRef}
          label="Task Title"
          placeholder="e.g. Schedule cake tasting, Pay venue advance deposit"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={error}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            ref={dateInputRef}
            label="Due Date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
          />
          <Select
            label="Priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            options={[
              { value: "low", label: "Low Priority" },
              { value: "medium", label: "Medium Priority" },
              { value: "high", label: "High / Urgent" },
            ]}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Category"
            placeholder="e.g. Catering, Venue, Logistics"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <Input
            label="Assigned To"
            placeholder="e.g. Sarah, Event Planner, Mom"
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Add Task
          </Button>
        </div>
      </form>
    </Modal>
  );
};
