// /api/sendReferralEmail.js
import nodemailer from "nodemailer";
import { db } from "../../firebase"; // adjust path if needed
import { collection, query, where, getDocs } from "firebase/firestore";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { referralTo, caseCode, clientColorCode, clientContactInfo, notes, consentFormUrl, createdBy, createdByOrg } = req.body;

        if (!referralTo || !caseCode) {
            return res.status(400).json({ error: "Missing referral details" });
        }

        // 🔍 Find focal persons of the referred-to org
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("organization", "==", referralTo), where("role", "==", "Focal Person"));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return res.status(404).json({ error: "No focal person found in that organization" });
        }

        // Collect emails of focal persons
        const focalEmails = querySnapshot.docs.map(doc => doc.data().email);

        // Setup Nodemailer transporter (using Gmail)
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_PASS,
            },
        });

        // Email content
        const mailOptions = {
            from: `"Referral System" <${process.env.GMAIL_USER}>`,
            to: focalEmails, // send to all focal persons of that org
            subject: `New Case Referral (Case: ${caseCode})`,
            html: `
        <h2>New Referral Received</h2>
        <p><strong>Referred From:</strong> ${createdByOrg} (by ${createdBy})</p>
        <p><strong>Case Code:</strong> ${caseCode}</p>
        <p><strong>Client Color Code:</strong> ${clientColorCode}</p>
        <p><strong>Client Contact:</strong> ${clientContactInfo}</p>
        <p><strong>Notes:</strong> ${notes}</p>
        ${consentFormUrl ? `<p><a href="${consentFormUrl}">View Consent Form</a></p>` : ""}
      `,
        };

        await transporter.sendMail(mailOptions);

        return res.status(200).json({ success: true, message: "Referral email sent!" });

    } catch (error) {
        console.error("Error sending referral email:", error);
        return res.status(500).json({ error: error.message });
    }
}
