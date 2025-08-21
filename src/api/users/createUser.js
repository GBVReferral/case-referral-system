// /api/createUser.js
import { adminAuth, adminDb } from "./_firebaseAdmin";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, password, name, role, organization } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    // 1️⃣ Create Firebase Auth user
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
    });

    // 2️⃣ Save in Firestore
    await adminDb.collection("users").doc(userRecord.uid).set({
      uid: userRecord.uid,
      name,
      email,
      role,
      organization,
    });

    return res.status(200).json({ success: true, uid: userRecord.uid });
  } catch (err) {
    console.error("Error creating user:", err);
    return res.status(500).json({ error: err.message });
  }
}
