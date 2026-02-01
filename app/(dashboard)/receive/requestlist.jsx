import { useEffect, useState } from "react";
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
import { database } from "../../../lib/appwrite";
import Spacer from "../../../components/Spacer";
import ThemedText from "../../../components/ThemedText";
import ThemedView from "../../../components/ThemedView";

const ITEMS_DATABASE_ID = "69276d130021687546df";
const MATCHES_COLLECTION_ID = "matches";

async function getZipFromLatLng(lat, lng) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
    );
    const data = await response.json();
    return data.address?.postcode || null;
  } catch (err) {
    console.warn("Failed to get zip code from lat/lng:", err);
    return null;
  }
}

const SORT_LABELS = {
  score: "Best Match",
  items: "Most Items",
  location: "Closest",
};

const RequestList = () => {
  const {
    getRequestsWithMatches,
    selectMatch,
    createAndSelectMatch,
    provideRequestorContact,
  } = useMatch();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortMode, setSortMode] = useState("score");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [currentMatchId, setCurrentMatchId] = useState(null);
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  const preprocessZipCodes = async (requests) => {
    for (const req of requests) {
      if (!req.zipCode && req.lat != null && req.lng != null) {
        req.zipCode = await getZipFromLatLng(req.lat, req.lng);
      }
      for (const match of req.matches || []) {
        const d = match.donation;
        if (d && !d.zipCode && d.lat != null && d.lng != null) {
          d.zipCode = await getZipFromLatLng(d.lat, d.lng);
        }
      }
    }
    return requests;
  };

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await getRequestsWithMatches();
      const processed = await preprocessZipCodes(data || []);
      setRequests(processed);
    } catch (err) {
      console.error("Error loading requests:", err);
      Alert.alert("Error", "Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();

    const unsubscribe = database.client.subscribe(
      `databases.${ITEMS_DATABASE_ID}.collections.${MATCHES_COLLECTION_ID}.documents`,
      (response) => {
        console.log("Match update detected, reloading...");
        loadRequests();
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  const getSortedMatches = (request) => {
    const matches = request.matches || [];
    return [...matches]
      .map((m) => {
        let zipDiff = null;
        if (request.zipCode && m.donation?.zipCode) {
          zipDiff = Math.abs(
            Number(request.zipCode) - Number(m.donation.zipCode)
          );
        }
        return { ...m, zipDiff };
      })
      .sort((a, b) => {
        if (sortMode === "score") return (b.score || 0) - (a.score || 0);
        if (sortMode === "items")
          return (b.items?.length || 0) - (a.items?.length || 0);
        if (sortMode === "location") {
          const aHas = typeof a.zipDiff === "number";
          const bHas = typeof b.zipDiff === "number";
          if (aHas && bHas) return a.zipDiff - b.zipDiff;
          if (aHas && !bHas) return -1;
          if (!aHas && bHas) return 1;
          return 0;
        }
        return 0;
      });
  };

  const handleSelectMatch = async (match, request) => {
    Alert.alert(
      "Select this match?",
      "Once selected, you'll need to wait for the donor to approve. You can only select one match at a time.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Select",
          onPress: async () => {
            try {
              if (match._isTemporary) {
                await createAndSelectMatch(match.donation, request, {
                  overlap: match.items,
                  score: match.score,
                });
              } else {
                await selectMatch(match.$id);
              }
              
              Alert.alert(
                "Match selected!",
                "Waiting for donor to approve or deny your request."
              );
            } catch (err) {
              console.error(err);
              Alert.alert("Error", err.message || "Failed to select match.");
            }
          },
        },
      ]
    );
  };

  const openContactModal = (matchId) => {
    setCurrentMatchId(matchId);
    setContactEmail("");
    setContactPhone("");
    setContactModalVisible(true);
  };

  const handleProvideContact = async () => {
    if (!contactPhone.trim()) {
      Alert.alert("Error", "Phone number is required.");
      return;
    }
    try {
      await provideRequestorContact(currentMatchId, {
        email: contactEmail || null,
        phone: contactPhone,
      });
      Alert.alert(
        "Success!",
        "Match complete! Your request and the donation have been matched. You can now coordinate with the donor."
      );
      setContactModalVisible(false);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", err.message || "Failed to save contact info.");
    }
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
        Request Matches
      </ThemedText>

      <View style={styles.dropdownWrapper}>
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => setDropdownOpen(!dropdownOpen)}
        >
          <ThemedText>Sort by: {SORT_LABELS[sortMode]} ▼</ThemedText>
        </TouchableOpacity>

        {dropdownOpen && (
          <View style={styles.dropdownMenu}>
            {Object.entries(SORT_LABELS).map(([key, label]) => (
              <TouchableOpacity
                key={key}
                style={styles.dropdownItem}
                onPress={() => {
                  setSortMode(key);
                  setDropdownOpen(false);
                }}
              >
                <ThemedText
                  style={sortMode === key && styles.dropdownActiveText}
                >
                  {label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <Spacer height={10} />

      <ScrollView>
        {requests.length === 0 && (
          <ThemedText style={styles.noMatch}>
            No requests yet. Create a request to get matches!
          </ThemedText>
        )}

        {requests.map((request) => {
          const sortedMatches = getSortedMatches(request);

          const pendingMatch = sortedMatches.find((m) => m.status === "pending");

          const approvedMatch = sortedMatches.find((m) => m.status === "approved");

          const availableMatches = sortedMatches.filter(
            (m) => !m.status || m._isTemporary
          );

          return (
            <View key={request.$id} style={styles.requestCard}>
              <ThemedText style={styles.requestTitle}>
                Requested Items:
              </ThemedText>
              <ThemedText>
                {[...(request.items || []), ...(request.other || [])].join(", ")}
              </ThemedText>

              <ThemedText style={styles.subtle}>
                Requested Zip: {request.zipCode || "Location not provided"}
              </ThemedText>

              <Spacer height={10} />

              {approvedMatch && !approvedMatch.requestorPhone ? (
                <View style={styles.matchCard}>
                  <ThemedText style={styles.approvedTitle}>
                    Donor Approved Your Request!
                  </ThemedText>
                  <ThemedText style={styles.infoText}>
                    Please provide your contact information to complete the match.
                  </ThemedText>
                  <TouchableOpacity
                    style={[
                      styles.selectButton,
                      { marginTop: 10, backgroundColor: "#4CAF50" },
                    ]}
                    onPress={() => openContactModal(approvedMatch.$id)}
                  >
                    <ThemedText style={{ color: "white", fontWeight: "bold" }}>
                      Provide Contact Info
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              ) : approvedMatch && approvedMatch.requestorPhone ? (
                <View style={styles.matchCard}>
                  <ThemedText style={styles.completeTitle}>
                    ✓ Match Complete!
                  </ThemedText>
                  <ThemedText style={styles.sectionTitle}>
                    Donor Contact:
                  </ThemedText>
                  <ThemedText>
                    Email: {approvedMatch.donorEmail || "N/A"}
                  </ThemedText>
                  <ThemedText>
                    Phone: {approvedMatch.donorPhone || "N/A"}
                  </ThemedText>
                  <Spacer height={8} />
                  <ThemedText style={styles.subtle}>
                    Donation Items:{" "}
                    {approvedMatch.donation?.items?.join(", ") || "N/A"}
                  </ThemedText>
                  <ThemedText style={styles.infoText}>
                    Please coordinate with the donor to arrange pickup/delivery.
                  </ThemedText>
                </View>
              ) : pendingMatch ? (
                <View style={styles.matchCard}>
                  <ThemedText style={styles.pendingTitle}>
                    Waiting for Donor Response
                  </ThemedText>
                  <ThemedText style={styles.infoText}>
                    You've selected a match. The donor will approve or deny your
                    request soon.
                  </ThemedText>
                  <Spacer height={8} />
                  <ThemedText style={styles.subtle}>
                    Donation Items:{" "}
                    {pendingMatch.donation?.items?.join(", ") || "N/A"}
                  </ThemedText>
                  <ThemedText style={styles.subtle}>
                    Match Score: {pendingMatch.score || 0}
                  </ThemedText>
                </View>
              ) : availableMatches.length > 0 ? (
                <>
                  <ThemedText style={styles.instructionText}>
                    {availableMatches.length} potential{" "}
                    {availableMatches.length === 1 ? "match" : "matches"} found!
                    Select ONE to send a request to the donor.
                  </ThemedText>
                  {availableMatches.map((m, index) => (
                    <View key={m.$id} style={styles.matchCard}>
                      <ThemedText style={styles.matchTitle}>
                        Match #{index + 1}
                      </ThemedText>
                      <ThemedText>
                        Score: {m.score || 0} | Items: {m.items?.length || 0}
                      </ThemedText>
                      <ThemedText style={styles.itemsList}>
                        Available: {m.donation?.items?.join(", ") || "N/A"}
                      </ThemedText>
                      <ThemedText style={styles.subtle}>
                        Donation Zip:{" "}
                        {m.donation?.zipCode || "Location not provided"}
                      </ThemedText>

                      <TouchableOpacity
                        style={[styles.selectButton, { marginTop: 8 }]}
                        onPress={() => handleSelectMatch(m, request)}
                      >
                        <ThemedText>Select this match</ThemedText>
                      </TouchableOpacity>
                    </View>
                  ))}
                </>
              ) : (
                <ThemedText style={styles.noMatch}>
                  No matches available yet. Check back soon!
                </ThemedText>
              )}
            </View>
          );
        })}
      </ScrollView>

      <Modal
        visible={contactModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setContactModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ThemedText title style={{ marginBottom: 10 }}>
              Complete Your Match
            </ThemedText>
            <ThemedText style={styles.modalHint}>
              Provide your contact info so the donor can reach you. Phone number
              is required.
            </ThemedText>

            <TextInput
              style={[styles.input, { color: "#111" }]}
              placeholder="Email (optional)"
              value={contactEmail}
              onChangeText={setContactEmail}
              keyboardType="email-address"
              placeholderTextColor="#666"
            />
            <TextInput
              style={[styles.input, { color: "#111" }]}
              placeholder="Phone (required)"
              value={contactPhone}
              onChangeText={setContactPhone}
              keyboardType="phone-pad"
              placeholderTextColor="#666"
            />

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginTop: 10,
              }}
            >
              <TouchableOpacity
                style={[
                  styles.selectButton,
                  { flex: 1, marginRight: 5, backgroundColor: "#4CAF50" },
                ]}
                onPress={handleProvideContact}
              >
                <ThemedText style={{ color: "white", fontWeight: "bold" }}>
                  Submit
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.selectButton,
                  {
                    flex: 1,
                    marginLeft: 5,
                    backgroundColor: "#f0f0f0",
                    borderColor: "#ccc",
                  },
                ]}
                onPress={() => setContactModalVisible(false)}
              >
                <ThemedText>Cancel</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
};

export default RequestList;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15 },
  heading: { fontSize: 20, fontWeight: "bold", textAlign: "center" },
  dropdownWrapper: { alignItems: "center", marginBottom: 10, zIndex: 1000 },
  dropdownButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "white",
  },
  dropdownMenu: {
    marginTop: 5,
    backgroundColor: "white",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    width: 200,
    position: "absolute",
    top: 40,
  },
  dropdownItem: { padding: 10, alignItems: "center" },
  dropdownActiveText: { fontWeight: "bold", color: "#007AFF" },
  requestCard: {
    backgroundColor: "#f5f5f5",
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  requestTitle: { fontWeight: "bold", fontSize: 16 },
  instructionText: {
    fontSize: 13,
    color: "#555",
    fontStyle: "italic",
    marginBottom: 8,
    backgroundColor: "#E3F2FD",
    padding: 8,
    borderRadius: 6,
  },
  noMatch: { color: "#777", fontStyle: "italic", marginTop: 8 },
  matchCard: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  matchTitle: { fontWeight: "bold", fontSize: 15 },
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
    marginTop: 8,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: "#555",
    marginTop: 4,
    fontStyle: "italic",
  },
  itemsList: { fontSize: 14, marginTop: 4, color: "#333" },
  subtle: { fontSize: 12, color: "#666", marginTop: 2 },
  selectButton: {
    marginTop: 5,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#007AFF",
    backgroundColor: "#E0F0FF",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: { backgroundColor: "white", borderRadius: 10, padding: 20 },
  modalHint: { fontSize: 14, color: "#666", marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
});