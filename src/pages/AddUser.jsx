import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

const AddUser = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [role, setRole] = useState("");
  const [organization, setOrganization] = useState("");
  const [roles, setRoles] = useState([]);
  const [organizations, setOrganizations] = useState([]);

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRoles = async () => {
      const snapshot = await getDocs(collection(db, "roles"));
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setRoles(data);
    };

    const fetchOrganizations = async () => {
      const snapshot = await getDocs(collection(db, "organizations"));
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setOrganizations(data);
    };

    fetchRoles();
    fetchOrganizations();
  }, []);

  const handleAddUser = async (e) => {
    e.preventDefault();

    if (!name || !email || !password || !role || !organization) {
      Swal.fire("Error", "Please fill in all fields.", "error");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/createUser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role, organization }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create user");
      }

      Swal.fire("Success!", "User added successfully!", "success");

      // reset form
      setName("");
      setEmail("");
      setPassword("");
      setRole("");
      setOrganization("");
    } catch (error) {
      console.error("Error adding user:", error);
      Swal.fire("Error", error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleAddUser} className="w-3xl p-4 space-y-4">
        <div>
          <label htmlFor="name" className="block font-bold">Name</label>
          <input
            id="name"
            type="text"
            className="border px-2 py-1 w-full"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="email" className="block font-bold">
            Email <span className="text-sm font-light text-amber-600">Email can't be changed once created!</span>
          </label>
          <input
            id="email"
            type="email"
            className="border px-2 py-1 w-full"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="password" className="block font-bold">
            Password <span className="text-sm font-light text-amber-600">Password can't be changed once created!</span>
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              className="border px-2 py-1 w-full"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs"
              disabled={loading}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <div>
          <label className="block font-bold">Role</label>
          <select
            className="border px-2 py-1 w-full"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required
            disabled={loading}
          >
            <option value="">-- Select Role --</option>
            {roles.map((r) => (
              <option key={r.id} value={r.name}>{r.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-bold">Organization</label>
          <select
            className="border px-2 py-1 w-full"
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            required
            disabled={loading}
          >
            <option value="">-- Select Organization --</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.name}>{org.name}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className={`bg-blue-600 text-white px-4 py-2 rounded cursor-pointer ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
          disabled={loading}
        >
          {loading ? "Creating..." : "Add User"}
        </button>
      </form>

      <div className="mt-4">
        <p><span className="font-bold">Note:</span> Creating a user no longer logs you out; you stay signed in.</p>
      </div>
    </>
  );
};

export default AddUser;
