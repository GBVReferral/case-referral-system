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
        const sendEmailPromises = focalEmails.map(email =>
            transporter.sendMail({
                from: `"GBV Referral System" <${process.env.GMAIL_USER}>`,
                to: email,
                subject: `New Referral Case: ${referralData.caseCode}`,
                text: `A new referral has been created for your organization.

Case Code: ${referralData.caseCode}
Color Code: ${referralData.clientColorCode}
Client Info: ${referralData.clientContactInfo}
Notes: ${referralData.notes}
Consent Form: ${referralData.consentFormUrl}
Created By: ${referralData.createdBy} (${referralData.createdByOrg})`,
                html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #004085; border-bottom: 2px solid #004085; padding-bottom: 5px;">New Referral Case Assigned</h2>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
          <tr>
            <td style="padding: 8px; font-weight: bold; width: 150px;">Case Code:</td>
            <td style="padding: 8px;">${referralData.caseCode}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Color Code:</td>
            <td style="padding: 8px;">${referralData.clientColorCode}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Client Info:</td>
            <td style="padding: 8px;">${referralData.clientContactInfo}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Notes:</td>
            <td style="padding: 8px;">${referralData.notes}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Consent Form:</td>
            <td style="padding: 8px;"><a href="${referralData.consentFormUrl}" target="_blank">${referralData.consentFormUrl}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Created By:</td>
            <td style="padding: 8px;">${referralData.createdBy} (${referralData.createdByOrg})</td>
          </tr>
        </table>

        <p style="margin-top: 20px; color: #555;">
          Please review this referral promptly and take necessary actions. 
        </p>

        <hr style="border: none; border-top: 1px solid #ccc; margin: 20px 0;" />

        <p style="font-size: 12px; color: #777;">
          This is an automated notification from the GBV Referral System.
        </p>
      </div>
    `
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
