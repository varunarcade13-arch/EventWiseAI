import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import React, { useRef, useState } from "react";

export interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currency: string;
  onAdd: (category: { name: string; allocated: number; actual: number; notes: string }) => Promise<void>;
}

export const AddCategoryModal: React.FC<AddCategoryModalProps> = ({
  isOpen,
  onClose,
  currency,
  onAdd,
}) => {
  const [name, setName] = useState("");
  const [allocated, setAllocated] = useState("");
  const [actual, setActual] = useState("0");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!name.trim()) {
      setError("Category name is required.");
      nameInputRef.current?.focus();
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      await onAdd({
        name: name.trim(),
        allocated: Math.max(0, Number(allocated) || 0),
        actual: Math.max(0, Number(actual) || 0),
        notes: notes.trim(),
      });
      setName("");
      setAllocated("");
      setActual("0");
      setNotes("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add category");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Budget Category"
      description={`Specify allocation for this category in ${currency}.`}
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Input
          ref={nameInputRef}
          label="Category Name"
          placeholder="e.g. Floral Decor, Drone Video, Shuttle Service"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={error}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label={`Allocated (${currency})`}
            type="number"
            min="0"
            placeholder="0"
            value={allocated}
            onChange={(e) => setAllocated(e.target.value)}
            required
          />
          <Input
            label={`Actual Spent (${currency})`}
            type="number"
            min="0"
            placeholder="0"
            value={actual}
            onChange={(e) => setActual(e.target.value)}
          />
        </div>

        <Input
          label="Notes / Vendor Deliverable"
          placeholder="e.g. Quote includes sound setup"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700/80">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Save Category
          </Button>
        </div>
      </form>
    </Modal>
  );
};
