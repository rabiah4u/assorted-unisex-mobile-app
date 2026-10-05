import { Image } from "expo-image";
import { Link } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/currency";

export default function CartScreen() {
  const { items, count, subtotal, loading, error, updateQuantity, removeItem } = useCart();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const onQuantityChange = async (itemId: string, delta: number) => {
    const item = items.find((entry) => entry.id === itemId);
    const nextQuantity = (item?.quantity ?? 0) + delta;
    setActionLoading(itemId);
    try {
      await updateQuantity(itemId, nextQuantity);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemove = async (itemId: string) => {
    setActionLoading(itemId);
    try {
      await removeItem(itemId);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Cart</Text>
        <Text style={styles.subtitle}>{count} item{count === 1 ? "" : "s"}</Text>
      </View>

      {loading ? (
        <View style={styles.state}><ActivityIndicator /></View>
      ) : error ? (
        <View style={styles.state}><Text style={styles.errorText}>{error}</Text></View>
      ) : items.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptyMessage}>Add a few essentials and they will show up here.</Text>
          <Link href="/(tabs)/shop" asChild>
            <Pressable style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Continue shopping</Text>
            </Pressable>
          </Link>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {items.map((item) => {
            const product = item.product;
            const unitPrice = Number(product?.price ?? 0);
            const totalPrice = unitPrice * (item.quantity ?? 0);

            return (
              <View key={item.id} style={styles.itemCard}>
                <View style={styles.thumb}>
                  {product?.image_url ? (
                    <Image
                      source={{ uri: product.image_url }}
                      style={styles.thumbImage}
                      contentFit="cover"
                      transition={200}
                    />
                  ) : (
                    <Text style={styles.thumbText}>{product?.name ?? "Product"}</Text>
                  )}
                </View>

                <View style={styles.itemBody}>
                  <Text style={styles.itemName}>{product?.name ?? "Product"}</Text>
                  <Text style={styles.itemMeta}>Size: {item.size ?? "One size"}</Text>
                  <Text style={styles.itemMeta}>Price: {formatPrice(unitPrice)}</Text>

                  <View style={styles.quantityRow}>
                    <Pressable
                      style={styles.qtyButton}
                      onPress={() => void onQuantityChange(item.id, -1)}
                      disabled={actionLoading === item.id}
                    >
                      <Text style={styles.qtyButtonText}>−</Text>
                    </Pressable>

                    <Text style={styles.quantity}>{item.quantity}</Text>

                    <Pressable
                      style={styles.qtyButton}
                      onPress={() => void onQuantityChange(item.id, 1)}
                      disabled={actionLoading === item.id}
                    >
                      <Text style={styles.qtyButtonText}>+</Text>
                    </Pressable>
                  </View>
                </View>

                <View style={styles.rightColumn}>
                  <Text style={styles.itemTotal}>{formatPrice(totalPrice)}</Text>
                  <Pressable
                    onPress={() => void handleRemove(item.id)}
                    disabled={actionLoading === item.id}
                  >
                    <Text style={styles.removeText}>Remove</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}

          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{formatPrice(subtotal)}</Text>
            </View>
            <Link href="/checkout" asChild>
              <Pressable style={styles.checkoutButton}>
                <Text style={styles.checkoutButtonText}>Proceed to checkout</Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f5f5f3",
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111111",
  },
  subtitle: {
    marginTop: 4,
    color: "#6b7280",
  },
  content: {
    padding: 18,
    gap: 12,
    paddingBottom: 32,
  },
  itemCard: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 12,
    alignItems: "center",
  },
  thumb: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  thumbImage: {
    width: "100%",
    height: "100%",
  },
  thumbText: {
    textAlign: "center",
    color: "#4b5563",
    fontSize: 12,
    fontWeight: "600",
  },
  itemBody: {
    flex: 1,
    gap: 4,
  },
  itemName: {
    fontWeight: "700",
    color: "#111111",
  },
  itemMeta: {
    color: "#6b7280",
    fontSize: 12,
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 6,
  },
  qtyButton: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },
  qtyButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111111",
  },
  quantity: {
    minWidth: 18,
    textAlign: "center",
    fontWeight: "700",
    color: "#111111",
  },
  rightColumn: {
    alignItems: "flex-end",
    gap: 8,
  },
  itemTotal: {
    fontWeight: "700",
    color: "#111111",
  },
  removeText: {
    color: "#b42318",
    fontWeight: "600",
  },
  summaryBox: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 16,
    gap: 14,
    marginTop: 8,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    color: "#6b7280",
    fontWeight: "600",
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111111",
  },
  checkoutButton: {
    backgroundColor: "#111111",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  checkoutButtonText: {
    color: "#ffffff",
    fontWeight: "700",
  },
  state: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
    gap: 14,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111111",
  },
  emptyMessage: {
    color: "#6b7280",
    textAlign: "center",
    fontSize: 16,
  },
  primaryButton: {
    backgroundColor: "#111111",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
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
