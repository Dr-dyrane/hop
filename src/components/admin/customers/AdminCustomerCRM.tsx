"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { MapPinHouse, Phone, UserRoundCheck } from "lucide-react";
import type { AdminCustomerAddressRow, AdminCustomerDetail } from "@/lib/db/types";
import {
  deleteAdminCustomerAddressAction,
  saveAdminCustomerAddressAction,
  updateAdminCustomerRecordAction,
  updateAdminCustomerProfileAction,
} from "@/app/(admin)/admin/customers/[customerKey]/actions";
import { cn } from "@/lib/utils";

type AddressDraft = {
  addressId: string | null;
  label: string;
  recipientName: string;
  phone: string;
  line1: string;
  line2: string;
  landmark: string;
  city: string;
  state: string;
  postalCode: string;
  deliveryNotes: string;
  latitude: string;
  longitude: string;
  isDefault: boolean;
};

function createAddressDraft(address?: AdminCustomerAddressRow | null): AddressDraft {
  return {
    addressId: address?.addressId ?? null,
    label: address?.label ?? "",
    recipientName: address?.recipientName ?? "",
    phone: address?.phoneE164 ?? "",
    line1: address?.line1 ?? "",
    line2: address?.line2 ?? "",
    landmark: address?.landmark ?? "",
    city: address?.city ?? "",
    state: address?.state ?? "",
    postalCode: address?.postalCode ?? "",
    deliveryNotes: address?.deliveryNotes ?? "",
    latitude: address?.latitude == null ? "" : `${address.latitude}`,
    longitude: address?.longitude == null ? "" : `${address.longitude}`,
    isDefault: address?.isDefault ?? false,
  };
}

export function AdminCustomerCRM({ customer }: { customer: AdminCustomerDetail }) {
  const [supportOpen, setSupportOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [addressDraft, setAddressDraft] = useState<AddressDraft | null>(null);

  return (
    <div className="space-y-4">
      <section className="glass-morphism rounded-[32px] bg-[color:var(--surface)]/88 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary-label">
              CRM
            </div>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-label">Support state</h2>
          </div>
          <button
            type="button"
            onClick={() => setSupportOpen(true)}
            className="min-h-[40px] rounded-full bg-system-fill/42 px-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-label"
          >
            Edit
          </button>
        </div>

        <div className="mt-5 space-y-3">
          <InfoTile label="State" value={formatSupportState(customer.supportState)} />
          <div className="rounded-[24px] bg-system-fill/42 px-4 py-4">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary-label">
              Tags
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {customer.tags.length > 0 ? (
                customer.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-system-fill/56 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label"
                  >
                    {tag}
                  </span>
                ))
              ) : (
                <span className="text-sm text-secondary-label">No tags</span>
              )}
            </div>
          </div>
          <InlineStatus message={customer.notes ?? "No support note yet."} />
        </div>
      </section>

      <section className="glass-morphism rounded-[32px] bg-[color:var(--surface)]/88 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary-label">
              Contact
            </div>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-label">Reachability</h2>
          </div>
          <div className="flex items-center gap-2">
            {customer.userId ? (
              <button
                type="button"
                onClick={() => setProfileOpen(true)}
                className="min-h-[40px] rounded-full bg-system-fill/42 px-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-label"
              >
                Edit
              </button>
            ) : null}
            <Phone className="h-5 w-5 text-secondary-label" strokeWidth={1.8} />
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <InfoTile label="Email" value={customer.email ?? "No email"} />
          <InfoTile label="Phone" value={customer.phone ?? "No phone"} />
          <InfoTile
            label="Account"
            value={customer.userId ? "Linked account" : "Guest order only"}
            icon={customer.userId ? <UserRoundCheck className="h-4 w-4" strokeWidth={1.8} /> : undefined}
          />
          {!customer.userId ? (
            <InlineStatus message="Guest contact is read-only for now. Use order detail for operational handling." />
          ) : null}
        </div>
      </section>

      <section className="glass-morphism rounded-[32px] bg-[color:var(--surface)]/88 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary-label">
              Addresses
            </div>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-label">Delivery places</h2>
          </div>
          <div className="flex items-center gap-2">
            {customer.userId ? (
              <button
                type="button"
                onClick={() => setAddressDraft(createAddressDraft())}
                className="min-h-[40px] rounded-full bg-system-fill/42 px-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-label"
              >
                Add
              </button>
            ) : null}
            <MapPinHouse className="h-5 w-5 text-secondary-label" strokeWidth={1.8} />
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {customer.addresses.map((address, index) => (
            <div
              key={`${address.addressId ?? "recent"}-${index}`}
              className="rounded-[24px] bg-system-fill/42 px-4 py-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-sm font-semibold text-label">{address.label}</div>
                  {address.isDefault ? (
                    <span className="rounded-full bg-system-fill/56 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
                      Default
                    </span>
                  ) : null}
                  <span className="rounded-full bg-system-fill/56 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
                    {address.source === "saved" ? "Saved" : "Recent order"}
                  </span>
                </div>
                {customer.userId && address.source === "saved" && address.addressId ? (
                  <button
                    type="button"
                    onClick={() => setAddressDraft(createAddressDraft(address))}
                    className="min-h-[36px] rounded-full bg-system-fill/56 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-label"
                  >
                    Edit
                  </button>
                ) : null}
              </div>
              <div className="mt-3 space-y-1 text-sm text-secondary-label">
                <div className="font-medium text-label">{address.recipientName}</div>
                <div>{address.phoneE164}</div>
                <div>{address.line1}</div>
                {address.line2 ? <div>{address.line2}</div> : null}
                <div>
                  {address.city}, {address.state}
                  {address.postalCode ? ` ${address.postalCode}` : ""}
                </div>
                {address.landmark ? <div>{address.landmark}</div> : null}
                {address.deliveryNotes ? <div>{address.deliveryNotes}</div> : null}
              </div>
            </div>
          ))}

          {customer.addresses.length === 0 ? (
            <div className="rounded-[24px] bg-system-fill/42 px-4 py-4 text-sm text-secondary-label">
              No saved address history yet.
            </div>
          ) : null}
        </div>
      </section>

      {profileOpen && customer.userId ? (
        <CustomerSheet title="Edit contact" onClose={() => setProfileOpen(false)}>
          <CustomerProfileForm customer={customer} onClose={() => setProfileOpen(false)} />
        </CustomerSheet>
      ) : null}

      {supportOpen ? (
        <CustomerSheet title="Customer CRM" onClose={() => setSupportOpen(false)}>
          <CustomerSupportForm customer={customer} onClose={() => setSupportOpen(false)} />
        </CustomerSheet>
      ) : null}

      {addressDraft && customer.userId ? (
        <CustomerSheet
          title={addressDraft.addressId ? "Edit address" : "Add address"}
          onClose={() => setAddressDraft(null)}
        >
          <CustomerAddressForm
            customer={customer}
            draft={addressDraft}
            onClose={() => setAddressDraft(null)}
          />
        </CustomerSheet>
      ) : null}
    </div>
  );
}

function CustomerSupportForm({
  customer,
  onClose,
}: {
  customer: AdminCustomerDetail;
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        setMessage(null);
        const formData = new FormData(event.currentTarget);

        startTransition(async () => {
          const result = await updateAdminCustomerRecordAction(customer.customerKey, formData);

          if (!result.success) {
            setMessage(result.error || "Unable to update CRM.");
            return;
          }

          router.refresh();
          onClose();
        });
      }}
      className="space-y-5"
    >
      <input type="hidden" name="userId" value={customer.userId ?? ""} />
      <input type="hidden" name="email" value={customer.email ?? ""} />
      <input type="hidden" name="phone" value={customer.phone ?? ""} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="ml-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary-label">
            Support state
          </label>
          <select
            name="supportState"
            defaultValue={customer.supportState}
            className="flex min-h-[48px] w-full appearance-none rounded-[20px] bg-system-fill/42 px-4 text-sm text-label outline-none transition-all focus:bg-system-fill/58"
          >
            <option value="standard">Standard</option>
            <option value="priority">Priority</option>
            <option value="follow_up">Follow up</option>
            <option value="hold">Hold</option>
          </select>
        </div>
        <Field
          label="Tags"
          name="tags"
          defaultValue={customer.tags.join(", ")}
          placeholder="vip, wholesale, callback"
        />
      </div>

      <div className="space-y-2">
        <label className="ml-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary-label">
          Notes
        </label>
        <textarea
          name="notes"
          defaultValue={customer.notes ?? ""}
          rows={5}
          className="flex w-full rounded-[20px] bg-system-fill/42 px-4 py-3 text-sm text-label outline-none transition-all placeholder:text-tertiary-label focus:bg-system-fill/58"
        />
      </div>

      <InlineStatus
        message={
          message ??
          "Tags are comma-separated. Leave everything blank with Standard to clear CRM metadata."
        }
      />

      <SheetActionRow pending={isPending} onClose={onClose} submitLabel="Save" />
    </form>
  );
}

function CustomerProfileForm({
  customer,
  onClose,
}: {
  customer: AdminCustomerDetail;
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        setMessage(null);
        const formData = new FormData(event.currentTarget);

        startTransition(async () => {
          const result = await updateAdminCustomerProfileAction(customer.customerKey, formData);

          if (!result.success) {
            setMessage(result.error || "Unable to update customer.");
            return;
          }

          router.refresh();
          onClose();
        });
      }}
      className="space-y-5"
    >
      <input type="hidden" name="userId" value={customer.userId ?? ""} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Full name"
          name="fullName"
          defaultValue={customer.fullName ?? ""}
          required
        />
        <Field
          label="Phone"
          name="preferredPhone"
          defaultValue={customer.phone ?? ""}
          required
        />
      </div>

      <InlineStatus
        message={message ?? "This updates the linked account profile and preferred phone."}
      />

      <SheetActionRow pending={isPending} onClose={onClose} submitLabel="Save" />
    </form>
  );
}

function CustomerAddressForm({
  customer,
  draft,
  onClose,
}: {
  customer: AdminCustomerDetail;
  draft: AddressDraft;
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        setMessage(null);
        const formData = new FormData(event.currentTarget);

        startTransition(async () => {
          const result = await saveAdminCustomerAddressAction(customer.customerKey, formData);

          if (!result.success) {
            setMessage(result.error || "Unable to save address.");
            return;
          }

          router.refresh();
          onClose();
        });
      }}
      className="space-y-5"
    >
      <input type="hidden" name="userId" value={customer.userId ?? ""} />
      <input type="hidden" name="addressId" value={draft.addressId ?? ""} />
      <input type="hidden" name="latitude" value={draft.latitude} />
      <input type="hidden" name="longitude" value={draft.longitude} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Label" name="label" defaultValue={draft.label} required />
        <Field label="Recipient" name="recipientName" defaultValue={draft.recipientName} required />
        <Field label="Phone" name="phone" defaultValue={draft.phone} required />
        <div className="space-y-2">
          <label className="ml-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary-label">
            Default
          </label>
          <select
            name="isDefault"
            defaultValue={draft.isDefault ? "true" : "false"}
            className="flex min-h-[48px] w-full appearance-none rounded-[20px] bg-system-fill/42 px-4 text-sm text-label outline-none transition-all focus:bg-system-fill/58"
          >
            <option value="false">No</option>
            <option value="true">Yes</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4">
        <Field label="Line 1" name="line1" defaultValue={draft.line1} required />
        <Field label="Line 2" name="line2" defaultValue={draft.line2} />
        <Field label="Landmark" name="landmark" defaultValue={draft.landmark} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="City" name="city" defaultValue={draft.city} required />
        <Field label="State" name="state" defaultValue={draft.state} required />
        <Field label="Postal" name="postalCode" defaultValue={draft.postalCode} />
      </div>

      <div className="space-y-2">
        <label className="ml-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary-label">
          Notes
        </label>
        <textarea
          name="deliveryNotes"
          defaultValue={draft.deliveryNotes}
          rows={3}
          className="flex w-full rounded-[20px] bg-system-fill/42 px-4 py-3 text-sm text-label outline-none transition-all placeholder:text-tertiary-label focus:bg-system-fill/58"
        />
      </div>

      <InlineStatus
        message={
          message ??
          "Coordinates are preserved from the current record. This sheet updates the saved address only."
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        {draft.addressId ? (
          <DeleteAddressButton
            customerKey={customer.customerKey}
            userId={customer.userId ?? ""}
            addressId={draft.addressId}
            onComplete={onClose}
          />
        ) : null}
        <SheetActionRow pending={isPending} onClose={onClose} submitLabel="Save" />
      </div>
    </form>
  );
}

function DeleteAddressButton({
  customerKey,
  userId,
  addressId,
  onComplete,
}: {
  customerKey: string;
  userId: string;
  addressId: string;
  onComplete: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() =>
        startTransition(async () => {
          const result = await deleteAdminCustomerAddressAction(customerKey, userId, addressId);

          if (!result.success) {
            return;
          }

          router.refresh();
          onComplete();
        })
      }
      disabled={isPending}
      className={cn(
        "min-h-[42px] rounded-full bg-system-fill/56 px-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-red-500 transition-colors duration-200 hover:bg-system-fill/76",
        isPending && "pointer-events-none opacity-50"
      )}
    >
      Delete
    </button>
  );
}

function CustomerSheet({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <>
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="z-layer-modal-backdrop fixed inset-0 bg-black/40 backdrop-blur-md"
      />
      <div className="z-layer-modal fixed inset-0 flex items-end justify-center px-3 py-3 sm:items-center sm:px-4 sm:py-6">
        <section
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className="glass-morphism flex max-h-[calc(100svh-1.5rem)] w-full max-w-[42rem] flex-col overflow-hidden rounded-[32px] bg-[color:var(--surface)]/92 shadow-[0_28px_80px_rgba(15,23,42,0.22)]"
        >
          <div className="flex items-center justify-between gap-3 px-5 py-4 sm:px-6">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary-label">
                Customers
              </div>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-label">{title}</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="min-h-[40px] rounded-full bg-system-fill/42 px-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label"
            >
              Close
            </button>
          </div>
          <div className="overflow-y-auto px-5 pb-5 sm:px-6 sm:pb-6">{children}</div>
        </section>
      </div>
    </>
  );
}

function SheetActionRow({
  pending,
  onClose,
  submitLabel,
}: {
  pending: boolean;
  onClose: () => void;
  submitLabel: string;
}) {
  return (
    <div className="flex w-full items-center justify-end gap-2">
      <button
        type="button"
        onClick={onClose}
        className="min-h-[42px] rounded-full bg-system-fill/42 px-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={pending}
        className={cn(
          "button-primary min-h-[42px] rounded-full px-5 text-[11px] font-semibold uppercase tracking-[0.16em]",
          pending && "pointer-events-none opacity-50"
        )}
      >
        {pending ? "Saving" : submitLabel}
      </button>
    </div>
  );
}

function InfoTile({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-[24px] bg-system-fill/42 px-4 py-4">
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary-label">
        {label}
      </div>
      <div className="mt-2 flex items-center gap-2 text-sm font-medium text-label">
        {icon}
        <span>{value}</span>
      </div>
    </div>
  );
}

function InlineStatus({ message }: { message: string }) {
  return (
    <p className="rounded-[20px] bg-system-fill/42 px-4 py-3 text-sm text-secondary-label">
      {message}
    </p>
  );
}

function formatSupportState(value: AdminCustomerDetail["supportState"]) {
  if (value === "follow_up") {
    return "Follow up";
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function Field({
  label,
  className,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={cn("space-y-2", className)}>
      <label className="ml-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary-label">
        {label}
      </label>
      <input
        {...props}
        className="flex min-h-[48px] w-full rounded-[20px] bg-system-fill/42 px-4 text-sm text-label outline-none transition-all placeholder:text-tertiary-label focus:bg-system-fill/58"
      />
    </div>
  );
}
