import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import {
    collection,
    query,
    where,
    getDocs,
    doc,
    updateDoc
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Swal from "sweetalert2";

const MyAssignedCases = () => {
    const [assignedCases, setAssignedCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState("");

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setCurrentUserId(user.uid);
            }
        });

        return unsubscribe;
    }, []);

    useEffect(() => {
        const fetchCases = async () => {
            if (!currentUserId) return;
            setLoading(true);
            const q = query(
                collection(db, "referrals"),
                where("assignedSupervisorId", "==", currentUserId)
            );
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setAssignedCases(data);
            setLoading(false);
        };
        if (currentUserId) fetchCases();
    }, [currentUserId]);

    const handleUpdateStatus = async (referral) => {
        const stages = [
            "In Progress Stage 1",
            "In Progress Stage 2",
            "In Progress Stage 3",
            "In Progress Stage 4",
            "In Progress Stage 5"
        ];

        const currentStage = referral.progressStage || 0;

        let nextStages = [];

        if (currentStage < 5) {
            nextStages.push(stages[currentStage]);
        }

        nextStages.push("On Hold", "Dismissed", "Closed");

        const { value: formValues } = await Swal.fire({
            title: "Update Case Status",
            html: `
        <p>Current Status: <strong>${referral.caseStatus || "None"}</strong></p>
        <p>Type the Case Code to confirm: <strong class="text-red-700">${referral.caseCode}</strong></p>
        <input id="swal-case-code" class="swal2-input" placeholder="Enter Case Code">
        <select id="swal-status" class="swal2-select">
          ${nextStages.map(s => `<option value="${s}">${s}</option>`).join("")}
        </select>
        <textarea id="swal-note" class="swal2-textarea" placeholder="Enter update note"></textarea>
      `,
            focusConfirm: false,
            showCancelButton: true,
            preConfirm: () => {
                const codeInput = document.getElementById("swal-case-code").value.trim();
                const newStatus = document.getElementById("swal-status").value;
                const note = document.getElementById("swal-note").value.trim();
                if (!codeInput || !note) {
                    Swal.showValidationMessage("Both fields are required.");
                    return false;
                }
                return { codeInput, newStatus, note };
            }
        });

        if (!formValues) return;

        const { codeInput, newStatus, note } = formValues;

        if (codeInput !== referral.caseCode) {
            Swal.fire("Error", "Case Code does not match.", "error");
            return;
        }

        let newStage = referral.progressStage || 0;

        if (newStatus.startsWith("In Progress Stage")) {
            const nextStageNumber = parseInt(newStatus.split("Stage ")[1], 10);
            newStage = nextStageNumber;
        }

        let progress = referral.progress || 0;

        if (newStatus.startsWith("In Progress Stage")) {
            progress = (newStage / 5) * 100;
        } else if (newStatus === "Closed") {
            progress = 100;
        }

        const docRef = doc(db, "referrals", referral.id);

        // Append this update to stageHistory array
        const newHistory = referral.stageHistory || [];
        newHistory.push({
            status: newStatus,
            note: note,
            date: new Date().toISOString()
        });

        await updateDoc(docRef, {
            caseStatus: newStatus,
            caseStatusNote: note,
            progressStage: newStage,
            progress: progress,
            stageHistory: newHistory
        });

        Swal.fire("Updated!", `Status set to: ${newStatus}`, "success");

        setAssignedCases(prev =>
            prev.map(item =>
                item.id === referral.id
                    ? {
                        ...item,
                        caseStatus: newStatus,
                        caseStatusNote: note,
                        progress,
                        progressStage: newStage,
                        stageHistory: newHistory
                    }
                    : item
            )
        );
    };




    const handleExportCSV = () => {
        if (!assignedCases.length) return;

        const header = [
            "Referral Code",
            "Case Code",
            "Supervisor Name",
            "Supervisor Org",
            "Current Status",
            "Progress %",
            "Latest Note"
        ];

        const rows = assignedCases.map(r => [
            r.referralCode,
            r.caseCode,
            r.assignedSupervisorName || "N/A",
            r.assignedSupervisorOrg || "N/A",
            r.caseStatus || "N/A",
            Math.round(r.progress || 0) + "%",
            r.caseStatusNote || ""
        ]);

        const csvContent = [header, ...rows]
            .map(e => e.map(field => `"${String(field).replace(/"/g, '""')}"`).join(","))
            .join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "assigned_cases.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleViewStages = (referral) => {
        const history = referral.stageHistory || [];
        if (history.length === 0) {
            Swal.fire("No Updates", "No stage updates yet.", "info");
            return;
        }

        const html = history.map(h => `
      <p><strong>Status:</strong> ${h.status}</p>
      <p><strong>Note:</strong> ${h.note}</p>
      <p><strong>Date:</strong> ${new Date(h.date).toLocaleString()}</p>
      <hr/>
    `).join("");

        Swal.fire({
            title: "Stages & Notes",
            html,
            width: "600px"
        });
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">My Assigned Cases</h2>
                <button
                    onClick={handleExportCSV}
                    className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                    Export CSV
                </button>
            </div>


            {loading ? (
                <p>Loading...</p>
            ) : assignedCases.length === 0 ? (
                <p>No assigned cases found.</p>
            ) : (
                <table className="w-full table-auto border">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="border px-4 py-2">Referral Code</th>
                            <th className="border px-4 py-2">Case Code</th>
                            <th className="border px-4 py-2">Supervisor</th>

                            <th className="border px-4 py-2">Current Status</th>
                            <th className="border px-4 py-2">Progress</th>
                            <th className="border px-4 py-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {assignedCases.map(referral => (
                            <tr key={referral.id}>
                                <td className="border px-4 py-2">{referral.referralCode}</td>
                                <td className="border px-4 py-2">{referral.caseCode || "N/A"}</td>
                                <td className="border px-4 py-2">{referral.assignedSupervisorName || "N/A"}</td>

                                <td className="border px-4 py-2">{referral.caseStatus || "None"}</td>
                                <td className="border px-4 py-2">
                                    <div className="w-full bg-gray-200 rounded-full h-4">
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
                                    </div>
                                </td>
                                <td className="border px-4 py-2 space-x-2">
                                    <button
                                        onClick={() => handleUpdateStatus(referral)}
                                        className="px-3 py-1 bg-green-600 text-sm text-white rounded"
                                    >
                                        Update Status
                                    </button>
                                    <button
                                        onClick={() => handleViewStages(referral)}
                                        className="px-3 py-1 bg-blue-600 text-sm text-white rounded"
                                    >
                                        See Stages & Notes
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default MyAssignedCases;
