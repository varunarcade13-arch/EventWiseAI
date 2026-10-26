import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { AddVendorModal } from "@/features/vendors/AddVendorModal";
import { formatCurrency } from "@/lib/currency";
import {
  EventModel,
  VendorCategory,
  VendorItem,
  VendorStatus,
} from "@/types/event";
import {
  Briefcase,
  Phone,
  Mail,
  Plus,
  Sparkles,
  Trash2,
  User,
} from "lucide-react";
import React, { useState } from "react";

export interface VendorChecklistProps {
  event: EventModel;
  onAddVendor: (vendor: Omit<VendorItem, "id">) => Promise<void>;
  onUpdateVendorStatus: (vendorId: string, status: VendorStatus) => Promise<void>;
  onDeleteVendor: (vendorId: string) => Promise<void>;
  onTriggerAIVendors: () => void;
  isLoadingAI?: boolean;
}

export const VendorChecklist: React.FC<VendorChecklistProps> = ({
  event,
  onAddVendor,
  onUpdateVendorStatus,
  onDeleteVendor,
  onTriggerAIVendors,
  isLoadingAI = false,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<"all" | VendorCategory>("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const filteredVendors =
    selectedCategory === "all"
      ? event.vendors
      : event.vendors.filter((v) => v.category === selectedCategory);

  const statusMap: Record<
    VendorStatus,
    { label: string; variant: "neutral" | "warning" | "success" }
  > = {
    not_contacted: { label: "Not Contacted", variant: "neutral" },
    contacted: { label: "In Discussion", variant: "warning" },
    booked: { label: "Booked", variant: "success" },
  };

  const categoriesList: Array<{ id: "all" | VendorCategory; label: string }> = [
    { id: "all", label: "All Categories" },
    { id: "venue", label: "Venue" },
    { id: "catering", label: "Catering" },
    { id: "photography", label: "Photography" },
    { id: "decoration", label: "Decoration" },
    { id: "entertainment", label: "Entertainment" },
    { id: "transportation", label: "Transport" },
    { id: "invitations", label: "Invitations" },
    { id: "makeup", label: "Makeup" },
    { id: "security", label: "Security" },
    { id: "miscellaneous", label: "Misc" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex-col sm:flex-row items-start sm:items-center gap-3">
          <div>
            <CardTitle>Vendor Directory & Checklist</CardTitle>
            <CardDescription>
              Manage outreach, negotiations, contracts, and booking confirmations.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsAddModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Vendor
            </Button>
            <Button
              size="sm"
              variant="ai"
              onClick={onTriggerAIVendors}
              isLoading={isLoadingAI}
              leftIcon={<Sparkles className="w-4 h-4" />}
            >
              AI Vendor Checklist
            </Button>
          </div>
        </CardHeader>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800 overflow-x-auto text-xs no-scrollbar">
          {categoriesList.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? "bg-brand-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Vendors Grid */}
        {filteredVendors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredVendors.map((vendor) => {
              const statusInfo = statusMap[vendor.status] || {
                label: vendor.status,
                variant: "neutral",
              };
              return (
                <div
                  key={vendor.id}
                  className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {vendor.category}
                          </span>
                          <Badge variant={statusInfo.variant} size="sm">
                            {statusInfo.label}
                          </Badge>
                        </div>
                        <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                          {vendor.name}
                        </h4>
                      </div>

                      <button
                        type="button"
                        onClick={() => onDeleteVendor(vendor.id)}
                        aria-label={`Delete vendor ${vendor.name}`}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 py-2 border-y border-slate-100 dark:border-slate-800 my-2">
                      <div>
                        <span className="text-[11px] text-slate-400 block">
                          Estimated Cost
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {formatCurrency(vendor.estimatedCost, event.currency)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] text-slate-400 block">
                          Final / Contract
                        </span>
                        <span className="font-semibold text-brand-600 dark:text-brand-400">
                          {vendor.actualCost !== undefined
                            ? formatCurrency(vendor.actualCost, event.currency)
                            : "Pending lock"}
                        </span>
                      </div>
                    </div>

                    {/* Contacts info */}
                    <div className="space-y-1 text-xs text-slate-500 mb-3">
                      {vendor.contactPerson && (
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{vendor.contactPerson}</span>
                        </div>
                      )}
                      {vendor.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{vendor.phone}</span>
                        </div>
                      )}
                      {vendor.email && (
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{vendor.email}</span>
                        </div>
                      )}
                      {vendor.notes && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-850 p-2 rounded-lg mt-2">
                          {vendor.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Status selector */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-medium">
                      Status:
                    </span>
                    <select
                      value={vendor.status}
                      aria-label={`Update booking status for ${vendor.name}`}
                      onChange={(e) =>
                        onUpdateVendorStatus(
                          vendor.id,
                          e.target.value as VendorStatus
                        )
                      }
                      className="text-xs bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-2.5 py-1 font-semibold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
                    >
                      <option value="not_contacted">Not Contacted</option>
                      <option value="contacted">In Discussion</option>
                      <option value="booked">Booked & Locked</option>
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 px-4 border-dashed border-2 rounded-xl">
            <Briefcase className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No vendors found for this category
            </p>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Add vendors manually or click AI Vendor Checklist to generate recommendations.
            </p>
            <Button
              size="sm"
              variant="ai"
              onClick={onTriggerAIVendors}
              isLoading={isLoadingAI}
              leftIcon={<Sparkles className="w-4 h-4" />}
            >
              Generate Vendors with AI
            </Button>
          </div>
        )}
      </Card>

      <AddVendorModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        currency={event.currency}
        onAdd={onAddVendor}
      />
    </div>
  );
};
