import * as Location from "expo-location";
import { useRouter, Stack} from "expo-router";
import { useEffect, useState } from "react";
import { Alert, View, useWindowDimensions } from "react-native";
import MapView from "react-native-maps";
import {PROVIDER_GOOGLE } from "react-native-maps";
import { FAB,  useTheme } from "react-native-paper";

export default function MapsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const [address, setAddress] =
    useState<Location.LocationGeocodedAddress | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [initialRegion, setInitialRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  // Get location and reverse geocode to get address
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        Alert.alert(
          "Permission Denied",
          "Permission to access location was denied."
        );
        return;
      }

      try {
        let currentLocation = await Location.getCurrentPositionAsync({});
        setLocation(currentLocation);

        if (currentLocation) {
          // Set the map region
          setInitialRegion({
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          });

          // Reverse geocode to get address information
          const reverseGeocode = await Location.reverseGeocodeAsync({
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
          });

          if (reverseGeocode && reverseGeocode.length > 0) {
            setAddress(reverseGeocode[0]);
          }
        }
      } catch (error) {
        setErrorMsg("Could not fetch location");
        Alert.alert(
          "Location Error",
          "Could not fetch location. Please ensure location services are enabled."
        );
        console.error(error);
      }
    })();
  }, []);

  // Get display text
  let streetName = "";
  let cityName = "";

  if (errorMsg) {

  } else if (location && address) {
    streetName = address.street || "";
    cityName = address.city || address.region || "";
  } 

  // Function to navigate to create screen with pre-filled data
  const navigateToCreate = () => {
    router.push({
      pathname: "/create",
      params: {
        street: streetName,
        location: cityName,
        latitude: location?.coords.latitude.toString(),
        longitude: location?.coords.longitude.toString(),
      },
    });
  };

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: theme.colors.background }}
    >
       <Stack.Screen
      options={{
        headerShown: false,
        statusBarStyle: 'dark', // You can set this to 'light' if you prefer
      }}
    />
      <MapView
        style={{ width: "100%", height: "100%" }}
        region={initialRegion}
        showsUserLocation={true}
        userInterfaceStyle={theme.dark ? "dark" : "light"}
        provider={PROVIDER_GOOGLE}
      >
        {/* Marker code if you have it */}
      </MapView>


      <FAB
        style={{
          position: "absolute",
          right: isTablet ? 24 : 16,
          bottom: isTablet ? 24 : 16,
          backgroundColor: theme.colors.primary,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.3,
          shadowRadius: 15,
          elevation: 8,
        }}
        icon="plus"
        onPress={navigateToCreate} // Use the new function
        color={theme.colors.onPrimary}
        customSize={isTablet ? 64 : 56}
        animated={true}
        label={isTablet ? "Buat Laporan" : "Laporkan"}
      />
    </View>
  );
}
