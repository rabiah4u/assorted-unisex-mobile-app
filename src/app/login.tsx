import * as Linking from "expo-linking";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { supabase } from "@/lib/supabase";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const authCheck = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!active) {
        return;
      }

      if (session) {
        router.replace("/(tabs)");
      }

      setChecking(false);
    };

    void authCheck();

    return () => {
      active = false;
    };
  }, [router]);

  async function signInWithGoogle() {
    try {
      setLoading(true);
      setError("");

      const redirectTo =
        Platform.OS !== "web" && Constants.expoVersion === null
          ? Linking.createURL("auth/callback", {
              scheme: "assortedunisexmobile",
            })
          : Linking.createURL("auth/callback");

      const { data, error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          skipBrowserRedirect: true,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (signInError) {
        throw signInError;
      }

      if (!data?.url) {
        throw new Error("No Google sign-in URL was returned.");
      }

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

      if (result.type === "cancel" || result.type === "dismiss") {
        setError("Google sign-in was cancelled.");
        return;
      }

      if (result.type !== "success") {
        throw new Error("Google sign-in did not complete successfully.");
      }

      const callbackUrl = result.url;
      const parsed = Linking.parse(callbackUrl);
      const callbackError =
        typeof parsed.queryParams?.error_description === "string"
          ? parsed.queryParams.error_description
          : typeof parsed.queryParams?.error === "string"
            ? parsed.queryParams.error
            : null;

      if (callbackError) {
        throw new Error(callbackError);
      }

      const code =
        typeof parsed.queryParams?.code === "string" ? parsed.queryParams.code : null;

      if (!code) {
        throw new Error("Google sign-in did not return an authorization code.");
      }

      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        throw exchangeError;
      }

      router.replace("/(tabs)");
    } catch (err) {
      console.error(err);
      setError("Google sign-in could not be completed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>YOUR ACCOUNT</Text>
      <Text style={styles.title}>Welcome to Assorted.</Text>
      <Text style={styles.subtitle}>
        Sign in to continue shopping. Your bag stays yours, wherever you go.
      </Text>

      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        onPress={() => void signInWithGoogle()}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.buttonText}>Continue with Google</Text>}
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f3",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#ffffff",
  },
  eyebrow: {
    fontSize: 12,
    letterSpacing: 1.5,
    fontWeight: "600",
    marginBottom: 12,
    color: "#4b5563",
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 12,
    color: "#111111",
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: "#666666",
    marginBottom: 32,
  },
  button: {
    height: 52,
    borderRadius: 12,
    backgroundColor: "#111111",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  error: {
    marginTop: 16,
    color: "#B42318",
    textAlign: "center",
    fontWeight: "600",
  },
});