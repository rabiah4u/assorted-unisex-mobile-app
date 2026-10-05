import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { supabase } from "@/lib/supabase";
import type { CartItem, Product } from "@/lib/types";

export type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  loading: boolean;
  error: string | null;
  refreshCart: () => Promise<void>;
  addToCart: (product: Product, size: string, quantity: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

function toNumber(value: number | string | null | undefined): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function normalizeCartItem(raw: Record<string, unknown>): CartItem {
  const productValue = raw.product as Record<string, unknown> | undefined;
  const rawPrice = productValue?.price;
  const product: Product | null = productValue
    ? {
        id: String(productValue.id ?? raw.product_id ?? ""),
        name: String(productValue.name ?? "Product"),
        description: typeof productValue.description === "string" ? productValue.description : null,
        price: typeof rawPrice === "number" || typeof rawPrice === "string" ? rawPrice : 0,
        category: typeof productValue.category === "string" ? productValue.category : null,
        image_url: typeof productValue.image_url === "string" ? productValue.image_url : null,
        sizes: productValue.sizes as string[] | string | null,
        stock: typeof productValue.stock === "number" ? productValue.stock : null,
      }
    : null;

  return {
    id: String(raw.id ?? ""),
    cart_id: typeof raw.cart_id === "string" ? raw.cart_id : null,
    product_id: typeof raw.product_id === "string" ? raw.product_id : null,
    product,
    quantity: typeof raw.quantity === "number" ? raw.quantity : Number(raw.quantity ?? 0),
    size: typeof raw.size === "string" ? raw.size : null,
    user_id: typeof raw.user_id === "string" ? raw.user_id : null,
    created_at: typeof raw.created_at === "string" ? raw.created_at : undefined,
  };
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshCart = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setItems([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let { data, error: selectError } = await supabase
        .from("cart_items")
        .select("*, product:products(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (selectError || !data) {
        const cartQuery = await supabase.from("carts").select("id").eq("user_id", user.id).maybeSingle();
        const cartId = cartQuery.data?.id;

        if (cartId) {
          const cartItemsQuery = await supabase
            .from("cart_items")
            .select("*, product:products(*)")
            .eq("cart_id", cartId)
            .order("created_at", { ascending: false });

          data = cartItemsQuery.data ?? [];
          selectError = cartItemsQuery.error;
        }
      }

      if (selectError) {
        throw selectError;
      }

      const normalized = (data ?? []).map((item) => normalizeCartItem((item ?? {}) as Record<string, unknown>));
      setItems(normalized);
    } catch (loadError) {
      console.error(loadError);
      setError("Could not load your cart right now.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const addToCart = useCallback(async (product: Product, size: string, quantity: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("You need to sign in before adding items to the cart.");
      return;
    }

    try {
      const { error } = await supabase.rpc("add_cart_item", {
        p_product_id: product.id,
        p_size: size,
        p_quantity: quantity,
      });

      if (error) {
        throw error;
      }

      await refreshCart();
    } catch (addError) {
      console.error(addError);
      setError("Unable to add this item to your cart.");
    }
  }, [refreshCart]);

  const removeItem = useCallback(async (itemId: string) => {
    try {
      const { error } = await supabase.from("cart_items").delete().eq("id", itemId);
      if (error) {
        throw error;
      }
      await refreshCart();
    } catch (removeError) {
      console.error(removeError);
      setError("Unable to remove this item from your cart.");
    }
  }, [refreshCart]);

  const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeItem(itemId);
      return;
    }

    try {
      const { error } = await supabase.rpc("set_cart_item_quantity", {
        p_cart_item_id: itemId,
        p_quantity: quantity,
      });

      if (error) {
        throw error;
      }

      await refreshCart();
    } catch (updateError) {
      console.error(updateError);
      setError("Unable to update the cart item quantity.");
    }
  }, [refreshCart, removeItem]);

  useEffect(() => {
    const initialRefresh = setTimeout(() => {
      void refreshCart();
    }, 0);

    const authSubscription = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "TOKEN_REFRESHED") {
        void refreshCart();
      }
    });

    const channel = supabase.channel("cart-items-sync");
    channel
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cart_items" },
        () => {
          void refreshCart();
        },
      )
      .subscribe();

    return () => {
      clearTimeout(initialRefresh);
      authSubscription.data.subscription.unsubscribe();
      void supabase.removeChannel(channel);
    };
  }, [refreshCart]);

  const count = useMemo(
    () => items.reduce((sum, item) => sum + Math.max(0, item.quantity ?? 0), 0),
    [items],
  );

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + toNumber(item.product?.price) * (item.quantity ?? 0), 0),
    [items],
  );

  const value = useMemo<CartContextValue>(
    () => ({ items, count, subtotal, loading, error, refreshCart, addToCart, updateQuantity, removeItem }),
    [items, count, subtotal, loading, error, refreshCart, addToCart, updateQuantity, removeItem],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }
  return context;
}
