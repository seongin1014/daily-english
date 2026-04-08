import * as admin from "firebase-admin";
import type { Request } from "firebase-functions/v2/https";
import type { Response } from "express";

export interface AuthenticatedRequest extends Request {
  uid: string;
}

/**
 * Verify Firebase Auth token from Authorization header.
 * Returns uid or sends 401 response.
 */
export async function verifyAuth(
  req: Request,
  res: Response
): Promise<string | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid Authorization header" });
    return null;
  }

  const token = authHeader.split("Bearer ")[1];
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    return decoded.uid;
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired token" });
    return null;
  }
}

/**
 * Check monthly usage against subscription limit.
 * Returns true if allowed, false if limit exceeded (sends 403).
 */
export async function checkUsageLimit(
  uid: string,
  res: Response
): Promise<boolean> {
  const db = admin.firestore();
  const userDoc = await db.doc(`users/${uid}`).get();
  const subscription = userDoc.data()?.subscription ?? "free";

  // Pro users have no limit
  if (subscription === "pro") return true;

  // Check RevenueCat as fallback (webhook delay compensation)
  if (subscription === "free") {
    const rcKey = process.env.REVENUECAT_API_KEY;
    if (rcKey) {
      try {
        const rcRes = await fetch(
          `https://api.revenuecat.com/v1/subscribers/${uid}`,
          { headers: { Authorization: `Bearer ${rcKey}` } }
        );
        if (rcRes.ok) {
          const rcData = await rcRes.json();
          const proEntitlement = rcData.subscriber?.entitlements?.pro;
          if (proEntitlement && new Date(proEntitlement.expires_date) > new Date()) {
            // Update Firestore to match RevenueCat
            await db.doc(`users/${uid}`).update({ subscription: "pro" });
            return true;
          }
        }
      } catch {
        // RevenueCat check failed — fall through to Firestore limit
      }
    }
  }

  // Check monthly usage
  const monthKey = new Date().toISOString().slice(0, 7);
  const usageDoc = await db.doc(`users/${uid}/usage/${monthKey}`).get();
  const count = usageDoc.data()?.recordingCount ?? 0;

  if (count >= 5) {
    res.status(403).json({ error: "USAGE_LIMIT_EXCEEDED", count, limit: 5 });
    return false;
  }

  return true;
}

/**
 * Increment monthly usage counter.
 */
export async function incrementUsage(uid: string): Promise<void> {
  const db = admin.firestore();
  const monthKey = new Date().toISOString().slice(0, 7);
  const usageRef = db.doc(`users/${uid}/usage/${monthKey}`);

  const usageDoc = await usageRef.get();
  if (usageDoc.exists) {
    await usageRef.update({
      recordingCount: admin.firestore.FieldValue.increment(1),
      lastRecordingAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } else {
    await usageRef.set({
      recordingCount: 1,
      lastRecordingAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
}
