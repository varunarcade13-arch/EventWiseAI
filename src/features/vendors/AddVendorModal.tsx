import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { VendorCategory, VendorItem, VendorStatus } from "@/types/event";
import React, { useRef, useState } from "react";

export interface AddVendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currency: string;
  onAdd: (vendor: Omit<VendorItem, "id">) => Promise<void>;
}

export const AddVendorModal: React.FC<AddVendorModalProps> = ({
  isOpen,
  onClose,
  currency,
  onAdd,
}) => {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<VendorCategory>("venue");
  const [status, setStatus] = useState<VendorStatus>("not_contacted");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [actualCost, setActualCost] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!name.trim()) {
      setError("Vendor name is required.");
      nameInputRef.current?.focus();
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      await onAdd({
        name: name.trim(),
        category,
        status,
        estimatedCost: Math.max(0, Number(estimatedCost) || 0),
        actualCost: actualCost ? Math.max(0, Number(actualCost) || 0) : undefined,
        contactPerson: contactPerson.trim(),
        phone: phone.trim(),
        email: email.trim(),
        notes: notes.trim(),
      });
      setName("");
      setEstimatedCost("");
      setActualCost("");
      setContactPerson("");
      setPhone("");
      setEmail("");
      setNotes("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add vendor");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Vendor"
      description="Track quotes, contacts, and booking contracts."
      size="lg"
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Input
          ref={nameInputRef}
          label="Vendor / Business Name"
          placeholder="e.g. Lumina Wedding Films, Spice Symphony"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={error}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value as VendorCategory)}
            options={[
              { value: "venue", label: "Venue" },
              { value: "catering", label: "Catering" },
              { value: "photography", label: "Photography" },
              { value: "decoration", label: "Decoration" },
              { value: "entertainment", label: "Entertainment" },
              { value: "transportation", label: "Transportation" },
              { value: "invitations", label: "Invitations" },
              { value: "makeup", label: "Makeup & Styling" },
              { value: "security", label: "Security & Sanitation" },
              { value: "miscellaneous", label: "Miscellaneous" },
            ]}
          />
          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as VendorStatus)}
            options={[
              { value: "not_contacted", label: "Not Contacted" },
              { value: "contacted", label: "Contacted / In Discussion" },
              { value: "booked", label: "Booked / Advance Paid" },
            ]}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label={`Estimated Cost (${currency})`}
            type="number"
            min="0"
            placeholder="0"
            value={estimatedCost}
            onChange={(e) => setEstimatedCost(e.target.value)}
            required
          />
          <Input
            label={`Final / Actual Cost (${currency})`}
            type="number"
            min="0"
            placeholder="Optional"
            value={actualCost}
            onChange={(e) => setActualCost(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Contact Person"
            placeholder="e.g. Arjun"
            value={contactPerson}
            onChange={(e) => setContactPerson(e.target.value)}
          />
          <Input
            label="Phone"
            placeholder="+91 98..."
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Input
            label="Email"
            type="email"
            placeholder="name@vendor.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <Input
          label="Contract Deliverables / Notes"
          placeholder="e.g. Requires 50% deposit, backup generator provided"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700/80">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Save Vendor
          </Button>
        </div>
      </form>
    </Modal>
  );
};
