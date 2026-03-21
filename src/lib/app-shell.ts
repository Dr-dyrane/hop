export type ShellNavIcon =
  | "store"
  | "cart"
  | "orders"
  | "addresses"
  | "reviews"
  | "profile"
  | "overview"
  | "payments"
  | "delivery"
  | "catalog"
  | "layout"
  | "customers"
  | "settings";

export type ShellFabIcon = ShellNavIcon | "add" | "save";

export type ShellFabAction = {
  label: string;
  icon: ShellFabIcon;
  kind: "cart" | "link" | "submit" | "event";
  href?: string;
  formId?: string;
  eventName?: string;
};

export type ShellNavItem = {
  href: string;
  label: string;
  shortLabel: string;
  description: string;
  icon: ShellNavIcon;
  match?: "exact" | "prefix";
};

export type ShellBreadcrumb = {
  href: string;
  label: string;
};

export type ShellHeaderRoute = {
  pattern: string;
  title: string;
  breadcrumbs?: ShellBreadcrumb[];
  mobileFab?: ShellFabAction;
};

export type ShellHeaderContext = {
  title: string;
  breadcrumbs: ShellBreadcrumb[];
  activeItem: ShellNavItem | null;
};

function normalizePathname(pathname: string) {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname;
}

function splitPathname(pathname: string) {
  return normalizePathname(pathname)
    .split("/")
    .filter(Boolean);
}

function isDynamicSegment(segment: string) {
  return segment.startsWith("[") && segment.endsWith("]");
}

function formatSegmentLabel(segment: string) {
  if (!segment || /^[0-9a-f]{8,}$/i.test(segment.replace(/-/g, ""))) {
    return "Detail";
  }

  return segment
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function isActiveShellPath(currentPath: string, item: ShellNavItem) {
  const pathname = normalizePathname(currentPath);
  const href = normalizePathname(item.href);

  if (href === pathname) {
    return true;
  }

  if (item.match === "exact") {
    return false;
  }

  return pathname.startsWith(`${href}/`);
}

function matchShellRoutePattern(pathname: string, pattern: string) {
  const currentSegments = splitPathname(pathname);
  const patternSegments = splitPathname(pattern);

  if (currentSegments.length !== patternSegments.length) {
    return false;
  }

  return patternSegments.every((segment, index) => {
    return isDynamicSegment(segment) || segment === currentSegments[index];
  });
}

export function getShellMatchedRoute(pathname: string, routes: ShellHeaderRoute[]) {
  const normalizedPathname = normalizePathname(pathname);

  return (
    routes.find((route) => matchShellRoutePattern(normalizedPathname, route.pattern)) ?? null
  );
}

export function getActiveShellNavItem(pathname: string, items: ShellNavItem[]) {
  const matches = items.filter((item) => isActiveShellPath(pathname, item));

  if (matches.length === 0) {
    return null;
  }

  return matches.sort((left, right) => right.href.length - left.href.length)[0] ?? null;
}

export function getShellHeaderContext({
  pathname,
  navItems,
  routes,
  fallbackTitle,
}: {
  pathname: string;
  navItems: ShellNavItem[];
  routes: ShellHeaderRoute[];
  fallbackTitle: string;
}): ShellHeaderContext {
  const normalizedPathname = normalizePathname(pathname);
  const activeItem = getActiveShellNavItem(normalizedPathname, navItems);
  const matchedRoute =
    getShellMatchedRoute(normalizedPathname, routes);
  const lastSegment = splitPathname(normalizedPathname).at(-1) ?? null;
  const breadcrumbs =
    matchedRoute?.breadcrumbs ??
    (activeItem && normalizePathname(activeItem.href) !== normalizedPathname
      ? [{ href: activeItem.href, label: activeItem.label }]
      : []);
  const title =
    matchedRoute?.title ??
    activeItem?.label ??
    (lastSegment ? formatSegmentLabel(lastSegment) : fallbackTitle);

  return {
    title,
    breadcrumbs,
    activeItem,
  };
}

export const PORTAL_NAV_ITEMS: ShellNavItem[] = [
  {
    href: "/account",
    label: "Store",
    shortLabel: "Store",
    description: "In-portal shopping and order overview.",
    icon: "store",
    match: "exact",
  },
  {
    href: "/account/orders",
    label: "Orders",
    shortLabel: "Orders",
    description: "Order history, payment status, and tracking.",
    icon: "orders",
  },
  {
    href: "/account/addresses",
    label: "Addresses",
    shortLabel: "Places",
    description: "Saved delivery addresses and preferences.",
    icon: "addresses",
  },
  {
    href: "/account/reviews",
    label: "Reviews",
    shortLabel: "Reviews",
    description: "Pending ratings and submitted feedback.",
    icon: "reviews",
  },
  {
    href: "/account/profile",
    label: "Profile",
    shortLabel: "Account",
    description: "Identity, phone number, and preferences.",
    icon: "profile",
  },
];

export const PORTAL_HEADER_ROUTES: ShellHeaderRoute[] = [
  {
    pattern: "/account",
    title: "Store",
    mobileFab: {
      label: "Open cart",
      icon: "cart",
      kind: "cart",
    },
  },
  {
    pattern: "/account/orders",
    title: "Orders",
    mobileFab: {
      label: "Open cart",
      icon: "cart",
      kind: "cart",
    },
  },
  {
    pattern: "/account/orders/[orderId]",
    title: "Order Detail",
    breadcrumbs: [{ href: "/account/orders", label: "Orders" }],
  },
  {
    pattern: "/account/tracking/[orderId]",
    title: "Tracking",
    breadcrumbs: [{ href: "/account/orders", label: "Orders" }],
  },
  {
    pattern: "/account/addresses",
    title: "Addresses",
    mobileFab: {
      label: "Save address",
      icon: "add",
      kind: "submit",
      formId: "account-address-form",
    },
  },
  {
    pattern: "/account/reviews",
    title: "Reviews",
  },
  {
    pattern: "/account/profile",
    title: "Profile",
    mobileFab: {
      label: "Save profile",
      icon: "save",
      kind: "submit",
      formId: "account-profile-form",
    },
  },
  {
    pattern: "/account/reorder",
    title: "Reorder",
  },
];

export const ADMIN_NAV_ITEMS: ShellNavItem[] = [
  {
    href: "/admin",
    label: "Overview",
    shortLabel: "Home",
    description: "Queues, delivery pressure, and low-stock signals.",
    icon: "overview",
    match: "exact",
  },
  {
    href: "/admin/orders",
    label: "Orders",
    shortLabel: "Orders",
    description: "Operational order board and detailed workflow control.",
    icon: "orders",
  },
  {
    href: "/admin/payments",
    label: "Payments",
    shortLabel: "Payments",
    description: "Manual transfer review and proof verification.",
    icon: "payments",
  },
  {
    href: "/admin/delivery",
    label: "Delivery",
    shortLabel: "Delivery",
    description: "Dispatch, assignment, and live tracking supervision.",
    icon: "delivery",
  },
  {
    href: "/admin/catalog/products",
    label: "Catalog",
    shortLabel: "Catalog",
    description: "Products, variants, merchandising, and stock controls.",
    icon: "catalog",
  },
  {
    href: "/admin/layout",
    label: "Layout",
    shortLabel: "Layout",
    description: "Published sections, drafts, and breakpoint previews.",
    icon: "layout",
  },
  {
    href: "/admin/customers",
    label: "Customers",
    shortLabel: "People",
    description: "Customer lookup, history, and support context.",
    icon: "customers",
  },
  {
    href: "/admin/reviews",
    label: "Reviews",
    shortLabel: "Reviews",
    description: "Moderation and featured trust signals.",
    icon: "reviews",
  },
  {
    href: "/admin/settings",
    label: "Settings",
    shortLabel: "Settings",
    description: "Bank accounts, notifications, delivery, and admin controls.",
    icon: "settings",
  },
];

export const ADMIN_HEADER_ROUTES: ShellHeaderRoute[] = [
  {
    pattern: "/admin",
    title: "Overview",
  },
  {
    pattern: "/admin/orders",
    title: "Orders",
  },
  {
    pattern: "/admin/orders/[orderId]",
    title: "Order Detail",
    breadcrumbs: [{ href: "/admin/orders", label: "Orders" }],
    mobileFab: {
      label: "Primary action",
      icon: "save",
      kind: "submit",
      formId: "admin-order-primary-form",
    },
  },
  {
    pattern: "/admin/payments",
    title: "Payments",
  },
  {
    pattern: "/admin/delivery",
    title: "Delivery",
    mobileFab: {
      label: "Save rider",
      icon: "add",
      kind: "submit",
      formId: "admin-delivery-rider-form",
    },
  },
  {
    pattern: "/admin/catalog/products",
    title: "Catalog",
    mobileFab: {
      label: "New product",
      icon: "add",
      kind: "link",
      href: "/admin/catalog/products/new",
    },
  },
  {
    pattern: "/admin/catalog/products/new",
    title: "New Product",
    breadcrumbs: [{ href: "/admin/catalog/products", label: "Products" }],
    mobileFab: {
      label: "Create product",
      icon: "add",
      kind: "submit",
      formId: "admin-product-create-form",
    },
  },
  {
    pattern: "/admin/catalog/products/[productId]",
    title: "Edit Product",
    breadcrumbs: [{ href: "/admin/catalog/products", label: "Products" }],
    mobileFab: {
      label: "Save product",
      icon: "save",
      kind: "submit",
      formId: "admin-product-edit-form",
    },
  },
  {
    pattern: "/admin/layout",
    title: "Layout",
  },
  {
    pattern: "/admin/layout/sections/[sectionId]",
    title: "Edit Section",
    breadcrumbs: [{ href: "/admin/layout", label: "Layout" }],
    mobileFab: {
      label: "Save section",
      icon: "save",
      kind: "submit",
      formId: "admin-layout-section-form",
    },
  },
  {
    pattern: "/admin/customers",
    title: "Customers",
  },
  {
    pattern: "/admin/reviews",
    title: "Reviews",
  },
  {
    pattern: "/admin/settings",
    title: "Settings",
  },
];
