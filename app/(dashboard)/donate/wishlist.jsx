import { StyleSheet, ScrollView, TouchableOpacity, Linking, View } from 'react-native';
import { useState, useEffect } from 'react';

import Spacer from "../../../components/Spacer";
import ThemedText from "../../../components/ThemedText";
import ThemedView from "../../../components/ThemedView";
import { database } from '../../../lib/appwrite';

const WISHLIST_DB_ID = "6944caa80022e2cfa289";
const WISHLIST_COLLECTION_ID = "teacher_wishlists";

const Wishlist = () => {
  const [wishlists, setWishlists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadWishlists();
  }, []);

  const loadWishlists = async () => {
    try {
      setLoading(true);
      const response = await database.listDocuments(
        WISHLIST_DB_ID,
        WISHLIST_COLLECTION_ID
      );
      
      // Shuffle the wishlists randomly
      const shuffled = response.documents.sort(() => Math.random() - 0.5);
      setWishlists(shuffled);
    } catch (err) {
      console.error("Error loading wishlists:", err);
      setError("Failed to load wishlists. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const openAmazonLink = (url) => {
    if (url) {
      Linking.openURL(url).catch(err => {
        console.error("Failed to open URL:", err);
        alert("Could not open Amazon wishlist link");
      });
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Loading wishlists...</ThemedText>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.error}>{error}</ThemedText>
        <Spacer height={20} />
        <TouchableOpacity style={styles.retryButton} onPress={loadWishlists}>
          <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.pageContainer}>
      <Spacer />
      <ThemedText title style={styles.heading}>
        Teachers' Amazon Wishlists
      </ThemedText>
      <Spacer height={20} />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {wishlists.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ThemedText style={styles.emptyText}>
              No wishlists available yet.
            </ThemedText>
            <Spacer height={10} />
            <ThemedText style={styles.subtleText}>
              Check back soon!
            </ThemedText>
          </View>
        ) : (
          wishlists.map((wishlist, index) => {
            // Handle items - use capitalized field names from Appwrite
            const itemsArray = Array.isArray(wishlist.Items) 
              ? wishlist.Items 
              : [];
            
            return (
            <View key={wishlist.$id} style={styles.wishlistCard}>
              <View style={styles.cardHeader}>
                <ThemedText style={styles.teacherName}>{wishlist.Name || "Anonymous Teacher"}</ThemedText>
              </View>

              <Spacer height={10} />

              {itemsArray.length > 0 && (
                <>
                  <ThemedText style={styles.sectionLabel}>Items Requested:</ThemedText>
                  <View style={styles.itemsContainer}>
                    {itemsArray.map((item, idx) => (
                      <View key={idx} style={styles.itemChip}>
                        <ThemedText style={styles.itemText}>• {item}</ThemedText>
                      </View>
                    ))}
                  </View>
                  <Spacer height={15} />
                </>
              )}

              <TouchableOpacity
                style={styles.amazonButton}
                onPress={() => openAmazonLink(wishlist.amazonLink)}
              >
                <ThemedText style={styles.amazonButtonText}>
                  View Amazon Wishlist →
                </ThemedText>
              </TouchableOpacity>
            </View>
            );
          })
        )}
        <Spacer height={20} />
      </ScrollView>
    </ThemedView>
  );
};

export default Wishlist;

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    padding: 15,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 15,
  },
  heading: {
    fontWeight: "bold",
    fontSize: 20,
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  wishlistCard: {
    backgroundColor: "#f5f5f5",
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  cardHeader: {
    borderBottomWidth: 2,
    borderBottomColor: "#007AFF",
    paddingBottom: 10,
  },
  teacherName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111",
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  itemsContainer: {
    gap: 6,
  },
  itemChip: {
    backgroundColor: "white",
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#007AFF",
  },
  itemText: {
    fontSize: 14,
    color: "#333",
  },
  amazonButton: {
    backgroundColor: "#FF9900",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  amazonButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    color: "#666",
  },
  subtleText: {
    fontSize: 14,
    textAlign: "center",
    color: "#999",
  },
  error: {
    color: "#d32f2f",
    fontSize: 16,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 8,
    paddingHorizontal: 30,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "600",
  },
});