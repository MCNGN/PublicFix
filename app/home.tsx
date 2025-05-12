import * as Location from "expo-location";
import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import {
  Button,
  Chip,
  Divider,
  FAB,
  IconButton,
  useTheme,
} from "react-native-paper";

// Dummy data for road issues
const dummyReports = [
  {
    id: 1,
    title: "Jalan Berlubang",
    description:
      "Lubang besar di tengah jalan menyebabkan kemacetan dan berbahaya bagi pengendara motor",
    street: "Jalan Ahmad Yani",
    location: "Kota Bandung",
    category: "Lubang",
    status: "Dilaporkan",
    date: "12-05-2023",
    imageUrl:
      "https://jabarekspres.com/wp-content/uploads/2022/07/jalan-rusak-cileunyi.jpeg",
    latitude: -6.914744,
    longitude: 107.60981,
  },
  {
    id: 2,
    title: "Aspal Rusak Parah",
    description: "Permukaan jalan rusak dan bergelombang sepanjang 50 meter",
    street: "Jalan Sudirman",
    location: "Jakarta Pusat",
    category: "Aspal Rusak",
    status: "Dalam Proses",
    date: "05-05-2023",
    imageUrl:
      "https://jabarekspres.com/wp-content/uploads/2022/07/jalan-rusak-cileunyi.jpeg",
    latitude: -6.917464,
    longitude: 107.61913,
  },
  {
    id: 3,
    title: "Trotoar Rusak",
    description: "Batu-batu trotoar lepas dan membahayakan pejalan kaki",
    street: "Jalan Dipatiukur",
    location: "Bandung",
    category: "Trotoar",
    status: "Selesai",
    date: "01-04-2023",
    imageUrl:
      "https://jabarekspres.com/wp-content/uploads/2022/07/jalan-rusak-cileunyi.jpeg",
    latitude: -6.910744,
    longitude: 107.61581,
  },
  {
    id: 4,
    title: "Banjir di Jalan",
    description: "Air tergenang setelah hujan karena saluran tersumbat",
    street: "Jalan Cihampelas",
    location: "Bandung",
    category: "Drainase",
    status: "Dilaporkan",
    date: "10-05-2023",
    imageUrl:
      "https://jabarekspres.com/wp-content/uploads/2022/07/jalan-rusak-cileunyi.jpeg",
    latitude: -6.905744,
    longitude: 107.60081,
  },
];

// Status color mapping
const statusColors = {
  Dilaporkan: "#FF9800", // Orange
  "Dalam Proses": "#2196F3", // Blue
  Selesai: "#4CAF50", // Green
  Ditolak: "#F44336", // Red
};

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
    latitude: -6.914744,
    longitude: 107.60981,
    latitudeDelta: 0.0222,
    longitudeDelta: 0.0121,
  });

  // State for the selected report and modal visibility
  const [selectedReport, setSelectedReport] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

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
    // Handle error state
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

  // Handle marker press
  const handleMarkerPress = (report) => {
    setSelectedReport(report);
    setModalVisible(true);
  };

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: theme.colors.background }}
    >
      <Stack.Screen
        options={{
          headerShown: false,
          statusBarStyle: "dark",
        }}
      />

      <MapView
        style={{
          width: "100%",
          height: "100%",
        }}
        initialRegion={{
          latitude: -6.914744,
          longitude: 107.60981,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
        region={initialRegion}
        showsUserLocation={true}
        provider={PROVIDER_GOOGLE}
        onMapReady={() => {
          console.log("Map is ready");
        }}
        onRegionChangeComplete={(region) => {
          console.log("New region:", region);
        }}
      >
        {/* Debug marker */}
        <Marker
          coordinate={{
            latitude: -6.914744,
            longitude: 107.60981,
          }}
          title="Debug Marker"
          pinColor="red"
        />

        {/* Render markers from dummy data */}
        {dummyReports.map((report) => (
          <Marker
            key={report.id}
            coordinate={{
              latitude: report.latitude,
              longitude: report.longitude,
            }}
            title={report.title}
            description={report.street}
            pinColor={statusColors[report.status] || "#FF9800"}
            onPress={() => handleMarkerPress(report)}
          />
        ))}
      </MapView>

      {/* Modal to display report details */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View
            style={[
              styles.modalView,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text
                style={[styles.modalTitle, { color: theme.colors.onSurface }]}
              >
                Detail Laporan
              </Text>
              <IconButton
                icon="close"
                size={24}
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              />
            </View>

            <Divider />

            <ScrollView style={styles.modalContent}>
              {selectedReport && (
                <>
                  <Image
                    source={{ uri: selectedReport.imageUrl }}
                    style={styles.reportImage}
                    resizeMode="cover"
                  />

                  <View style={styles.statusContainer}>
                    <Chip
                      mode="flat"
                      style={{
                        backgroundColor: statusColors[selectedReport.status],
                      }}
                      textStyle={{ color: "white", fontWeight: "bold" }}
                    >
                      {selectedReport.status}
                    </Chip>
                    <Text style={styles.reportDate}>{selectedReport.date}</Text>
                  </View>

                  <Text
                    style={[
                      styles.reportTitle,
                      { color: theme.colors.onSurface },
                    ]}
                  >
                    {selectedReport.title}
                  </Text>

                  <View style={styles.locationContainer}>
                    <Text style={styles.locationLabel}>Lokasi:</Text>
                    <Text style={styles.locationText}>
                      {selectedReport.street}, {selectedReport.location}
                    </Text>
                  </View>

                  <View style={styles.categoryContainer}>
                    <Text style={styles.categoryLabel}>Kategori:</Text>
                    <Chip mode="outlined">{selectedReport.category}</Chip>
                  </View>

                  <Text style={styles.sectionTitle}>Deskripsi</Text>
                  <Text style={styles.descriptionText}>
                    {selectedReport.description}
                  </Text>
                </>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                mode="contained"
                icon="flag"
                onPress={() => {
                  setModalVisible(false);
                  // Additional action if needed
                }}
                style={{ flex: 1 }}
              >
                Tandai Sudah Diperbaiki
              </Button>
            </View>
          </View>
        </View>
      </Modal>

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
        onPress={navigateToCreate}
        color={theme.colors.onPrimary}
        customSize={isTablet ? 64 : 56}
        animated={true}
        label={isTablet ? "Buat Laporan" : "Laporkan"}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  calloutView: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 10,
    width: 150,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  calloutTitle: {
    fontWeight: "bold",
    fontSize: 14,
  },
  calloutSubtitle: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  centeredView: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    maxHeight: "80%",
    width: "100%",
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  closeButton: {
    margin: 0,
  },
  modalContent: {
    paddingBottom: 20,
  },
  reportImage: {
    width: "100%",
    height: 200,
  },
  statusContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  reportDate: {
    fontSize: 14,
    color: "#666",
  },
  reportTitle: {
    fontSize: 22,
    fontWeight: "bold",
    paddingHorizontal: 16,
    marginVertical: 12,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  locationLabel: {
    fontSize: 15,
    fontWeight: "600",
    marginRight: 4,
  },
  locationText: {
    fontSize: 15,
    flex: 1,
  },
  categoryContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  categoryLabel: {
    fontSize: 15,
    fontWeight: "600",
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    paddingHorizontal: 16,
    marginBottom: 8,
    marginTop: 8,
  },
  descriptionText: {
    fontSize: 15,
    paddingHorizontal: 16,
    marginBottom: 20,
    lineHeight: 22,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
});
