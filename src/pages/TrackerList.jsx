import { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  getDoc
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Link } from "react-router-dom";

export default function TrackerList() {
  const [referrals, setReferrals] = useState([]);
  const [currentUserOrg, setCurrentUserOrg] = useState("");
  const [currentUserRole, setCurrentUserRole] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 10;

  // Get current user info
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setCurrentUserOrg(userData.organization || "");
          setCurrentUserRole(userData.role || "");
        }
      }
    });
    return unsubscribe;
  }, []);

  // Fetch referrals for this org
  useEffect(() => {
    const fetchReferrals = async () => {
      if (!currentUserOrg) return;
      try {
        setLoading(true);
        const q = query(
          collection(db, "referrals"),
          where("referralTo", "==", currentUserOrg),
          orderBy("dateOfReferral", "desc")
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setReferrals(data);
      } catch (error) {
        console.error("Error fetching:", error);
      } finally {
        setLoading(false);
      }
    };
    if (currentUserOrg) fetchReferrals();
  }, [currentUserOrg]);

  const filtered = referrals.filter(r => {
    const rc = r.referralCode?.toLowerCase() || "";
    const cc = r.caseCode?.toLowerCase() || "";
    return rc.includes(searchTerm.toLowerCase()) || cc.includes(searchTerm.toLowerCase());
  });

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentItems = filtered.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  if (currentUserRole !== "Focal Person" && currentUserRole !== "Case Supervisor") {
    return <p>Not authorized</p>;
  }

  return (
    <div className="mx-auto relative overflow-x-auto shadow-md sm:rounded-lg p-4">
      <h2 className="text-2xl font-bold mb-4">Case Tracker - My Org [{currentUserOrg}]</h2>

      <div className="pb-4">
        <input
          type="text"
          placeholder="Search Referral or Case Code..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="block py-2 px-4 border border-gray-300 rounded-lg w-80"
        />
      </div>

      <table className="w-full text-sm text-left text-gray-500 table-auto">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
          <tr>
            <th className="border px-4 py-2">Referral Code</th>
            <th className="border px-4 py-2">Case Code</th>
            <th className="border px-4 py-2">Status</th>
            <th className="border px-4 py-2">Date</th>
            <th className="border px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan="5" className="text-center py-4">Loading...</td></tr>
          ) : currentItems.length === 0 ? (
            <tr><td colSpan="5" className="text-center py-4">No referrals found.</td></tr>
          ) : (
            currentItems.map(r => (
              <tr key={r.id}>
                <td className="border px-4 py-2">{r.referralCode}</td>
                <td className="border px-4 py-2">{r.caseCode}</td>
                <td className="border px-4 py-2">
                  {r.status === "Approved" && (
                    <span className="text-white bg-green-500 px-2 py-1">Approved</span>
                  )}
                  {r.status === "Rejected" && (
                    <span className="text-white bg-red-500 px-2 py-1">Rejected</span>
                  )}
                  {r.status !== "Approved" && r.status !== "Rejected" && (
                    <span className="text-black font-bold px-2 py-1">{r.status}</span>
                  )}
                </td>
                <td className="border px-4 py-2">
                  {r.dateOfReferral?.toDate().toLocaleString() || "N/A"}
                </td>
                <td className="border px-4 py-2">
                  <Link
                    to={`/tracker/${r.id}`}
                    className="text-blue-600 underline"
                  >
                    View / Update
                  </Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="flex justify-center mt-4 space-x-2">
          {[...Array(totalPages).keys()].map(number => (
            <button
              key={number + 1}
              onClick={() => setCurrentPage(number + 1)}
              className={`px-3 py-1 rounded ${currentPage === number + 1 ? "bg-blue-600 text-white" : "bg-gray-200"
                }`}
            >
              {number + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
