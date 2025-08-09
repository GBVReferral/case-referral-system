import { useState } from "react";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import Swal from "sweetalert2";

export default function CreateOrganization() {
    const { currentUser } = useAuth();

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    const handleCreateOrg = async (e) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, "organizations"), {
                name,
                description,
                createdAt: serverTimestamp(),
                createdBy: currentUser?.email,
            });

            await Swal.fire({
                icon: "success",
                title: "Organization Created!",
                text: `"${name}" has been added.`,
                showCancelButton: true,
                confirmButtonText: "Create Another",
                cancelButtonText: "Go to Organizations",
            }).then((result) => {
                if (result.isConfirmed) {
                    setName("");
                    setDescription("");
                } else {
                    // Navigate to Organizations list if they click cancel
                    window.location.href = "/organizations";
                }
            });

        } catch (error) {
            console.error("Error adding organization:", error);
            Swal.fire("Error", error.message, "error");
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
            <h1 className="text-2xl font-bold mb-4">Create New Organization</h1>
            <form onSubmit={handleCreateOrg} className="flex flex-col gap-4">
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
    className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 cursor-pointer transition-colors"
                >
                    Create Organization
                </button>
            </form>
        </div>
    );
}
