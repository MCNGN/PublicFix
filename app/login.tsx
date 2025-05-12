import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Linking from "expo-linking";
import { Stack, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useState } from "react";
import { Alert, Text, View } from "react-native";
import { Button } from "react-native-paper";

// Help the browser close automatically after auth redirect
WebBrowser.maybeCompleteAuthSession();

// Update API URL to use your backend
const API_URL = "https://publicfix-backend.vercel.app/api/auth/google";

export default function Login() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [authInProgress, setAuthInProgress] = useState(false);

  // Set up URL event listener as soon as component mounts
  useEffect(() => {
    const handleRedirect = async (event) => {
      console.log("Auth redirect received:", event.url);
      try {
        // For URLs that come back as deep links
        if (event.url.includes("auth-callback")) {
          console.log("Processing auth callback URL");

          // Extract token from URL - try more direct approach
          const url = new URL(event.url);
          const token = url.searchParams.get("token");
          const userData = url.searchParams.get("userData");

          if (token) {
            console.log("Token found in URL");

            // Mark auth as no longer in progress
            setAuthInProgress(false);

            // Process authentication
            await handleAuthSuccess(token, userData);
          }
        }
      } catch (error) {
        console.error("Error processing redirect URL:", error);
      }
    };

    // Subscribe to URL events
    const subscription = Linking.addEventListener("url", handleRedirect);

    // Check for initial URL (app opened via URL)
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log("App opened with initial URL:", url);
        handleRedirect({ url });
      }
    });

    return () => {
      subscription.remove();
      // No need for WebBrowser.dismissAuthSession() - removed for Android compatibility
    };
  }, [authInProgress]);

  const handleAuthSuccess = async (token, userData) => {
    try {
      console.log("Saving authentication data");
      await AsyncStorage.setItem("token", token);

      if (userData) {
        try {
          // Parse user data if it's a JSON string
          const userInfo =
            typeof userData === "string" ? JSON.parse(userData) : userData;

          await AsyncStorage.setItem("userInfo", JSON.stringify(userInfo));
        } catch (error) {
          console.error("Error parsing user data:", error);
          await AsyncStorage.setItem("userInfo", String(userData));
        }
      }

      console.log("Authentication successful, navigating to auth-callback");

      // Small delay before navigation to ensure AsyncStorage operations complete
      setTimeout(() => {
        console.log("Executing navigation to auth-callback page...");
        router.replace("/auth-callback"); // Navigate to auth-callback instead of index
      }, 300);
    } catch (error) {
      console.error("Error in authentication success handler:", error);
      Alert.alert("Error", "Failed to complete authentication.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setAuthInProgress(true);

      // Create a scheme-specific redirect URL
      // Use explicit scheme to ensure proper handling
      const scheme = "publicfix";
      const path = "auth-callback";

      // When creating the redirect URL, do this:
      const redirectUrl = `${scheme}://auth-callback`; // Note: No leading slash

      console.log("Redirect URL:", redirectUrl);

      // Add redirect URL to backend auth URL
      const fullAuthUrl = `${API_URL}?redirectUrl=${encodeURIComponent(
        redirectUrl
      )}`;
      console.log("Opening auth URL:", fullAuthUrl);

      // Use in-app browser for authentication
      const result = await WebBrowser.openAuthSessionAsync(
        fullAuthUrl,
        redirectUrl
      );
      console.log("WebBrowser session result:", result);

      // Check if we already have an authentication token
      // This handles cases where the browser might have closed but auth succeeded
      const existingToken = await AsyncStorage.getItem("token");
      if (existingToken) {
        console.log("Token found in storage after browser closed");
        router.replace("/");
        return;
      }

      // If the WebBrowser closed without success
      if (result.type !== "success") {
        setAuthInProgress(false);
        console.log("Browser session ended with result type:", result.type);

        // Only show alert if user explicitly cancelled
        if (result.type === "dismiss") {
          Alert.alert("Login Cancelled", "Google login was cancelled.");
        }
      }
    } catch (error) {
      console.error("Error during Google sign-in:", error);
      Alert.alert("Login Error", "Failed to sign in with Google.");
      setAuthInProgress(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white p-6">
      <Stack.Screen
        options={{
          title: "Login",
          headerShown: false,
        }}
      />

      {/* Logo and App Information */}
      <View className="items-center justify-center flex-1 mb-16">
        <Text className="text-3xl font-bold text-blue-700 mb-3">PublicFix</Text>
        <Text className="text-gray-600 text-center text-lg mb-6">
          Aplikasi untuk melapor kerusakan pada Jalan
        </Text>

        {/* Google Sign In Button */}
        <Button
          mode="contained"
          icon="google"
          onPress={handleGoogleSignIn}
          loading={loading}
          disabled={loading || authInProgress}
          className="w-full py-2 rounded-lg"
          contentStyle={{ paddingVertical: 8 }}
          labelStyle={{ fontSize: 16 }}
        >
          Continue with Google
        </Button>

        {/* Terms of Service */}
        <View className="mt-6">
          <Text className="text-gray-500 text-center text-xs">
            By continuing, you agree to our{" "}
            <Text className="text-blue-700">Terms of Service</Text> and{" "}
            <Text className="text-blue-700">Privacy Policy</Text>
          </Text>
        </View>
      </View>
    </View>
  );
}
