import { createContext, useContext } from "react";
import { database } from "../lib/appwrite";
import { ID, Query } from "react-native-appwrite";
import { UserContext } from "./UserContext";

export const MatchContext = createContext();

const ITEMS_DATABASE_ID = "69276d130021687546df";
const DONATIONS_COLLECTION_ID = "donations";
const REQUESTS_COLLECTION_ID = "requests";
const MATCHES_COLLECTION_ID = "matches";

function normalizeItems(items = [], other = []) {
  return [...items, ...other]
    .map((i) => String(i).trim().toLowerCase())
    .filter(Boolean);
}

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

function calculateMatchScore(donation, request) {
  const donationItems = normalizeItems(donation.items, donation.other);
  const requestItems = normalizeItems(request.items, request.other);

  console.log("Comparing:", {
    donationItems,
    requestItems,
  });

  const overlap = donationItems.filter((item) => requestItems.includes(item));
  
  console.log("Overlap found:", overlap);
  
  if (overlap.length === 0) return null; 

  let score = overlap.length;

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

    if (distance <= 5) score += 3;
    else if (distance <= 15) score += 2;
    else if (distance <= 30) score += 1;
  }

  return {
    score: Number(score.toFixed(2)),
    overlap,
  };
}

export function MatchProvider({ children }) {
  const { user } = useContext(UserContext);

  const userId = user?.$id ?? null;

  async function saveDonation(items, other = [], locationData = {}) {
    console.log("saveDonation called:", { items, other, locationData, userId });
    
    if (!userId) {
      console.error("No userId - user not logged in");
      return null;
    }

    const { zipCode = null, lat = null, lng = null } = locationData;
    
    try {
      const result = await database.createDocument(
        ITEMS_DATABASE_ID,
        DONATIONS_COLLECTION_ID,
        ID.unique(),
        {
          userId,
          items,
          other,
          zipCode,
          lat,
          lng,
          status: "active",
        }
      );
      
      console.log("Donation saved successfully:", result);
      return result;
    } catch (err) {
      console.error("Error saving donation:", err);
      throw err;
    }
  }

  async function saveRequest(items, other = [], locationData = {}) {
    console.log("saveRequest called:", { items, other, locationData, userId });
    
    if (!userId) {
      console.error("No userId - user not logged in");
      return null;
    }

    const { zipCode = null, lat = null, lng = null } = locationData;
    
    try {
      const result = await database.createDocument(
        ITEMS_DATABASE_ID,
        REQUESTS_COLLECTION_ID,
        ID.unique(),
        {
          userId,
          items,
          other,
          zipCode,
          lat,
          lng,
          status: "active",
        }
      );
      
      console.log("Request saved successfully:", result);
      return result;
    } catch (err) {
      console.error("Error saving request:", err);
      throw err;
    }
  }

  async function getRequestsWithMatches() {
    console.log("getRequestsWithMatches called for userId:", userId);
    
    if (!userId) {
      console.error("No userId");
      return [];
    }
    
    try {
      const requestRes = await database.listDocuments(
        ITEMS_DATABASE_ID,
        REQUESTS_COLLECTION_ID,
        [Query.equal("userId", userId), Query.equal("status", "active")]
      );

      console.log("User's requests:", requestRes.documents.length);

      const donationRes = await database.listDocuments(
        ITEMS_DATABASE_ID,
        DONATIONS_COLLECTION_ID,
        [
          Query.equal("status", "active"),
          Query.limit(100),
        ]
      );

      console.log("Available donations:", donationRes.documents.length);
      console.log("Donations:", donationRes.documents.map(d => ({
        id: d.$id,
        userId: d.userId,
        items: d.items,
        status: d.status
      })));

      const enriched = [];

      for (const request of requestRes.documents) {
        console.log("Processing request:", request.$id);
        
        const existingMatchesRes = await database.listDocuments(
          ITEMS_DATABASE_ID,
          MATCHES_COLLECTION_ID,
          [Query.equal("requestId", request.$id)]
        );

        const existingMatches = new Map();
        for (const match of existingMatchesRes.documents) {
          existingMatches.set(match.donationId, match);
        }

        console.log("Existing matches for request:", existingMatches.size);

        const matches = [];

        for (const donation of donationRes.documents) {
          const existingMatch = existingMatches.get(donation.$id);
          if (existingMatch) {
            console.log("Using existing match:", existingMatch.$id);
            try {
              matches.push({
                ...existingMatch,
                donation,
                donorEmail: existingMatch.donorEmail || null,
                donorPhone: existingMatch.donorPhone || null,
                requestorEmail: existingMatch.requestorEmail || null,
                requestorPhone: existingMatch.requestorPhone || null,
              });
            } catch (err) {
              console.error("Error loading existing match:", err);
            }
            continue;
          }

          const matchResult = calculateMatchScore(donation, request);
          if (!matchResult) continue;

          console.log("Potential match found:", {
            donationId: donation.$id,
            score: matchResult.score,
            overlap: matchResult.overlap,
          });

          matches.push({
            $id: `temp-${donation.$id}`,
            donationId: donation.$id,
            requestId: request.$id,
            items: matchResult.overlap,
            score: matchResult.score,
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

        console.log("Total matches for request:", matches.length);

        enriched.push({ ...request, matches: matches.slice(0, 10) });
      }

      console.log("Returning enriched requests:", enriched.length);
      return enriched;
    } catch (err) {
      console.error("Error in getRequestsWithMatches:", err);
      return [];
    }
  }

  async function getDonationsWithMatches() {
    if (!userId) return [];
    
    const donationRes = await database.listDocuments(
      ITEMS_DATABASE_ID,
      DONATIONS_COLLECTION_ID,
      [Query.equal("userId", userId), Query.equal("status", "active")]
    );

    const enriched = [];

    for (const donation of donationRes.documents) {
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
        try {
          const request = await database.getDocument(
            ITEMS_DATABASE_ID,
            REQUESTS_COLLECTION_ID,
            match.requestId
          );

          if (request.status !== "active") continue;

          matches.push({
            ...match,
            request,
            donorEmail: match.donorEmail || null,
            donorPhone: match.donorPhone || null,
            requestorEmail: match.requestorEmail || null,
            requestorPhone: match.requestorPhone || null,
          });
        } catch {}
      }

      enriched.push({ ...donation, matches });
    }

    return enriched;
  }

  async function selectMatch(matchId) {
    if (!userId) return null;

    if (matchId.startsWith("temp-")) {
      throw new Error(
        "Please pass the full match object to selectMatch for temporary matches"
      );
    }

    const match = await database.getDocument(
      ITEMS_DATABASE_ID,
      MATCHES_COLLECTION_ID,
      matchId
    );

    const existingPendingMatches = await database.listDocuments(
      ITEMS_DATABASE_ID,
      MATCHES_COLLECTION_ID,
      [Query.equal("requestId", match.requestId), Query.equal("status", "pending")]
    );

    if (existingPendingMatches.documents.length > 0) {
      throw new Error(
        "You already have a pending match for this request. Please wait for donor response."
      );
    }

    await database.updateDocument(
      ITEMS_DATABASE_ID,
      DONATIONS_COLLECTION_ID,
      match.donationId,
      { status: "pending" }
    );

    return await database.updateDocument(
      ITEMS_DATABASE_ID,
      MATCHES_COLLECTION_ID,
      matchId,
      { status: "pending" }
    );
  }

  async function createAndSelectMatch(donation, request, matchData) {
    console.log("createAndSelectMatch called:", { donation: donation.$id, request: request.$id });
    
    if (!userId) return null;

    const existingPendingMatches = await database.listDocuments(
      ITEMS_DATABASE_ID,
      MATCHES_COLLECTION_ID,
      [Query.equal("requestId", request.$id), Query.equal("status", "pending")]
    );

    if (existingPendingMatches.documents.length > 0) {
      throw new Error(
        "You already have a pending match for this request. Please wait for donor response."
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
      }
    );

    console.log("Match created:", newMatch.$id);

    await database.updateDocument(
      ITEMS_DATABASE_ID,
      DONATIONS_COLLECTION_ID,
      donation.$id,
      { status: "pending" }
    );

    return newMatch;
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
        selectMatch,
        createAndSelectMatch,
        approveDonation,
        denyDonation,
        provideRequestorContact,
      }}
    >
      {children}
    </MatchContext.Provider>
  );
}