import { Image } from "expo-image";
import { Link } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/currency";
import type { Product } from "@/lib/types";

export default function ShopScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
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
          .order("name", { ascending: true });

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
          setError("Unable to load products at the moment.");
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

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((product) => {
      const value = product.category?.trim();
      if (value) set.add(value);
    });
    return ["All", ...Array.from(set)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === "All") return products;
    return products.filter((product) => product.category === selectedCategory);
  }, [products, selectedCategory]);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Shop</Text>
        <Text style={styles.subtitle}>Browse our latest arrivals</Text>
      </View>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
        data={categories}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.chip, item === selectedCategory && styles.chipActive]}
            onPress={() => setSelectedCategory(item)}
          >
            <Text style={[styles.chipText, item === selectedCategory && styles.chipTextActive]}>{item}</Text>
          </Pressable>
        )}
      />

      {loading ? (
        <View style={styles.state}><ActivityIndicator /></View>
      ) : error ? (
        <View style={styles.state}><Text style={styles.errorText}>{error}</Text></View>
      ) : filteredProducts.length === 0 ? (
        <View style={styles.state}><Text style={styles.emptyText}>No products match this category.</Text></View>
      ) : (
        <FlatList
          data={filteredProducts}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.columnWrapper}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const hasImageError = Boolean(imageErrors[item.id]);
            return (
              <Link
                href={{ pathname: "/product/[id]", params: { id: item.id } }}
                asChild
              >
                <Pressable style={styles.card}>
                  <View style={styles.imageBox}>
                    {item.image_url && !hasImageError ? (
                      <Image
                        source={{ uri: item.image_url }}
                        style={styles.productImage}
                        contentFit="cover"
                        transition={200}
                        onError={() => setImageErrors((current) => ({ ...current, [item.id]: true }))}
                      />
                    ) : (
                      <Text style={styles.imagePlaceholder}>{item.name}</Text>
                    )}
                  </View>
                  <Text style={styles.category}>{item.category ?? "General"}</Text>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.price}>{formatPrice(item.price)}</Text>
                </Pressable>
              </Link>
            );
          }}
        />
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
  chips: {
    paddingHorizontal: 18,
    paddingBottom: 12,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#e5e7eb",
  },
  chipActive: {
    backgroundColor: "#111111",
  },
  chipText: {
    color: "#111111",
    fontWeight: "600",
  },
  chipTextActive: {
    color: "#ffffff",
  },
  grid: {
    paddingHorizontal: 18,
    paddingBottom: 28,
  },
  columnWrapper: {
    justifyContent: "space-between",
    marginBottom: 14,
  },
  card: {
    width: "48%",
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 10,
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  imageBox: {
    height: 160,
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
    textAlign: "center",
    paddingHorizontal: 10,
  },
  category: {
    color: "#6b7280",
    fontSize: 12,
    textTransform: "uppercase",
    fontWeight: "700",
  },
  name: {
    color: "#111111",
    fontWeight: "700",
    fontSize: 15,
  },
  price: {
    color: "#111111",
    fontWeight: "700",
  },
  state: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emptyText: {
    color: "#6b7280",
    fontWeight: "600",
    textAlign: "center",
  },
  errorText: {
    color: "#b42318",
    fontWeight: "600",
    textAlign: "center",
  },
});
