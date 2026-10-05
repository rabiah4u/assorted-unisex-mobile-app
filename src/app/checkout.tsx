import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/currency";
import { supabase } from "@/lib/supabase";
import type { OrderForm } from "@/lib/types";

const initialForm: OrderForm = {
  name: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
};

export default function CheckoutScreen() {
  const router = useRouter();
  const { items, subtotal, refreshCart, loading } = useCart();
  const [form, setForm] = useState<OrderForm>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  if (items.length === 0 && !submitting && !orderNumber) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Link href="/(tabs)/shop" asChild>
          <Pressable style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Browse products</Text>
          </Pressable>
        </Link>
      </View>
    );
  }

  const submitOrder = async () => {
    try {
      setSubmitting(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }

      const payload = {
        p_customer_name: form.name,
        p_email: form.email,
        p_phone: form.phone,
        p_address: form.address,
        p_city: form.city,
        p_state: form.state,
        p_total: subtotal,
      };

      let result: { data: any; error: any } | null = null;
      for (const rpcName of ["create_order", "place_order", "checkout"]) {
        const response = await supabase.rpc(rpcName, payload);
        if (!response.error) {
          result = response;
          break;
        }

        const code = response.error?.code ?? "";
        if (code !== "PGRST202" && code !== "42883" && code !== "42P01") {
          result = response;
          break;
        }
      }

      if (!result || result.error) {
        throw result?.error ?? new Error("Store checkout is not available right now.");
      }

      const nextOrderNumber =
        result.data?.order_number ??
        result.data?.number ??
        result.data?.id ??
        "Order placed";

      setOrderNumber(String(nextOrderNumber));
      await refreshCart();
    } catch (submitErr) {
      console.error(submitErr);
      setError("We could not create your order. Please review your details and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (orderNumber) {
    return (
      <View style={styles.successScreen}>
        <Text style={styles.successTitle}>Order placed</Text>
        <Text style={styles.successText}>Order number: {orderNumber}</Text>
        <Link href="/(tabs)/shop" asChild>
          <Pressable style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Continue shopping</Text>
          </Pressable>
        </Link>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Checkout</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Full name"
          value={form.name}
          onChangeText={(value) => setForm((current) => ({ ...current, name: value }))}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={form.email}
          onChangeText={(value) => setForm((current) => ({ ...current, email: value }))}
        />
        <TextInput
          style={styles.input}
          placeholder="Phone"
          keyboardType="phone-pad"
          value={form.phone}
          onChangeText={(value) => setForm((current) => ({ ...current, phone: value }))}
        />
        <TextInput
          style={styles.input}
          placeholder="Address"
          value={form.address}
          onChangeText={(value) => setForm((current) => ({ ...current, address: value }))}
        />
        <View style={styles.inlineRow}>
          <TextInput
            style={[styles.input, styles.inlineInput]}
            placeholder="City"
            value={form.city}
            onChangeText={(value) => setForm((current) => ({ ...current, city: value }))}
          />
          <TextInput
            style={[styles.input, styles.inlineInput]}
            placeholder="State"
            value={form.state}
            onChangeText={(value) => setForm((current) => ({ ...current, state: value }))}
          />
        </View>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Order summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>{formatPrice(subtotal)}</Text>
        </View>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Pressable style={styles.primaryButton} onPress={() => void submitOrder()} disabled={submitting || loading}>
        {submitting ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.primaryButtonText}>Place order</Text>}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f5f5f3",
  },
  content: {
    padding: 18,
    gap: 16,
    paddingBottom: 36,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111111",
  },
  form: {
    gap: 12,
  },
  input: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    fontSize: 15,
  },
  inlineRow: {
    flexDirection: "row",
    gap: 10,
  },
  inlineInput: {
    flex: 1,
  },
  summaryCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 16,
    gap: 8,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111111",
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
    fontSize: 18,
    fontWeight: "700",
    color: "#111111",
  },
  primaryButton: {
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
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f3",
    padding: 24,
    gap: 18,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111111",
  },
  successScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f3",
    padding: 24,
    gap: 18,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#111111",
  },
  successText: {
    fontSize: 16,
    color: "#4b5563",
    textAlign: "center",
  },
});
