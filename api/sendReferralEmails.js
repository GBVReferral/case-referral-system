import admin from "firebase-admin";
import nodemailer from "nodemailer";

// Initialize Firebase Admin once
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_KEY_JSON);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// Setup nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER, 
    pass: process.env.SMTP_PASS,
  },
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { referralToOrg, referralData } = req.body;

    if (!referralToOrg || !referralData) {
      return res.status(400).json({ error: "Missing referral data" });
    }

    // 🔹 Get all user emails (admins + normal users)
    const usersSnapshot = await db.collection("users").get();
    const allEmails = usersSnapshot.docs
      .map((doc) => doc.data().email)
      .filter((email) => !!email);

    if (allEmails.length === 0) {
      return res.status(400).json({ error: "No user emails found" });
    }

    // Email template with referred-to org name
    const mailOptions = {
      from: `"Case Referral System" <${process.env.SMTP_USER}>`,
      to: allEmails, // all users (transparent, not BCC)
      subject: `📌 Case Referral: ${referralData.caseCode} → ${referralToOrg}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #2c3e50;">📌 New Case Referral</h2>
          <p>A case has been referred in the system. Please find details below:</p>
          <table style="border-collapse: collapse; width: 100%; margin-top: 15px;">
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Case Code</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${referralData.caseCode}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Client Color Code</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${referralData.clientColorCode}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Client Contact Info</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${referralData.clientContactInfo}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Notes</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${referralData.notes}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Consent Form</strong></td><td style="padding: 8px; border: 1px solid #ddd;"><a href="${referralData.consentFormUrl}" target="_blank">View Form</a></td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Referred By</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${referralData.createdBy} (${referralData.createdByOrg})</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Referred To Org</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${referralToOrg}</td></tr>
          </table>
          <p style="margin-top:20px;">Regards,<br>Case Referral System</p>
        </div>
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    res.status(200).json({ success: true, message: "Emails sent to all users" });
  } catch (error) {
    console.error("Email sending error:", error);
    res.status(500).json({ error: "Failed to send referral emails" });
  }
}
