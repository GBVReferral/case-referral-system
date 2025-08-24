// app/api/sendSupervisorAssignEmail/route.js
import admin from "firebase-admin";
import nodemailer from "nodemailer";

// --- Initialize Firebase Admin exactly once ---
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Note: keep the literal "\n" from env and convert to real newlines
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

// Optional: force Node runtime (avoids Edge where nodemailer won't run)
// export const runtime = "nodejs";

export async function POST(req) {
  try {
    // ---- (Optional) Verify Firebase Auth token ----
    // Enable by setting REQUIRE_FIREBASE_AUTH=true in your .env
    if (process.env.REQUIRE_FIREBASE_AUTH === "true") {
      const authHeader = req.headers.get("authorization") || "";
      const token = authHeader.startsWith("Bearer ")
        ? authHeader.slice(7)
        : null;
      if (!token) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
        });
      }
      await admin.auth().verifyIdToken(token);
    }

    // Accept both "message" (plain text) and "html" (prebuilt HTML)
    const { to, subject, message, html } = await req.json();

    if (!to || !subject || (!message && !html)) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
      });
    }

    // --- Nodemailer transporter (Gmail) ---
    // Gmail requires an App Password if 2FA is enabled.
    // .env:
    //   GMAIL_USER="youraddress@gmail.com"
    //   GMAIL_PASS="your_gmail_app_password"
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    // Build a nice HTML wrapper if only "message" is provided
    const htmlBody =
      html ??
      `
      <div style="font-family: Arial, sans-serif; padding: 16px; border:1px solid #ddd; border-radius:8px;">
        <h2 style="color:#2563eb; margin-top:0;">Case Assignment Notification</h2>
        <p>Dear Supervisor,</p>
        <p>${(message || "").replace(/\n/g, "<br/>")}</p>
        <p style="font-size:12px; color:#6b7280; margin-top:24px;">
          This is an automated message from the Case Management System.
        </p>
      </div>
    `;

    await transporter.sendMail({
      from: `"Case Management System" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      text: message ?? "Please view this email in HTML.",
      html: htmlBody,
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error("Email API error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to send supervisor email" }),
      { status: 500 }
    );
  }
}
