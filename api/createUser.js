import { adminAuth, adminDb } from "./_firebaseAdmin";

export default async function handler(req, res) {
  console.log("ENV", {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
});

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, email, password, role, organization } = req.body;

  if (!name || !email || !password || !role || !organization) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // Create user in Firebase Auth
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
    });

    // Save additional data in Firestore
    await adminDb.collection("users").doc(userRecord.uid).set({
      uid: userRecord.uid,
      name,
      email,
      role,
      organization,
    });

    res.status(200).json({ success: true, uid: userRecord.uid });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
