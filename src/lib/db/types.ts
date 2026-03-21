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
  imageStorageKey: string | null;
  imageUrl: string | null;
  modelStorageKey: string | null;
  modelUrl: string | null;
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
  productTagline: string | null;
  shortDescription: string;
  categoryId: string | null;
  categoryName: string | null;
  status: "draft" | "active" | "archived";
  merchandisingState: "featured" | "standard" | "hidden";
  isAvailable: boolean;
  variantId: string;
  variantSlug: string;
  variantName: string;
  sku: string;
  variantStatus: "draft" | "active" | "archived";
  priceNgn: number;
  compareAtPriceNgn: number | null;
  ingredientCount: number;
  mediaCount: number;
  inventoryOnHand: number | null;
  inventoryReserved: number | null;
  reorderThreshold: number | null;
  sortOrder: number;
  imageStorageKey: string | null;
  imageUrl: string | null;
  modelStorageKey: string | null;
  modelUrl: string | null;
};

export type AdminCatalogCategory = {
  categoryId: string;
  categorySlug: string;
  categoryName: string;
};

export type AdminCatalogProductDetail = {
  productId: string;
  productSlug: string;
  productName: string;
  productMarketingName: string | null;
  productTagline: string | null;
  shortDescription: string;
  longDescription: string | null;
  categoryId: string | null;
  categoryName: string | null;
  status: "draft" | "active" | "archived";
  merchandisingState: "featured" | "standard" | "hidden";
  isAvailable: boolean;
  sortOrder: number;
  variantId: string;
  variantSlug: string;
  variantName: string;
  sku: string;
  sizeLabel: string | null;
  unitLabel: string | null;
  priceNgn: number;
  compareAtPriceNgn: number | null;
  variantStatus: "draft" | "active" | "archived";
  ingredientCount: number;
  mediaCount: number;
  inventoryOnHand: number | null;
  inventoryReserved: number | null;
  reorderThreshold: number | null;
};

export type AdminCatalogProductMedia = {
  mediaId: string;
  productId: string | null;
  variantId: string | null;
  targetType: "product" | "variant";
  targetLabel: string;
  mediaType: "image" | "model_3d" | "video";
  storageKey: string;
  publicUrl: string;
  altText: string | null;
  sortOrder: number;
  isPrimary: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
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
  body: string | null;
  settings: Record<string, unknown>;
  presentationCount: number;
  bindingCount: number;
};

export type AdminLayoutVersion = {
  versionId: string;
  pageId: string;
  label: string;
  status: "draft" | "published" | "archived";
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminLayoutDraftDetail = {
  version: AdminLayoutVersion;
  sections: AdminLayoutSection[];
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

export type AdminDeliveryOrder = {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  status: string;
  fulfillmentStatus: string;
  deliveryStage: "preparing" | "ready_for_dispatch" | "out_for_delivery";
  totalNgn: number;
  placedAt: string;
  transferReference: string;
  itemCount: number;
  deliveryAddressSnapshot: Record<string, unknown>;
  assignmentId: string | null;
  assignmentStatus: string | null;
  riderId: string | null;
  riderName: string | null;
  riderPhone: string | null;
  riderVehicleType: string | null;
  latestDeliveryEventType: string | null;
  latestDeliveryEventAt: string | null;
  latestTrackingLatitude: number | null;
  latestTrackingLongitude: number | null;
  latestTrackingHeading: number | null;
  latestTrackingAccuracyMeters: number | null;
  latestTrackingRecordedAt: string | null;
};

export type AdminDeliveryRider = {
  riderId: string;
  name: string;
  phone: string;
  vehicleType: string | null;
  isActive: boolean;
  activeAssignmentCount: number;
  activeOrderNumber: string | null;
};

export type DeliveryTrackingPoint = {
  pointId: string;
  assignmentId: string;
  latitude: number;
  longitude: number;
  heading: number | null;
  accuracyMeters: number | null;
  recordedAt: string;
};

export type DeliveryTimelineEvent = {
  eventId: string;
  orderId: string;
  assignmentId: string | null;
  eventType: string;
  actorType: string;
  actorEmail: string | null;
  note: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type DeliveryCourierSession = {
  assignmentId: string;
  orderId: string;
  orderNumber: string;
  assignmentStatus: string;
  riderId: string | null;
  riderName: string | null;
  riderPhone: string | null;
  deliveryAddressSnapshot: Record<string, unknown>;
};

export type PortalTrackingSnapshot = {
  orderId: string;
  orderNumber: string;
  status: string;
  fulfillmentStatus: string;
  trackingEnabled: boolean;
  customerName: string;
  customerPhone: string;
  deliveryAddressSnapshot: Record<string, unknown>;
  assignmentId: string | null;
  assignmentStatus: string | null;
  riderName: string | null;
  riderPhone: string | null;
  riderVehicleType: string | null;
  latestPoint: DeliveryTrackingPoint | null;
  events: DeliveryTimelineEvent[];
};

export type SiteSettingRow = {
  key: string;
  value: unknown;
};

export type AdminDeliveryDefaults = {
  trackingEnabled: boolean;
  staleTransferWindowMinutes: number;
};

export type AdminLayoutPreviewSetting = {
  mode: string;
};

export type AdminSettingsSnapshot = {
  bankAccount: BankAccountRow | null;
  deliveryDefaults: AdminDeliveryDefaults;
  layoutPreview: AdminLayoutPreviewSetting;
  siteSettings: SiteSettingRow[];
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

export type PortalProfile = {
  userId: string | null;
  email: string;
  fullName: string;
  firstName: string;
  lastName: string;
  preferredPhoneE164: string;
  marketingOptIn: boolean;
};

export type PortalAddress = {
  addressId: string;
  label: string;
  recipientName: string;
  phoneE164: string;
  line1: string;
  line2: string | null;
  landmark: string | null;
  city: string;
  state: string;
  postalCode: string | null;
  deliveryNotes: string | null;
  latitude: number | null;
  longitude: number | null;
  isDefault: boolean;
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

export type AdminOrderReturnQueueRow = {
  returnCaseId: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  status: "requested" | "approved" | "rejected" | "received" | "refunded";
  reason: string;
  requestedRefundAmountNgn: number;
  approvedRefundAmountNgn: number | null;
  refundBankName: string | null;
  refundAccountName: string | null;
  refundAccountNumber: string | null;
  requestedAt: string;
};

export type OrderReturnCaseRow = {
  returnCaseId: string;
  orderId: string;
  requestedByUserId: string | null;
  requestedByEmail: string | null;
  status: "requested" | "approved" | "rejected" | "received" | "refunded";
  reason: string;
  details: string | null;
  requestedRefundAmountNgn: number;
  approvedRefundAmountNgn: number | null;
  refundBankName: string | null;
  refundAccountName: string | null;
  refundAccountNumber: string | null;
  reviewedByUserId: string | null;
  reviewedByEmail: string | null;
  reviewedAt: string | null;
  rejectedAt: string | null;
  receivedAt: string | null;
  refundedAt: string | null;
  refundReference: string | null;
  resolutionNote: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OrderReturnEventRow = {
  eventId: string;
  returnCaseId: string;
  orderId: string;
  actorType: string;
  actorEmail: string | null;
  action: string;
  note: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type PortalPendingReview = {
  requestId: string;
  orderId: string;
  orderNumber: string;
  completedAt: string;
  customerName: string;
};

export type OrderReviewRequestRow = {
  requestId: string;
  orderId: string;
  status: string;
  createdAt: string;
  completedAt: string | null;
  expiresAt: string | null;
};

export type OrderReviewRow = {
  reviewId: string;
  orderId: string;
  rating: number;
  title: string | null;
  body: string | null;
  status: string;
  isFeatured: boolean;
  createdAt: string;
  moderatedAt: string | null;
};

export type PortalReviewRow = {
  reviewId: string;
  orderId: string;
  orderNumber: string;
  rating: number;
  title: string | null;
  body: string | null;
  status: string;
  isFeatured: boolean;
  createdAt: string;
  moderatedAt: string | null;
};

export type WorkspaceNotification = {
  notificationId: string;
  title: string;
  detail: string;
  href: string;
  createdAt: string;
  tone: "default" | "success" | "warning";
  icon: "order" | "payment" | "delivery" | "return" | "alert";
};

export type AdminReviewRow = {
  reviewId: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string | null;
  rating: number;
  title: string | null;
  body: string | null;
  status: string;
  isFeatured: boolean;
  createdAt: string;
  moderatedAt: string | null;
  moderatedByEmail: string | null;
};
