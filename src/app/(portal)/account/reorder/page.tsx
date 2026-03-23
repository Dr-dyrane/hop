import { requireAuthenticatedSession } from "@/lib/auth/guards";
import { listOrdersForPortal } from "@/lib/db/repositories/orders-repository";
import { ReorderBoard } from "@/components/account/ReorderBoard";
import styles from "./reorder-page.module.css";

function getBannerState(input: {
  totalOrders: number;
  readyOrders: number;
  activeOrders: number;
}) {
  const { totalOrders, readyOrders, activeOrders } = input;

  if (totalOrders === 0) {
    return {
      title: "No orders yet",
      detail: "Place your first order to unlock reorder.",
    };
  }

  if (readyOrders === 0) {
    return {
      title: "No orders ready",
      detail: "Reorder becomes available after completion.",
    };
  }

  if (activeOrders > 0) {
    return {
      title: `${readyOrders} ready to reorder`,
      detail: `${activeOrders} active in progress.`,
    };
  }

  return {
    title: `${readyOrders} ready to reorder`,
    detail: "Open any order and reorder in one tap.",
  };
}

export default async function ReorderPage() {
  const session = await requireAuthenticatedSession("/account/reorder");
  const orders = await listOrdersForPortal(session.email);
  const activeOrders = orders.filter((order) => order.active).length;
  const readyOrders = orders.length - activeOrders;
  const banner = getBannerState({
    totalOrders: orders.length,
    readyOrders,
    activeOrders,
  });

  return (
    <div className={styles.page}>
      <section className={styles.banner}>
        <p className={styles.bannerEyebrow}>Reorder</p>
        <h1 className={styles.bannerTitle}>{banner.title}</h1>
        <p className={styles.bannerDetail}>{banner.detail}</p>
      </section>

      <ReorderBoard orders={orders} />
    </div>
  );
}
