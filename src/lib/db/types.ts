export type PublishedCatalogProduct = {
  productId: string;
  productSlug: string;
  productName: string;
  productMarketingName: string | null;
  productTagline: string | null;
  shortDescription: string;
  merchandisingState: string;
  isAvailable: boolean;
  variantId: string;
  variantSlug: string;
  variantName: string;
  sku: string;
  priceNgn: number;
  compareAtPriceNgn: number | null;
  mediaStorageKey: string | null;
  mediaType: string | null;
};

export type AdminOverviewMetrics = {
  activeProducts: number;
  availableProducts: number;
  featuredProducts: number;
  enabledHomeSections: number;
  homeBindingCount: number;
  homeVersionLabel: string | null;
};

export type AdminCatalogProduct = {
  productId: string;
  productSlug: string;
  productName: string;
  productMarketingName: string | null;
  categoryName: string | null;
  merchandisingState: "featured" | "standard" | "hidden";
  isAvailable: boolean;
  variantName: string;
  priceNgn: number;
  ingredientCount: number;
};

export type AdminLayoutSummary = {
  versionId: string | null;
  versionLabel: string | null;
  sectionCount: number;
  enabledSectionCount: number;
  bindingCount: number;
};

export type AdminLayoutSection = {
  sectionId: string;
  sectionKey: string;
  sectionType: string;
  sortOrder: number;
  isEnabled: boolean;
  eyebrow: string | null;
  heading: string | null;
  presentationCount: number;
  bindingCount: number;
};

export type AdminCustomerSummary = {
  customerKey: string;
  userId: string | null;
  email: string | null;
  fullName: string | null;
  phone: string | null;
  totalOrders: number;
  activeOrders: number;
  addressCount: number;
  latestOrderNumber: string | null;
  latestOrderStatus: string | null;
  latestOrderAt: string | null;
};

export type SiteSettingRow = {
  key: string;
  value: unknown;
};

export type PublishedPageSection = {
  pageKey: string;
  versionId: string;
  versionLabel: string;
  sectionId: string;
  sectionKey: string;
  sectionType: string;
  sortOrder: number;
  isEnabled: boolean;
  eyebrow: string | null;
  heading: string | null;
  body: string | null;
  settings: Record<string, unknown>;
};

export type PageSectionPresentation = {
  sectionId: string;
  breakpoint: "mobile" | "tablet" | "desktop";
  presentation: Record<string, unknown>;
};

export type PageSectionBinding = {
  sectionId: string;
  entityType: string;
  entityId: string | null;
  bindingKey: string | null;
  sortOrder: number;
  metadata: Record<string, unknown>;
};

export type PortalAccountSummary = {
  userId: string | null;
  email: string;
  fullName: string | null;
  totalOrders: number;
  activeOrders: number;
  addressCount: number;
  reviewCount: number;
  latestOrderNumber: string | null;
  latestOrderStatus: string | null;
};

export type OrderListRow = {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  totalNgn: number;
  placedAt: string;
  transferDeadlineAt: string | null;
  itemCount: number;
};

export type AdminPaymentQueueRow = {
  paymentId: string;
  orderId: string;
  orderNumber: string;
  status: string;
  expectedAmountNgn: number;
  submittedAmountNgn: number | null;
  bankName: string | null;
  accountName: string | null;
  accountNumber: string | null;
  payerName: string | null;
  submittedAt: string | null;
  expiresAt: string | null;
};

export type PortalOrderListRow = {
  orderId: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  totalNgn: number;
  placedAt: string;
  active: boolean;
  itemCount: number;
};

export type PortalOrderLine = {
  title: string;
  sku: string;
  unitPriceNgn: number;
  quantity: number;
  lineTotalNgn: number;
};

export type PortalOrderDetail = {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  subtotalNgn: number;
  discountNgn: number;
  deliveryFeeNgn: number;
  totalNgn: number;
  notes: string | null;
  transferReference: string;
  transferDeadlineAt: string | null;
  placedAt: string;
  confirmedAt: string | null;
  cancelledAt: string | null;
  deliveredAt: string | null;
  deliveryAddressSnapshot: Record<string, unknown>;
  paymentId: string | null;
  payment: {
    status: string;
    expectedAmountNgn: number;
    submittedAmountNgn: number | null;
    reviewedByEmail: string | null;
    expiresAt: string | null;
    bankName: string | null;
    accountName: string | null;
    accountNumber: string | null;
    instructions: string | null;
  } | null;
  items: PortalOrderLine[];
};

export type CartSnapshotItem = {
  productId: string;
  quantity: number;
};

export type CartSnapshot = {
  cartId: string;
  itemCount: number;
  items: CartSnapshotItem[];
};

export type BankAccountRow = {
  bankAccountId: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  instructions: string | null;
  isDefault: boolean;
};

export type OrderStatusEventRow = {
  eventId: string;
  orderId: string;
  fromStatus: string | null;
  toStatus: string;
  actorType: string;
  actorEmail: string | null;
  note: string | null;
  createdAt: string;
};

export type PaymentReviewEventRow = {
  eventId: string;
  paymentId: string;
  actorEmail: string | null;
  action: string;
  note: string | null;
  createdAt: string;
};

export type PaymentProofRow = {
  proofId: string;
  paymentId: string;
  storageKey: string;
  publicUrl: string | null;
  mimeType: string;
  submittedByEmail: string | null;
  createdAt: string;
};
