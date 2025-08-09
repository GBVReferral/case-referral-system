import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const [loading, setLoading] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const userRole = userDoc.data().role || "";
            setIsAllowed(allowedRoles.includes(userRole));
          } else {
            setIsAllowed(false);
          }
        } catch (err) {
          console.error("Error checking user role:", err);
          setIsAllowed(false);
        }
      } else {
        setIsAllowed(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [allowedRoles]);

  if (loading) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600">Checking permissions...</p>
      </div>
    );
  }

  return isAllowed ? children : <Navigate to="/not-authorized" replace />;
}
