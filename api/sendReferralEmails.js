import nodemailer from "nodemailer";
import { db } from "../src/firebase"; // adjust path if needed
import { collection, query, where, getDocs } from "firebase/firestore";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { referralToOrg, referralData } = req.body;

    if (!referralToOrg || !referralData) {
      return res.status(400).json({ error: "Missing referralToOrg or referralData" });
    }

    // 1️⃣ Query Firestore for focal persons in the target organization
    const usersRef = collection(db, "users");
    const q = query(
      usersRef,
      where("organization", "==", referralToOrg),
      where("role", "==", "Focal Person")
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return res.status(404).json({ error: `No focal persons found for ${referralToOrg}` });
    }

    const focalEmails = querySnapshot.docs.map(doc => doc.data().email);

    // 2️⃣ Setup Nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    // 3️⃣ Send emails to all focal persons
    const sendPromises = focalEmails.map(email =>
      transporter.sendMail({
        from: `"GBV Referral System" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: `New Referral Case: ${referralData.caseCode}`,
        text: `
A new case has been referred.

Case Code: ${referralData.caseCode}
Color Code: ${referralData.clientColorCode}
Client Info: ${referralData.clientContactInfo}
Notes: ${referralData.notes}
Consent Form: ${referralData.consentFormUrl}
Created By: ${referralData.createdBy} (${referralData.createdByOrg})
        `,
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

    await Promise.all(sendPromises);

    return res.status(200).json({ success: true, message: "Emails sent to focal persons" });

  } catch (err) {
    console.error("Error sending referral emails:", err);
    return res.status(500).json({ error: err.message });
  }
}
