import { requireAuthenticatedSession } from "@/lib/auth/guards";
import { OrderDetailView } from "@/components/orders/OrderDetailView";
import {
  getLatestOrderReturnCase,
  listOrderReturnCaseItems,
  listOrderReturnEvents,
  listOrderReturnProofs,
} from "@/lib/db/repositories/order-returns-repository";
import {
  getOrderReview,
  getOrderReviewRequest,
} from "@/lib/db/repositories/review-repository";
import {
  getPortalOrderDetail,
  listOrderStatusEvents,
  listPaymentProofs,
} from "@/lib/db/repositories/orders-repository";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const session = await requireAuthenticatedSession(`/account/orders/${orderId}`);
  const order = await getPortalOrderDetail(session.email, orderId);
  const customerActor = {
    email: session.email,
    role: "customer" as const,
  };
  const [timeline, proofs, reviewRequest, review, returnCase, returnEvents, returnProofs] = await Promise.all([
    listOrderStatusEvents(orderId, customerActor),
    listPaymentProofs(order?.paymentId ?? "", customerActor),
    getOrderReviewRequest(orderId, customerActor),
    getOrderReview(orderId, customerActor),
    getLatestOrderReturnCase(orderId, customerActor),
    listOrderReturnEvents(orderId, customerActor),
    listOrderReturnProofs(orderId, customerActor),
  ]);
  const returnItems = returnCase
    ? await listOrderReturnCaseItems(returnCase.returnCaseId, customerActor)
    : [];

  return (
    <OrderDetailView
      order={order}
      timeline={timeline}
      proofs={proofs}
      reviewRequest={reviewRequest}
      review={review}
      returnCase={returnCase}
      returnItems={returnItems}
      returnEvents={returnEvents}
      returnProofs={returnProofs}
      backHref="/account/orders"
      trackingHref={`/account/tracking/${orderId}`}
    />
  );
}
