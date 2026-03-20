import Link from "next/link";
import { OrderDetailView } from "@/components/orders/OrderDetailView";
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
  params: { orderId: string };
  searchParams: { access?: string };
}) {
  const accessToken = searchParams.access;

  if (!verifyGuestOrderAccessToken(accessToken, params.orderId)) {
    return (
      <main className="mx-auto min-h-[100svh] w-full max-w-[840px] px-4 pb-16 pt-24 sm:px-6">
        <div className="glass-morphism rounded-[32px] bg-system-background/80 p-6 text-sm text-secondary-label shadow-soft">
          Link expired.
          <div className="mt-4">
            <Link
              href="/"
              className="text-xs font-semibold uppercase tracking-headline text-secondary-label underline-offset-4 hover:text-label"
            >
              Back to site
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const order = await getGuestOrderDetail(params.orderId);
  const [timeline, proofs] = await Promise.all([
    listOrderStatusEvents(params.orderId),
    listPaymentProofs(order?.paymentId ?? ""),
  ]);

  return (
    <main className="mx-auto min-h-[100svh] w-full max-w-[840px] px-4 pb-16 pt-24 sm:px-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="text-xs font-semibold uppercase tracking-headline text-secondary-label underline-offset-4 hover:text-label"
        >
          Back to site
        </Link>
        <Link
          href="/auth/sign-in?returnTo=/account/orders"
          className="text-xs font-semibold uppercase tracking-headline text-secondary-label underline-offset-4 hover:text-label"
        >
          Sign in
        </Link>
      </div>

      <OrderDetailView
        order={order}
        timeline={timeline}
        proofs={proofs}
        backHref="/"
        accessToken={accessToken}
      />
    </main>
  );
}
