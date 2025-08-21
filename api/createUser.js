import { adminAuth, adminDb } from "./_firebaseAdmin";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { name, email, password, role, organization } = req.body;

    if (!name || !email || !password || !role || !organization) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const userRecord = await adminAuth.createUser({ email, password, displayName: name });

    await adminDb.collection("users").doc(userRecord.uid).set({
      uid: userRecord.uid,
      name,
      email,
      role,
      organization,
    });

    return res.status(200).json({ success: true, uid: userRecord.uid });
  } catch (err) {
    console.error("Firebase createUser error:", err);
    return res.status(500).json({ error: err.message || "Unknown server error" });
  }
}
