import { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import Swal from "sweetalert2";

const RoleList = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRoles = async () => {
    try {
      setLoading(true); // ✅ mark as loading
      const querySnapshot = await getDocs(collection(db, "roles"));
      const rolesData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRoles(rolesData);
    } catch (error) {
      console.error("Error fetching roles:", error);
      Swal.fire("Error", "Failed to load roles", "error");
    } finally {
      setLoading(false); // ✅ done loading
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleAddRole = async () => {
    const { value: roleName } = await Swal.fire({
      title: "Add Role",
      input: "text",
      inputPlaceholder: "Enter role name",
      showCancelButton: true,
    });

    if (roleName) {
      try {
        await addDoc(collection(db, "roles"), { name: roleName });
        Swal.fire("Success!", "Role added successfully!", "success");
        fetchRoles();
      } catch (error) {
        console.error("Error adding role:", error);
        Swal.fire("Error", "Failed to add role", "error");
      }
    }
  };

  const handleEditRole = async (role) => {
    const { value: newName } = await Swal.fire({
      title: "Edit Role",
      input: "text",
      inputValue: role.name,
      showCancelButton: true,
    });

    if (newName) {
      try {
        await updateDoc(doc(db, "roles", role.id), { name: newName });
        Swal.fire("Success!", "Role updated successfully!", "success");
        fetchRoles();
      } catch (error) {
        console.error("Error updating role:", error);
        Swal.fire("Error", "Failed to update role", "error");
      }
    }
  };

  const handleDeleteRole = async (roleId) => {
    const result = await Swal.fire({
      title: "Delete Role?",
      text: "Are you sure you want to delete this role?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        await deleteDoc(doc(db, "roles", roleId));
        Swal.fire("Deleted!", "Role has been deleted.", "success");
        fetchRoles();
      } catch (error) {
        console.error("Error deleting role:", error);
        Swal.fire("Error", "Failed to delete role", "error");
      }
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Roles</h2>
      {/* <button
        onClick={handleAddRole}
        className="bg-blue-600 text-white px-4 py-2 rounded mb-4"
      >
        Add New Role
      </button> */}

      <table className="min-w-full border-collapse border border-gray-300">
        <thead>
          <tr>
            <th className="border border-gray-300 px-4 py-2">Role Name</th>
            <th className="border border-gray-300 px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {
            loading ? (
              <tr>
                <td colSpan="10" className="text-center py-4">
                  Loading data...
                </td>
              </tr>
            )
              : roles.length === 0 && (
                <tr>
                  <td colSpan={2} className="text-center py-4">
                    No roles found.
                  </td>
                </tr>
              )}
          {roles.map((role) => (
            <tr key={role.id}>
              <td className="border border-gray-300 px-4 py-2">{role.name}</td>
              <td className="border border-gray-300 px-4 py-2 space-x-2">
                <button disabled
                  onClick={() => handleEditRole(role)}
                  className="bg-yellow-400 px-2 py-1 rounded"
                >
                  Edit
                </button>
                <button disabled
                  onClick={() => handleDeleteRole(role.id)}
                  className="bg-red-500 text-white px-2 py-1 rounded"
                >
                  Delete
                </button>
                 <span>(can't change default roles)</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RoleList;
