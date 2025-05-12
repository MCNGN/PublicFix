import AsyncStorage from "@react-native-async-storage/async-storage";
import { SplashScreen, Stack } from "expo-router";
import { useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import { MD3DarkTheme, MD3LightTheme, PaperProvider } from "react-native-paper";
import "../global.css";

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Get device color scheme (light or dark)
  const colorScheme = useColorScheme();

  // Check authentication status on app load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        setIsAuthenticated(!!token);
      } catch (error) {
        console.error("Failed to get authentication status:", error);
        setIsAuthenticated(false);
      } finally {
        // Hide splash screen after checking auth status
        SplashScreen.hideAsync();
      }
    };

    checkAuthStatus();
  }, []);

  // Choose theme based on device settings
  const theme =
    colorScheme === "dark"
      ? {
          ...MD3DarkTheme,
          colors: {
            ...MD3DarkTheme.colors,
            primary: "#4B8BFF", // Custom blue for dark theme
            surfaceVariant: "#1F1F1F", // Darker background for dropdown items
            background: "#121212", // Dark background
            surface: "#1E1E1E", // Dark surface
            error: "#CF6679", // Error color for dark theme
            onBackground: "#FFFFFF", // Text on background
            onSurface: "#FFFFFF", // Text on surface
            outline: "#444444", // Outline color for inputs
            elevation: {
              level0: "transparent",
              level1: "#1E1E1E", // Cards, dialogs
              level2: "#222222", // Menus, bottom sheets
              level3: "#252525", // Navigation drawer
              level4: "#272727", // Modal bottom sheets
              level5: "#2C2C2C", // Search
            },
          },
        }
      : {
          ...MD3LightTheme,
          colors: {
            ...MD3LightTheme.colors,
            primary: "#3B82F6", // Keep your current blue for light theme
            background: "#FFFFFF",
            surface: "#FFFFFF",
            onBackground: "#000000",
            onSurface: "#000000",
          },
        };

  // Show nothing while we're determining auth status
  if (isAuthenticated === null) {
    return null;
  }

  return (
    <PaperProvider theme={theme}>
      {isAuthenticated ? (
        // Authenticated user routes
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: theme.colors.surface,
            },
            headerTintColor: theme.colors.onSurface,
          }}
        >
          <Stack.Screen
            name="home"
            options={{
              title: "Home",
            }}
          />
        </Stack>
      ) : (
        // Non-authenticated user routes
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: theme.colors.surface,
            },
            headerTintColor: theme.colors.onSurface,
          }}
        >
          <Stack.Screen
            name="index"
            options={{
              headerShown: false,
            }}
          />
        </Stack>
      )}
      {/* <Stack /> */}
    </PaperProvider>
  );
}