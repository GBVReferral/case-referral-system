// /api/sendCaseUpdateEmails.js
import nodemailer from "nodemailer";
import admin from "firebase-admin";

// Initialize Firebase Admin SDK (only once)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_ADMIN_KEY_JSON)
    ),
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  console.log("Case Update Email API invoked. Method:", req.method);

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { caseCode, updatedStatus, note, updatedBy, updatedByEmail, referredToOrg } = req.body;

    if (!caseCode || !updatedStatus || !updatedBy || !updatedByEmail) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // ✅ Fetch all users from Firestore
    const usersSnapshot = await db.collection("users").get();
    const allEmails = usersSnapshot.docs
      .map((doc) => doc.data().email)
      .filter((email) => !!email);

    // Add the updater’s email if not in users
    if (!allEmails.includes(updatedByEmail)) {
      allEmails.push(updatedByEmail);
    }

    // Setup Nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    // Send single email to all users
    await transporter.sendMail({
      from: `"GBV Referral System" <${process.env.GMAIL_USER}>`,
      to: allEmails.join(", "),
      subject: `Case Status Updated: ${caseCode}`,
      text: `Case ${caseCode} status has been updated.

New Status: ${updatedStatus}
Note: ${note}
Updated By: ${updatedBy}
Referred To Org: ${referredToOrg || "N/A"}
`,
      html: `
<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <h2 style="color: #004085; border-bottom: 2px solid #004085; padding-bottom: 5px;">Case Status Updated</h2>
  <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
    <tr><td style="padding: 8px; font-weight: bold; width: 150px;">Case Code:</td><td style="padding: 8px;">${caseCode}</td></tr>
    <tr><td style="padding: 8px; font-weight: bold;">New Status:</td><td style="padding: 8px;">${updatedStatus}</td></tr>
    <tr><td style="padding: 8px; font-weight: bold;">Note:</td><td style="padding: 8px;">${note}</td></tr>
    <tr><td style="padding: 8px; font-weight: bold;">Updated By:</td><td style="padding: 8px;">${updatedBy}</td></tr>
    <tr><td style="padding: 8px; font-weight: bold;">Referred To Org:</td><td style="padding: 8px;">${referredToOrg || "N/A"}</td></tr>
  </table>

  <p style="margin-top: 20px; color: #555;">
    Please review this case update promptly.
  </p>

  <hr style="border: none; border-top: 1px solid #ccc; margin: 20px 0;" />
  <p style="font-size: 12px; color: #777;">
    This is an automated notification from the GBV Referral System.
  </p>
</div>
      `
    });

    console.log("Case status update emails sent successfully");
    return res.status(200).json({ success: true, message: "Emails sent to all users" });

  } catch (err) {
    console.error("API error:", err);
    return res.status(500).json({ error: err.message });
  }
}
