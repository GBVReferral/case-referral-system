import { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc
} from "firebase/firestore";
import Swal from "sweetalert2";
import { GiNotebook } from "react-icons/gi";

export default function CaseTrackerLogs() {
  const [cases, setCases] = useState([]);
  const [filteredCases, setFilteredCases] = useState([]);
  const [loading, setLoading] = useState(true);

  const [orgs, setOrgs] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  useEffect(() => {
    const fetchCases = async () => {
      setLoading(true);

      const q = query(
        collection(db, "referrals"),
        where("assignedSupervisorId", "!=", "")
      );

      const snapshot = await getDocs(q);

      const data = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
          let supervisorName = "N/A";
          let supervisorOrg = "N/A";

          if (data.assignedSupervisorId) {
            const userDoc = await getDoc(doc(db, "users", data.assignedSupervisorId));
            if (userDoc.exists()) {
              const user = userDoc.data();
              supervisorName = user.name || "N/A";
              supervisorOrg = user.organization || "N/A";
            }
          }

          return {
            id: docSnap.id,
            ...data,
            supervisorName,
            supervisorOrg
          };
        })
      );

      // Extract unique orgs for filter
      const uniqueOrgs = Array.from(new Set(data.map((d) => d.supervisorOrg))).filter(Boolean);

      setCases(data);
      setFilteredCases(data);
      setOrgs(uniqueOrgs);
      setLoading(false);
    };

    fetchCases();
  }, []);

  useEffect(() => {
    let filtered = [...cases];
    if (selectedOrg) {
      filtered = filtered.filter((c) => c.supervisorOrg === selectedOrg);
    }
    if (selectedStatus) {
      filtered = filtered.filter((c) => c.caseStatus === selectedStatus);
    }
    setFilteredCases(filtered);
  }, [selectedOrg, selectedStatus, cases]);

  const handleViewStages = (referral) => {
    Swal.fire({
      title: `Stages & Notes for ${referral.referralCode}`,
      html: `
        <p><strong>Case Code:</strong> ${referral.caseCode || "N/A"}</p>
        <p><strong>Current Status:</strong> ${referral.caseStatus || "None"}</p>
        <p><strong>Progress:</strong> ${Math.round(referral.progress || 0)}%</p>
        <p><strong>Note:</strong> ${referral.caseStatusNote || "N/A"}</p>
      `
    });
  };

  const handleExportCSV = () => {
    if (filteredCases.length === 0) return;

    const header = [
      "Referral Code",
      "Case Code",
      "Supervisor Name",
      "Supervisor Org",
      "Status",
      "Progress",
      "Notes"
    ];

    const rows = filteredCases.map((referral) => [
      referral.referralCode,
      referral.caseCode,
      referral.supervisorName,
      referral.supervisorOrg,
      referral.caseStatus || "None",
      `${Math.round(referral.progress || 0)}%`,
      referral.caseStatusNote || "N/A"
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [header, ...rows].map((e) => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `case_tracker_logs_${new Date().toISOString()}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">📋 Case Tracker Logs</h2>

      <div className="flex flex-wrap gap-4 mb-4">
        <div>
          <label className="block mb-1 font-medium">Filter by Org:</label>
          <select
            value={selectedOrg}
            onChange={(e) => setSelectedOrg(e.target.value)}
            className="border px-3 py-2 rounded"
          >
            <option value="">All Orgs</option>
            {orgs.map((org) => (
              <option key={org} value={org}>{org}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-1 font-medium">Filter by Status:</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="border px-3 py-2 rounded"
          >
            <option value="">All Statuses</option>
            <option>In Progress Stage 1</option>
            <option>In Progress Stage 2</option>
            <option>In Progress Stage 3</option>
            <option>In Progress Stage 4</option>
            <option>In Progress Stage 5</option>
            <option>On Hold</option>
            <option>Dismissed</option>
            <option>Closed</option>
          </select>
        </div>

        <button
          onClick={() => {
            setSelectedOrg("");
            setSelectedStatus("");
          }}
          className="px-4 py-2 bg-gray-500 text-white rounded self-end"
        >
          Clear Filters
        </button>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2 bg-green-600 text-white rounded self-end"
        >
          Download CSV
        </button>
      </div>

      {loading ? (
        <p>Loading cases...</p>
      ) : filteredCases.length === 0 ? (
        <p>No assigned cases found.</p>
      ) : (
        <table className="w-full table-auto border">
          <thead>
            <tr className="bg-gray-200 text-left">
              <th className="border px-4 py-2">Referral Code</th>
              <th className="border px-4 py-2">Case Code</th>
              <th className="border px-4 py-2">Supervisor</th>
              <th className="border px-4 py-2">Org</th>
              <th className="border px-4 py-2">Status</th>
              <th className="border px-4 py-2">Progress</th>
              <th className="border px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {filteredCases.map((referral) => (
              <tr key={referral.id}>
                <td className="border px-4 py-2">{referral.referralCode}</td>
                <td className="border px-4 py-2">{referral.caseCode}</td>
                <td className="border px-4 py-2">{referral.supervisorName}</td>
                <td className="border px-4 py-2">{referral.supervisorOrg}</td>

                {
                  (referral.caseStatus === "On Hold") ? (

                    <td className="border font-bold px-4 py-2 text-yellow-700">{referral.caseStatus}</td>
                  ) :

                    (referral.caseStatus === "Dismissed") ? (

                      <td className="border font-bold px-4 py-2 text-red-800">{referral.caseStatus}</td>

                    ) : (referral.caseStatus === "Closed") && (
                      <td className="border font-bold px-4 py-2 text-green-600">{referral.caseStatus}</td>
                    )


                }

                <td className="border px-4 py-2">
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div

                      className={`h-4 rounded-full ${referral.caseStatus === "Closed"
                        ? "bg-green-600"
                        : referral.caseStatus === "On Hold" ||
                          referral.caseStatus === "Dismissed"
                          ? "bg-gray-500"
                          : "bg-blue-600"
                        }`}
                      style={{ width: `${referral.progress || 0}%` }}
                    ><div className="text-sm text-center font-medium text-black-700">
                        {Math.round(referral.progress || 0)}%
                      </div></div>
                  </div>
                </td>
                <td className="border px-4 py-2">
                  <button
                    onClick={() => handleViewStages(referral)}
                    className="px-3 py-1 bg-gray-600 text-sm text-white rounded cursor-pointer"
                  >
                     Notesv 📋
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
