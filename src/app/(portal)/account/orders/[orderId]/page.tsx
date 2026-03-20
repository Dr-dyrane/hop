import { requireAuthenticatedSession } from "@/lib/auth/guards";
import { OrderDetailView } from "@/components/orders/OrderDetailView";
import {
  getPortalOrderDetail,
  listOrderStatusEvents,
  listPaymentProofs,
} from "@/lib/db/repositories/orders-repository";

export default async function OrderDetailPage({
  params,
}: {
  params: { orderId: string };
}) {
  const session = await requireAuthenticatedSession(`/account/orders/${params.orderId}`);
  const order = await getPortalOrderDetail(session.email, params.orderId);
  const [timeline, proofs] = await Promise.all([
    listOrderStatusEvents(params.orderId),
    listPaymentProofs(order?.paymentId ?? ""),
  ]);

  return (
    <OrderDetailView
      order={order}
      timeline={timeline}
      proofs={proofs}
      backHref="/account/orders"
    />
  );
}
