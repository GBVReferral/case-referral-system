import { FaBars } from "react-icons/fa";
import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { IoMdLogOut } from "react-icons/io";



export default function Header({ user, onLogout, toggleSidebar }) {

  const [currentUserName, setCurrentUserName] = useState("");
  const [currentUserOrg, setCurrentUserOrg] = useState("");
  const [currentUserRole, setCurrentUserRole] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setCurrentUserName(userData.name || "");
          setCurrentUserOrg(userData.organization || "");
          setCurrentUserRole(userData.role || "");
        }
      }
    });

    return () => unsubscribe();
  }, []);
  return (
    <header className="flex justify-between items-center bg-gray-100 px-4 py-3 border-b border-gray-300">
      <div className="flex items-center gap-4">
        <FaBars
          className="text-gray-700 cursor-pointer text-xl"
          onClick={toggleSidebar}
        />
        <p className="text-sm">
          Signed in as: <strong>{currentUserName}</strong>
          {currentUserOrg && <> | Org: <strong>{currentUserOrg}</strong></>}
          {currentUserRole && <> | Role: <strong>{currentUserRole}</strong></>}
        </p>
      </div>
      <button
        onClick={onLogout}
        className="bg-gray-500 text-white text-sm px-3 py-1 rounded hover:bg-gray-600 cursor-pointer"
      >

        Logout
        <IoMdLogOut className="inline ml-1" />
      </button>
    </header>
  );
}
