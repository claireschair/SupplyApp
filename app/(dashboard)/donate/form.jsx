import { StyleSheet, TouchableOpacity, Keyboard, ScrollView, View, TouchableWithoutFeedback, Alert, TextInput } from "react-native";
import React, { useState } from "react";
import Spacer from "../../../components/Spacer";
import ThemedText from "../../../components/ThemedText";
import ThemedView from "../../../components/ThemedView";
import ThemedTextInput from "../../../components/ThemedTextInput";
import { useMatch } from "../../../hooks/useMatch";
import * as Location from "expo-location";
import { useRouter } from "expo-router";

const DonationForm = () => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [otherItems, setOtherItems] = useState([]);
  const [otherInput, setOtherInput] = useState("");
  const [selectionMethod, setSelectionMethod] = useState(null);
  const [zipCode, setZipCode] = useState("");
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);

  const { saveDonation } = useMatch();
  const router = useRouter();

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

  const handleAddOtherItem = () => {
    if (otherInput.trim()) {
      setOtherItems([...otherItems, otherInput.trim()]);
      setOtherInput("");
    }
  };

  const handleRemoveOtherItem = (index) => {
    setOtherItems(otherItems.filter((_, i) => i !== index));
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

    if (selectedItems.length === 0 && otherItems.length === 0) {
      setError("Please select or add at least one supply item.");
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
      await saveDonation(selectedItems, otherItems, {
        zipCode: selectionMethod === "zip" ? zipInt : null,
        lat: selectionMethod === "location" ? location.latitude : null,
        lng: selectionMethod === "location" ? location.longitude : null,
      });

      setSelectedItems([]);
      setOtherItems([]);
      setOtherInput("");
      setZipCode("");
      setLocation(null);
      setSelectionMethod(null);

      Alert.alert(
        "Thank you!",
        "Thank you for your donation!",
        [
          {
            text: "OK",
            onPress: () => router.replace("/donate/donationlist"),
          },
        ],
        { cancelable: false }
      );
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
          <Spacer height={90} />
          <ThemedText title style={styles.heading}>
            Donation Form
          </ThemedText>

          <Spacer height={20} />

          <ThemedText>Select Supplies to Donate:</ThemedText>
          <Spacer height={10} />

          <View style={styles.supplyContainer}>
            <View style={styles.column}>
                {supplyOptions.slice(0, 4).map((item) => (
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
              </View>

              <View style={styles.column}>
                {supplyOptions.slice(4).map((item) => (
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
              </View>
            </View>


          <Spacer height={15} />

          <ThemedText>Add Other Items (Optional):</ThemedText>
          <Spacer height={10} />

          <View style={styles.otherInputWrapper}>
            <TextInput
              style={[styles.otherInput, { color: "#111" }]}
              placeholder="e.g., Glue sticks"
              value={otherInput}
              onChangeText={setOtherInput}
              onSubmitEditing={handleAddOtherItem}
              returnKeyType="done"
            />
            <TouchableOpacity 
              style={styles.addButton} 
              onPress={handleAddOtherItem}
            >
              <ThemedText style={styles.addButtonText}>Add</ThemedText>
            </TouchableOpacity>
          </View>

          {otherItems.length > 0 && (
            <View style={styles.otherItemsList}>
              {otherItems.map((item, index) => (
                <View key={index} style={styles.otherItemChip}>
                  <ThemedText style={styles.otherItemText}>{item}</ThemedText>
                  <TouchableOpacity onPress={() => handleRemoveOtherItem(index)}>
                    <ThemedText style={styles.removeButton}>✕</ThemedText>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <Spacer height={20} />
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
            <ThemedText style={styles.buttonText}>Submit Donation</ThemedText>
          </TouchableOpacity>

          <Spacer height={20} />
        </ScrollView>
      </TouchableWithoutFeedback>
    </ThemedView>
  );
};

export default DonationForm;


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#bcd7f5ff', 
  },
  scrollContent: {
    padding: 20,
    alignItems: 'center',
  },
  heading: {
    fontWeight: 'bold',
    fontSize: 28,
    color: '#1F2A37',
    textAlign: 'center',
  },
  supplyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '85%',
    gap: 10,
    marginTop: 10,
  },
  column: {
    flex: 1,
    gap: 10,
  },
  itemButton: {
    paddingVertical: 14,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    alignItems: 'center',
  },
  itemSelected: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
    shadowOpacity: 0.2,
  },
  itemText: {
    textAlign: 'center',
    color: '#333',
    fontWeight: '500',
  },
  itemTextSelected: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: 'bold',
  },
  otherInputWrapper: {
    flexDirection: 'row',
    width: '90%',
    gap: 10,
    marginTop: 10,
  },
  otherInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  addButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 20,
    borderRadius: 20,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  otherItemsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    width: '90%',
  },
  otherItemChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCEEFF',
    borderRadius: 20,
    paddingVertical: 6,
    paddingLeft: 12,
    paddingRight: 8,
    gap: 8,
  },
  otherItemText: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '500',
  },
  removeButton: {
    fontSize: 16,
    color: '#4A90E2',
    fontWeight: 'bold',
  },
  radioContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
    marginTop: 10,
  },
  radioButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
    marginHorizontal: 5,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  radioSelected: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  radioText: {
    color: '#333',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#4A90E2',
    paddingVertical: 16,
    paddingHorizontal: 25,
    borderRadius: 30,
    marginVertical: 15,
    width: '90%',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    textAlign: 'center',
  },
  error: {
    color: 'red',
    fontSize: 14,
    marginBottom: 10,
    marginTop: 5,
  },
  sectionCard: {
    width: '95%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
},
});
