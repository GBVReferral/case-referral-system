// /api/sendSupervisorEmail.js
import nodemailer from "nodemailer";
import admin from "firebase-admin";

// ✅ Initialize Firebase Admin SDK (only once)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_ADMIN_KEY_JSON)
    ),
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  console.log("Supervisor Email API invoked:", req.method);

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { supervisorId, referralData } = req.body;
    console.log("Request body:", req.body);

    if (!supervisorId || !referralData) {
      return res
        .status(400)
        .json({ error: "Missing supervisorId or referralData" });
    }

    // ✅ Fetch supervisor’s email from Firestore
    const supervisorDoc = await db.collection("users").doc(supervisorId).get();

    if (!supervisorDoc.exists) {
      return res.status(404).json({ error: "Supervisor not found" });
    }

    const supervisorEmail = supervisorDoc.data().email;

    if (!supervisorEmail) {
      return res.status(400).json({ error: "Supervisor email not found" });
    }

    console.log("Supervisor email found:", supervisorEmail);

    // ✅ Setup Nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    // ✅ Send email
    await transporter.sendMail({
      from: `"GBV Referral System" <${process.env.GMAIL_USER}>`,
      to: supervisorEmail,
      subject: `Assigned Case: ${referralData.caseCode}`,
      text: `You have been assigned to a new case.

Case Code: ${referralData.caseCode}
Color Code: ${referralData.clientColorCode}
Client Info: ${referralData.clientContactInfo}
Notes: ${referralData.notes}
Consent Form: ${referralData.consentFormUrl}
Assigned By: ${referralData.assignedBy} (${referralData.assignedByOrg})`,

      html: `
<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <h2 style="color: #004085;">You’ve been assigned a new case</h2>
  
  <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
    <tr><td><b>Case Code:</b></td><td>${referralData.caseCode}</td></tr>
    <tr><td><b>Color Code:</b></td><td>${referralData.clientColorCode}</td></tr>
    <tr><td><b>Client Info:</b></td><td>${referralData.clientContactInfo}</td></tr>
    <tr><td><b>Notes:</b></td><td>${referralData.notes}</td></tr>
    <tr><td><b>Consent Form:</b></td><td><a href="${referralData.consentFormUrl}" target="_blank">${referralData.consentFormUrl}</a></td></tr>
    <tr><td><b>Assigned By:</b></td><td>${referralData.assignedBy} (${referralData.assignedByOrg})</td></tr>
  </table>

  <p style="margin-top: 20px; color: #555;">Please review this case and take necessary actions.</p>
</div>
`,
    });

    console.log("Email sent to supervisor:", supervisorEmail);
    return res
      .status(200)
      .json({ success: true, message: "Email sent to supervisor" });
  } catch (err) {
    console.error("Supervisor Email API error:", err);
    return res.status(500).json({ error: err.message });
  }
}
