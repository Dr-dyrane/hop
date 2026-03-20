"use client";

import React, {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useMarketingContent } from "@/components/providers/MarketingContentProvider";
import {
  addRemoteCartItem,
  clearRemoteCart,
  fetchCartSnapshot,
  removeRemoteCartItem,
  replaceRemoteCartItems,
  setRemoteCartItemQuantity,
  submitCheckoutOrder,
} from "@/lib/cart/api-client";
import {
  SHOT_BUNDLE,
  getProductDisplayName,
  getProductPriceSnapshot,
  getShotBundlePricing,
  isShotProduct,
} from "@/lib/commerce";
import type { ProductId } from "@/lib/marketing/types";

const CART_STORAGE_KEY = "hop-cart-v1";

type CartItem = {
  productId: ProductId;
  quantity: number;
};

type CheckoutField =
  | "fullName"
  | "email"
  | "phoneNumber"
  | "deliveryLocation"
  | "notes";

type CheckoutFormState = {
  fullName: string;
  email: string;
  phoneNumber: string;
  deliveryLocation: string;
  notes: string;
};

type CartLine = {
  productId: ProductId;
  category: string;
  isShot: boolean;
  quantity: number;
  displayName: string;
  originalUnitUsd: number;
  currentUnitUsd: number;
  savingsUnitUsd: number;
  originalUnitNgn: number;
  currentUnitNgn: number;
  savingsUnitNgn: number;
  lineOriginalUsd: number;
  lineCurrentUsd: number;
  lineSavingsUsd: number;
  lineOriginalNgn: number;
  lineCurrentNgn: number;
  lineSavingsNgn: number;
};

type CommerceContextType = {
  cartItems: CartItem[];
  cartLines: CartLine[];
  itemCount: number;
  isCartOpen: boolean;
  isCartReady: boolean;
  isRefreshingCart: boolean;
  isSubmittingCheckout: boolean;
  checkoutError: string | null;
  checkoutForm: CheckoutFormState;
  shotBundleCount: number;
  subtotalUsd: number;
  subtotalNgn: number;
  discountUsd: number;
  discountNgn: number;
  totalUsd: number;
  totalNgn: number;
  addItem: (productId: ProductId, quantity?: number) => void;
  setQuantity: (productId: ProductId, quantity: number) => void;
  removeItem: (productId: ProductId) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  refreshCart: () => Promise<void>;
  updateCheckoutField: (field: CheckoutField, value: string) => void;
  canCheckout: boolean;
  submitCheckout: () => Promise<void>;
};

const CommerceContext = createContext<CommerceContextType | undefined>(undefined);

const emptyCartSnapshot: CartItem[] = [];
const emptyCheckoutForm: CheckoutFormState = {
  fullName: "",
  email: "",
  phoneNumber: "",
  deliveryLocation: "",
  notes: "",
};

function sanitizeCartItems(value: unknown, productIds: Set<string>): CartItem[] {
  if (!Array.isArray(value)) {
    return emptyCartSnapshot;
  }

  const parsedItems = value
    .map((item) => {
      if (
        typeof item !== "object" ||
        item === null ||
        !("productId" in item) ||
        !("quantity" in item)
      ) {
        return null;
      }

      const productId = item.productId;
      const quantity = item.quantity;

      if (
        typeof productId !== "string" ||
        !productIds.has(productId) ||
        typeof quantity !== "number" ||
        !Number.isFinite(quantity)
      ) {
        return null;
      }

      return {
        productId: productId as ProductId,
        quantity: Math.max(1, Math.floor(quantity)),
      };
    })
    .filter((item): item is CartItem => item !== null);

  return parsedItems.length > 0 ? parsedItems : emptyCartSnapshot;
}

function readLegacyCartSnapshot(productIds: Set<string>) {
  if (typeof window === "undefined") {
    return emptyCartSnapshot;
  }

  const rawValue = window.localStorage.getItem(CART_STORAGE_KEY);

  if (!rawValue) {
    return emptyCartSnapshot;
  }

  try {
    return sanitizeCartItems(JSON.parse(rawValue), productIds);
  } catch {
    return emptyCartSnapshot;
  }
}

function clearLegacyCartSnapshot() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(CART_STORAGE_KEY);
}

const RECOVERABLE_CART_MESSAGES = new Set([
  "Cart is empty.",
  "Cart is no longer active.",
  "Cart expired.",
  "Cart is unavailable.",
]);

function formatCommerceError(error: unknown) {
  const message =
    error instanceof Error ? error.message : "Something went wrong.";

  if (message === "Cart expired." || message === "Cart is unavailable.") {
    return "Cart refreshed.";
  }

  return message;
}

function isRecoverableCartMessage(message: string) {
  return RECOVERABLE_CART_MESSAGES.has(message);
}

export function CommerceProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { productIds, productsById } = useMarketingContent();
  const validProductIds = useMemo(() => new Set(productIds), [productIds]);
  const [cartItems, setCartItems] = useState<CartItem[]>(emptyCartSnapshot);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCartReady, setIsCartReady] = useState(false);
  const [isRefreshingCart, setIsRefreshingCart] = useState(false);
  const [isSubmittingCheckout, setIsSubmittingCheckout] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutForm, setCheckoutForm] = useState(emptyCheckoutForm);

  useEffect(() => {
    let active = true;

    async function hydrateCart() {
      const legacyItems = readLegacyCartSnapshot(validProductIds);

      try {
        let snapshot = await fetchCartSnapshot();

        if (snapshot.items.length === 0 && legacyItems.length > 0) {
          snapshot = await replaceRemoteCartItems(legacyItems);
        }

        if (!active) {
          return;
        }

        setCartItems(snapshot.items as CartItem[]);
        setCheckoutError(null);
        clearLegacyCartSnapshot();
      } catch {
        if (!active) {
          return;
        }

        setCartItems(legacyItems);
      } finally {
        if (active) {
          setIsCartReady(true);
        }
      }
    }

    void hydrateCart();

    return () => {
      active = false;
    };
  }, [validProductIds]);

  const applyRemoteSnapshot = useCallback((items: CartItem[]) => {
    setCartItems(items);
    clearLegacyCartSnapshot();
  }, []);

  const refreshCart = useCallback(async () => {
    setIsRefreshingCart(true);

    try {
      const snapshot = await fetchCartSnapshot();
      applyRemoteSnapshot(snapshot.items as CartItem[]);
      setCheckoutError(null);
    } catch (error) {
      setCartItems(emptyCartSnapshot);
      setCheckoutError(formatCommerceError(error));
      throw error;
    } finally {
      setIsCartReady(true);
      setIsRefreshingCart(false);
    }
  }, [applyRemoteSnapshot]);

  const cartLines = useMemo(() => {
    return cartItems.map((item) => {
      const pricing = getProductPriceSnapshot(productsById, item.productId);
      const product = productsById[item.productId];

      return {
        productId: item.productId,
        category: product.categoryId,
        isShot: isShotProduct(productsById, item.productId),
        quantity: item.quantity,
        displayName: getProductDisplayName(productsById, item.productId),
        originalUnitUsd: pricing.originalUsd,
        currentUnitUsd: pricing.currentUsd,
        savingsUnitUsd: pricing.savingsUsd,
        originalUnitNgn: pricing.originalNgn,
        currentUnitNgn: pricing.currentNgn,
        savingsUnitNgn: pricing.savingsNgn,
        lineOriginalUsd: pricing.originalUsd * item.quantity,
        lineCurrentUsd: pricing.currentUsd * item.quantity,
        lineSavingsUsd: pricing.savingsUsd * item.quantity,
        lineOriginalNgn: pricing.originalNgn * item.quantity,
        lineCurrentNgn: pricing.currentNgn * item.quantity,
        lineSavingsNgn: pricing.savingsNgn * item.quantity,
      };
    });
  }, [cartItems, productsById]);

  const itemCount = useMemo(
    () => cartItems.reduce((total, item) => total + item.quantity, 0),
    [cartItems]
  );
  const shotQuantity = useMemo(
    () =>
      cartItems.reduce(
        (total, item) =>
          total + (isShotProduct(productsById, item.productId) ? item.quantity : 0),
        0
      ),
    [cartItems, productsById]
  );
  const shotBundlePricing = useMemo(
    () =>
      getShotBundlePricing(
        shotQuantity,
        productsById.shot_glow?.priceNgn ?? SHOT_BUNDLE.bundlePriceNgn
      ),
    [productsById, shotQuantity]
  );
  const shotBundleCount = shotBundlePricing.bundleCount;

  const subtotalUsd = useMemo(
    () => cartLines.reduce((total, line) => total + line.lineOriginalUsd, 0),
    [cartLines]
  );
  const subtotalNgn = useMemo(
    () => cartLines.reduce((total, line) => total + line.lineOriginalNgn, 0),
    [cartLines]
  );
  const discountUsd = shotBundlePricing.discountUsd;
  const discountNgn = shotBundlePricing.discountNgn;
  const totalUsd = useMemo(
    () => Math.max(0, subtotalUsd - discountUsd),
    [discountUsd, subtotalUsd]
  );
  const totalNgn = useMemo(
    () => Math.max(0, subtotalNgn - discountNgn),
    [discountNgn, subtotalNgn]
  );

  const addItem = useCallback(
    (productId: ProductId, quantity = 1) => {
      const normalizedQuantity = Math.max(1, Math.floor(quantity));
      const existingItem = cartItems.find((item) => item.productId === productId);
      const optimisticItems = existingItem
        ? cartItems.map((item) =>
            item.productId === productId
              ? { ...item, quantity: item.quantity + normalizedQuantity }
              : item
          )
        : [...cartItems, { productId, quantity: normalizedQuantity }];

      setCartItems(optimisticItems);
      setIsCartOpen(true);
      setCheckoutError(null);

      void addRemoteCartItem(productId, normalizedQuantity)
        .then((snapshot) => {
          applyRemoteSnapshot(snapshot.items as CartItem[]);
        })
        .catch((error) => {
          setCartItems(cartItems);
          setCheckoutError(formatCommerceError(error));
        });
    },
    [applyRemoteSnapshot, cartItems]
  );

  const setQuantity = useCallback(
    (productId: ProductId, quantity: number) => {
      const normalizedQuantity = Math.floor(quantity);
      const optimisticItems =
        normalizedQuantity <= 0
          ? cartItems.filter((item) => item.productId !== productId)
          : cartItems.map((item) =>
              item.productId === productId
                ? { ...item, quantity: normalizedQuantity }
                : item
            );

      setCartItems(optimisticItems);
      setCheckoutError(null);

      void setRemoteCartItemQuantity(productId, normalizedQuantity)
        .then((snapshot) => {
          applyRemoteSnapshot(snapshot.items as CartItem[]);
        })
        .catch((error) => {
          setCartItems(cartItems);
          setCheckoutError(formatCommerceError(error));
        });
    },
    [applyRemoteSnapshot, cartItems]
  );

  const removeItem = useCallback(
    (productId: ProductId) => {
      const optimisticItems = cartItems.filter((item) => item.productId !== productId);

      setCartItems(optimisticItems);
      setCheckoutError(null);

      void removeRemoteCartItem(productId)
        .then((snapshot) => {
          applyRemoteSnapshot(snapshot.items as CartItem[]);
        })
        .catch((error) => {
          setCartItems(cartItems);
          setCheckoutError(formatCommerceError(error));
        });
    },
    [applyRemoteSnapshot, cartItems]
  );

  const clearCart = useCallback(() => {
    const previousItems = cartItems;

    setCartItems(emptyCartSnapshot);
    setCheckoutError(null);

    void clearRemoteCart()
      .then((snapshot) => {
        applyRemoteSnapshot(snapshot.items as CartItem[]);
      })
      .catch((error) => {
        setCartItems(previousItems);
        setCheckoutError(formatCommerceError(error));
      });
  }, [applyRemoteSnapshot, cartItems]);

  const openCart = useCallback(() => {
    setIsCartOpen(true);
  }, []);

  const closeCart = useCallback(() => {
    setIsCartOpen(false);
  }, []);

  const toggleCart = useCallback(() => {
    setIsCartOpen((current) => !current);
  }, []);

  const updateCheckoutField = useCallback((field: CheckoutField, value: string) => {
    setCheckoutForm((current) => ({
      ...current,
      [field]: value,
    }));
    setCheckoutError(null);
  }, []);

  const canCheckout =
    cartItems.length > 0 &&
    checkoutForm.fullName.trim().length > 1 &&
    checkoutForm.phoneNumber.trim().length > 6 &&
    checkoutForm.deliveryLocation.trim().length > 2 &&
    !isSubmittingCheckout;

  const submitCheckout = useCallback(async () => {
    if (!canCheckout) {
      return;
    }

    setIsSubmittingCheckout(true);
    setCheckoutError(null);

    try {
      const result = await submitCheckoutOrder({
        customerName: checkoutForm.fullName,
        customerEmail: checkoutForm.email,
        customerPhone: checkoutForm.phoneNumber,
        deliveryLocation: checkoutForm.deliveryLocation,
        notes: checkoutForm.notes,
      });

      setCheckoutForm(emptyCheckoutForm);
      setCartItems(emptyCartSnapshot);
      clearLegacyCartSnapshot();
      setIsCartOpen(false);

      startTransition(() => {
        router.push(result.redirectTo);
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong.";

      if (isRecoverableCartMessage(message)) {
        try {
          await refreshCart();
          setCheckoutError(
            message === "Cart is empty." ? "Cart is empty." : "Cart refreshed."
          );
        } catch {
          setCartItems(emptyCartSnapshot);
        }

        return;
      }

      setCheckoutError(formatCommerceError(error));
    } finally {
      setIsSubmittingCheckout(false);
    }
  }, [canCheckout, checkoutForm, refreshCart, router]);

  const value = useMemo<CommerceContextType>(
    () => ({
      cartItems,
      cartLines,
      itemCount,
      isCartOpen,
      isCartReady,
      isRefreshingCart,
      isSubmittingCheckout,
      checkoutError,
      checkoutForm,
      shotBundleCount,
      subtotalUsd,
      subtotalNgn,
      discountUsd,
      discountNgn,
      totalUsd,
      totalNgn,
      addItem,
      setQuantity,
      removeItem,
      clearCart,
      openCart,
      closeCart,
      toggleCart,
      refreshCart,
      updateCheckoutField,
      canCheckout,
      submitCheckout,
    }),
    [
      addItem,
      canCheckout,
      cartItems,
      cartLines,
      checkoutError,
      checkoutForm,
      clearCart,
      closeCart,
      discountNgn,
      discountUsd,
      isCartOpen,
      isCartReady,
      isRefreshingCart,
      isSubmittingCheckout,
      itemCount,
      openCart,
      refreshCart,
      removeItem,
      setQuantity,
      shotBundleCount,
      subtotalNgn,
      subtotalUsd,
      submitCheckout,
      toggleCart,
      totalNgn,
      totalUsd,
      updateCheckoutField,
    ]
  );

  return (
    <CommerceContext.Provider value={value}>{children}</CommerceContext.Provider>
  );
}

export function useCommerce() {
  const context = useContext(CommerceContext);

  if (!context) {
    throw new Error("useCommerce must be used within CommerceProvider");
  }

  return context;
}
