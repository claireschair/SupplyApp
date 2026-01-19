import { useEffect, useState, useContext } from "react";
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from "react-native";
import { useMatch } from "../../../hooks/useMatch"; 
import Spacer from "../../../components/Spacer";
import ThemedText from "../../../components/ThemedText";
import ThemedView from "../../../components/ThemedView";

const DonationList = () => {
  const { user, getRequestsWithMatches, updateMatchStatus } = useMatch();
  const [donationsWithMatches, setDonationsWithMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [contactInfo, setContactInfo] = useState({ email: "", phone: "" });

  const loadMatches = async () => {
    setLoading(true);
    try {
      const requests = await getRequestsWithMatches();
      const matchesForUserDonations = [];

      for (const request of requests) {
        for (const match of request.matches || []) {
          if (match.donation?.userId === user.$id) {
            matchesForUserDonations.push({ request, match });
          }
        }
      }

      setDonationsWithMatches(matchesForUserDonations);
    } catch (err) {
      console.warn("Failed to load matches:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatches();
  }, []);

  const handleApprove = ({ request, match }) => {
    setSelectedMatch({ request, match });
    setContactInfo({ email: "", phone: "" });
    setContactModalVisible(true);
  };

  const confirmApprove = async () => {
    if (!selectedMatch) return;

    if (!contactInfo.phone.trim()) {
      Alert.alert("Required", "Please enter a phone number to approve.");
      return;
    }

    await updateMatchStatus(selectedMatch.match.$id, "approved", {
      email: contactInfo.email || null,
      phone: contactInfo.phone,
    });

    setContactModalVisible(false);
    setSelectedMatch(null);
    loadMatches();
  };

  const handleDeny = async ({ match }) => {
    Alert.alert(
      "Deny Match",
      "Are you sure you want to deny this match?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Deny",
          style: "destructive",
          onPress: async () => {
            await updateMatchStatus(match.$id, "denied");
            loadMatches();
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <Spacer />
        <ThemedText>Loading matches...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Spacer />
      <ThemedText title style={styles.heading}>
        Pending Matches for Your Donations
      </ThemedText>
      <Spacer />

      <ScrollView>
        {donationsWithMatches.length === 0 && (
          <ThemedText>No matches at the moment.</ThemedText>
        )}

        {donationsWithMatches.map(({ request, match }) => {
          if (match.status === "approved") {
            return (
              <View key={match.$id} style={styles.card}>
                <ThemedText style={styles.bold}>
                  Requestor Contact Info
                </ThemedText>
                <ThemedText>
                  Name: {request.userId} {/* Replace with requestor name if available */}
                </ThemedText>
                <ThemedText>Email: {match.requestorEmail || "N/A"}</ThemedText>
                <ThemedText>Phone: {match.requestorPhone || "N/A"}</ThemedText>
                <ThemedText>
                  Requested Items: {request.items.join(", ")}
                </ThemedText>
              </View>
            );
          }

          if (match.status === "pending") {
            return (
              <View key={match.$id} style={styles.card}>
                <ThemedText style={styles.bold}>
                  Requestor: {request.userId} {/* Replace with requestor name if available */}
                </ThemedText>
                <ThemedText>Requested Items: {request.items.join(", ")}</ThemedText>
                <ThemedText>Donation Items: {match.donation.items.join(", ")}</ThemedText>

                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[styles.button, styles.approveButton]}
                    onPress={() => handleApprove({ request, match })}
                  >
                    <ThemedText style={styles.buttonText}>Approve</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.denyButton]}
                    onPress={() => handleDeny({ match })}
                  >
                    <ThemedText style={styles.buttonText}>Deny</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }

          return null;
        })}
      </ScrollView>

      <Modal visible={contactModalVisible} transparent animationType="slide">
        <View style={styles.modalWrapper}>
          <View style={styles.modalContent}>
            <ThemedText title>Enter Contact Info for Approval</ThemedText>
            <ThemedText style={styles.hintText}>
              Please provide your phone number (required) and email (optional)
            </ThemedText>
            <TextInput
              placeholder="Email (optional)"
              style={styles.input}
              placeholderTextColor="#666"
              value={contactInfo.email}
              onChangeText={(t) => setContactInfo((p) => ({ ...p, email: t }))}
            />
            <TextInput
              placeholder="Phone (required)"
              style={styles.input}
              placeholderTextColor="#666"
              value={contactInfo.phone}
              onChangeText={(t) => setContactInfo((p) => ({ ...p, phone: t }))}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setContactModalVisible(false)}
              >
                <ThemedText>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={confirmApprove}
              >
                <ThemedText>Confirm</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
};

export default DonationList;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15 },
  heading: { fontSize: 20, fontWeight: "bold", textAlign: "center" },
  card: {
    backgroundColor: "#f5f5f5",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  bold: { fontWeight: "bold" },
  buttonRow: { flexDirection: "row", justifyContent: "space-around", marginTop: 10 },
  button: { padding: 10, borderRadius: 8 },
  approveButton: { backgroundColor: "#4CAF50" },
  denyButton: { backgroundColor: "#F44336" },
  buttonText: { color: "white", fontWeight: "bold" },
  modalWrapper: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
  },
  hintText: { color: "#222", marginTop: 5, marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginVertical: 8,
    borderRadius: 8,
    color: "#000",
  },
  modalButtons: { flexDirection: "row", justifyContent: "space-between", marginTop: 15 },
  modalButton: { flex: 1, padding: 10, borderRadius: 8, alignItems: "center", marginHorizontal: 5 },
  cancelButton: { backgroundColor: "#ccc" },
  confirmButton: { backgroundColor: "#4CAF50" },
});
