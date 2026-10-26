import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { EventValidator } from "@/domain/services/EventValidator";
import { CurrencyCode, EventType } from "@/types/event";
import { Sparkles } from "lucide-react";
import React, { useRef, useState } from "react";

export interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    type: EventType;
    date: string;
    location: string;
    expectedGuests: number;
    totalBudget: number;
    currency: CurrencyCode;
    autoGenerateAI: boolean;
  }) => Promise<void>;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const guestsInputRef = useRef<HTMLInputElement>(null);
  const budgetInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    type: "wedding" as EventType,
    date: "",
    location: "",
    expectedGuests: "150",
    totalBudget: "1000000",
    currency: "INR" as CurrencyCode,
    autoGenerateAI: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = EventValidator.validate({
      name: formData.name,
      type: formData.type,
      date: formData.date,
      location: formData.location,
      expectedGuests: Number(formData.expectedGuests),
      totalBudget: Number(formData.totalBudget),
      currency: formData.currency,
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      showToast("Please correct the form errors before submitting.", "error");

      // Focus first invalid input (WCAG 3.3.1, 3.3.3)
      if (validation.errors.name) {
        nameInputRef.current?.focus();
      } else if (validation.errors.date) {
        dateInputRef.current?.focus();
      } else if (validation.errors.location) {
        locationInputRef.current?.focus();
      } else if (validation.errors.expectedGuests) {
        guestsInputRef.current?.focus();
      } else if (validation.errors.totalBudget) {
        budgetInputRef.current?.focus();
      }
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        name: formData.name.trim(),
        type: formData.type,
        date: formData.date,
        location: formData.location.trim(),
        expectedGuests: Number(formData.expectedGuests),
        totalBudget: Number(formData.totalBudget),
        currency: formData.currency,
        autoGenerateAI: formData.autoGenerateAI,
      });

      // Reset form
      setFormData({
        name: "",
        type: "wedding",
        date: "",
        location: "",
        expectedGuests: "150",
        totalBudget: "1000000",
        currency: "INR",
        autoGenerateAI: true,
      });
      setErrors({});
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create event";
      showToast(msg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Event"
      description="Set up your event fundamentals and let EventWise AI generate your comprehensive roadmap."
      size="lg"
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {/* Event Name */}
        <Input
          ref={nameInputRef}
          label="Event Name"
          placeholder="e.g. Maya & Liam's Sunset Wedding"
          value={formData.name}
          onChange={(e) => handleChange("name", e.target.value)}
          error={errors.name}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Event Type */}
          <Select
            label="Event Type"
            value={formData.type}
            onChange={(e) => handleChange("type", e.target.value)}
            error={errors.type}
            options={[
              { value: "wedding", label: "Wedding" },
              { value: "birthday", label: "Birthday Party" },
              { value: "community", label: "Community Event" },
              { value: "other", label: "Custom / Corporate Event" },
            ]}
          />

          {/* Event Date */}
          <Input
            ref={dateInputRef}
            label="Event Date"
            type="date"
            value={formData.date}
            onChange={(e) => handleChange("date", e.target.value)}
            error={errors.date}
            required
          />
        </div>

        {/* Location */}
        <Input
          ref={locationInputRef}
          label="Location / City / Venue"
          placeholder="e.g. The Taj Gateway, Bangalore"
          value={formData.location}
          onChange={(e) => handleChange("location", e.target.value)}
          error={errors.location}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Expected Guests */}
          <Input
            ref={guestsInputRef}
            label="Expected Guests"
            type="number"
            min="1"
            value={formData.expectedGuests}
            onChange={(e) => handleChange("expectedGuests", e.target.value)}
            error={errors.expectedGuests}
            required
          />

          {/* Currency */}
          <Select
            label="Currency"
            value={formData.currency}
            onChange={(e) => handleChange("currency", e.target.value)}
            error={errors.currency}
            options={[
              { value: "INR", label: "INR (₹)" },
              { value: "USD", label: "USD ($)" },
              { value: "EUR", label: "EUR (€)" },
              { value: "GBP", label: "GBP (£)" },
            ]}
          />

          {/* Total Budget */}
          <Input
            ref={budgetInputRef}
            label="Total Budget"
            type="number"
            min="0"
            value={formData.totalBudget}
            onChange={(e) => handleChange("totalBudget", e.target.value)}
            error={errors.totalBudget}
            required
          />
        </div>

        {/* Auto AI Plan toggle */}
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-brand-50 to-indigo-50 dark:from-brand-950/40 dark:to-indigo-950/40 border border-brand-200 dark:border-brand-800 flex items-start gap-3 mt-1">
          <input
            id="auto-ai-plan"
            type="checkbox"
            checked={formData.autoGenerateAI}
            onChange={(e) => handleChange("autoGenerateAI", e.target.checked)}
            className="mt-1 w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-700 cursor-pointer"
          />
          <label htmlFor="auto-ai-plan" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
            <span className="font-bold flex items-center gap-1.5 text-brand-900 dark:text-brand-200">
              <Sparkles className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              Auto-generate structured plan with Google Gemini
            </span>
            <span className="block mt-0.5 text-slate-500 dark:text-slate-400">
              Immediately crafts customized budget categories, timeline milestones, vendor checklist, and risk mitigations.
            </span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 mt-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            leftIcon={<Sparkles className="w-4 h-4" />}
          >
            Create Event
          </Button>
        </div>
      </form>
    </Modal>
  );
};
