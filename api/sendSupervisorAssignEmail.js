import nodemailer from "nodemailer";
import admin from "firebase-admin";

// Initialize Firebase Admin SDK once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_ADMIN_KEY_JSON)
    ),
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  console.log("sendSupervisorEmail API invoked. Method:", req.method);

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { caseCode, updatedStatus, note, updatedBy, updatedByEmail, assignedSupervisorId } =
      req.body;

    if (!caseCode || !updatedStatus || !updatedBy || !updatedByEmail || !assignedSupervisorId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // ✅ Fetch supervisor from Firestore
    const supervisorDoc = await db.collection("users").doc(assignedSupervisorId).get();
    if (!supervisorDoc.exists) {
      return res.status(404).json({ error: "Assigned supervisor not found" });
    }

    const supervisor = supervisorDoc.data();
    const supervisorEmail = supervisor.email;

    if (!supervisorEmail) {
      return res.status(400).json({ error: "Supervisor has no email" });
    }

    // Setup Nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    // Send email ONLY to supervisor
    await transporter.sendMail({
      from: `"GBV Referral System" <${process.env.GMAIL_USER}>`,
      to: supervisorEmail,
      subject: `New Case Assigned: ${caseCode}`,
      text: `Dear ${supervisor.name},

You have been assigned a new case.

Case Code: ${caseCode}
Status: ${updatedStatus}
Note: ${note}
Assigned By: ${updatedBy} (${updatedByEmail})

Please log in to the system to review and take action.
      `,
    });

    console.log("Email sent to supervisor:", supervisorEmail);
    return res.status(200).json({ success: true, message: "Email sent to assigned supervisor" });
  } catch (err) {
    console.error("Supervisor Email API error:", err);
    return res.status(500).json({ error: err.message });
  }
}
