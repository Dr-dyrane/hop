"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { MapPinHouse, Phone, UserRoundCheck } from "lucide-react";
import { useOverlayPresence } from "@/components/providers/UIProvider";
import type { AdminCustomerAddressRow, AdminCustomerDetail } from "@/lib/db/types";
import {
  deleteAdminCustomerAddressAction,
  saveAdminCustomerAddressAction,
  updateAdminCustomerRecordAction,
  updateAdminCustomerProfileAction,
} from "@/app/(admin)/admin/customers/[customerKey]/actions";
import styles from "./AdminCustomerCRM.module.css";

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

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

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
  const isSheetOpen = supportOpen || profileOpen || addressDraft !== null;

  useOverlayPresence("admin-customer-crm", isSheetOpen);

  return (
    <div className={styles.stack}>
      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <div>
            <p className={styles.panelEyebrow}>CRM</p>
            <h2 className={styles.panelTitle}>Support state</h2>
          </div>
          <button
            type="button"
            onClick={() => setSupportOpen(true)}
            className={styles.surfaceButton}
          >
            Edit
          </button>
        </div>

        <div className={styles.panelContent}>
          <InfoTile label="State" value={formatSupportState(customer.supportState)} />

          <div className={styles.tile}>
            <p className={styles.tileLabel}>Tags</p>
            <div className={styles.tagRow}>
              {customer.tags.length > 0 ? (
                customer.tags.map((tag) => (
                  <span key={tag} className={styles.tag}>
                    {tag}
                  </span>
                ))
              ) : (
                <span className={styles.emptyLabel}>No tags</span>
              )}
            </div>
          </div>

          <InlineStatus message={customer.notes ?? "No support note yet."} />
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <div>
            <p className={styles.panelEyebrow}>Contact</p>
            <h2 className={styles.panelTitle}>Reachability</h2>
          </div>
          <div className={styles.iconActionRow}>
            {customer.userId ? (
              <button
                type="button"
                onClick={() => setProfileOpen(true)}
                className={styles.surfaceButton}
              >
                Edit
              </button>
            ) : null}
            <Phone className={styles.panelIcon} strokeWidth={1.8} />
          </div>
        </div>

        <div className={styles.panelContent}>
          <InfoTile label="Email" value={customer.email ?? "No email"} />
          <InfoTile label="Phone" value={customer.phone ?? "No phone"} />
          <InfoTile
            label="Account"
            value={customer.userId ? "Linked account" : "Guest order only"}
            icon={customer.userId ? <UserRoundCheck className={styles.inlineIcon} strokeWidth={1.8} /> : undefined}
          />
          {!customer.userId ? (
            <InlineStatus message="Guest contact is read-only for now. Use order detail for operational handling." />
          ) : null}
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <div>
            <p className={styles.panelEyebrow}>Addresses</p>
            <h2 className={styles.panelTitle}>Delivery places</h2>
          </div>
          <div className={styles.iconActionRow}>
            {customer.userId ? (
              <button
                type="button"
                onClick={() => setAddressDraft(createAddressDraft())}
                className={styles.surfaceButton}
              >
                Add
              </button>
            ) : null}
            <MapPinHouse className={styles.panelIcon} strokeWidth={1.8} />
          </div>
        </div>

        <div className={styles.panelContent}>
          {customer.addresses.map((address, index) => (
            <div key={`${address.addressId ?? "recent"}-${index}`} className={styles.addressCard}>
              <div className={styles.addressHead}>
                <div className={styles.addressTagRow}>
                  <p className={styles.addressLabel}>{address.label}</p>
                  {address.isDefault ? <span className={styles.addressTag}>Default</span> : null}
                  <span className={styles.addressTag}>
                    {address.source === "saved" ? "Saved" : "Recent order"}
                  </span>
                </div>

                {customer.userId && address.source === "saved" && address.addressId ? (
                  <button
                    type="button"
                    onClick={() => setAddressDraft(createAddressDraft(address))}
                    className={styles.smallButton}
                  >
                    Edit
                  </button>
                ) : null}
              </div>

              <div className={styles.addressBody}>
                <p className={styles.addressRecipient}>{address.recipientName}</p>
                <p>{address.phoneE164}</p>
                <p>{address.line1}</p>
                {address.line2 ? <p>{address.line2}</p> : null}
                <p>
                  {address.city}, {address.state}
                  {address.postalCode ? ` ${address.postalCode}` : ""}
                </p>
                {address.landmark ? <p>{address.landmark}</p> : null}
                {address.deliveryNotes ? <p>{address.deliveryNotes}</p> : null}
              </div>
            </div>
          ))}

          {customer.addresses.length === 0 ? (
            <div className={styles.emptyAddress}>No saved address history yet.</div>
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
      className={styles.formStack}
    >
      <input type="hidden" name="userId" value={customer.userId ?? ""} />
      <input type="hidden" name="email" value={customer.email ?? ""} />
      <input type="hidden" name="phone" value={customer.phone ?? ""} />

      <div className={styles.formGridTwo}>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Support state</label>
          <select
            name="supportState"
            defaultValue={customer.supportState}
            className={styles.fieldSelect}
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

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Notes</label>
        <textarea
          name="notes"
          defaultValue={customer.notes ?? ""}
          rows={5}
          className={styles.fieldTextarea}
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
      className={styles.formStack}
    >
      <input type="hidden" name="userId" value={customer.userId ?? ""} />

      <div className={styles.formGridTwo}>
        <Field label="Full name" name="fullName" defaultValue={customer.fullName ?? ""} required />
        <Field label="Phone" name="preferredPhone" defaultValue={customer.phone ?? ""} required />
      </div>

      <InlineStatus message={message ?? "This updates the linked account profile and preferred phone."} />

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
      className={styles.formStack}
    >
      <input type="hidden" name="userId" value={customer.userId ?? ""} />
      <input type="hidden" name="addressId" value={draft.addressId ?? ""} />
      <input type="hidden" name="latitude" value={draft.latitude} />
      <input type="hidden" name="longitude" value={draft.longitude} />

      <div className={styles.formGridTwo}>
        <Field label="Label" name="label" defaultValue={draft.label} required />
        <Field label="Recipient" name="recipientName" defaultValue={draft.recipientName} required />
        <Field label="Phone" name="phone" defaultValue={draft.phone} required />

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Default</label>
          <select
            name="isDefault"
            defaultValue={draft.isDefault ? "true" : "false"}
            className={styles.fieldSelect}
          >
            <option value="false">No</option>
            <option value="true">Yes</option>
          </select>
        </div>
      </div>

      <div className={styles.formGridSingle}>
        <Field label="Line 1" name="line1" defaultValue={draft.line1} required />
        <Field label="Line 2" name="line2" defaultValue={draft.line2} />
        <Field label="Landmark" name="landmark" defaultValue={draft.landmark} />
      </div>

      <div className={styles.formGridThree}>
        <Field label="City" name="city" defaultValue={draft.city} required />
        <Field label="State" name="state" defaultValue={draft.state} required />
        <Field label="Postal" name="postalCode" defaultValue={draft.postalCode} />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Notes</label>
        <textarea
          name="deliveryNotes"
          defaultValue={draft.deliveryNotes}
          rows={3}
          className={styles.fieldTextarea}
        />
      </div>

      <InlineStatus
        message={
          message ??
          "Coordinates are preserved from the current record. This sheet updates the saved address only."
        }
      />

      <div className={styles.addressActionRow}>
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
      className={`${styles.deleteButton} ${isPending ? styles.buttonDisabled : ""}`}
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
  const headingId = useId();
  const dialogRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const frame = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      returnFocusRef.current?.focus();
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const dialog = dialogRef.current;
      if (!dialog) {
        return;
      }

      const focusables = Array.from(
        dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      ).filter(
        (element) =>
          !element.hasAttribute("disabled") &&
          element.getAttribute("aria-hidden") !== "true" &&
          (element.offsetParent !== null || element === document.activeElement)
      );

      if (focusables.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (!active || active === first || !dialog.contains(active)) {
          event.preventDefault();
          last.focus();
        }
        return;
      }

      if (!active || active === last || !dialog.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return (
    <>
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className={styles.sheetBackdrop}
      />
      <div className={styles.sheetWrap}>
        <section
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={headingId}
          className={styles.sheetDialog}
        >
          <div className={styles.sheetHeader}>
            <div>
              <p className={styles.sheetEyebrow}>Customers</p>
              <h2 id={headingId} className={styles.sheetTitle}>
                {title}
              </h2>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className={styles.sheetCloseButton}
            >
              Close
            </button>
          </div>

          <div className={styles.sheetBody}>{children}</div>
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
    <div className={styles.sheetActionRow}>
      <button type="button" onClick={onClose} className={styles.cancelButton}>
        Cancel
      </button>
      <button
        type="submit"
        disabled={pending}
        className={`${styles.submitButton} ${pending ? styles.buttonDisabled : ""}`}
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
    <div className={styles.tile}>
      <p className={styles.tileLabel}>{label}</p>
      <p className={styles.tileValue}>
        {icon}
        <span>{value}</span>
      </p>
    </div>
  );
}

function InlineStatus({ message }: { message: string }) {
  return <p className={styles.inlineStatus}>{message}</p>;
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
}: { label: string; className?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={`${styles.fieldGroup} ${className ?? ""}`.trim()}>
      <label className={styles.fieldLabel}>{label}</label>
      <input {...props} className={styles.fieldInput} />
    </div>
  );
}
