// old code snippet
// src/pages/AddUser2.jsx.
import { useState, useEffect } from "react";
import { auth, db } from "../firebase"; // no storage import now!
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";
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


    const navigate = useNavigate(); // 👈 init navigate

    useEffect(() => {
        const fetchRoles = async () => {
            const snapshot = await getDocs(collection(db, "roles"));
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setRoles(data);
        };

        const fetchOrganizations = async () => {
            const snapshot = await getDocs(collection(db, "organizations"));
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
            // 1️⃣ Create Auth user
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 2️⃣ Save user data in Firestore
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                name,
                email,
                role,
                organization,
            });

            Swal.fire("Success!", "User added successfully!", "success");

            // ✅ Logout & redirect
            await signOut(auth);
            navigate("/login");

        } catch (error) {
            console.error("Error adding user:", error);
            Swal.fire("Error", error.message, "error");
        }
    };

    return (
        <>
            <form onSubmit={handleAddUser} className="w-3xl p-4 space-y-4">
                <div>
                    <label htmlFor="name" className="block font-bold">Name </label>
                    <input
                        id="name"
                        type="text"
                        className="border px-2 py-1 w-full"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>

                <div>
                    <label htmlFor="email" className="block font-bold">Email <span className="text-sm font-light text-amber-600">Email can't be changed once you have created!</span></label>
                    <input
                        id="email"
                        type="email"
                        className="border px-2 py-1 w-full"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                <div>
                    <label htmlFor="password" className="block font-bold">Password <span className="text-sm font-light text-amber-600">Password can't be changed once you have created!</span></label>
                    <div className="relative">
                        <input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            className="border px-2 py-1 w-full"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs"
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
                    >
                        <option value="">-- Select Organization --</option>
                        {organizations.map((org) => (
                            <option key={org.id} value={org.name}>{org.name}</option>
                        ))}
                    </select>
                </div>

                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded cursor-pointer">
                    Add User
                </button>

            </form>

            <div>
                <p><span className="font-bold">⚠️ Warning: </span> After you have created account, the system will immediately log you out. Then sign in again to access the system or create another accounts!</p>
            </div>

        </>
    );
};

export default AddUser;
