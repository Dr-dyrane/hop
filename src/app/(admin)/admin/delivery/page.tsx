import Link from "next/link";
import { AdminDeliveryLiveSurface } from "@/components/admin/delivery/AdminDeliveryLiveSurface";
import { requireAdminSession } from "@/lib/auth/guards";
import { formatNgn } from "@/lib/commerce";
import { buildCourierAccessUrl, createCourierAccessToken } from "@/lib/delivery/access";
import { buildAdminDeliveryLiveSnapshot, getDeliveryLine } from "@/lib/delivery/snapshot";
import {
  getAdminDeliveryBoardSnapshot,
} from "@/lib/db/repositories/delivery-repository";
import type { AdminDeliveryOrder, AdminDeliveryRider } from "@/lib/db/types";
import {
  assignRiderAction,
  createRiderAction,
  markReadyAction,
  updateAssignmentStatusAction,
} from "./actions";

function formatTimestamp(value?: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

const deliveryLabelMap: Record<string, string> = {
  preparing: "Preparing order",
  ready_for_dispatch: "Ready to send",
  out_for_delivery: "Out for delivery",
  assigned: "Rider assigned",
  unassigned: "Awaiting rider",
  picked_up: "Picked up",
  failed: "Delivery failed",
  returned: "Returned",
  delivered: "Delivered",
};

function formatStatusLabel(value: string) {
  return deliveryLabelMap[value] ?? value.replace(/_/g, " ");
}

function StageChip({ value }: { value: string }) {
  return (
    <span className="rounded-full bg-system-background px-3 py-1 text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
      {formatStatusLabel(value)}
    </span>
  );
}

function DeliveryControls({
  order,
  riders,
}: {
  order: AdminDeliveryOrder;
  riders: AdminDeliveryRider[];
}) {
  if (order.deliveryStage === "preparing") {
    return (
      <form action={markReadyAction} className="flex items-center gap-2">
        <input type="hidden" name="orderId" value={order.orderId} />
        <button
          type="submit"
          className="button-secondary min-h-[40px] px-4 text-[10px] font-semibold uppercase tracking-headline"
        >
          Ready to send
        </button>
      </form>
    );
  }

  if (order.deliveryStage === "ready_for_dispatch") {
    const canAssign =
      riders.length > 0 &&
      (!order.assignmentStatus ||
        order.assignmentStatus === "unassigned" ||
        order.assignmentStatus === "failed");

    return (
      <div className="flex flex-wrap items-center gap-2">
        {canAssign ? (
          <form action={assignRiderAction} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="orderId" value={order.orderId} />
            <select
              name="riderId"
              defaultValue={riders[0]?.riderId ?? ""}
              className="rounded-full bg-system-background px-4 py-2 text-[10px] font-semibold uppercase tracking-headline text-label"
            >
              {riders.map((rider) => (
                <option key={rider.riderId} value={rider.riderId}>
                  {rider.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="button-secondary min-h-[40px] px-4 text-[10px] font-semibold uppercase tracking-headline"
            >
              Assign rider
            </button>
          </form>
        ) : null}

        {order.assignmentId && order.assignmentStatus === "assigned" ? (
          <>
            <form action={updateAssignmentStatusAction}>
              <input type="hidden" name="orderId" value={order.orderId} />
              <input type="hidden" name="assignmentId" value={order.assignmentId} />
              <input type="hidden" name="nextStatus" value="picked_up" />
              <button
                type="submit"
                className="button-secondary min-h-[40px] px-4 text-[10px] font-semibold uppercase tracking-headline"
              >
                Picked up
              </button>
            </form>
            <form action={updateAssignmentStatusAction}>
              <input type="hidden" name="orderId" value={order.orderId} />
              <input type="hidden" name="assignmentId" value={order.assignmentId} />
              <input type="hidden" name="nextStatus" value="unassigned" />
              <button
                type="submit"
                className="rounded-full bg-system-background px-4 py-2 text-[10px] font-semibold uppercase tracking-headline text-secondary-label transition-colors duration-300 hover:text-label"
              >
                Remove
              </button>
            </form>
          </>
        ) : null}

        {order.assignmentId && order.assignmentStatus === "failed" ? (
          <form action={updateAssignmentStatusAction}>
            <input type="hidden" name="orderId" value={order.orderId} />
            <input type="hidden" name="assignmentId" value={order.assignmentId} />
            <input type="hidden" name="nextStatus" value="returned" />
            <button
              type="submit"
              className="rounded-full bg-system-background px-4 py-2 text-[10px] font-semibold uppercase tracking-headline text-secondary-label transition-colors duration-300 hover:text-label"
            >
              Return
            </button>
          </form>
        ) : null}
      </div>
    );
  }

  if (!order.assignmentId) {
    return null;
  }

  if (order.assignmentStatus === "picked_up") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <form action={updateAssignmentStatusAction}>
          <input type="hidden" name="orderId" value={order.orderId} />
          <input type="hidden" name="assignmentId" value={order.assignmentId} />
          <input type="hidden" name="nextStatus" value="out_for_delivery" />
          <button
            type="submit"
            className="button-secondary min-h-[40px] px-4 text-[10px] font-semibold uppercase tracking-headline"
          >
            Out for delivery
          </button>
        </form>
        <form action={updateAssignmentStatusAction}>
          <input type="hidden" name="orderId" value={order.orderId} />
          <input type="hidden" name="assignmentId" value={order.assignmentId} />
          <input type="hidden" name="nextStatus" value="assigned" />
          <button
            type="submit"
            className="rounded-full bg-system-background px-4 py-2 text-[10px] font-semibold uppercase tracking-headline text-secondary-label transition-colors duration-300 hover:text-label"
          >
            Back
          </button>
        </form>
      </div>
    );
  }

  if (order.assignmentStatus === "out_for_delivery") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <form action={updateAssignmentStatusAction}>
          <input type="hidden" name="orderId" value={order.orderId} />
          <input type="hidden" name="assignmentId" value={order.assignmentId} />
          <input type="hidden" name="nextStatus" value="delivered" />
          <button
            type="submit"
            className="button-secondary min-h-[40px] px-4 text-[10px] font-semibold uppercase tracking-headline"
          >
            Delivered
          </button>
        </form>
        <form action={updateAssignmentStatusAction}>
          <input type="hidden" name="orderId" value={order.orderId} />
          <input type="hidden" name="assignmentId" value={order.assignmentId} />
          <input type="hidden" name="nextStatus" value="failed" />
          <button
            type="submit"
            className="rounded-full bg-system-background px-4 py-2 text-[10px] font-semibold uppercase tracking-headline text-secondary-label transition-colors duration-300 hover:text-label"
          >
            Failed
          </button>
        </form>
      </div>
    );
  }

  if (order.assignmentStatus === "failed" && riders.length > 0) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <form action={assignRiderAction} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="orderId" value={order.orderId} />
          <select
            name="riderId"
            defaultValue={riders[0]?.riderId ?? ""}
            className="rounded-full bg-system-background px-4 py-2 text-[10px] font-semibold uppercase tracking-headline text-label"
          >
            {riders.map((rider) => (
              <option key={rider.riderId} value={rider.riderId}>
                {rider.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="button-secondary min-h-[40px] px-4 text-[10px] font-semibold uppercase tracking-headline"
          >
            Reassign rider
          </button>
        </form>
        <form action={updateAssignmentStatusAction}>
          <input type="hidden" name="orderId" value={order.orderId} />
          <input type="hidden" name="assignmentId" value={order.assignmentId} />
          <input type="hidden" name="nextStatus" value="returned" />
          <button
            type="submit"
            className="rounded-full bg-system-background px-4 py-2 text-[10px] font-semibold uppercase tracking-headline text-secondary-label transition-colors duration-300 hover:text-label"
          >
            Return
          </button>
        </form>
      </div>
    );
  }

  return null;
}

function OrderCard({
  order,
  riders,
}: {
  order: AdminDeliveryOrder;
  riders: AdminDeliveryRider[];
}) {
  const courierUrl =
    order.assignmentId && order.riderId
      ? buildCourierAccessUrl(
          createCourierAccessToken({
            assignmentId: order.assignmentId,
            orderId: order.orderId,
            riderId: order.riderId,
          })
        )
      : null;

  return (
    <article className="rounded-[26px] bg-system-fill/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-headline text-secondary-label">
            #{order.orderNumber}
          </div>
          <div className="mt-1 truncate text-lg font-semibold text-label">
            {order.customerName}
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <StageChip value={order.deliveryStage} />
          {order.assignmentStatus ? <StageChip value={order.assignmentStatus} /> : null}
        </div>
      </div>

      <div className="mt-3 space-y-1 text-sm text-secondary-label">
        <div>{getDeliveryLine(order.deliveryAddressSnapshot)}</div>
        <div>{order.customerPhone}</div>
        {order.riderName ? (
          <div className="text-label">
            {order.riderName}
            {order.riderPhone ? ` / ${order.riderPhone}` : ""}
          </div>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 text-sm text-secondary-label sm:grid-cols-3">
        <div>
          <div className="font-semibold text-label">{formatNgn(order.totalNgn)}</div>
          <div>{order.itemCount} item{order.itemCount === 1 ? "" : "s"}</div>
        </div>
        <div>
          <div className="font-semibold text-label">{order.transferReference}</div>
          <div>{formatTimestamp(order.placedAt)}</div>
        </div>
        <div className="sm:text-right">
          <Link
            href={`/admin/orders/${order.orderId}`}
            className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label transition-colors duration-300 hover:text-label"
          >
            Open
          </Link>
          {courierUrl ? (
            <div className="mt-2">
              <Link
                href={courierUrl}
                target="_blank"
                className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label transition-colors duration-300 hover:text-label"
              >
                Courier
              </Link>
            </div>
          ) : null}
        </div>
      </div>

      {order.latestDeliveryEventType ? (
        <div className="mt-4 text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
          {formatStatusLabel(order.latestDeliveryEventType)} /{" "}
          {formatTimestamp(order.latestDeliveryEventAt)}
        </div>
      ) : null}

      <div className="mt-4">
        <DeliveryControls order={order} riders={riders} />
      </div>
    </article>
  );
}

function StageCard({
  title,
  count,
  orders,
  riders,
}: {
  title: string;
  count: number;
  orders: AdminDeliveryOrder[];
  riders: AdminDeliveryRider[];
}) {
  return (
    <section className="glass-morphism rounded-[32px] bg-system-background/78 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-lg font-semibold tracking-tight text-label">{title}</h3>
        <span className="rounded-full bg-system-fill px-3 py-1 text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
          {count}
        </span>
      </div>

      {orders.length === 0 ? (
        <div className="mt-4 rounded-[24px] bg-system-fill/60 px-4 py-5 text-sm text-secondary-label">
          Clear
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {orders.map((order) => (
            <OrderCard key={order.orderId} order={order} riders={riders} />
          ))}
        </div>
      )}
    </section>
  );
}

function RiderRoster({ riders }: { riders: AdminDeliveryRider[] }) {
  return (
    <section className="glass-morphism rounded-[32px] bg-system-background/78 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-lg font-semibold tracking-tight text-label">Riders</h3>
        <span className="rounded-full bg-system-fill px-3 py-1 text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
          {riders.length}
        </span>
      </div>

      <form id="admin-delivery-rider-form" action={createRiderAction} className="mt-4 grid gap-3">
        <input
          type="text"
          name="name"
          placeholder="Rider name"
          className="w-full rounded-[24px] bg-system-fill/80 px-4 py-3 text-sm text-label placeholder:text-secondary-label"
        />
        <input
          type="tel"
          name="phoneNumber"
          placeholder="Phone"
          className="w-full rounded-[24px] bg-system-fill/80 px-4 py-3 text-sm text-label placeholder:text-secondary-label"
        />
        <input
          type="text"
          name="vehicleType"
          placeholder="Bike or car"
          className="w-full rounded-[24px] bg-system-fill/80 px-4 py-3 text-sm text-label placeholder:text-secondary-label"
        />
        <button
          type="submit"
          className="button-secondary min-h-[44px] justify-center text-[10px] font-semibold uppercase tracking-headline"
        >
          Save rider
        </button>
      </form>

      <div className="mt-4 space-y-3">
        {riders.map((rider) => (
          <article
            key={rider.riderId}
            className="rounded-[24px] bg-system-fill/70 p-4 text-sm text-secondary-label"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold text-label">{rider.name}</div>
                <div>{rider.phone}</div>
                {rider.vehicleType ? <div>{rider.vehicleType}</div> : null}
              </div>
              <div className="text-right">
                <div className="rounded-full bg-system-background px-3 py-1 text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
                  {rider.activeAssignmentCount === 0 ? "Free" : "Busy"}
                </div>
                {rider.activeOrderNumber ? (
                  <div className="mt-2 text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
                    #{rider.activeOrderNumber}
                  </div>
                ) : null}
              </div>
            </div>
          </article>
        ))}
        {riders.length === 0 ? (
          <div className="rounded-[24px] bg-system-fill/60 px-4 py-5 text-sm text-secondary-label">
            No riders yet.
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default async function AdminDeliveryPage() {
  const session = await requireAdminSession("/admin/delivery");
  const { orders, riders, trackingEnabled } = await getAdminDeliveryBoardSnapshot({
    actorEmail: session.email,
  });
  const preparingOrders = orders.filter((order) => order.deliveryStage === "preparing");
  const readyOrders = orders.filter(
    (order) => order.deliveryStage === "ready_for_dispatch"
  );
  const liveOrders = orders.filter(
    (order) => order.deliveryStage === "out_for_delivery"
  );
  const liveSnapshot = buildAdminDeliveryLiveSnapshot({
    orders,
    riders,
    trackingEnabled,
  });

  return (
    <div className="space-y-8 pb-20 md:space-y-10">
      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-4 xl:grid-cols-3">
          <StageCard
            title="Preparing"
            count={preparingOrders.length}
            orders={preparingOrders}
            riders={riders}
          />
          <StageCard
            title="Ready to Send"
            count={readyOrders.length}
            orders={readyOrders}
            riders={riders}
          />
          <StageCard
            title="Out for Delivery"
            count={liveOrders.length}
            orders={liveOrders}
            riders={riders}
          />
        </div>

        <div className="grid gap-4">
          <AdminDeliveryLiveSurface
            initialSnapshot={liveSnapshot}
            fallbackUrl="/api/admin/delivery/live"
            streamUrl="/api/admin/delivery/live/stream"
          />

          <RiderRoster riders={riders} />
        </div>
      </section>
    </div>
  );
}
