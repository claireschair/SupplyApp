import { Client, Databases, ID, Query } from "node-appwrite";

export default async function (context) {
  context.log("Function started");

  const {
    APPWRITE_ENDPOINT,
    APPWRITE_PROJECT_ID,
    APPWRITE_API_KEY,
    DONATION_DATABASE_ID,
    DONATION_COLLECTION_ID,
    RECEIVE_DATABASE_ID,
    RECEIVE_COLLECTION_ID,
    MATCH_DATABASE_ID,
    MATCH_COLLECTION_ID,
  } = process.env;

  // Check for missing environment variables
  const missing = Object.entries({
    APPWRITE_ENDPOINT,
    APPWRITE_PROJECT_ID,
    APPWRITE_API_KEY,
    DONATION_DATABASE_ID,
    DONATION_COLLECTION_ID,
    RECEIVE_DATABASE_ID,
    RECEIVE_COLLECTION_ID,
    MATCH_DATABASE_ID,
    MATCH_COLLECTION_ID,
  })
    .filter(([_, v]) => !v)
    .map(([k]) => k);

  if (missing.length) {
    context.error("Missing env vars:", missing);
    return context.res.empty();
  }

  // Initialize Appwrite client
  const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID)
    .setKey(APPWRITE_API_KEY);

  const databases = new Databases(client);

  try {
    context.log("Listing donations...");
    const donationsRes = await databases.listDocuments(
      DONATION_DATABASE_ID,
      DONATION_COLLECTION_ID
    );

    context.log("Listing requests...");
    const requestsRes = await databases.listDocuments(
      RECEIVE_DATABASE_ID,
      RECEIVE_COLLECTION_ID
    );

    const donations = donationsRes.documents;
    const requests = requestsRes.documents;

    context.log(`Donations: ${donations.length}`);
    context.log(`Requests: ${requests.length}`);

    for (const donation of donations) {
      const donationItems = normalizeItems(donation.items, donation.other);

      for (const request of requests) {
        const requestItems = normalizeItems(request.items, request.other);

        const overlap = donationItems.filter(item =>
          requestItems.includes(item)
        );

        const score = overlap.length;
        if (score === 0) continue;

        context.log(
          `Match score ${score} → donation ${donation.$id}, request ${request.$id}`,
          overlap
        );

        // Check if match already exists
        const existing = await databases.listDocuments(
          MATCH_DATABASE_ID,
          MATCH_COLLECTION_ID,
          [
            Query.equal("donationId", donation.$id),
            Query.equal("requestId", request.$id),
          ]
        );

        if (existing.total > 0) continue;

        // Create new match
        await databases.createDocument(
          MATCH_DATABASE_ID,
          MATCH_COLLECTION_ID,
          ID.unique(),
          {
            donationId: donation.$id,
            requestId: request.$id,
            items: overlap,
            score,
          }
        );

        context.log("Match created");
      }
    }
  } catch (err) {
    context.error("Function error:", err.message || err);
  }

  return context.res.empty();
}

// Normalize items: combine donation/request items with 'other', trim, lowercase
function normalizeItems(items = [], other = []) {
  return [...items, ...other]
    .map(i => String(i).trim().toLowerCase())
    .filter(Boolean);
}
