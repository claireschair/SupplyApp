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

  const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID)
    .setKey(APPWRITE_API_KEY);

  const databases = new Databases(client);

  try {
    context.log("Listing donations...");
    const donationsRes = await databases.listDocuments(DONATION_DATABASE_ID, DONATION_COLLECTION_ID);

    context.log("Listing requests...");
    const requestsRes = await databases.listDocuments(RECEIVE_DATABASE_ID, RECEIVE_COLLECTION_ID);

    const donations = donationsRes.documents;
    const requests = requestsRes.documents;

    context.log(`Donations: ${donations.length}`);
    context.log(`Requests: ${requests.length}`);

    for (const donation of donations) {
      const donationItems = normalizeItems(donation.items, donation.Other);

      for (const request of requests) {
        const requestItems = normalizeItems(request.items, request.Other);

        const overlap = donationItems.filter(item => requestItems.includes(item));
        if (overlap.length === 0) continue;

        // --------------------------
        // Base score: item overlap
        // --------------------------
        let score = overlap.length;
        const itemScore = score;

        // --------------------------
        // ZIP CODE BONUS
        // --------------------------
        let zipBonus = 0;
        let zipLog = "";
        if (donation.zipCode && request.zipCode) {
          const donationZip = parseInt(donation.zipCode, 10);
          const requestZip = parseInt(request.zipCode, 10);
          const zipDiff = Math.abs(donationZip - requestZip);

          if (zipDiff === 0) {
            zipBonus = 3;
            zipLog = "Exact zip match";
          } else if (zipDiff <= 5) {
            zipBonus = 2;
            zipLog = `Zip within ±5 (${zipDiff})`;
          } else if (zipDiff <= 10) {
            zipBonus = 1;
            zipLog = `Zip within ±10 (${zipDiff})`;
          }

          score += zipBonus;
        }

        // --------------------------
        // LOCATION PROXIMITY BONUS
        // --------------------------
        let locBonus = 0;
        let locLog = "";
        if (
          donation.lat != null &&
          donation.lng != null &&
          request.lat != null &&
          request.lng != null
        ) {
          const distanceKm = haversineDistance(
            donation.lat,
            donation.lng,
            request.lat,
            request.lng
          );

          if (distanceKm <= 5) {
            locBonus = 3;
            locLog = `Distance ≤5km (${distanceKm.toFixed(2)}km)`;
          } else if (distanceKm <= 15) {
            locBonus = 2;
            locLog = `Distance ≤15km (${distanceKm.toFixed(2)}km)`;
          } else if (distanceKm <= 30) {
            locBonus = 1;
            locLog = `Distance ≤30km (${distanceKm.toFixed(2)}km)`;
          }

          score += locBonus;
        }

        // --------------------------
        // Detailed logging
        // --------------------------
        context.log(
          `Match: donation ${donation.$id} ↔ request ${request.$id}`,
          {
            itemsMatched: overlap,
            itemScore,
            zipBonus,
            zipInfo: zipLog,
            locBonus,
            locInfo: locLog,
            totalScore: score,
          }
        );

        // --------------------------
        // Check if match exists
        // --------------------------
        const existing = await databases.listDocuments(
          MATCH_DATABASE_ID,
          MATCH_COLLECTION_ID,
          [
            Query.equal("donationId", donation.$id),
            Query.equal("requestId", request.$id),
          ]
        );
        if (existing.total > 0) continue;

        await databases.createDocument(
          MATCH_DATABASE_ID,
          MATCH_COLLECTION_ID,
          ID.unique(),
          {
            donationId: donation.$id,
            requestId: request.$id,
            items: overlap,
            score: parseFloat(score.toFixed(2)),
          }
        );

        context.log("Match created successfully");
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

// Haversine formula to calculate distance between two lat/lng points
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const toRad = deg => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
