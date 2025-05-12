import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Text, View } from "react-native";

export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    // Add this debugging block at the beginning of your effect
    console.log("Auth callback mounted, params:", params);
    console.log("Raw params:", JSON.stringify(params));

    Linking.getInitialURL().then((url) => {
      console.log("Initial URL in auth-callback:", url);
      if (url) {
        const parsed = Linking.parse(url);
        console.log("Parsed URL data:", parsed);
      }
    });

    const handleAuthData = async () => {
      try {
        // Extract token and userData from URL params
        const token = params.token as string;
        const userData = params.userData as string;

        console.log("Auth-callback screen: Processing authentication");

        if (token) {
          // Save the token
          await AsyncStorage.setItem("token", token);
          console.log("Token saved successfully");

          // Save user data if available
          if (userData) {
            try {
              // Parse user data if it's a JSON string
              const userInfo =
                typeof userData === "string" ? JSON.parse(userData) : userData;

              await AsyncStorage.setItem("userInfo", JSON.stringify(userInfo));
              console.log("User data saved successfully");
            } catch (error) {
              console.error("Error parsing user data:", error);
              await AsyncStorage.setItem("userInfo", String(userData));
            }
          }

          // Redirect to home screen after a short delay
          setTimeout(() => {
            router.replace("/home");
          }, 500);
        } else {
          console.log("No token found in URL params");
          // Redirect back to login if no token
          setTimeout(() => {
            router.replace("/");
          }, 500);
        }
      } catch (error) {
        console.error("Error in auth callback:", error);
        // Redirect back to login on error
        setTimeout(() => {
          router.replace("/");
        }, 500);
      }
    };

    handleAuthData();
  }, [params, router]);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
      }}
    >
      <ActivityIndicator size="large" color="#3B82F6" />
      <Text style={{ marginTop: 20, fontSize: 16 }}>
        Completing authentication...
      </Text>
    </View>
  );
}
