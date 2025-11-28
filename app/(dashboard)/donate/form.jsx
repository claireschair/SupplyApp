import { StyleSheet, TextInput, TouchableOpacity, Keyboard } from "react-native";
import React, { useState } from "react";

import Spacer from "../../../components/Spacer";
import ThemedText from "../../../components/ThemedText";
import ThemedView from "../../../components/ThemedView";
import { useUser } from "../../../hooks/useUser";

const DonationForm = () => {
  const [zipcode, setZipcode] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [error, setError] = useState(null);

  const { saveDonation } = useUser();

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

  const handleSubmit = async () => {
    Keyboard.dismiss();  // 👈 HIDE KEYBOARD

    setError(null);

    if (zipcode.length !== 5) {
      setError("Please enter a valid 5-digit ZIP code.");
      return;
    }

    if (selectedItems.length === 0) {
      setError("Please select at least one supply item.");
      return;
    }

    try {
      await saveDonation(zipcode, selectedItems);
      setZipcode("");
      setSelectedItems([]);
      alert("Thank you for your donation!");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText title={true} style={styles.heading}>
        Donation Form
      </ThemedText>

      <Spacer height={20} />

      {/* ZIP CODE INPUT */}
      <ThemedText>ZIP Code:</ThemedText>
      <TextInput
        style={styles.input}
        placeholder="Enter ZIP code"
        keyboardType="numeric"
        value={zipcode}
        onChangeText={setZipcode}
        maxLength={5}
        returnKeyType="done"
        onSubmitEditing={handleSubmit}  // 👈 SUBMIT WHEN USER PRESSES "Done"
      />

      <Spacer height={20} />

      {/* MULTI SELECT ITEMS */}
      <ThemedText>Select Supplies to Donate:</ThemedText>
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

      {/* ERROR */}
      {error && <ThemedText style={styles.error}>{error}</ThemedText>}

      <Spacer height={15} />

      {/* SUBMIT BUTTON */}
      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <ThemedText style={styles.buttonText}>Submit Donation</ThemedText>
      </TouchableOpacity>

      <Spacer height={10} />

      {/* HIDE KEYBOARD BUTTON */}
      <TouchableOpacity
        style={styles.hideKeyboardButton}
        onPress={() => Keyboard.dismiss()}
      >
        <ThemedText style={styles.hideKeyboardText}>Hide Keyboard ⌄</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
};

export default DonationForm;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: "center",
  },
  heading: {
    fontWeight: "bold",
    fontSize: 22,
    textAlign: "center",
  },
  input: {
    width: "90%",
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 10,
    marginTop: 5,
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
  },
  button: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 12,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },

  hideKeyboardButton: {
    marginTop: 10,
    padding: 8,
    borderRadius: 10,
    backgroundColor: "#ccc",
  },
  hideKeyboardText: {
    fontSize: 14,
    color: "black",
  },
});
