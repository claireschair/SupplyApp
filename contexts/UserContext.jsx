import { createContext, useEffect, useState } from "react";
import { account, database } from "../lib/appwrite";
import { ID, Query } from "react-native-appwrite";

export const UserContext = createContext();

// ---------- IDs ----------
const FEEDBACK_DB_ID = "6921e0910003970bf9bb";
const FEEDBACK_COLLECTION_ID = "feedbackattributers";

const REQUEST_DB_ID = "6944caa80022e2cfa289";
const REQUEST_COLLECTION_ID = "requests";

const DONATION_DB_ID = "69276d130021687546df";
const DONATION_COLLECTION_ID = "donations";

const MATCH_DB_ID = "6946ce09003051fcb9a2";
const MATCH_COLLECTION_ID = "matches";
// -------------------------

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // ---------------- LOGIN ----------------
  async function login(email, password) {
    await account.createEmailPasswordSession(email, password);
    await getInitialUserValue();
  }

  // ---------------- REGISTER ----------------
  async function register(email, password, name, label) {
    const newUser = await account.create(ID.unique(), email, password, name);

    await database.createDocument(
      process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID,
      process.env.EXPO_PUBLIC_APPWRITE_USERS_COLLECTION_ID,
      ID.unique(),
      {
        userID: newUser.$id,
        name,
        email,
        label,
      }
    );

    await login(email, password);
  }

  // ---------------- LOGOUT ----------------
  async function logout() {
    await account.deleteSession("current");
    setUser(null);
  }

  // ---------------- LOAD USER ----------------
  async function getInitialUserValue() {
    try {
      const authUser = await account.get();

      const profile = await database.listDocuments(
        process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID,
        process.env.EXPO_PUBLIC_APPWRITE_USERS_COLLECTION_ID,
        [Query.equal("userID", authUser.$id)]
      );

      setUser({ ...authUser, ...(profile.documents[0] || {}) });
    } catch {
      setUser(null);
    } finally {
      setAuthChecked(true);
    }
  }

  // ---------------- SAVE DONATION ----------------
  async function saveDonation(items, other = null, locationData = {}) {
    if (!user) throw new Error("User not logged in");

    const { zipCode = null, lat = null, lng = null } = locationData;

    return await database.createDocument(
      DONATION_DB_ID,
      DONATION_COLLECTION_ID,
      ID.unique(),
      {
        userId: user.$id,
        items,
        Other: other || null,
        zipCode,
        lat,
        lng,
        donorEmail: user.email, // store donor email by default
      }
    );
  }

  // ---------------- SAVE REQUEST ----------------
  async function saveRequest(items, other = null, locationData = {}) {
    if (!user) throw new Error("User not logged in");

    const { zipCode = null, lat = null, lng = null } = locationData;

    return await database.createDocument(
      REQUEST_DB_ID,
      REQUEST_COLLECTION_ID,
      ID.unique(),
      {
        userId: user.$id,
        items,
        Other: other || null,
        zipCode,
        lat,
        lng,
        requestorEmail: user.email, // store requestor email by default
      }
    );
  }

  // ---------------- FETCH REQUESTS + MATCHES ----------------
  async function getRequestsWithMatches() {
    if (!user) throw new Error("User not logged in");

    const requestRes = await database.listDocuments(
      REQUEST_DB_ID,
      REQUEST_COLLECTION_ID,
      [Query.equal("userId", user.$id)]
    );

    const enriched = [];

    for (const request of requestRes.documents) {
      const matchRes = await database.listDocuments(
        MATCH_DB_ID,
        MATCH_COLLECTION_ID,
        [
          Query.equal("requestId", request.$id),
          Query.orderDesc("score"),
          Query.limit(10),
        ]
      );

      const matches = await Promise.all(
        matchRes.documents.map(async (match) => {
          const donation = await database.getDocument(
            DONATION_DB_ID,
            DONATION_COLLECTION_ID,
            match.donationId
          );

          return {
            ...match,
            donation,
            donorEmail: match.donorEmail || donation.donorEmail || null,
            donorPhone: match.donorPhone || donation.donorPhone || null,
            requestorEmail: match.requestorEmail || request.requestorEmail || null,
            requestorPhone: match.requestorPhone || null,
          };
        })
      );

      enriched.push({ ...request, matches });
    }

    return enriched;
  }

  // ---------------- UPDATE MATCH STATUS ----------------
  async function updateMatchStatus(matchId, status, contactInfo = null, isRequestor = false) {
    if (!user) throw new Error("User not logged in");

    const updateData = { status };

    if (status === "approved" && contactInfo) {
      if (isRequestor) {
        updateData.requestorEmail = contactInfo.email || null;
        updateData.requestorPhone = contactInfo.phone;
      } else {
        updateData.donorEmail = contactInfo.email || null;
        updateData.donorPhone = contactInfo.phone;
      }
    }

    return await database.updateDocument(
      MATCH_DB_ID,
      MATCH_COLLECTION_ID,
      matchId,
      updateData
    );
  }

  // ---------------- SELECT MATCH ----------------
  async function selectMatch(matchId) {
    // Selecting a match sets its status to "pending"
    return await updateMatchStatus(matchId, "pending");
  }

  // ---------------- PROVIDE CONTACT INFO ----------------
  async function provideContactInfo(matchId, contactInfo) {
    // Called by requestor after donor approves
    const updatedMatch = await updateMatchStatus(matchId, "approved", contactInfo, true);

    // Optional: if you want to store the contact info in the request as well
    const matchDoc = updatedMatch;
    if (matchDoc.requestId) {
      await database.updateDocument(
        REQUEST_DB_ID,
        REQUEST_COLLECTION_ID,
        matchDoc.requestId,
        {
          [`matchContacts.${matchId}`]: contactInfo,
        }
      );
    }

    return updatedMatch;
  }

  // ---------------- FEEDBACK ----------------
  async function saveFeedback(rating, text) {
    if (!user) throw new Error("User not logged in");

    return await database.createDocument(
      FEEDBACK_DB_ID,
      FEEDBACK_COLLECTION_ID,
      ID.unique(),
      { userId: user.$id, rating, text }
    );
  }

  useEffect(() => {
    getInitialUserValue();
  }, []);

  return (
    <UserContext.Provider
      value={{
        user,
        authChecked,
        login,
        logout,
        register,
        saveDonation,
        saveRequest,
        saveFeedback,
        getRequestsWithMatches,
        updateMatchStatus,
        selectMatch,
        provideContactInfo,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}
