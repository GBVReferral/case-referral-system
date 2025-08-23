import nodemailer from "nodemailer";
import { db } from "../firebase"; // adjust path if needed
import { collection, query, where, getDocs } from "firebase/firestore";

export default async function handler(req, res) {
  console.log("API invoked. Method:", req.method);
  console.log("Request body:", req.body);

  if (req.method !== "POST") {
    console.log("Method not allowed");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { referralToOrg, referralData } = req.body;

    if (!referralToOrg || !referralData) {
      console.log("Missing referralToOrg or referralData");
      return res.status(400).json({ error: "Missing referralToOrg or referralData" });
    }

    console.log("Referral to organization:", referralToOrg);
    console.log("Referral data:", referralData);

    const usersRef = collection(db, "users");
    const q = query(
      usersRef,
      where("organization", "==", referralToOrg),
      where("role", "==", "Focal Person")
    );

    console.log("Running Firestore query...");
    const querySnapshot = await getDocs(q);

    console.log("Query snapshot:", querySnapshot);

    if (querySnapshot.empty) {
      console.log("No focal persons found");
      return res.status(404).json({ error: "No focal persons found" });
    }

    const focalEmails = querySnapshot.docs.map(doc => doc.data().email);
    console.log("Focal emails:", focalEmails);

    // Nodemailer setup
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    console.log("Sending emails...");
    await Promise.all(
      focalEmails.map(email =>
        transporter.sendMail({
          from: `"GBV Referral System" <${process.env.GMAIL_USER}>`,
          to: email,
          subject: `New Referral Case: ${referralData.caseCode}`,
          text: `Referral case info...`,
        })
      )
    );

    console.log("Emails sent successfully");
    return res.status(200).json({ success: true, message: "Emails sent" });
  } catch (err) {
    console.error("ERROR in API:", err);
    return res.status(500).json({ error: err.message });
  }
}

