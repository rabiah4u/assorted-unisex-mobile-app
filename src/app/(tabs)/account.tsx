import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { supabase } from "@/lib/supabase";

export default function AccountScreen() {
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (!active) {
        return;
      }

      if (error || !user) {
        router.replace("/login");
        return;
      }

      setEmail(user.email ?? "");
      setName(user.user_metadata?.full_name ?? user.user_metadata?.name ?? "");
      setLoading(false);
    };

    void loadProfile();

    return () => {
      active = false;
    };
  }, [router]);

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Account</Text>
      </View>

      {loading ? (
        <View style={styles.state}><ActivityIndicator /></View>
      ) : (
        <View style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(name || email || "A").slice(0, 1).toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{name || "Assorted customer"}</Text>
          <Text style={styles.email}>{email}</Text>

          <Pressable style={styles.logoutButton} onPress={() => void logout()}>
            <Text style={styles.logoutButtonText}>Log out</Text>
          </Pressable>
        </View>
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
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111111",
  },
  state: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    margin: 18,
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 24,
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#111111",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "700",
  },
  name: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111111",
  },
  email: {
    color: "#6b7280",
    fontSize: 15,
    textAlign: "center",
  },
  logoutButton: {
    width: "100%",
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 18,
  },
  logoutButtonText: {
    color: "#111111",
    fontWeight: "700",
  },
});
