import { useState } from "react";
import Swal from "sweetalert2";

const ContactDeveloper = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !email || !message) {
      Swal.fire("Error", "Please fill in all fields.", "error");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/contactDeveloper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to send message");

      Swal.fire("Sent!", "Your message has been sent successfully.", "success");

      // reset form
      setName("");
      setEmail("");
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      Swal.fire("Error", error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-4 space-y-4 border rounded shadow">
      <h2 className="text-lg font-bold mb-2">Contact Developer</h2>
      <input
        type="text"
        placeholder="Name"
        className="border px-2 py-1 w-full"
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={loading}
        required
      />
      <input
        type="email"
        placeholder="Email"
        className="border px-2 py-1 w-full"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={loading}
        required
      />
      <textarea
        placeholder="Message"
        className="border px-2 py-1 w-full"
        rows={5}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        disabled={loading}
        required
      />
      <button
        type="submit"
        className={`bg-blue-600 text-white px-4 py-2 rounded ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
        disabled={loading}
      >
        {loading ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
};

export default ContactDeveloper;
