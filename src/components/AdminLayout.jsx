import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

export default function AdminLayout({ children }) {

  const { currentUser, signOut } = useAuth();
  const navigate = useNavigate();
  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You will be logged out from the system.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, Logout"
    });

    if (result.isConfirmed) {
      try {
        await signOut(auth);
        navigate("/login");
        Swal.fire("Logged out!", "You have been logged out.", "success");
      } catch (error) {
        console.error("Logout failed:", error);
        Swal.fire("Error", "Failed to logout.", "error");
      }
    }
  };

  const [isOpen, setIsOpen] = useState(true); // ✅ Moved here  
  const toggleSidebar = () => setIsOpen(!isOpen);


  return (
    <div className="flex">
      <Sidebar isOpen={isOpen} />
      <div className="flex flex-col flex-1 h-screen">
        <Header user={currentUser} onLogout={handleLogout} toggleSidebar={toggleSidebar} />
        <main className="p-6 overflow-y-auto flex-1 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}


