import nodemailer from "nodemailer";
import { db } from "../firebase"; // make sure path is correct
import { collection, query, where, getDocs } from "firebase/firestore";

export default async function handler(req, res) {
  console.log("API invoked. Method:", req.method);

  if (req.method !== "POST") {
    console.log("Method not allowed");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { referralToOrg, referralData } = req.body;
    console.log("Request body:", req.body);

    if (!referralToOrg || !referralData) {
      console.log("Missing referralToOrg or referralData");
      return res.status(400).json({ error: "Missing referralToOrg or referralData" });
    }

    // -------------------------------
    // TEST EMAIL FIRST
    // -------------------------------
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    // Temporary test email to your own inbox
    await transporter.sendMail({
      from: `"Test" <${process.env.GMAIL_USER}>`,
      to: "psmmr.edu@gmail.com", // replace with your email
      subject: "Test Email from GBV Referral API",
      text: "Hello world! This is a test email.",
    });
    console.log("Test email sent successfully");
    // -------------------------------

    // Firestore query for focal persons
    console.log(`Querying users in org "${referralToOrg}" with role "Focal Person"`);
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("organization", "==", referralToOrg), where("role", "==", "Focal Person"));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log("No focal persons found");
      return res.status(404).json({ error: "No focal persons found for this organization" });
    }

    const focalEmails = querySnapshot.docs.map(doc => doc.data().email);
    console.log("Focal person emails:", focalEmails);

    // Send emails to focal persons
    const sendEmailPromises = focalEmails.map(email => {
      return transporter.sendMail({
        from: `"GBV Referral System" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: `New Referral Case: ${referralData.caseCode}`,
        text: `A new referral has been created for your organization.\n\nCase Code: ${referralData.caseCode}\nColor Code: ${referralData.clientColorCode}\nClient Info: ${referralData.clientContactInfo}\nNotes: ${referralData.notes}\nConsent Form: ${referralData.consentFormUrl}\nCreated By: ${referralData.createdBy} (${referralData.createdByOrg})`,
        html: `
          <h3>New Referral Case</h3>
          <p><strong>Case Code:</strong> ${referralData.caseCode}</p>
          <p><strong>Color Code:</strong> ${referralData.clientColorCode}</p>
          <p><strong>Client Info:</strong> ${referralData.clientContactInfo}</p>
          <p><strong>Notes:</strong> ${referralData.notes}</p>
          <p><strong>Consent Form:</strong> <a href="${referralData.consentFormUrl}">${referralData.consentFormUrl}</a></p>
          <p><strong>Created By:</strong> ${referralData.createdBy} (${referralData.createdByOrg})</p>
        `,
      });
    });

    await Promise.all(sendEmailPromises);
    console.log("Focal person emails sent successfully");

    return res.status(200).json({ success: true, message: "Emails sent to focal persons" });

  } catch (err) {
    console.error("Unhandled API error:", err);
    return res.status(500).json({ error: err.message });
  }
}
