import { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import {
  collection,
  query,
  orderBy,
  where,
  getDocs,
  doc,
  getDoc
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Link } from "react-router-dom"; // ✅ Add this to make <Link> work

const ReferredToMe = () => {
  const [referrals, setReferrals] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [currentUserRole, setCurrentUserRole] = useState("");
  const [currentUserOrg, setCurrentUserOrg] = useState("");
  const [userLoaded, setUserLoaded] = useState(false);
  const itemsPerPage = 10;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setCurrentUserRole(userData.role || "");
          setCurrentUserOrg(userData.organization || "");
        }
      }
      setUserLoaded(true);
    });
    return unsubscribe;
  }, []);

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
        const referralsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setReferrals(referralsData);
      } catch (error) {
        console.error("Error fetching referrals:", error);
      } finally {
        setLoading(false);
      }
    };
    if (currentUserOrg) fetchReferrals();
  }, [currentUserOrg]);

  const filteredReferrals = referrals.filter(r => {
    const rc = r.referralCode?.toLowerCase() || "";
    const cc = r.caseCode?.toLowerCase() || "";
    const cb = r.createdBy?.toLowerCase() || "";
    const corg = r.createdByOrg?.toLowerCase() || "";
    return (
      rc.includes(searchTerm.toLowerCase()) ||
      cc.includes(searchTerm.toLowerCase()) ||
      cb.includes(searchTerm.toLowerCase()) ||
      corg.includes(searchTerm.toLowerCase())
    );
  });

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentItems = filteredReferrals.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredReferrals.length / itemsPerPage);

  if (!userLoaded) return <p>Loading user...</p>;
  if (currentUserRole !== "Focal Person") return <p>Not Authorized</p>;

  return (
    <div className="mx-auto relative overflow-x-auto shadow-md sm:rounded-lg p-4">
      <h2 className="text-2xl font-bold mb-4">Referrals To My Org [{currentUserOrg}]</h2>

      <div className="pb-4 bg-white">
        <input
          type="text"
          placeholder="Search..."
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
          <tr className="text-left">
            <th className="border px-4 py-2">Referral Code</th>
            <th className="border px-4 py-2">Case Code</th>
            <th className="border px-4 py-2">Refer From</th>
            <th className="border px-4 py-2">Status</th>
            <th className="border px-4 py-2">Date</th>
            <th className="border px-4 py-2">Actions</th> {/* ✅ new Actions column */}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan="6" className="text-center py-4">Loading referrals...</td></tr>
          ) : currentItems.length === 0 ? (
            <tr><td colSpan="6" className="text-center py-4">No referrals found.</td></tr>
          ) : (
            currentItems.map((r) => (
              <tr key={r.id}>
                <td className="border px-4 py-2">{r.referralCode}</td>
                <td className="border px-4 py-2">{r.caseCode}</td>
                <td className="border px-4 py-2">{r.createdByOrg || "N/A"}</td>
                <td className="border px-4 py-2">
                  {r.status === "Approved" ? (
                    <span className="text-white bg-green-500 px-2 py-1 rounded">{r.status}</span>
                  ) : r.status === "Rejected" ? (
                    <span className="text-white bg-red-500 px-2 py-1 rounded">{r.status}</span>
                  ) : (
                    <span className="text-black font-bold px-2 py-1 rounded">{r.status}</span>
                  )}
                </td>
                <td className="border px-4 py-2">{r.dateOfReferral?.toDate().toLocaleString() || "N/A"}</td>
                <td className="border px-4 py-2">
                  <Link
                    to={`/master-referral-log/${r.id}`}
                    className="text-blue-600 underline"
                  >
                    View
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
              className={`px-3 py-1 rounded ${currentPage === number + 1 ? "bg-blue-600 text-white" : "bg-gray-200"}`}
            >
              {number + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReferredToMe;
