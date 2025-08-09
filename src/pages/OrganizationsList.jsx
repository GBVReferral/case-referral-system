import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { deleteDoc, doc } from "firebase/firestore";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";

export default function OrganizationsList() {
    const [orgs, setOrgs] = useState([]);

    const [loading, setLoading] = useState(true);

    const fetchOrgs = async () => {

        try {
            const q = query(collection(db, "organizations"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            const orgList = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setOrgs(orgList);

        } catch (error) {
            console.error("Error fetching organizations:", error);
        } finally {
            setLoading(false); // ✅ done loading       
        }

    };

    useEffect(() => {
        fetchOrgs();
    }, []);


    // Delete organization function

    const handleDelete = async (org) => {
        const { value: inputName } = await Swal.fire({
            title: `Type the name to confirm deletion`,
            input: "text",
            inputPlaceholder: `Type "${org.name}"`,
            showCancelButton: true,
            confirmButtonText: "Delete",
            confirmButtonColor: "#d33",
        });

        if (!inputName) return;

        if (inputName !== org.name) {
            Swal.fire("Name does not match!", "", "error");
            return;
        }

        try {
            await deleteDoc(doc(db, "organizations", org.id));
            setOrgs((prev) => prev.filter((o) => o.id !== org.id));
            Swal.fire("Deleted!", `"${org.name}" has been deleted.`, "success");
        } catch (error) {
            console.error("Error deleting organization:", error);
            Swal.fire("Error", error.message, "error");
        }
    };

    return (
        <div className=" mx-auto mt-10 p-6 bg-white rounded shadow">
            <h1 className="text-2xl font-bold mb-4">Organizations</h1>
            <div>
                <p className="text-gray-500 mt-4">
                    Total Organizations: {orgs.length}
                </p>
            </div>

            <br />
            {

                loading ? (
                    <tr>
                        <td colSpan="10" className="text-center py-4">
                            Loading data...
                        </td>
                    </tr>
                )
                    : orgs.length === 0 ? (
                        <p>No organizations found.</p>
                    ) : (
                        <ul className="space-y-4">
                            {orgs.map((org) => (
                                <li
                                    key={org.id}
                                    className="border p-4 rounded shadow hover:bg-gray-50"
                                >
                                    <h2 className="text-xl font-semibold">{org.name}</h2>
                                    <p className="text-gray-700">{org.description}</p>
                                    <p className="text-sm text-gray-500">
                                        Created by: {org.createdBy || "N/A"} |{" "}
                                        {org.createdAt?.toDate
                                            ? org.createdAt.toDate().toLocaleString()
                                            : "No date"}
                                    </p>
                                    <button
                                        onClick={() => handleDelete(org)}
                                        className="text-red-600 hover:underline text-sm"
                                    >
                                        Delete
                                    </button>
                                    <Link
                                        to={`/edit-organization/${org.id}`}
                                        className="text-blue-600 hover:underline text-sm ml-4"
                                    >
                                        Edit
                                    </Link>
                                </li>

                            ))}
                        </ul>

                    )}
        </div>
    );
}
