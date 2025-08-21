// /api/users/delete.js
import { adminAuth, adminDb } from "../_firebaseAdmin";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const authHeader = req.headers.authorization || "";
  const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!idToken) return res.status(401).json({ error: "Missing ID token" });

  try {
    const caller = await adminAuth.verifyIdToken(idToken);
    // (Optional)
    // if (!caller.admin) return res.status(403).json({ error: "Admins only" });

    const { uid } = req.body || {};
    if (!uid) return res.status(400).json({ error: "Missing uid" });

    await adminAuth.deleteUser(uid);
    await adminDb.collection("users").doc(uid).delete();

    // TODO: cleanup other data owned by this user if needed.

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}
