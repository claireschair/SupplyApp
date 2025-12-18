import { StyleSheet, TouchableOpacity, Keyboard } from "react-native";
import React, { useState } from "react";

import Spacer from "../../../components/Spacer";
import ThemedText from "../../../components/ThemedText";
import ThemedView from "../../../components/ThemedView";
import { useUser } from "../../../hooks/useUser";
import ThemedTextInput from "../../../components/ThemedTextInput";

const DonationForm = () => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [other, setOther] = useState("");
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
    Keyboard.dismiss();
    setError(null);

    const trimmedOther = other.trim();
    const otherValue = trimmedOther.length > 0 ? trimmedOther : null;

    if (selectedItems.length === 0 && !otherValue) {
      setError("Please select or enter at least one supply item.");
      return;
    }

    try {
      await saveDonation(selectedItems, otherValue);
      setSelectedItems([]);
      setOther("");
      alert("Thank you for your donation!");
    } catch (err) {
      setError(err.message || "Something went wrong.");
    }
  };


  return (
    <ThemedView style={styles.container}>
      <ThemedText title style={styles.heading}>
        Donation Form
      </ThemedText>

      <Spacer height={20} />

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

      {/* OPTIONAL OTHER INPUT */}
      <ThemedTextInput
        style={{ marginBottom: 20, width: "90%" }}
        placeholder="Other (optional, comma-separated if needed)"
        value={other}
        onChangeText={setOther}
      />

      {error && <ThemedText style={styles.error}>{error}</ThemedText>}

      <Spacer height={15} />

      {/* SUBMIT */}
      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <ThemedText style={styles.buttonText}>Submit Donation</ThemedText>
      </TouchableOpacity>

      <Spacer height={10} />

      {/* HIDE KEYBOARD */}
      <TouchableOpacity
        style={styles.hideKeyboardButton}
        onPress={Keyboard.dismiss}
      >
        <ThemedText style={styles.hideKeyboardText}>
          Hide Keyboard ⌄
        </ThemedText>
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
