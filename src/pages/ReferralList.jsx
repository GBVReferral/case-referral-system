// ReferralList.jsx
import { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { collection, query, orderBy, getDocs, deleteDoc, doc, getDoc } from "firebase/firestore";
import Swal from "sweetalert2";
import { Link, useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import * as XLSX from "xlsx";

const ReferralList = () => {
  const [referrals, setReferrals] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [currentUserRole, setCurrentUserRole] = useState("");
  const [currentUserName, setCurrentUserName] = useState("");
  const [currentUserOrg, setCurrentUserOrg] = useState("");
  const [loading, setLoading] = useState(true);

  const itemsPerPage = 10;
  const navigate = useNavigate();

  const fetchReferrals = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, "referrals"), orderBy("dateOfReferral", "desc"));
      const querySnapshot = await getDocs(q);
      const referralsData = querySnapshot.docs.map(doc => ({
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

  useEffect(() => {
    fetchReferrals();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setCurrentUserRole(userData.role || "");
          setCurrentUserName(userData.name || "");
          setCurrentUserOrg(userData.organization || "");
        }
      }
    });

    return unsubscribe;
  }, []);

  const filteredReferrals = referrals.filter(r => {
    const referralcode = r.referralCode || "";
    const code = r.caseCode || "";
    const contact = r.clientContactInfo || "";
    const referperson = r.createdBy || "";
    const referto = r.referralTo || "";

    const matchesSearch =
      referralcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
      referperson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      referto.toLowerCase().includes(searchTerm.toLowerCase());

    const referralDate = r.dateOfReferral?.toDate ? r.dateOfReferral.toDate() : null;
    const matchesFrom = fromDate ? referralDate >= new Date(fromDate) : true;
    const matchesTo = toDate ? referralDate <= new Date(toDate + "T23:59:59") : true;

    return matchesSearch && matchesFrom && matchesTo;
  });

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentItems = filteredReferrals.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredReferrals.length / itemsPerPage);

  const handleDelete = async (referral) => {
    const { id, referralCode } = referral;

    const { value: userInput } = await Swal.fire({
      title: 'Confirm Deletion',
      html: `Type the Referral Code exactly to confirm: <strong class="text-red-700">${referralCode}</strong>`,
      input: 'text',
      inputPlaceholder: 'Enter Referral Code',
      showCancelButton: true,
      confirmButtonText: 'Delete',
    });

    if (userInput === referralCode) {
      try {
        await deleteDoc(doc(db, "referrals", id));
        Swal.fire("Deleted!", "Referral has been deleted.", "success");
        fetchReferrals();
      } catch (error) {
        console.error("Error deleting referral:", error);
        Swal.fire("Error", "Failed to delete referral.", "error");
      }
    } else if (userInput) {
      Swal.fire("Error", "Referral Code does not match.", "error");
    }
  };

  const exportToExcel = () => {
    const data = filteredReferrals.map(r => ({
      ReferralCode: r.referralCode,
      CaseCode: r.caseCode,
      ReferFrom: r.createdByOrg || "N/A",
      ReferralTo: r.referralTo || "N/A",
      Status: r.status || "N/A",
      ReferralDate: r.dateOfReferral?.toDate
        ? r.dateOfReferral.toDate().toLocaleString()
        : "N/A",
      ClientColorCode: r.clientColorCode || "N/A",
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Referrals");
    XLSX.writeFile(workbook, "Referral_Master_Log.xlsx");
  };

  return (
    <div className="mx-auto relative overflow-x-auto shadow-md sm:rounded-lg p-4">
      <h2 className="text-2xl font-bold mb-4">
        Referral Master Log [ <span className="text-1xl">Total:</span> <span>{filteredReferrals.length}</span> ]
      </h2>

      <div className="flex flex-wrap gap-4 pb-4">
        <input
          type="text"
          placeholder="Search for referral"
          className="block py-2 px-4 text-sm border border-gray-300 rounded-lg w-80 bg-gray-50"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
        />
        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="py-2 px-4 border border-gray-300 rounded"
        />
        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="py-2 px-4 border border-gray-300 rounded"
        />
        <button
          onClick={exportToExcel}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Export XLSX
        </button>
      </div>

      <table className="w-full text-sm text-left text-gray-500 table-auto">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
          <tr>
            <th className="border px-4 py-2">Referral Code</th>
            <th className="border px-4 py-2">Case Code</th>
            <th className="border px-4 py-2">Refer from</th>
            <th className="border px-4 py-2">Client Color Code</th>
            <th className="border px-4 py-2">Referral To</th>
            <th className="border px-4 py-2">Status</th>
            <th className="border px-4 py-2">Referral Date</th>
            <th className="border px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan="10" className="text-center py-4">
                Loading data...
              </td>
            </tr>
          ) : currentItems.length === 0 ? (
            <tr>
              <td colSpan="8" className="text-center py-4">
                No referrals found.
              </td>
            </tr>
          ) : (
            currentItems.map((r) => (
              <tr key={r.id}>
                <td className="border px-4 py-2">{r.referralCode}</td>
                <td className="border px-4 py-2">{r.caseCode}</td>
                <td className="border px-4 py-2">{r.createdByOrg || "N/A"}</td>
                <td className="border px-4 py-2">
                  {r.clientColorCode === "Red" ? (
                    <span className="text-white bg-red-500 px-2 py-1">Urgent</span>
                  ) : r.clientColorCode === "Yellow" ? (
                    <span className="text-white bg-yellow-500 px-2 py-1">Non-Urgent</span>
                  ) : (
                    "N/A"
                  )}
                </td>
                <td className="border px-4 py-2">
                  {r.referralTo === currentUserOrg ? (
                    <strong className="font-extrabold bg-black text-white px-2 py-1">
                      {r.referralTo}
                    </strong>
                  ) : (
                    r.referralTo
                  )}
                </td>
                <td className="border px-4 py-2">
                  {r.status === "Approved" ? (
                    <span className="text-white bg-green-500 px-2 py-1">{r.status}</span>
                  ) : r.status === "Rejected" ? (
                    <span className="text-white bg-red-500 px-2 py-1">{r.status}</span>
                  ) : (
                    <span className="text-black font-extrabold px-2 py-1">{r.status}</span>
                  )}
                </td>
                <td className="border px-4 py-2">
                  {r.dateOfReferral?.toDate
                    ? r.dateOfReferral.toDate().toLocaleString()
                    : "N/A"}
                </td>
                <td className="border px-4 py-2 space-x-2">
                  <Link to={`/master-referral-log/${r.id}`} className="text-blue-600 underline">
                    View
                  </Link>

                  {(currentUserRole === "Administrator" || currentUserName === r.createdBy) && (
                    <Link to={`/master-referral-log/${r.id}/edit`} className="text-blue-600 underline">
                      Edit
                    </Link>
                  )}

                  {(currentUserRole === "Administrator" || currentUserName === r.createdBy) && (
                    <button
                      onClick={() => handleDelete(r)}
                      className="text-blue-600 underline"
                    >
                      Delete
                    </button>
                  )}
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
              className={`px-3 py-1 rounded ${currentPage === number + 1
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200"
                }`}
            >
              {number + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReferralList;
