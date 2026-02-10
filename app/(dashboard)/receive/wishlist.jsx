import { StyleSheet, TextInput, TouchableOpacity, View, Keyboard, Alert } from 'react-native';
import { useState, useEffect, useContext } from 'react';

import Spacer from "../../../components/Spacer";
import ThemedText from "../../../components/ThemedText";
import ThemedView from "../../../components/ThemedView";
import { useWishlist } from "../../../hooks/useWishlist";
import { UserContext } from '../../../contexts/UserContext';
import { database } from '../../../lib/appwrite';
import { Query } from 'react-native-appwrite';

const Wishlist = () => {
  const [name, setName] = useState("");
  const [amazon, setAmazon] = useState("");
  const [items, setItems] = useState([]);
  const [itemInput, setItemInput] = useState("");
  const [error, setError] = useState(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isTeacher, setIsTeacher] = useState(null);
  const [loading, setLoading] = useState(true);

  const { saveWishlist } = useWishlist();
  const { user } = useContext(UserContext);

  useEffect(() => {
    const checkUserLabel = () => {
      if (!user) {
        setLoading(false);
        return;
      }

      // The label is directly on the user object
      const userLabel = user.label;
      console.log("User label:", userLabel);
      setIsTeacher(userLabel === "teacher");
      setLoading(false);
    };

    checkUserLabel();
  }, [user]);

  const handleAddItem = () => {
    if (itemInput.trim()) {
      setItems([...items, itemInput.trim()]);
      setItemInput("");
    }
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setError(null);

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!amazon.trim()) {
      setError("Please enter your Amazon wishlist link.");
      return;
    }

    try {
      await saveWishlist(name, amazon, items);
      setName("");
      setAmazon("");
      setItems([]);
      setItemInput("");
      Alert.alert("Success", "Thank you for submitting your wishlist!");
    } catch (err) {
      setError(err.message || "Something went wrong.");
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Spacer />
      <ThemedText title style={styles.heading}>
        Add to Your Wishlist
      </ThemedText>

      <Spacer height={20} />

      {loading ? (
        <View style={styles.centerContent}>
          <ThemedText>Loading...</ThemedText>
        </View>
      ) : !user ? (
        <View style={styles.centerContent}>
          <ThemedText style={styles.warningText}>
            Please log in to create a wishlist.
          </ThemedText>
        </View>
      ) : !isTeacher ? (
        <View style={styles.centerContent}>
          <ThemedText style={styles.warningText}>
            Only teachers can create wishlists.
          </ThemedText>
          <Spacer height={10} />
          <ThemedText style={styles.subtleText}>
            If you are a teacher, please contact support to update your account.
          </ThemedText>
        </View>
      ) : (
        <View style={styles.formWrapper}>
          <ThemedText style={styles.label}>Name</ThemedText>
          <Spacer height={8} />
          <TextInput
            style={styles.input}
            placeholder="Enter your name"
            value={name}
            onChangeText={setName}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />

          <Spacer height={20} />

          <ThemedText style={styles.label}>Amazon Wishlist Link</ThemedText>
          <Spacer height={8} />
          <TextInput
            style={styles.input}
            placeholder="https://www.amazon.com/..."
            value={amazon}
            onChangeText={setAmazon}
            keyboardType="url"
            autoCapitalize="none"
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />

          <Spacer height={20} />

          <ThemedText style={styles.label}>Specific Items (Optional)</ThemedText>
          <Spacer height={8} />
          
          <View style={styles.itemInputWrapper}>
            <TextInput
              style={[styles.input, styles.itemInput]}
              placeholder="e.g., Desk organizer"
              value={itemInput}
              onChangeText={setItemInput}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onSubmitEditing={handleAddItem}
              returnKeyType="done"
            />
            <TouchableOpacity 
              style={styles.addButton} 
              onPress={handleAddItem}
            >
              <ThemedText style={styles.addButtonText}>Add</ThemedText>
            </TouchableOpacity>
          </View>

          {items.length > 0 && (
            <View style={styles.itemsList}>
              {items.map((item, index) => (
                <View key={index} style={styles.itemChip}>
                  <ThemedText style={styles.itemText}>{item}</ThemedText>
                  <TouchableOpacity onPress={() => handleRemoveItem(index)}>
                    <ThemedText style={styles.removeButton}>✕</ThemedText>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {isFocused && (
            <View style={styles.keyboardButtonWrapper}>
              <TouchableOpacity style={styles.keyboardButton} onPress={Keyboard.dismiss}>
                <ThemedText style={styles.keyboardButtonText}>Hide Keyboard ⬇︎</ThemedText>
              </TouchableOpacity>
            </View>
          )}

          <Spacer height={15} />

          {error && (
            <>
              <ThemedText style={styles.error}>{error}</ThemedText>
              <Spacer height={10} />
            </>
          )}

          <TouchableOpacity style={styles.button} onPress={handleSubmit}>
            <ThemedText style={styles.buttonText}>Submit Wishlist</ThemedText>
          </TouchableOpacity>
        </View>
      )}

      <Spacer />
    </ThemedView>
  );
};

export default Wishlist;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  warningText: {
    fontSize: 16,
    textAlign: "center",
    color: "#d32f2f",
    fontWeight: "600",
  },
  subtleText: {
    fontSize: 14,
    textAlign: "center",
    color: "#666",
  },
  heading: {
    fontWeight: "bold",
    fontSize: 20,
    textAlign: "center",
  },
  formWrapper: {
    backgroundColor: "#f5f5f5",
    padding: 20,
    borderRadius: 12,
  },
  label: {
    fontWeight: "600",
    fontSize: 14,
  },
  input: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#111",
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  itemInputWrapper: {
    flexDirection: "row",
    gap: 10,
  },
  itemInput: {
    flex: 1,
  },
  addButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    justifyContent: "center",
    borderRadius: 8,
  },
  addButtonText: {
    color: "white",
    fontWeight: "600",
  },
  itemsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  itemChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E0F0FF",
    borderRadius: 20,
    paddingVertical: 6,
    paddingLeft: 12,
    paddingRight: 8,
    gap: 8,
  },
  itemText: {
    fontSize: 14,
    color: "#007AFF",
  },
  removeButton: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "bold",
  },
  keyboardButtonWrapper: {
    alignItems: "center",
    marginTop: 10,
  },
  keyboardButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "white",
  },
  keyboardButtonText: {
    fontSize: 14,
  },
  error: {
    color: "#d32f2f",
    fontSize: 14,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});