import { useFocusEffect, useRouter } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { supabase } from "@/lib/supabase";

export default function AppIndex() {
  const router = useRouter();

  useFocusEffect(() => {
    let active = true;

    const redirect = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!active) {
        return;
      }

      if (session) {
        router.replace("/(tabs)");
      } else {
        router.replace("/login");
      }
    };

    void redirect();

    return () => {
      active = false;
    };
  });

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f3",
  },
});