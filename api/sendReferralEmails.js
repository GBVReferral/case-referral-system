// /api/sendReferralEmails.js
import nodemailer from "nodemailer";
import admin from "firebase-admin";

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_ADMIN_KEY_JSON)
    ),
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  console.log("API invoked. Method:", req.method);

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { referralToOrg, referralData } = req.body;
    console.log("Request body:", req.body);

    if (!referralToOrg || !referralData) {
      return res
        .status(400)
        .json({ error: "Missing referralToOrg or referralData" });
    }

    // Query Firestore for focal persons
    const usersRef = db.collection("users");
    const querySnapshot = await usersRef
      .where("organization", "==", referralToOrg)
      .where("role", "==", "Focal Person")
      .get();

    if (querySnapshot.empty) {
      console.log("No focal persons found for:", referralToOrg);
      return res
        .status(404)
        .json({ error: "No focal persons found for this organization" });
    }

    const focalEmails = querySnapshot.docs.map((doc) => doc.data().email);
    console.log("Focal person emails:", focalEmails);

    // Setup Nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    // Send email to each focal person
    const sendEmailPromises = focalEmails.map((email) =>
      transporter.sendMail({
        from: `"GBV Referral System" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: `New Referral Case: ${referralData.caseCode}`,
        text: `A new referral has been created for your organization.\n
Case Code: ${referralData.caseCode}
Color Code: ${referralData.clientColorCode}
Client Info: ${referralData.clientContactInfo}
Notes: ${referralData.notes}
Consent Form: ${referralData.consentFormUrl}
Created By: ${referralData.createdBy} (${referralData.createdByOrg})`,
        html: `
          <h3>New Referral Case</h3>
          <p><strong>Case Code:</strong> ${referralData.caseCode}</p>
          <p><strong>Color Code:</strong> ${referralData.clientColorCode}</p>
          <p><strong>Client Info:</strong> ${referralData.clientContactInfo}</p>
          <p><strong>Notes:</strong> ${referralData.notes}</p>
          <p><strong>Consent Form:</strong> <a href="${referralData.consentFormUrl}">${referralData.consentFormUrl}</a></p>
          <p><strong>Created By:</strong> ${referralData.createdBy} (${referralData.createdByOrg})</p>
        `,
      })
    );

    await Promise.all(sendEmailPromises);
    console.log("Emails sent successfully");

    return res
      .status(200)
      .json({ success: true, message: "Emails sent to focal persons" });
  } catch (err) {
    console.error("API error:", err);
    return res.status(500).json({ error: err.message });
  }
}
