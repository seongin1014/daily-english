"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyAuth = verifyAuth;
exports.checkUsageLimit = checkUsageLimit;
exports.incrementUsage = incrementUsage;
const admin = __importStar(require("firebase-admin"));
/**
 * Verify Firebase Auth token from Authorization header.
 * Returns uid or sends 401 response.
 */
async function verifyAuth(req, res) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        res.status(401).json({ error: "Missing or invalid Authorization header" });
        return null;
    }
    const token = authHeader.split("Bearer ")[1];
    try {
        const decoded = await admin.auth().verifyIdToken(token);
        return decoded.uid;
    }
    catch (error) {
        res.status(401).json({ error: "Invalid or expired token" });
        return null;
    }
}
/**
 * Check monthly usage against subscription limit.
 * Returns true if allowed, false if limit exceeded (sends 403).
 */
async function checkUsageLimit(uid, res) {
    const db = admin.firestore();
    const userDoc = await db.doc(`users/${uid}`).get();
    const subscription = userDoc.data()?.subscription ?? "free";
    // Pro users have no limit
    if (subscription === "pro")
        return true;
    // Check RevenueCat as fallback (webhook delay compensation)
    if (subscription === "free") {
        const rcKey = process.env.REVENUECAT_API_KEY;
        if (rcKey) {
            try {
                const rcRes = await fetch(`https://api.revenuecat.com/v1/subscribers/${uid}`, { headers: { Authorization: `Bearer ${rcKey}` } });
                if (rcRes.ok) {
                    const rcData = await rcRes.json();
                    const proEntitlement = rcData.subscriber?.entitlements?.pro;
                    if (proEntitlement && new Date(proEntitlement.expires_date) > new Date()) {
                        // Update Firestore to match RevenueCat
                        await db.doc(`users/${uid}`).update({ subscription: "pro" });
                        return true;
                    }
                }
            }
            catch {
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
async function incrementUsage(uid) {
    const db = admin.firestore();
    const monthKey = new Date().toISOString().slice(0, 7);
    const usageRef = db.doc(`users/${uid}/usage/${monthKey}`);
    const usageDoc = await usageRef.get();
    if (usageDoc.exists) {
        await usageRef.update({
            recordingCount: admin.firestore.FieldValue.increment(1),
            lastRecordingAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
    else {
        await usageRef.set({
            recordingCount: 1,
            lastRecordingAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
}
//# sourceMappingURL=auth.js.map