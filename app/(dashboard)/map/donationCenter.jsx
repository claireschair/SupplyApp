import {
  StyleSheet,
  TouchableOpacity,
  TextInput,
  View,
} from "react-native";
import { useState } from "react";
import MapView, { Marker } from "react-native-maps";

import ThemedView from "../../../components/ThemedView";
import ThemedText from "../../../components/ThemedText";
import Spacer from "../../../components/Spacer";
import { useMap } from "../../../hooks/useMap";

import PlaceSearchInput from "./PlaceSearchInput";

const SelectDonationLocation = () => {
  const { saveDonationCenter } = useMap();

  const [items, setItems] = useState("");
  const [location, setLocation] = useState(null);
  const [placeName, setPlaceName] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError(null);

    if (!location || !placeName) {
      setError("Please type the address of the donation center.");
      return;
    }

    const itemsArray = items
      .split(",")
      .map((i) => i.trim())
      .filter(Boolean);

    try {
      setLoading(true);

      await saveDonationCenter(itemsArray, {
        name: placeName,
        lat: location.latitude,
        lng: location.longitude,
        verified: false,
      });

      setItems("");
      setLocation(null);
      setPlaceName(null);

      alert("Donation center added!");
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.searchOverlay}>
        <PlaceSearchInput
          onSelect={({ name, latitude, longitude }) => {
            setPlaceName(name);
            setLocation({ latitude, longitude });
          }}
        />
      </View>

      <MapView
        style={styles.map}
        region={
          location && {
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }
        }
      >
        {location && <Marker coordinate={location} title={placeName} />}
      </MapView>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Items accepted (optional, comma-separated)"
          value={items}
          onChangeText={setItems}
        />

        {error && <ThemedText style={styles.error}>{error}</ThemedText>}

        <Spacer height={10} />

        <TouchableOpacity
          style={styles.button}
          onPress={handleSubmit}
          disabled={loading}
        >
          <ThemedText style={styles.buttonText}>
            {loading ? "Adding..." : "Add Donation Center"}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
};

export default SelectDonationLocation;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchOverlay: {
    position: "absolute",
    top: 50,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  map: {
    flex: 1,
  },
  form: {
    padding: 16,
    backgroundColor: "white",
  },
  input: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "white",
  },
  button: {
    backgroundColor: "#4F46E5",
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  error: {
    color: "red",
    marginTop: 8,
    textAlign: "center",
  },
});
