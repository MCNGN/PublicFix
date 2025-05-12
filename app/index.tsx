import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Linking from "expo-linking";
import { Stack, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useState } from "react";
import { Alert, Text, View } from "react-native";
import { Button } from "react-native-paper";

// Enable this line to help auto-close the browser when redirect happens
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

      console.log("Authentication successful, navigating to home");

      // Navigate directly to the home page
      setTimeout(() => {
        router.replace("/");
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

      // If the backend doesn't accept redirect params, just open the URL directly
      console.log("Opening auth URL:", API_URL);

      // Simply open the browser with the auth URL
      const result = await WebBrowser.openBrowserAsync(API_URL);
      console.log("WebBrowser session result:", result);

      // The browser will open but won't automatically close
      // The user will need to manually switch back to the app after authentication

      // Optional: You can check if authentication happened on app focus
      // by checking AsyncStorage for token in a separate useEffect
    } catch (error) {
      console.error("Error during Google sign-in:", error);
      Alert.alert("Login Error", "Failed to sign in with Google.");
    } finally {
      setLoading(false);
      setAuthInProgress(false);
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
