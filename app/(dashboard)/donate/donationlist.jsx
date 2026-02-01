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
import { UserContext } from "../../../contexts/UserContext";
import { database } from "../../../lib/appwrite";
import Spacer from "../../../components/Spacer";
import ThemedText from "../../../components/ThemedText";
import ThemedView from "../../../components/ThemedView";

const ITEMS_DATABASE_ID = "69276d130021687546df";
const MATCHES_COLLECTION_ID = "matches";

const DonationList = () => {
  const { user } = useContext(UserContext);
  const { getDonationsWithMatches, approveDonation, denyDonation } = useMatch();
  const [donationsWithMatches, setDonationsWithMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [contactInfo, setContactInfo] = useState({ email: "", phone: "" });

  const loadMatches = async () => {
    setLoading(true);
    try {
      const donations = await getDonationsWithMatches();
      setDonationsWithMatches(donations || []);
    } catch (err) {
      console.warn("Failed to load matches:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatches();

    const unsubscribe = database.client.subscribe(
      `databases.${ITEMS_DATABASE_ID}.collections.${MATCHES_COLLECTION_ID}.documents`,
      (response) => {
        console.log("Match update detected, reloading...");
        loadMatches();
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  const handleApprove = (donation, match) => {
    setSelectedMatch({ donation, match });
    setContactInfo({ email: "", phone: "" });
    setContactModalVisible(true);
  };

  const confirmApprove = async () => {
    if (!selectedMatch) return;

    if (!contactInfo.phone.trim()) {
      Alert.alert("Required", "Please enter a phone number to approve.");
      return;
    }

    try {
      await approveDonation(selectedMatch.match.$id, {
        email: contactInfo.email || null,
        phone: contactInfo.phone,
      });

      Alert.alert(
        "Match Approved!",
        "The requestor will now provide their contact info. Once they do, you'll see their information here."
      );
      setContactModalVisible(false);
      setSelectedMatch(null);
    } catch (err) {
      console.error("Error approving match:", err);
      Alert.alert("Error", err.message || "Failed to approve match.");
    }
  };

  const handleDeny = async (donation, match) => {
    Alert.alert(
      "Deny Match Request",
      "Are you sure you want to deny this request? The requestor will be able to select a different match.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Deny",
          style: "destructive",
          onPress: async () => {
            try {
              await denyDonation(match.$id);
              Alert.alert(
                "Request Denied",
                "The match has been removed. Your donation is now available for other requests."
              );
            } catch (err) {
              console.error("Error denying match:", err);
              Alert.alert("Error", "Failed to deny match.");
            }
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

  const allMatches = donationsWithMatches.flatMap((donation) =>
    (donation.matches || []).map((match) => ({ donation, match }))
  );

  return (
    <ThemedView style={styles.container}>
      <Spacer />
      <ThemedText title style={styles.heading}>
        Match Requests for Your Donations
      </ThemedText>
      <Spacer />

      <ScrollView>
        {allMatches.length === 0 && (
          <ThemedText>No match requests at the moment.</ThemedText>
        )}

        {allMatches.map(({ donation, match }) => {
          if (match.status === "approved" && !match.requestorPhone) {
            return (
              <View key={match.$id} style={styles.card}>
                <ThemedText style={styles.approvedTitle}>
                  Match Approved - Waiting for Requestor
                </ThemedText>
                <ThemedText style={styles.subtitle}>
                  Your Donation: {donation.items.join(", ")}
                </ThemedText>
                <ThemedText style={styles.infoText}>
                  You've approved this match. Waiting for the requestor to provide their contact information.
                </ThemedText>
                <Spacer height={8} />
                <ThemedText style={styles.subtle}>
                  Requested Items: {match.request?.items?.join(", ") || "N/A"}
                </ThemedText>
              </View>
            );
          }

          if (match.status === "approved" && match.requestorPhone) {
            return (
              <View key={match.$id} style={styles.card}>
                <ThemedText style={styles.completeTitle}>
                  ✓ Match Complete!
                </ThemedText>
                <ThemedText style={styles.subtitle}>
                  Your Donation: {donation.items.join(", ")}
                </ThemedText>
                <Spacer height={8} />
                <ThemedText style={styles.sectionTitle}>
                  Requestor Contact Info:
                </ThemedText>
                <ThemedText>Email: {match.requestorEmail || "N/A"}</ThemedText>
                <ThemedText>Phone: {match.requestorPhone || "N/A"}</ThemedText>
                <Spacer height={8} />
                <ThemedText style={styles.subtle}>
                  Requested Items: {match.request?.items?.join(", ") || "N/A"}
                </ThemedText>
                <ThemedText style={styles.infoText}>
                  Please coordinate with the requestor to arrange pickup/delivery.
                </ThemedText>
              </View>
            );
          }

          if (match.status === "pending") {
            return (
              <View key={match.$id} style={styles.card}>
                <ThemedText style={styles.pendingTitle}>
                  New Match Request
                </ThemedText>
                <ThemedText style={styles.subtitle}>
                  Your Donation: {donation.items.join(", ")}
                </ThemedText>
                <ThemedText>
                  Requested Items: {match.request?.items?.join(", ") || "N/A"}
                </ThemedText>
                <ThemedText style={styles.scoreText}>
                  Match Score: {match.score || 0}
                </ThemedText>
                <ThemedText style={styles.infoText}>
                  A requestor has selected your donation. Would you like to approve this match?
                </ThemedText>

                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[styles.button, styles.approveButton]}
                    onPress={() => handleApprove(donation, match)}
                  >
                    <ThemedText style={styles.buttonText}>Approve</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.denyButton]}
                    onPress={() => handleDeny(donation, match)}
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
            <ThemedText title>Approve Match</ThemedText>
            <ThemedText style={styles.hintText}>
              Please provide your contact info so the requestor can reach you. Phone number is required.
            </ThemedText>
            <TextInput
              placeholder="Email (optional)"
              style={styles.input}
              placeholderTextColor="#666"
              value={contactInfo.email}
              onChangeText={(t) => setContactInfo((p) => ({ ...p, email: t }))}
              keyboardType="email-address"
            />
            <TextInput
              placeholder="Phone (required)"
              style={styles.input}
              placeholderTextColor="#666"
              value={contactInfo.phone}
              onChangeText={(t) => setContactInfo((p) => ({ ...p, phone: t }))}
              keyboardType="phone-pad"
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
                <ThemedText style={{ color: "white", fontWeight: "bold" }}>
                  Approve Match
                </ThemedText>
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
  approvedTitle: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#4CAF50",
  },
  completeTitle: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#2196F3",
  },
  pendingTitle: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#FF9800",
  },
  sectionTitle: {
    fontWeight: "bold",
    fontSize: 14,
    marginBottom: 4,
  },
  subtitle: { color: "#666", fontSize: 14, marginTop: 4 },
  scoreText: { color: "#007AFF", fontSize: 14, marginTop: 4 },
  infoText: {
    fontSize: 13,
    color: "#555",
    marginTop: 6,
    fontStyle: "italic",
  },
  subtle: { fontSize: 12, color: "#666", marginTop: 2 },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 12,
  },
  button: { padding: 10, borderRadius: 8, flex: 1, marginHorizontal: 5 },
  approveButton: { backgroundColor: "#4CAF50" },
  denyButton: { backgroundColor: "#F44336" },
  buttonText: { color: "white", fontWeight: "bold", textAlign: "center" },
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
  hintText: { color: "#555", marginTop: 5, marginBottom: 10, fontSize: 14 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginVertical: 8,
    borderRadius: 8,
    color: "#000",
    backgroundColor: "#fff",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
  },
  cancelButton: { backgroundColor: "#ccc" },
  confirmButton: { backgroundColor: "#4CAF50" },
});