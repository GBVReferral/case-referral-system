import { useState, useEffect } from "react";
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { Link } from "react-router-dom";
import { FaHome, FaBuilding, FaUsers, FaFileAlt, FaPlus } from "react-icons/fa";
import Swal from "sweetalert2";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";

const UserList = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch all users once
    const fetchUsers = async () => {
        try {
            setLoading(true); // ✅ mark as loading
            const querySnapshot = await getDocs(collection(db, "users"));
            const usersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setUsers(usersData);
        } catch (error) {
            console.error("Error fetching users:", error);
            Swal.fire("Error", "Failed to load users", "error");
        }finally {
            setLoading(false); // ✅ done loading
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: "Delete User?",
            text: "Are you sure you want to delete this user?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Delete",
            cancelButtonText: "Cancel",
        });

        if (result.isConfirmed) {
            try {
                await deleteDoc(doc(db, "users", id));
                Swal.fire("Deleted!", "User has been deleted.", "success");
                fetchUsers();
            } catch (error) {
                console.error("Error deleting user:", error);
                Swal.fire("Error", "Failed to delete user", "error");
            }
        }
    };

    const handleEdit = async (user) => {
        // 🔹 Fetch Roles
        const rolesSnapshot = await getDocs(collection(db, "roles"));
        const rolesData = rolesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        // 🔹 Fetch Organizations
        const orgsSnapshot = await getDocs(collection(db, "organizations"));
        const orgsData = orgsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        // 🔹 Create select options HTML
        const rolesOptions = rolesData
            .map(
                (role) =>
                    `<option value="${role.name}" ${user.role === role.name ? "selected" : ""
                    }>${role.name}</option>`
            )
            .join("");

        const orgsOptions = orgsData
            .map(
                (org) =>
                    `<option value="${org.name}" ${user.organization === org.name ? "selected" : ""
                    }>${org.name}</option>`
            )
            .join("");

        // 🔹 Show SweetAlert modal
        const { value: formValues } = await Swal.fire({
            title: "Edit User",
            html: `
      <input id="swal-name" class="swal2-input" placeholder="Name" value="${user.name}">
      <select id="swal-role" class="swal2-input">${rolesOptions}</select>
      <select id="swal-org" class="swal2-input">${orgsOptions}</select>
    `,
            focusConfirm: false,
            showCancelButton: true,
            preConfirm: () => {
                return {
                    name: document.getElementById("swal-name").value.trim(),
                    role: document.getElementById("swal-role").value,
                    organization: document.getElementById("swal-org").value,
                };
            },
        });

        if (formValues) {
            const { name, role, organization } = formValues;

            if (!name || !role || !organization) {
                Swal.fire("Error", "All fields must be filled.", "error");
                return;
            }

            try {
                await updateDoc(doc(db, "users", user.id), {
                    name,
                    role,
                    organization,
                });
                Swal.fire("Updated!", "User updated successfully.", "success");
                fetchUsers();
            } catch (error) {
                console.error("Error updating user:", error);
                Swal.fire("Error", "Failed to update user.", "error");
            }
        }
    };




    return (
        <div>
            <Link to="/secret-admin-add-user" className="flex items-center gap-x-1 py-2  cursor-pointer">
                <FaPlus />
                <span>Add User</span>

            </Link>

            <table className="min-w-full border-collapse border border-gray-300">
                <thead>
                    <tr className="text-left bg-gray-200">
                        <th className="border border-gray-300 px-4 py-2">Name</th>
                        <th className="border border-gray-300 px-4 py-2">Email</th>
                        <th className="border border-gray-300 px-4 py-2">Org</th>
                        <th className="border border-gray-300 px-4 py-2">Role</th>
                        <th className="border border-gray-300 px-4 py-2">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                            <tr>
                                <td colSpan="10" className="text-center py-4">
                                    Loading data...
                                </td>
                            </tr>
                        ):users.length === 0 && (
                        <tr>
                            <td colSpan={4} className="text-center py-4">
                                No users found.
                            </td>
                        </tr>
                    )}
                    {users.map((user) => (
                        <tr key={user.id}>
                            <td className="border border-gray-300 px-4 py-2">{user.name}</td>
                            <td className="border border-gray-300 px-4 py-2">{user.email}</td>
                            <td className="border border-gray-300 px-4 py-2">{user.organization}</td>
                            <td className="border border-gray-300 px-4 py-2">{user.role}</td>
                            <td className="border border-gray-300 px-4 py-2 space-x-2">
                                <button
                                    onClick={() => handleEdit(user)}
                                    className="bg-yellow-400 px-2 py-1 rounded cursor-pointer text-sm"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(user.id)}
                                    className="bg-red-500 text-white px-2 py-1 rounded cursor-pointer text-sm"
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default UserList;
