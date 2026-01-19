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
import { UserContext } from "../../../contexts/UserContext";
import Spacer from "../../../components/Spacer";
import ThemedText from "../../../components/ThemedText";
import ThemedView from "../../../components/ThemedView";

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
  const { getRequestsWithMatches, selectMatch, provideContactInfo } = useContext(UserContext);
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
    const data = await getRequestsWithMatches();
    const processed = await preprocessZipCodes(data || []);
    setRequests(processed);
    setLoading(false);
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const getSortedMatches = (request) => {
    const matches = request.matches || [];
    return [...matches]
      .map((m) => {
        let zipDiff = null;
        if (request.zipCode && m.donation?.zipCode) {
          zipDiff = Math.abs(Number(request.zipCode) - Number(m.donation.zipCode));
        }
        return { ...m, zipDiff };
      })
      .sort((a, b) => {
        if (sortMode === "score") return (b.score || 0) - (a.score || 0);
        if (sortMode === "items") return (b.items?.length || 0) - (a.items?.length || 0);
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

  const handleSelectMatch = async (matchId) => {
    try {
      await selectMatch(matchId);
      Alert.alert("Match selected!", "Waiting for donor approval.");
      await loadRequests();
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to select match.");
    }
  };

  const openContactModal = (matchId) => {
    setCurrentMatchId(matchId);
    setContactEmail("");
    setContactPhone("");
    setContactModalVisible(true);
  };

  const handleProvideContact = async () => {
    if (!contactPhone) {
      Alert.alert("Error", "Phone number is required.");
      return;
    }
    try {
      await provideContactInfo(currentMatchId, {
        email: contactEmail,
        phone: contactPhone,
      });
      setContactModalVisible(false);
      await loadRequests();
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to save contact info.");
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
      <ThemedText title style={styles.heading}>Request Matches</ThemedText>

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
                <ThemedText style={sortMode === key && styles.dropdownActiveText}>
                  {label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <Spacer height={10} />

      <ScrollView>
        {requests.map((request) => {
          const sortedMatches = getSortedMatches(request);
          const selectedMatch = sortedMatches.find(
            (m) => m.status === "pending" || m.status === "approved"
          );

          return (
            <View key={request.$id} style={styles.requestCard}>
              <ThemedText style={styles.requestTitle}>Requested Items:</ThemedText>
              <ThemedText>
                {[...(request.items || []), ...(request.Other || [])].join(", ")}
              </ThemedText>

              <ThemedText style={styles.subtle}>
                Requested Zip: {request.zipCode || "Location not provided"}
              </ThemedText>

              <Spacer height={10} />

              {selectedMatch ? (
                selectedMatch.status === "pending" ? (
                  <View style={styles.matchCard}>
                    <ThemedText style={[styles.subtle, { fontStyle: "italic" }]}>
                      Pending Approval from donor
                    </ThemedText>
                  </View>
                ) : selectedMatch.status === "approved" ? (
                  !selectedMatch.requestorPhone ? (
                    <View style={styles.matchCard}>
                      <ThemedText style={[styles.subtle, { fontStyle: "italic" }]}>
                        Match approved! Please provide your contact info:
                      </ThemedText>
                      <TouchableOpacity
                        style={[styles.selectButton, { marginTop: 10 }]}
                        onPress={() => openContactModal(selectedMatch.$id)}
                      >
                        <ThemedText>Provide Contact Info</ThemedText>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.matchCard}>
                      <ThemedText style={styles.matchTitle}>
                        Donor Contact Information
                      </ThemedText>
                      <ThemedText>Email: {selectedMatch.donorEmail || "N/A"}</ThemedText>
                      <ThemedText>Phone: {selectedMatch.donorPhone || "N/A"}</ThemedText>
                    </View>
                  )
                ) : null
              ) : sortedMatches.length > 0 ? (
                <View style={styles.matchCard}>
                  <ThemedText style={styles.matchTitle}>Best Match</ThemedText>
                  <ThemedText>
                    Score: {sortedMatches[0].score || 0} | Items: {sortedMatches[0].items?.length || 0}
                  </ThemedText>
                  <ThemedText style={styles.subtle}>
                    Donation Zip: {sortedMatches[0].donation?.zipCode || "Location not provided"}
                  </ThemedText>
                  <TouchableOpacity
                    style={[styles.selectButton, { marginTop: 5 }]}
                    onPress={() => handleSelectMatch(sortedMatches[0].$id)}
                  >
                    <ThemedText>Select this match</ThemedText>
                  </TouchableOpacity>
                </View>
              ) : (
                <ThemedText style={styles.noMatch}>No matches available yet.</ThemedText>
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
              Provide Contact Info (Phone required)
            </ThemedText>

            <TextInput
              style={[styles.input, { color: "#111" }]}
              placeholder="Email (optional)"
              value={contactEmail}
              onChangeText={setContactEmail}
              keyboardType="email-address"
            />
            <TextInput
              style={[styles.input, { color: "#111" }]}
              placeholder="Phone (required)"
              value={contactPhone}
              onChangeText={setContactPhone}
              keyboardType="phone-pad"
            />

            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10 }}>
              <TouchableOpacity
                style={[styles.selectButton, { flex: 1, marginRight: 5 }]}
                onPress={handleProvideContact}
              >
                <ThemedText>Submit</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.selectButton, { flex: 1, marginLeft: 5, backgroundColor: "#f0f0f0", borderColor: "#ccc" }]}
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
  dropdownButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: "#ccc", backgroundColor: "white" },
  dropdownMenu: { marginTop: 5, backgroundColor: "white", borderRadius: 10, borderWidth: 1, borderColor: "#ddd", width: 200, position: "absolute" },
  dropdownItem: { padding: 10, alignItems: "center" },
  dropdownActiveText: { fontWeight: "bold", color: "#007AFF" },
  requestCard: { backgroundColor: "#f5f5f5", padding: 15, borderRadius: 12, marginBottom: 20 },
  requestTitle: { fontWeight: "bold" },
  noMatch: { color: "#777", fontStyle: "italic" },
  matchCard: { backgroundColor: "white", padding: 10, borderRadius: 10, marginTop: 8, borderWidth: 1, borderColor: "#ddd" },
  matchTitle: { fontWeight: "bold" },
  subtle: { fontSize: 12, color: "#666" },
  selectButton: { marginTop: 5, padding: 8, borderRadius: 8, borderWidth: 1, borderColor: "#007AFF", backgroundColor: "#E0F0FF", alignItems: "center" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 },
  modalContent: { backgroundColor: "white", borderRadius: 10, padding: 20 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, marginBottom: 10 },
});
