import { createContext, useContext } from "react";
import { database } from "../lib/appwrite";
import { ID, Query } from "react-native-appwrite";
import { UserContext } from "./UserContext";

export const MatchContext = createContext();

const ITEMS_DATABASE_ID = "69276d130021687546df";
const DONATIONS_COLLECTION_ID = "donations";
const REQUESTS_COLLECTION_ID = "requests";
const MATCHES_COLLECTION_ID = "matches";

export function MatchProvider({ children }) {
  const { user } = useContext(UserContext);

  const userId = user?.$id ?? null;

  async function saveDonation(items, other = [], locationData = {}) {
    if (!userId) return null;

    const { zipCode = null, lat = null, lng = null } = locationData;
    return database.createDocument(
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
  }

  async function saveRequest(items, other = [], locationData = {}) {
    if (!userId) return null;

    const { zipCode = null, lat = null, lng = null } = locationData;
    return database.createDocument(
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
  }

  async function getRequestsWithMatches() {
    if (!userId) return [];
    const requestRes = await database.listDocuments(
      ITEMS_DATABASE_ID,
      REQUESTS_COLLECTION_ID,
      [Query.equal("userId", userId), Query.equal("status", "active")]
    );

    const enriched = [];
    for (const request of requestRes.documents) {
      const matchRes = await database.listDocuments(
        ITEMS_DATABASE_ID,
        MATCHES_COLLECTION_ID,
        [Query.equal("requestId", request.$id), Query.orderDesc("score"), Query.limit(10)]
      );

      const matches = [];
      for (const match of matchRes.documents) {
        try {
          const donation = await database.getDocument(
            ITEMS_DATABASE_ID,
            DONATIONS_COLLECTION_ID,
            match.donationId
          );
          if (donation.status !== "active") continue;

          matches.push({
            ...match,
            donation,
            donorEmail: match.donorEmail || null,
            donorPhone: match.donorPhone || null,
            requestorEmail: match.requestorEmail || null,
            requestorPhone: match.requestorPhone || null,
          });
        } catch {}
      }

      enriched.push({ ...request, matches });
    }

    return enriched;
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
        [Query.equal("donationId", donation.$id), Query.orderDesc("score"), Query.limit(10)]
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

  async function updateMatchStatus(matchId, status, contactInfo = null, isRequestor = false) {
    if (!userId) return null;

    const match = await database.getDocument(ITEMS_DATABASE_ID, MATCHES_COLLECTION_ID, matchId);

    if (match.status === "approved") {
      throw new Error("This match has already been approved.");
    }

    const updateData = { status };

    if (status === "approved" && contactInfo) {
      if (isRequestor) {
        updateData.requestorEmail = contactInfo.email || null;
        updateData.requestorPhone = contactInfo.phone;
      } else {
        updateData.donorEmail = contactInfo.email || null;
        updateData.donorPhone = contactInfo.phone;
      }

      if (match.donationId) {
        await database.updateDocument(ITEMS_DATABASE_ID, DONATIONS_COLLECTION_ID, match.donationId, { status: "matched" });
      }

      if (match.requestId) {
        await database.updateDocument(ITEMS_DATABASE_ID, REQUESTS_COLLECTION_ID, match.requestId, { status: "matched" });
      }

      const otherMatches = await database.listDocuments(
        ITEMS_DATABASE_ID,
        MATCHES_COLLECTION_ID,
        [Query.or([Query.equal("donationId", match.donationId), Query.equal("requestId", match.requestId)])]
      );

      for (const m of otherMatches.documents) {
        if (m.$id !== matchId) {
          await database.deleteDocument(ITEMS_DATABASE_ID, MATCHES_COLLECTION_ID, m.$id);
        }
      }
    }

    return await database.updateDocument(ITEMS_DATABASE_ID, MATCHES_COLLECTION_ID, matchId, updateData);
  }

  async function selectMatch(matchId) {
    if (!userId) return null;
    return updateMatchStatus(matchId, "pending");
  }

  async function provideContactInfo(matchId, contactInfo) {
    if (!userId) return null;
    return updateMatchStatus(matchId, "approved", contactInfo, true);
  }

  return (
    <MatchContext.Provider
      value={{
        saveDonation,
        saveRequest,
        getRequestsWithMatches,
        getDonationsWithMatches,
        updateMatchStatus,
        selectMatch,
        provideContactInfo,
      }}
    >
      {children}
    </MatchContext.Provider>
  );
}
