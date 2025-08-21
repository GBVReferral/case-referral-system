// src/api/createUser.js
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

export default async function handler(req, res) {
  // CORS headers
  const allowedOrigins = ["http://localhost:5173", "https://gbv-referral-system.vercel.app"];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Parse env JSON
  const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_KEY_JSON || "{}");

  // Initialize Firebase Admin only once
  if (!getApps().length) {
    initializeApp({
      credential: cert(serviceAccount),
    });
  }

  const auth = getAuth();
  const db = getFirestore();

  const { name, email, password, role, organization } = req.body;

  if (!name || !email || !password || !role || !organization) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
    });

    // Save additional data in Firestore
    await db.collection("users").doc(userRecord.uid).set({
      uid: userRecord.uid,
      name,
      email,
      role,
      organization,
      createdAt: new Date().toISOString(),
    });

    return res.status(200).json({ uid: userRecord.uid, message: "User created successfully" });
  } catch (error) {
    console.error("Error creating user:", error);
    return res.status(500).json({ error: error.message });
  }
}
