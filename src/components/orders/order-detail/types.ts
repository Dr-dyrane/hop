import type {
  OrderReturnCaseRow,
  OrderReturnCaseItemRow,
  OrderReturnEventRow,
  OrderReturnProofRow,
  OrderReviewRequestRow,
  OrderReviewRow,
  OrderStatusEventRow,
  PaymentProofRow,
  PortalOrderDetail,
} from "@/lib/db/types";

export type ActivePanel = "payment" | "return" | "review" | "details" | null;

export type OrderDetailViewProps = {
  order: PortalOrderDetail | null;
  timeline: OrderStatusEventRow[];
  proofs: PaymentProofRow[];
  reviewRequest: OrderReviewRequestRow | null;
  review: OrderReviewRow | null;
  returnCase: OrderReturnCaseRow | null;
  returnItems: OrderReturnCaseItemRow[];
  returnEvents: OrderReturnEventRow[];
  returnProofs: OrderReturnProofRow[];
  backHref: string;
  accessToken?: string;
  trackingHref?: string | null;
  viewerRole?: "customer" | "admin";
};
