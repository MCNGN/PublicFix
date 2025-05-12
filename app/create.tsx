import * as ImagePicker from "expo-image-picker";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import * as React from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import {
  Button,
  Dialog,
  IconButton,
  List,
  Portal,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import { Dropdown } from "react-native-paper-dropdown";

const OPTIONS = [
  { label: "Jalan Berlubang", value: "pothole" },
  { label: "Aspal Retak", value: "cracks" },
  { label: "Permukaan Tidak Rata", value: "uneven" },
  { label: "Bahu Jalan Rusak", value: "shoulder" },
  { label: "Drainase Tersumbat", value: "drainage" },
  { label: "Trotoar Rusak", value: "sidewalk" },
  { label: "Lampu Jalan Tidak Berfungsi", value: "streetlight" },
  { label: "Rambu Lalu Lintas Rusak", value: "trafficsign" },
  { label: "Jembatan Rusak", value: "bridge" },
  { label: "Longsor", value: "landslide" },
];

export default function Create() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const theme = useTheme();

  // Get current window dimensions for responsive layout
  const { width } = useWindowDimensions();

  // Calculate responsive values
  const isTablet = width >= 768;
  const contentPadding = isTablet ? "px-8" : "px-4";
  const imageHeight = isTablet ? "h-72" : "h-48";

  // Get location data from URL params
  const prefilledStreet =
    typeof params.street === "string" ? params.street : "";
  const prefilledLocation =
    typeof params.location === "string" ? params.location : "";
  const latitude = typeof params.latitude === "string" ? params.latitude : "";
  const longitude =
    typeof params.longitude === "string" ? params.longitude : "";

  // Form state with prefilled values
  const [street, setStreet] = React.useState(prefilledStreet);
  const [description, setDescription] = React.useState("");
  const [lokasi, setLokasi] = React.useState(prefilledLocation);
  const [loading, setLoading] = React.useState(false);

  const [category, setCategory] = React.useState<string>();

  // Image state
  const [image, setImage] = React.useState<string | null>(null);

  // Add a state to control the image source dialog
  const [imagePickerVisible, setImagePickerVisible] = React.useState(false);

  // Update form if params change
  React.useEffect(() => {
    if (prefilledStreet) setStreet(prefilledStreet);
    if (prefilledLocation) setLokasi(prefilledLocation);
  }, [prefilledStreet, prefilledLocation]);

  // Function to pick image from gallery
  const pickImageFromGallery = async () => {
    setImagePickerVisible(false);

    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Please allow access to your photo library to upload images."
        );
        return;
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image from gallery.");
    }
  };

  // Function to take a picture with camera
  const takePhoto = async () => {
    setImagePickerVisible(false);

    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Please allow camera access to take photos."
        );
        return;
      }

      let result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Failed to take photo with camera.");
    }
  };

  // Update your existing pickImage function to show the dialog
  const pickImage = () => {
    setImagePickerVisible(true);
  };

  const handleSubmit = async () => {
    // Validate form
    if (!street.trim()) {
      alert("Masukkan nama jalan");
      return;
    }

    if (!description.trim()) {
      alert("Masukkan deskripsi kerusakan");
      return;
    }

    if (!lokasi.trim()) {
      alert("Masukkan lokasi");
      return;
    }

    if (!category) {
      alert("Pilih kategori kerusakan");
      return;
    }

    if (!image) {
      alert("Unggah foto kerusakan");
      return;
    }

    try {
      setLoading(true);

      // Get current date in DD-MM-YYYY format
      const today = new Date();
      const day = String(today.getDate()).padStart(2, "0");
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const year = today.getFullYear();
      const formattedDate = `${day}-${month}-${year}`;

      // Create a form data object to send the image and all report data together
      const formData = new FormData();

      // Add the image to form data
      const imageUri =
        Platform.OS === "android" ? image : image.replace("file://", "");

      const imageFileName = imageUri.split("/").pop();
      const imageType = "image/" + (imageUri.match(/\.(\w+)$/)?.[1] || "jpeg");

      // Add image file directly to the form data - fix the format for React Native
      formData.append("image", {
        uri: imageUri,
        name: imageFileName || "photo.jpg",
        type: imageType,
        // These are important for React Native FormData to work correctly with files
      } as any);

      // Add all report data to the form data
      formData.append("street", street);
      formData.append("description", description);
      formData.append("location", lokasi);
      formData.append("category", category);
      formData.append("date", formattedDate);

      if (latitude) formData.append("latitude", latitude);
      if (longitude) formData.append("longitude", longitude);

      // Skip token check - send the report directly
      const response = await fetch(
        "https://publicfix-backend.vercel.app/api/reports",
        {
          method: "POST",
          headers: {
            // Note: Don't set Content-Type when sending FormData
            // The browser will set the correct content type with boundary
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;
        try {
          // Try to parse as JSON first
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || "Failed to submit report";
        } catch {
          // If not JSON, use the raw text
          errorMessage = errorText || "Failed to submit report";
        }
        throw new Error(errorMessage);
      }

      // Success!
      alert("Laporan berhasil disimpan");
      router.push("/"); // Navigate back to home screen
    } catch (error) {
      console.error("Error saving report:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Silakan coba lagi.";
      alert(`Gagal menyimpan laporan: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: theme.colors.background }}
    >
      <Stack.Screen
        options={{
          title: "Buat Laporan",
          headerTitleStyle: { fontWeight: "bold" },
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTintColor: theme.colors.onSurface,
        }}
      />

      {/* Image Source Dialog */}
      <Portal>
        <Dialog
          visible={imagePickerVisible}
          onDismiss={() => setImagePickerVisible(false)}
          style={{ backgroundColor: theme.colors.surface }}
        >
          <Dialog.Title style={{ color: theme.colors.onSurface }}>
            Pilih Sumber Foto
          </Dialog.Title>
          <Dialog.Content>
            <List.Item
              title="Kamera"
              titleStyle={{ color: theme.colors.onSurface }}
              left={(props) => (
                <List.Icon
                  {...props}
                  icon="camera"
                  color={theme.colors.primary}
                />
              )}
              onPress={takePhoto}
              style={{ paddingVertical: 8 }}
            />
            <List.Item
              title="Galeri"
              titleStyle={{ color: theme.colors.onSurface }}
              left={(props) => (
                <List.Icon
                  {...props}
                  icon="image"
                  color={theme.colors.primary}
                />
              )}
              onPress={pickImageFromGallery}
              style={{ paddingVertical: 8 }}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setImagePickerVisible(false)}>Batal</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="flex-1" showsHorizontalScrollIndicator={false}>
          <View
            className={`flex-1 py-4 ${contentPadding} ${
              isTablet ? "max-w-3xl mx-auto" : ""
            }`}
          >
            {/* Image Upload Section - Same as before but with updated text */}
            <Text
              variant={isTablet ? "titleLarge" : "titleMedium"}
              className="mb-2"
              style={{ fontWeight: "bold", color: theme.colors.onBackground }}
            >
              Foto
            </Text>
            <TouchableOpacity
              onPress={pickImage}
              className={`${imageHeight} mb-4 items-center justify-center`}
              style={{
                borderWidth: 2,
                borderStyle: "dashed",
                borderColor: theme.dark ? "#444444" : "#D1D5DB",
                borderRadius: 8,
              }}
            >
              {image ? (
                <Image
                  source={{ uri: image }}
                  className="w-full h-full rounded-lg"
                  resizeMode="cover"
                />
              ) : (
                <View className="items-center">
                  <IconButton
                    icon="camera"
                    size={isTablet ? 56 : 40}
                    iconColor={theme.colors.primary}
                  />
                  <Text
                    variant={isTablet ? "bodyLarge" : "bodyMedium"}
                    style={{
                      color: theme.colors.onSurface,
                      textAlign: "center",
                    }}
                  >
                    Ambil foto atau pilih dari galeri
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Rest of your form remains the same */}

            {/* Add a replace button if image exists */}
            {image && (
              <Button
                mode="text"
                onPress={pickImage}
                style={{ marginTop: -8, marginBottom: 8 }}
                textColor={theme.colors.primary}
              >
                Ganti Foto
              </Button>
            )}

            {/* Form in a responsive grid on tablets */}
            <View className={isTablet ? "flex-row flex-wrap" : ""}>
              {/* Nama Jalan */}
              <View className={`mb-4 ${isTablet ? "w-1/2 pr-2" : "w-full"}`}>
                <Text
                  variant={isTablet ? "titleMedium" : "titleSmall"}
                  className="mb-2"
                  style={{
                    fontWeight: "bold",
                    color: theme.colors.onBackground,
                  }}
                >
                  Nama Jalan
                </Text>
                <TextInput
                  placeholder="Masukkan nama jalan"
                  placeholderTextColor={theme.colors.onSurfaceVariant}
                  value={street}
                  onChangeText={setStreet}
                  mode="outlined"
                  theme={theme}
                />
              </View>

              {/* Lokasi */}
              <View className={`mb-4 ${isTablet ? "w-1/2 pl-2" : "w-full"}`}>
                <Text
                  variant={isTablet ? "titleMedium" : "titleSmall"}
                  className="mb-2"
                  style={{
                    fontWeight: "bold",
                    color: theme.colors.onBackground,
                  }}
                >
                  Kota/Kabupaten
                </Text>
                <TextInput
                  placeholder="Masukkan kota atau kabupaten"
                  placeholderTextColor={theme.colors.onSurfaceVariant}
                  value={lokasi}
                  onChangeText={setLokasi}
                  mode="outlined"
                  theme={theme}
                />
              </View>
            </View>

            {/* Map Location Display */}
            <View className="mb-4">
              <Text
                variant="titleMedium"
                className="mb-2"
                style={{ fontWeight: "bold", color: theme.colors.onBackground }}
              >
                Lokasi Peta
              </Text>
              <View
                className={`${
                  isTablet ? "h-48" : "h-36"
                } rounded-lg overflow-hidden mb-2`}
              >
                <MapView
                  style={{ width: "100%", height: "100%" }}
                  initialRegion={{
                    latitude: parseFloat(latitude) || 37.78825,
                    longitude: parseFloat(longitude) || -122.4324,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                  }}
                  scrollEnabled={false}
                  zoomEnabled={false}
                  rotateEnabled={false}
                  userInterfaceStyle={theme.dark ? "dark" : "light"}
                >
                  {latitude && longitude && (
                    <Marker
                      coordinate={{
                        latitude: parseFloat(latitude),
                        longitude: parseFloat(longitude),
                      }}
                      pinColor="#3B82F6"
                    />
                  )}
                </MapView>
              </View>
              <Text
                className="text-xs mb-2"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                {latitude && longitude
                  ? `Koordinat: ${parseFloat(latitude).toFixed(
                      6
                    )}, ${parseFloat(longitude).toFixed(6)}`
                  : "Koordinat tidak tersedia"}
              </Text>
            </View>

            {/* Deskripsi - full width */}
            <View className="mb-4">
              <Text
                variant="titleMedium"
                className="mb-2"
                style={{ fontWeight: "bold", color: theme.colors.onBackground }}
              >
                Deskripsi
              </Text>
              <TextInput
                placeholder="Ceritakan laporan disini..."
                placeholderTextColor={theme.colors.onSurfaceVariant}
                value={description}
                onChangeText={setDescription}
                mode="outlined"
                multiline={true}
                numberOfLines={3}
                style={{ minHeight: 80 }}
                className="mt-4"
                theme={theme} // Pass theme to TextInput
              />
            </View>

            {/* Category Dropdown - with theme support */}
            <View className="mb-4">
              <Text
                variant="titleMedium"
                className="mb-2"
                style={{ fontWeight: "bold", color: theme.colors.onBackground }}
              >
                Kategori
              </Text>
              <Dropdown
                label={category ? "" : "Pilih Kategori"}
                mode={"outlined"}
                value={category}
                onSelect={setCategory}
                options={OPTIONS}
              />
            </View>

            {/* Submit Button */}
            <View style={{ marginTop: "auto", paddingVertical: 16 }}>
              <Button
                mode="contained"
                onPress={handleSubmit}
                loading={loading}
                disabled={loading}
                style={{ backgroundColor: theme.colors.primary }}
                textColor={theme.colors.onPrimary}
              >
                Simpan Laporan
              </Button>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
