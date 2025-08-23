import nodemailer from "nodemailer";
import { db } from "../src/firebase"; // adjust path if needed
import { collection, query, where, getDocs } from "firebase/firestore";

export default function handler(req, res) {
  if (req.method === "POST") {
    res.status(200).json({ success: true, message: "POST received" });
  } else {
    res.status(405).json({ error: "Method Not Allowed" });
  }
}