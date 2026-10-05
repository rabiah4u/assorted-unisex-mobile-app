import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/currency";
import { supabase } from "@/lib/supabase";
import type { Product } from "@/lib/types";

export default function ProductDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>("S");
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { addToCart } = useCart();

  useEffect(() => {
    if (!params.id) {
      return;
    }

    let active = true;

    const loadProduct = async () => {
      try {
        setLoading(true);
        const { data, error: loadError } = await supabase
          .from("products")
          .select("*")
          .eq("id", params.id)
          .maybeSingle();

        if (loadError) {
          throw loadError;
        }

        if (!active) {
          return;
        }

        if (!data) {
          setError("Product not found.");
          return;
        }

        const normalized = data as Product;
        const sizes = normalizeSizes(normalized.sizes);
        setProduct(normalized);
        setSelectedSize(sizes[0] ?? "One size");
        setError(null);
      } catch (loadErr) {
        console.error(loadErr);
        if (active) {
          setError("This product could not be loaded.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadProduct();

    return () => {
      active = false;
    };
  }, [params.id]);

  const sizes = useMemo(() => normalizeSizes(product?.sizes), [product]);

  const handleAddToCart = async () => {
    if (!product) {
      return;
    }

    setAdding(true);
    try {
      await addToCart(product, selectedSize, quantity);
      router.back();
    } catch (addErr) {
      console.error(addErr);
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!params.id || !product || error) {
    return (
      <View style={styles.loadingScreen}>
        <Text style={styles.errorText}>{error ?? "Product not found."}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.imageBox}>
        {product.image_url && !imageError ? (
          <Image
            source={{ uri: product.image_url }}
            style={styles.productImage}
            contentFit="cover"
            transition={200}
            onError={() => setImageError(true)}
          />
        ) : (
          <Text style={styles.imageText}>{product.name}</Text>
        )}
      </View>

      <View style={styles.details}>
        <Text style={styles.category}>{product.category ?? "Category"}</Text>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.price}>{formatPrice(product.price)}</Text>

        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{product.description ?? "No product description available."}</Text>

        <Text style={styles.sectionTitle}>Select size</Text>
        <View style={styles.sizeRow}>
          {sizes.length > 0 ? (
            sizes.map((size) => (
              <Pressable
                key={size}
                onPress={() => setSelectedSize(size)}
                style={[styles.sizeButton, selectedSize === size && styles.sizeButtonActive]}
              >
                <Text style={[styles.sizeText, selectedSize === size && styles.sizeTextActive]}>{size}</Text>
              </Pressable>
            ))
          ) : (
            <Text style={styles.sizeText}>One size</Text>
          )}
        </View>

        <Text style={styles.sectionTitle}>Quantity</Text>
        <View style={styles.quantityRow}>
          <Pressable style={styles.qtyButton} onPress={() => setQuantity((value) => Math.max(1, value - 1))}>
            <Text style={styles.qtyButtonText}>−</Text>
          </Pressable>
          <Text style={styles.quantity}>{quantity}</Text>
          <Pressable style={styles.qtyButton} onPress={() => setQuantity((value) => value + 1)}>
            <Text style={styles.qtyButtonText}>+</Text>
          </Pressable>
        </View>

        <Pressable style={styles.primaryButton} onPress={() => void handleAddToCart()} disabled={adding}>
          {adding ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.primaryButtonText}>Add to cart</Text>}
        </Pressable>
      </View>
    </ScrollView>
  );
}

function normalizeSizes(sizes: string[] | string | null | undefined) {
  if (!sizes) return [];
  if (Array.isArray(sizes)) return sizes.map(String);
  if (typeof sizes === "string") {
    return sizes
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
  }
  return [];
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f3",
  },
  screen: {
    flex: 1,
    backgroundColor: "#f5f5f3",
  },
  content: {
    paddingBottom: 32,
  },
  imageBox: {
    height: 320,
    backgroundColor: "#e5e7eb",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  imageText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111111",
    textAlign: "center",
  },
  details: {
    backgroundColor: "#ffffff",
    marginTop: -18,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 28,
  },
  category: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: "#6b7280",
    textTransform: "uppercase",
  },
  name: {
    marginTop: 8,
    fontSize: 28,
    fontWeight: "700",
    color: "#111111",
  },
  price: {
    marginTop: 8,
    fontSize: 20,
    fontWeight: "700",
    color: "#111111",
  },
  sectionTitle: {
    marginTop: 24,
    marginBottom: 12,
    fontSize: 16,
    fontWeight: "700",
    color: "#111111",
  },
  description: {
    color: "#4b5563",
    lineHeight: 22,
  },
  sizeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  sizeButton: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  sizeButtonActive: {
    backgroundColor: "#111111",
    borderColor: "#111111",
  },
  sizeText: {
    color: "#111111",
    fontWeight: "600",
  },
  sizeTextActive: {
    color: "#ffffff",
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  qtyButton: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },
  qtyButtonText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111111",
  },
  quantity: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111111",
  },
  primaryButton: {
    marginTop: 24,
    backgroundColor: "#111111",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontWeight: "700",
  },
  errorText: {
    color: "#b42318",
    fontWeight: "600",
    textAlign: "center",
  },
});
