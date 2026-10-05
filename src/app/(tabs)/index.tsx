import { Image } from "expo-image";
import { Link } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/currency";
import type { Product } from "@/lib/types";

export default function HomeScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let mounted = true;

    const loadProducts = async () => {
      try {
        setLoading(true);
        const { data, error: loadError } = await supabase
          .from("products")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(6);

        if (loadError) {
          throw loadError;
        }

        if (mounted) {
          setProducts((data ?? []) as Product[]);
          setError(null);
        }
      } catch (loadErr) {
        console.error(loadErr);
        if (mounted) {
          setError("Unable to load featured products right now.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadProducts();

    return () => {
      mounted = false;
    };
  }, []);

  const featured = useMemo(() => products.slice(0, 3), [products]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <Text style={styles.eyebrow}>ASSORTED UNISEX</Text>
        <Text style={styles.title}>Designed for every day.</Text>
        <Text style={styles.subtitle}>Shop everyday basics, statement layers, and must-have essentials.</Text>
        <Link href="/(tabs)/shop" asChild>
          <Pressable style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Shop now</Text>
          </Pressable>
        </Link>
      </View>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Featured picks</Text>
        <Link href="/(tabs)/shop" asChild>
          <Pressable>
            <Text style={styles.linkText}>View all</Text>
          </Pressable>
        </Link>
      </View>

      {loading ? (
        <View style={styles.stateCard}><ActivityIndicator /></View>
      ) : error ? (
        <View style={styles.stateCard}><Text style={styles.errorText}>{error}</Text></View>
      ) : (
        <View style={styles.productList}>
          {featured.map((product) => {
            const hasImageError = Boolean(imageErrors[product.id]);
            return (
              <Link
                key={product.id}
                href={{ pathname: "/product/[id]", params: { id: product.id } }}
                asChild
              >
                <Pressable style={styles.featureCard}>
                  <View style={styles.productImageFrame}>
                    {product.image_url && !hasImageError ? (
                      <Image
                        source={{ uri: product.image_url }}
                        style={styles.productImage}
                        contentFit="cover"
                        transition={200}
                        onError={() => setImageErrors((current) => ({ ...current, [product.id]: true }))}
                      />
                    ) : (
                      <Text style={styles.imagePlaceholder}>{product.name}</Text>
                    )}
                  </View>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.price}>{formatPrice(product.price)}</Text>
                </Pressable>
              </Link>
            );
          })}
        </View>
      )}
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
    gap: 18,
    paddingBottom: 48,
  },
  heroCard: {
    backgroundColor: "#111111",
    borderRadius: 24,
    padding: 22,
    gap: 10,
  },
  eyebrow: {
    color: "#d4d4d4",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  title: {
    color: "#ffffff",
    fontSize: 32,
    fontWeight: "700",
    lineHeight: 38,
  },
  subtitle: {
    color: "#f3f4f6",
    fontSize: 15,
    lineHeight: 22,
  },
  primaryButton: {
    marginTop: 8,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#111111",
    fontWeight: "700",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111111",
  },
  linkText: {
    color: "#2563eb",
    fontWeight: "600",
  },
  productList: {
    gap: 14,
  },
  featureCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 12,
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  productImageFrame: {
    height: 140,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    color: "#6b7280",
    fontWeight: "600",
    paddingHorizontal: 12,
    textAlign: "center",
  },
  productName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111111",
  },
  price: {
    color: "#111111",
    fontWeight: "600",
  },
  stateCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    color: "#b42318",
    textAlign: "center",
    fontWeight: "600",
  },
});
