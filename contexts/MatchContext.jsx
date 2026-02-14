import { createContext, useContext } from "react";
import { database } from "../lib/appwrite";
import { ID, Query } from "react-native-appwrite";
import { UserContext } from "./UserContext";

export const MatchContext = createContext();

const ITEMS_DATABASE_ID = "69276d130021687546df";
const DONATIONS_COLLECTION_ID = "donations";
const REQUESTS_COLLECTION_ID = "requests";
const MATCHES_COLLECTION_ID = "matches";

// Configuration
const MATCH_TIMEOUT_HOURS = 48;
const EXPIRATION_DAYS = 30;
const MIN_MATCH_SCORE = 1;
const MAX_DISTANCE_KM = 50;
const ALLOW_SELF_MATCHING = true; // Set to false in production

// Helper function to normalize items
function normalizeItems(items = [], other = []) {
  return [...items, ...other]
    .map((i) => String(i).trim().toLowerCase())
    .filter(Boolean);
}

// Helper to get quantity for an item
function getQuantity(itemsList, quantitiesList, itemName) {
  const index = itemsList.findIndex(
    (item) => item.toLowerCase() === itemName.toLowerCase()
  );
  if (index === -1) return 1;
  return quantitiesList && quantitiesList[index] ? quantitiesList[index] : 1;
}

// Haversine distance calculation
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Calculate match score between a donation and request
function calculateMatchScore(donation, request) {
  const donationItems = normalizeItems(donation.items, donation.other);
  const requestItems = normalizeItems(request.items, request.other);

  const overlap = donationItems.filter((item) => requestItems.includes(item));
  
  if (overlap.length === 0) return null;

  let score = overlap.length;

  const requestedCount = requestItems.length;
  const matchedCount = overlap.length;
  const completeness = matchedCount / requestedCount;
  
  if (completeness === 1.0) {
    score += 5;
  } else if (completeness >= 0.75) {
    score += 3;
  } else if (completeness >= 0.5) {
    score += 2;
  } else if (completeness >= 0.25) {
    score += 1;
  }

  let quantitySufficient = true;
  if (donation.itemQuantities && request.itemQuantities) {
    for (const item of overlap) {
      const donationQty = getQuantity(
        [...donation.items, ...donation.other],
        donation.itemQuantities,
        item
      );
      const requestQty = getQuantity(
        [...request.items, ...request.other],
        request.itemQuantities,
        item
      );
      
      if (donationQty < requestQty) {
        quantitySufficient = false;
        break;
      }
    }
    
    if (quantitySufficient) {
      score += 2;
    }
  }

  if (donation.zipCode && request.zipCode) {
    const diff = Math.abs(
      parseInt(donation.zipCode, 10) - parseInt(request.zipCode, 10)
    );
    if (diff === 0) score += 3;
    else if (diff <= 5) score += 2;
    else if (diff <= 10) score += 1;
  }

  if (
    donation.lat != null &&
    donation.lng != null &&
    request.lat != null &&
    request.lng != null
  ) {
    const distance = haversineDistance(
      donation.lat,
      donation.lng,
      request.lat,
      request.lng
    );

    if (distance > MAX_DISTANCE_KM) {
      return null;
    }

    if (distance <= 5) score += 3;
    else if (distance <= 15) score += 2;
    else if (distance <= 30) score += 1;
  }

  return {
    score: Number(score.toFixed(2)),
    overlap,
    completeness,
    quantitySufficient,
  };
}

function isExpired(document) {
  if (!document.expiresAt) return false;
  return new Date(document.expiresAt) < new Date();
}

function hasTimedOut(match) {
  if (!match.pendingSince || match.status !== "pending") return false;
  const timeoutMs = MATCH_TIMEOUT_HOURS * 60 * 60 * 1000;
  return new Date() - new Date(match.pendingSince) > timeoutMs;
}

export function MatchProvider({ children }) {
  const { user } = useContext(UserContext);

  const userId = user?.$id ?? null;

  async function saveDonation(items, other = [], locationData = {}, quantitiesObject = {}) {
    if (!userId) return null;

    const { zipCode = null, lat = null, lng = null } = locationData;
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + EXPIRATION_DAYS);
    
    const allItems = [...items, ...other];
    const itemQuantities = allItems.map(item => quantitiesObject[item] || 1);
    
    return database.createDocument(
      ITEMS_DATABASE_ID,
      DONATIONS_COLLECTION_ID,
      ID.unique(),
      {
        userId,
        items,
        other,
        itemQuantities,
        zipCode,
        lat,
        lng,
        status: "active",
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
      }
    );
  }

  async function saveRequest(items, other = [], locationData = {}, quantitiesObject = {}) {
    if (!userId) return null;

    const { zipCode = null, lat = null, lng = null } = locationData;
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + EXPIRATION_DAYS);
    
    const allItems = [...items, ...other];
    const itemQuantities = allItems.map(item => quantitiesObject[item] || 1);
    
    return database.createDocument(
      ITEMS_DATABASE_ID,
      REQUESTS_COLLECTION_ID,
      ID.unique(),
      {
        userId,
        items,
        other,
        itemQuantities,
        zipCode,
        lat,
        lng,
        status: "active",
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
      }
    );
  }

  async function cleanupExpiredAndTimedOut() {
    try {
      const expiredDonations = await database.listDocuments(
        ITEMS_DATABASE_ID,
        DONATIONS_COLLECTION_ID,
        [
          Query.lessThan("expiresAt", new Date().toISOString()),
          Query.or([
            Query.equal("status", "active"),
            Query.equal("status", "pending")
          ]),
          Query.limit(100)
        ]
      );

      for (const doc of expiredDonations.documents) {
        await database.updateDocument(
          ITEMS_DATABASE_ID,
          DONATIONS_COLLECTION_ID,
          doc.$id,
          { status: "expired" }
        );
      }

      const expiredRequests = await database.listDocuments(
        ITEMS_DATABASE_ID,
        REQUESTS_COLLECTION_ID,
        [
          Query.lessThan("expiresAt", new Date().toISOString()),
          Query.or([
            Query.equal("status", "active"),
            Query.equal("status", "pending")
          ]),
          Query.limit(100)
        ]
      );

      for (const doc of expiredRequests.documents) {
        await database.updateDocument(
          ITEMS_DATABASE_ID,
          REQUESTS_COLLECTION_ID,
          doc.$id,
          { status: "expired" }
        );
      }

      const pendingMatches = await database.listDocuments(
        ITEMS_DATABASE_ID,
        MATCHES_COLLECTION_ID,
        [
          Query.equal("status", "pending"),
          Query.limit(100)
        ]
      );

      const timeoutDate = new Date();
      timeoutDate.setHours(timeoutDate.getHours() - MATCH_TIMEOUT_HOURS);

      for (const match of pendingMatches.documents) {
        if (match.pendingSince && new Date(match.pendingSince) < timeoutDate) {
          await database.updateDocument(
            ITEMS_DATABASE_ID,
            DONATIONS_COLLECTION_ID,
            match.donationId,
            { status: "active" }
          );
          
          await database.updateDocument(
            ITEMS_DATABASE_ID,
            REQUESTS_COLLECTION_ID,
            match.requestId,
            { status: "active" }
          );
          
          await database.deleteDocument(
            ITEMS_DATABASE_ID,
            MATCHES_COLLECTION_ID,
            match.$id
          );
        }
      }
    } catch (err) {
      console.error("Error in cleanup:", err);
    }
  }

  async function getRequestsWithMatches() {
    if (!userId) return [];
    
    try {
      await cleanupExpiredAndTimedOut();

      // Get user's requests with status "active", "pending", OR "matched"
      const requestRes = await database.listDocuments(
        ITEMS_DATABASE_ID,
        REQUESTS_COLLECTION_ID,
        [
          Query.equal("userId", userId),
          Query.or([
            Query.equal("status", "active"),
            Query.equal("status", "pending"),
            Query.equal("status", "matched")
          ]),
          Query.limit(100)
        ]
      );

      const donationQueries = [
        Query.equal("status", "active"),
        Query.limit(100),
      ];
      
      if (!ALLOW_SELF_MATCHING) {
        donationQueries.push(Query.notEqual("userId", userId));
      }

      const donationRes = await database.listDocuments(
        ITEMS_DATABASE_ID,
        DONATIONS_COLLECTION_ID,
        donationQueries
      );

      const enriched = [];

      for (const request of requestRes.documents) {
        if (isExpired(request)) continue;

        const existingMatchesRes = await database.listDocuments(
          ITEMS_DATABASE_ID,
          MATCHES_COLLECTION_ID,
          [Query.equal("requestId", request.$id), Query.limit(100)]
        );

        const matches = [];
        let pendingMatch = null;

        // First, load all existing matches (pending/approved) with their donation details
        for (const match of existingMatchesRes.documents) {
          if (hasTimedOut(match)) {
            try {
              await database.updateDocument(
                ITEMS_DATABASE_ID,
                DONATIONS_COLLECTION_ID,
                match.donationId,
                { status: "active" }
              );
              await database.updateDocument(
                ITEMS_DATABASE_ID,
                REQUESTS_COLLECTION_ID,
                match.requestId,
                { status: "active" }
              );
              await database.deleteDocument(
                ITEMS_DATABASE_ID,
                MATCHES_COLLECTION_ID,
                match.$id
              );
            } catch (err) {
              console.error("Error cleaning up timed out match:", err);
            }
            continue;
          }

          // Load the donation for this match
          try {
            const donation = await database.getDocument(
              ITEMS_DATABASE_ID,
              DONATIONS_COLLECTION_ID,
              match.donationId
            );

            if (!isExpired(donation)) {
              matches.push({
                ...match,
                donation,
                donorEmail: match.donorEmail || null,
                donorPhone: match.donorPhone || null,
                requestorEmail: match.requestorEmail || null,
                requestorPhone: match.requestorPhone || null,
              });

              if (match.status === "pending") {
                pendingMatch = match;
              }
            }
          } catch (err) {
            console.error("Error loading donation for existing match:", err);
          }
        }

        // Then, add potential new matches ONLY if no pending match exists
        for (const donation of donationRes.documents) {
          if (isExpired(donation)) continue;

          // Skip if we already have a match with this donation
          if (matches.some(m => m.donationId === donation.$id)) {
            continue;
          }

          if (pendingMatch) {
            continue;
          }

          const matchResult = calculateMatchScore(donation, request);
          
          if (!matchResult || matchResult.score < MIN_MATCH_SCORE) {
            continue;
          }

          matches.push({
            $id: `temp-${donation.$id}`,
            donationId: donation.$id,
            requestId: request.$id,
            items: matchResult.overlap,
            score: matchResult.score,
            completeness: matchResult.completeness,
            quantitySufficient: matchResult.quantitySufficient,
            status: null,
            donation,
            donorEmail: null,
            donorPhone: null,
            requestorEmail: null,
            requestorPhone: null,
            _isTemporary: true,
          });
        }

        matches.sort((a, b) => (b.score || 0) - (a.score || 0));

        enriched.push({ 
          ...request, 
          matches: matches.slice(0, 10),
          hasPendingMatch: !!pendingMatch 
        });
      }

      return enriched;
    } catch (err) {
      console.error("Error in getRequestsWithMatches:", err);
      throw err;
    }
  }

  async function getDonationsWithMatches() {
    if (!userId) return [];
    
    try {
      await cleanupExpiredAndTimedOut();

      // Get donations with status "active", "pending", OR "matched" so they show until dismissed
      const donationRes = await database.listDocuments(
        ITEMS_DATABASE_ID,
        DONATIONS_COLLECTION_ID,
        [
          Query.equal("userId", userId),
          Query.or([
            Query.equal("status", "active"),
            Query.equal("status", "pending"),
            Query.equal("status", "matched")
          ]),
          Query.limit(100)
        ]
      );

      const enriched = [];

      for (const donation of donationRes.documents) {
        if (isExpired(donation)) continue;

        const matchRes = await database.listDocuments(
          ITEMS_DATABASE_ID,
          MATCHES_COLLECTION_ID,
          [
            Query.equal("donationId", donation.$id),
            Query.orderDesc("score"),
            Query.limit(10),
          ]
        );

        const matches = [];
        for (const match of matchRes.documents) {
          if (hasTimedOut(match)) {
            try {
              await database.deleteDocument(
                ITEMS_DATABASE_ID,
                MATCHES_COLLECTION_ID,
                match.$id
              );
            } catch (err) {
              console.error("Error cleaning up timed out match:", err);
            }
            continue;
          }

          try {
            const request = await database.getDocument(
              ITEMS_DATABASE_ID,
              REQUESTS_COLLECTION_ID,
              match.requestId
            );

            // Skip requests that aren't active OR pending (for this donation)
            // This handles both expired and already matched requests
            if (isExpired(request)) continue;

            matches.push({
              ...match,
              request,
              donorEmail: match.donorEmail || null,
              donorPhone: match.donorPhone || null,
              requestorEmail: match.requestorEmail || null,
              requestorPhone: match.requestorPhone || null,
            });
          } catch (err) {
            console.error("Error loading request for match:", err);
          }
        }

        enriched.push({ ...donation, matches });
      }

      return enriched;
    } catch (err) {
      console.error("Error in getDonationsWithMatches:", err);
      throw err;
    }
  }

  async function createAndSelectMatch(donation, request, matchData) {
    if (!userId) return null;

    const currentDonation = await database.getDocument(
      ITEMS_DATABASE_ID,
      DONATIONS_COLLECTION_ID,
      donation.$id
    );

    if (currentDonation.status !== "active") {
      throw new Error(
        "This donation was just selected by someone else. Please try a different match."
      );
    }

    const existingPendingMatches = await database.listDocuments(
      ITEMS_DATABASE_ID,
      MATCHES_COLLECTION_ID,
      [
        Query.equal("requestId", request.$id),
        Query.equal("status", "pending")
      ]
    );

    if (existingPendingMatches.documents.length > 0) {
      throw new Error(
        "This request already has a pending match. Please wait for donor response or cancel the pending match."
      );
    }

    const newMatch = await database.createDocument(
      ITEMS_DATABASE_ID,
      MATCHES_COLLECTION_ID,
      ID.unique(),
      {
        donationId: donation.$id,
        requestId: request.$id,
        items: matchData.overlap,
        score: matchData.score,
        status: "pending",
        pendingSince: new Date().toISOString(),
      }
    );

    try {
      await database.updateDocument(
        ITEMS_DATABASE_ID,
        DONATIONS_COLLECTION_ID,
        donation.$id,
        { status: "pending" }
      );
      
      await database.updateDocument(
        ITEMS_DATABASE_ID,
        REQUESTS_COLLECTION_ID,
        request.$id,
        { status: "pending" }
      );
    } catch (err) {
      await database.deleteDocument(
        ITEMS_DATABASE_ID,
        MATCHES_COLLECTION_ID,
        newMatch.$id
      );
      throw new Error(
        "Failed to secure this donation. It may have been selected by someone else. Please try again."
      );
    }

    return newMatch;
  }

  async function cancelPendingMatch(matchId) {
    if (!userId) return null;

    const match = await database.getDocument(
      ITEMS_DATABASE_ID,
      MATCHES_COLLECTION_ID,
      matchId
    );

    if (match.status !== "pending") {
      throw new Error("This match is not pending.");
    }

    const request = await database.getDocument(
      ITEMS_DATABASE_ID,
      REQUESTS_COLLECTION_ID,
      match.requestId
    );

    if (request.userId !== userId) {
      throw new Error("You can only cancel your own pending matches.");
    }

    await database.updateDocument(
      ITEMS_DATABASE_ID,
      DONATIONS_COLLECTION_ID,
      match.donationId,
      { status: "active" }
    );
    
    await database.updateDocument(
      ITEMS_DATABASE_ID,
      REQUESTS_COLLECTION_ID,
      match.requestId,
      { status: "active" }
    );

    await database.deleteDocument(
      ITEMS_DATABASE_ID,
      MATCHES_COLLECTION_ID,
      matchId
    );

    return true;
  }

  async function approveDonation(matchId, donorContactInfo) {
    if (!userId) return null;

    const match = await database.getDocument(
      ITEMS_DATABASE_ID,
      MATCHES_COLLECTION_ID,
      matchId
    );

    if (match.status !== "pending") {
      throw new Error("This match is not pending approval.");
    }

    return await database.updateDocument(
      ITEMS_DATABASE_ID,
      MATCHES_COLLECTION_ID,
      matchId,
      {
        status: "approved",
        donorEmail: donorContactInfo.email || null,
        donorPhone: donorContactInfo.phone,
      }
    );
  }

  async function denyDonation(matchId) {
    if (!userId) return null;

    const match = await database.getDocument(
      ITEMS_DATABASE_ID,
      MATCHES_COLLECTION_ID,
      matchId
    );

    if (match.status !== "pending") {
      throw new Error("This match is not pending.");
    }

    await database.updateDocument(
      ITEMS_DATABASE_ID,
      DONATIONS_COLLECTION_ID,
      match.donationId,
      { status: "active" }
    );
    
    await database.updateDocument(
      ITEMS_DATABASE_ID,
      REQUESTS_COLLECTION_ID,
      match.requestId,
      { status: "active" }
    );

    return await database.deleteDocument(
      ITEMS_DATABASE_ID,
      MATCHES_COLLECTION_ID,
      matchId
    );
  }

  async function provideRequestorContact(matchId, requestorContactInfo) {
    if (!userId) return null;

    const match = await database.getDocument(
      ITEMS_DATABASE_ID,
      MATCHES_COLLECTION_ID,
      matchId
    );

    if (match.status !== "approved") {
      throw new Error("This match has not been approved by the donor yet.");
    }

    await database.updateDocument(
      ITEMS_DATABASE_ID,
      MATCHES_COLLECTION_ID,
      matchId,
      {
        requestorEmail: requestorContactInfo.email || null,
        requestorPhone: requestorContactInfo.phone,
      }
    );

    await database.updateDocument(
      ITEMS_DATABASE_ID,
      DONATIONS_COLLECTION_ID,
      match.donationId,
      { status: "matched" }
    );

    await database.updateDocument(
      ITEMS_DATABASE_ID,
      REQUESTS_COLLECTION_ID,
      match.requestId,
      { status: "matched" }
    );

    const otherMatches = await database.listDocuments(
      ITEMS_DATABASE_ID,
      MATCHES_COLLECTION_ID,
      [
        Query.or([
          Query.equal("donationId", match.donationId),
          Query.equal("requestId", match.requestId),
        ]),
        Query.limit(100)
      ]
    );

    for (const m of otherMatches.documents) {
      if (m.$id !== matchId) {
        await database.deleteDocument(
          ITEMS_DATABASE_ID,
          MATCHES_COLLECTION_ID,
          m.$id
        );
      }
    }

    return match;
  }

  return (
    <MatchContext.Provider
      value={{
        saveDonation,
        saveRequest,
        getRequestsWithMatches,
        getDonationsWithMatches,
        createAndSelectMatch,
        cancelPendingMatch,
        approveDonation,
        denyDonation,
        provideRequestorContact,
        cleanupExpiredAndTimedOut,
      }}
    >
      {children}
    </MatchContext.Provider>
  );
}