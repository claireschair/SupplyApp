import { StyleSheet, TouchableOpacity, Keyboard, ScrollView, View, TouchableWithoutFeedback } from "react-native";
import React, { useState } from "react";
import Spacer from "../../../components/Spacer";
import ThemedText from "../../../components/ThemedText";
import ThemedView from "../../../components/ThemedView";
import ThemedTextInput from "../../../components/ThemedTextInput";
import { useUser } from "../../../hooks/useUser";
import * as Location from "expo-location";

const ReceiveForm = () => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [other, setOther] = useState("");
  const [selectionMethod, setSelectionMethod] = useState(null);
  const [zipCode, setZipCode] = useState("");
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);

  const { saveRequest } = useUser();

  const supplyOptions = [
    "Backpacks",
    "Notebooks",
    "Pencils",
    "Pens",
    "Markers",
    "Crayons",
    "Binders",
    "Folders",
  ];

  const toggleItem = (item) => {
    setSelectedItems((prev) =>
      prev.includes(item)
        ? prev.filter((i) => i !== item)
        : [...prev, item]
    );
  };

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("Location permission denied.");
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      setError(null);
    } catch (err) {
      setError("Failed to get location.");
      console.log(err);
    }
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();
    setError(null);

    const otherArray = other
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    if (selectedItems.length === 0 && otherArray.length === 0) {
      setError("Please select or enter at least one supply item.");
      return;
    }

    if (!selectionMethod) {
      setError("Please choose a matching method: Zip Code or Location.");
      return;
    }

    let zipInt = null;
    if (selectionMethod === "zip") {
      if (zipCode.trim().length === 0) {
        setError("Please enter a zip code.");
        return;
      }
      zipInt = parseInt(zipCode.trim(), 10);
      if (isNaN(zipInt)) {
        setError("Zip code must be a valid number.");
        return;
      }
    }

    if (selectionMethod === "location") {
      if (!location) {
        setError("Please select your current location.");
        return;
      }
    }

    try {
      await saveRequest(selectedItems, otherArray, {
        zipCode: selectionMethod === "zip" ? zipInt : null,
        lat: selectionMethod === "location" ? location.latitude : null,
        lng: selectionMethod === "location" ? location.longitude : null,
      });

      setSelectedItems([]);
      setOther("");
      setZipCode("");
      setLocation(null);
      setSelectionMethod(null);

      alert("Thank you for your request!");
    } catch (err) {
      setError(err.message || "Something went wrong.");
    }
  };

  return (
    <ThemedView style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <ThemedText title style={styles.heading}>
            Receive Form
          </ThemedText>

          <Spacer height={20} />

          <ThemedText>Select Supplies Needed:</ThemedText>
          <Spacer height={10} />

          {supplyOptions.map((item) => (
            <TouchableOpacity
              key={item}
              onPress={() => toggleItem(item)}
              style={[
                styles.itemButton,
                selectedItems.includes(item) && styles.itemSelected,
              ]}
            >
              <ThemedText
                style={
                  selectedItems.includes(item)
                    ? styles.itemTextSelected
                    : styles.itemText
                }
              >
                {item}
              </ThemedText>
            </TouchableOpacity>
          ))}

          <Spacer height={15} />

          <ThemedTextInput
            style={{ marginBottom: 20, width: "90%" }}
            placeholder="Other (optional, comma-separated)"
            value={other}
            onChangeText={setOther}
          />

          <Spacer height={10} />
          <ThemedText>Choose Matching Method:</ThemedText>
          <Spacer height={10} />

          <View style={styles.radioContainer}>
            <TouchableOpacity
              style={[
                styles.radioButton,
                selectionMethod === "zip" && styles.radioSelected,
              ]}
              onPress={() => setSelectionMethod("zip")}
            >
              <ThemedText style={styles.radioText}>Use Zip Code</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.radioButton,
                selectionMethod === "location" && styles.radioSelected,
              ]}
              onPress={() => setSelectionMethod("location")}
            >
              <ThemedText style={styles.radioText}>Use Current Location</ThemedText>
            </TouchableOpacity>
          </View>

          <Spacer height={10} />

          {selectionMethod === "zip" && (
            <ThemedTextInput
              style={{ marginBottom: 15, width: "90%" }}
              placeholder="Enter Zip Code"
              value={zipCode}
              onChangeText={setZipCode}
              keyboardType="numeric"
            />
          )}

          {selectionMethod === "location" && (
            <TouchableOpacity style={styles.button} onPress={getLocation}>
              <ThemedText style={styles.buttonText}>
                {location ? "Location Selected!" : "Use Current Location"}
              </ThemedText>
            </TouchableOpacity>
          )}

          {error && <ThemedText style={styles.error}>{error}</ThemedText>}

          <Spacer height={15} />

          <TouchableOpacity style={styles.button} onPress={handleSubmit}>
            <ThemedText style={styles.buttonText}>Submit Request</ThemedText>
          </TouchableOpacity>

          <Spacer height={20} />
        </ScrollView>
      </TouchableWithoutFeedback>
    </ThemedView>
  );
};

export default ReceiveForm;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    alignItems: "center",
  },
  heading: {
    fontWeight: "bold",
    fontSize: 22,
    textAlign: "center",
  },
  itemButton: {
    width: "90%",
    padding: 12,
    marginVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  itemSelected: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  itemText: {
    textAlign: "center",
    color: "black",
  },
  itemTextSelected: {
    textAlign: "center",
    color: "white",
    fontWeight: "bold",
  },
  error: {
    color: "red",
    fontSize: 14,
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 12,
    marginVertical: 5,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
    textAlign: "center",
  },
  radioContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "90%",
  },
  radioButton: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    width: "48%",
    alignItems: "center",
  },
  radioSelected: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  radioText: {
    color: "black",
    fontWeight: "bold",
  },
});
