import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import Swal from "sweetalert2";
import {
    doc,
    getDoc,
    updateDoc,
    serverTimestamp,
} from "firebase/firestore";

export default function EditOrganization() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [org, setOrg] = useState(null);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    useEffect(() => {
        const fetchOrg = async () => {
            const docRef = doc(db, "organizations", id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                setOrg(data);
                setName(data.name);
                setDescription(data.description);
            } else {
                alert("Organization not found!");
                navigate("/organizations");
            }
        };
        fetchOrg();
    }, [id, navigate]);

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const docRef = doc(db, "organizations", id);
            await updateDoc(docRef, {
                name,
                description,
                updatedAt: serverTimestamp(),
            });

            await Swal.fire({
                icon: "success",
                title: "Updated!",
                text: `"${name}" has been updated.`,
            });

            navigate("/organizations");
        } catch (error) {
            console.error("Error updating org:", error);
            Swal.fire("Error", error.message, "error");
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
            <h1 className="text-2xl font-bold mb-4">Edit Organization</h1>
            <form onSubmit={handleUpdate} className="flex flex-col gap-4">
                <input
                    className="w-full border-b-2 border-gray-300 focus:border-blue-600 outline-none py-2 transition-colors"
                    placeholder="Organization Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
                <textarea
                    className="w-full border-b-2 border-gray-300 focus:border-blue-600 outline-none py-2 transition-colors resize-none"
                    placeholder="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
                <button
                    type="submit"
                    className="bg-green-600 text-white py-2 rounded hover:bg-green-700"
                >
                    Update Organization
                </button>
            </form>
        </div>
    );
}
