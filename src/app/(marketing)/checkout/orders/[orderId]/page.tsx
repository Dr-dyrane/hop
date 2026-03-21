import Link from "next/link";
import { OrderDetailView } from "@/components/orders/OrderDetailView";
import {
  getLatestOrderReturnCase,
  listOrderReturnEvents,
} from "@/lib/db/repositories/order-returns-repository";
import {
  getOrderReview,
  getOrderReviewRequest,
} from "@/lib/db/repositories/review-repository";
import { verifyGuestOrderAccessToken } from "@/lib/orders/access";
import {
  getGuestOrderDetail,
  listOrderStatusEvents,
  listPaymentProofs,
} from "@/lib/db/repositories/orders-repository";

export default async function GuestCheckoutOrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ access?: string }>;
}) {
  const [{ orderId }, { access: accessToken }] = await Promise.all([
    params,
    searchParams,
  ]);

  if (!verifyGuestOrderAccessToken(accessToken, orderId)) {
    return (
      <main className="mx-auto min-h-[100svh] w-full max-w-[840px] px-4 pb-16 pt-24 sm:px-6">
        <div className="glass-morphism rounded-[32px] bg-system-background/80 p-6 text-sm text-secondary-label shadow-soft">
          Link expired.
          <div className="mt-4">
            <Link
              href="/"
              className="text-xs font-semibold uppercase tracking-headline text-secondary-label underline-offset-4 hover:text-label"
            >
              Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const order = await getGuestOrderDetail(orderId);
  const guestActor = {
    role: "customer" as const,
    guestOrderId: orderId,
  };
  const [timeline, proofs, reviewRequest, review, returnCase, returnEvents] = await Promise.all([
    listOrderStatusEvents(orderId, guestActor),
    listPaymentProofs(order?.paymentId ?? "", guestActor),
    getOrderReviewRequest(orderId, guestActor),
    getOrderReview(orderId, guestActor),
    getLatestOrderReturnCase(orderId, guestActor),
    listOrderReturnEvents(orderId, guestActor),
  ]);

  return (
    <main className="mx-auto min-h-[100svh] w-full max-w-[840px] px-4 pb-16 pt-24 sm:px-6">
      <div className="glass-morphism mb-6 flex items-center justify-between gap-4 rounded-[28px] bg-system-background/80 px-4 py-3 shadow-soft">
        <Link
          href="/"
          className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label transition-colors duration-300 hover:text-label"
        >
          Home
        </Link>
        <div className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
          Order
        </div>
        <Link
          href="/auth/sign-in?returnTo=/account/orders"
          className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label transition-colors duration-300 hover:text-label"
        >
          Sign in
        </Link>
      </div>

      <OrderDetailView
        order={order}
        timeline={timeline}
        proofs={proofs}
        reviewRequest={reviewRequest}
        review={review}
        returnCase={returnCase}
        returnEvents={returnEvents}
        backHref="/"
        accessToken={accessToken}
      />
    </main>
  );
}
