import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },    
    });

    await transporter.sendMail({
      from: `"Test" <${process.env.GMAIL_USER}>`,
      to: "psmmr.edu@gmail.com", // replace with your email
      subject: "Test Email from API",
      text: "Hello world! Testing Nodemailer",
    });

    res.status(200).json({ success: true, message: "Test email sent!" });
  } catch (err) {
    console.error("Error sending test email:", err);
    res.status(500).json({ error: err.message });
  }
}
