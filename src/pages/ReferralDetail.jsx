import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import {
    doc,
    getDoc,
    updateDoc,
    collection,
    query,
    where,
    getDocs,
    serverTimestamp,
} from "firebase/firestore";
import { useParams, Link, useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import Swal from "sweetalert2";

const ReferralDetail = () => {
    const { id } = useParams();
    const [referral, setReferral] = useState(null);
    const navigate = useNavigate();
    const [currentUserOrg, setCurrentUserOrg] = useState("");
    const [currentUserRole, setCurrentUserRole] = useState("");
    const [loading, setLoading] = useState(true);

    // ✅ For assigning supervisor:
    const [supervisors, setSupervisors] = useState([]);
    const [selectedSupervisorId, setSelectedSupervisorId] = useState("");
    const [assignNotes, setAssignNotes] = useState("");

    // ✅ Load referral by ID
    useEffect(() => {
        const fetchReferral = async () => {
            const docRef = doc(db, "referrals", id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setReferral({ id: docSnap.id, ...docSnap.data() });
            } else {
                console.error("No such referral!");
                navigate("/master-referral-log");
            }
            setLoading(false);
        };
        fetchReferral();
    }, [id, navigate]);

    // ✅ Load user org + role
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    const u = userDoc.data();
                    setCurrentUserOrg(u.organization || "");
                    setCurrentUserRole(u.role || "");
                }
            }
        });
        return unsub;
    }, []);

    // ✅ Load supervisors in same org (if needed)
    useEffect(() => {
        const fetchSupervisors = async () => {
            if (!currentUserOrg) return;
            const q = query(
                collection(db, "users"),
                where("role", "==", "Case Supervisor"),
                where("organization", "==", currentUserOrg)
            );
            const snap = await getDocs(q);
            setSupervisors(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        };
        if (currentUserOrg) fetchSupervisors();
    }, [currentUserOrg]);

    // ✅ Approve handler
    const handleApprove = async () => {
        try {
            const { value: userInput } = await Swal.fire({
                title: "Confirm Approval",
                html: `Type the Referral Code exactly to approve: <strong>${referral.referralCode}</strong>`,
                input: "text",
                inputPlaceholder: "Enter Referral Code",
                showCancelButton: true,
                confirmButtonText: "Approve",
            });

            if (userInput !== referral.referralCode) {
                if (userInput) {
                    Swal.fire("Error", "Referral Code does not match.", "error");
                }
                return;
            }

            const docRef = doc(db, "referrals", id);
            const user = auth.currentUser;
            let approverName = "", approverOrg = "";

            if (user) {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    approverName = userDoc.data().name || "";
                    approverOrg = userDoc.data().organization || "";
                }
            }

            await updateDoc(docRef, {
                status: "Approved",
                approvedBy: approverName,
                approvedByOrg: approverOrg,
            });

            setReferral((prev) => ({
                ...prev,
                status: "Approved",
                approvedBy: approverName,
                approvedByOrg: approverOrg,
            }));

            Swal.fire("Approved!", "Referral has been approved.", "success");
        } catch (error) {
            console.error(error);
            Swal.fire("Error", "Failed to approve referral.", "error");
        }
    };

    // ✅ Reject handler
    const handleReject = async () => {
        const { value: formValues } = await Swal.fire({
            title: "Reject Referral",
            html: `
        Type the Referral Code exactly: <strong>${referral.referralCode}</strong>
        <input id="swal-ref-code" class="swal2-input" placeholder="Referral Code">
        <textarea id="swal-reason" class="swal2-textarea" placeholder="Reason for rejection"></textarea>
      `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: "Reject",
            preConfirm: () => {
                const codeInput = document.getElementById("swal-ref-code").value.trim();
                const reasonInput = document.getElementById("swal-reason").value.trim();
                if (!codeInput || !reasonInput) {
                    Swal.showValidationMessage("Both fields are required.");
                    return;
                }
                return { codeInput, reasonInput };
            },
        });

        if (!formValues) return;

        const { codeInput, reasonInput } = formValues;

        if (codeInput !== referral.referralCode) {
            Swal.fire("Error", "Referral Code does not match.", "error");
            return;
        }

        try {
            const docRef = doc(db, "referrals", id);
            const user = auth.currentUser;
            let rejectorName = "", rejectorOrg = "";

            if (user) {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    rejectorName = userDoc.data().name || "";
                    rejectorOrg = userDoc.data().organization || "";
                }
            }

            await updateDoc(docRef, {
                status: "Rejected",
                rejectedBy: rejectorName,
                rejectedByOrg: rejectorOrg,
                rejectionNotes: reasonInput,
            });

            setReferral({
                ...referral,
                status: "Rejected",
                rejectedBy: rejectorName,
                rejectedByOrg: rejectorOrg,
                rejectionNotes: reasonInput,
            });

            Swal.fire("Rejected!", "Referral has been rejected.", "success");
        } catch (error) {
            console.error(error);
            Swal.fire("Error", "Failed to reject referral.", "error");
        }
    };

    // ✅ Assign supervisor handler
    // ✅ NEW: Require referral code confirmation when assigning
    const handleAssign = async (e) => {
        e.preventDefault();

        if (!selectedSupervisorId) {
            Swal.fire("Error", "Please select a supervisor.", "error");
            return;
        }

        const supervisor = supervisors.find((s) => s.id === selectedSupervisorId);

        // ✅ Ask for confirmation with referral code
        const { value: userInput } = await Swal.fire({
            title: "Confirm Assignment",
            html: `Type the Referral Code exactly to assign: <strong>${referral.referralCode}</strong>`,
            input: "text",
            inputPlaceholder: "Enter Referral Code",
            showCancelButton: true,
            confirmButtonText: "Assign",
        });

        if (userInput !== referral.referralCode) {
            if (userInput) {
                Swal.fire("Error", "Referral Code does not match.", "error");
            }
            return;
        }

        try {
            // ✅ get current user like in handleApprove
            const user = auth.currentUser;
            let assignerName = "", assignerOrg = "";

            if (user) {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    assignerName = userDoc.data().name || "";
                    assignerOrg = userDoc.data().organization || "";
                }
            }

            await updateDoc(doc(db, "referrals", id), {
                assignedSupervisorId: selectedSupervisorId,
                assignedSupervisorName: supervisor.name,
                assignedSupervisorEmail: supervisor.email || "",
                assignNotes: assignNotes,
                assignedAt: serverTimestamp(),
                status: "Assigned",
                assignedBy: assignerName, // optional tracking
                assignedByOrg: assignerOrg,
            });

            Swal.fire("Assigned!", "Supervisor has been assigned.", "success");

            setReferral((prev) => ({
                ...prev,
                status: "Assigned",
                assignedSupervisorName: supervisor.name,
                assignedSupervisorEmail: supervisor.email || "",
                assignNotes: assignNotes,
                assignedBy: assignerName,
            }));

            // ✅ Reset form
            setSelectedSupervisorId("");
            setAssignNotes("");
        } catch (err) {
            console.error(err);
            Swal.fire("Error", "Failed to assign.", "error");
        }
    };


    if (loading || !referral) {
        return <div>Loading...</div>;
    }

    return (
        <div className="mx-auto p-6 bg-white rounded-xl shadow-md">
            <Link to="/master-referral-log" className="text-blue-600 hover:underline mb-4 block">
                ⬅️ Back to Master Log
            </Link>

            <h2 className="text-3xl font-bold mb-6">Referral Detail</h2>

            <div className="space-y-4">
                <div><strong>Referral Code:</strong> {referral.referralCode}</div>
                <div><strong>Case Code:</strong> {referral.caseCode}</div>
                <div><strong>Referral To:</strong> {referral.referralTo}</div>




                <div>
                    <strong>Client Color Code:</strong>
                    {" "}

                    {referral.clientColorCode &&
                        referral.clientColorCode === "Red" ? (

                        <span className="text-white bg-red-500 px-2 py-1 ">

                            Urgent

                        </span>


                    ) : referral.clientColorCode === "Yellow" ? (

                        <span className="text-white bg-yellow-500 px-2 py-1 ">

                            Non-Urgent

                        </span>


                    ) : (
                        "N/A"
                    )
                    }
                </div>

                <div>
                    <strong> Contact Info:</strong>{" "}
                    {referral.clientContactInfo}
                </div>

                <div>
                    <strong>Notes:</strong>{" "}
                    {referral.notes}
                </div>

                <div>
                    <strong>Consent Form URL:</strong>{" "}
                    <a
                        href={referral.consentFormUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 underline"
                    >
                        {referral.consentFormUrl}
                    </a>
                </div>



                <div>
                    <strong>Status:</strong>{" "}
                    {referral.status === "Approved" ? (
                        <span className="bg-green-500 text-white px-2 py-1">{referral.status}</span>
                    ) : referral.status === "Rejected" ? (
                        <span className="bg-red-500 text-white px-2 py-1">{referral.status}</span>
                    ) : referral.status === "Assigned" ? (
                        <span className="bg-blue-600 text-white px-2 py-1">{referral.status}</span>
                    ) : (
                        <span>{referral.status}</span>
                    )}
                </div>

                {/* ✅ Approval Info */}
                {referral.status === "Approved" && (
                    <p><strong>Approved By:</strong> {referral.approvedBy} ({referral.approvedByOrg})</p>
                )}

                {referral.status === "Rejected" && (
                    <>
                        <p><strong>Rejected By:</strong> {referral.rejectedBy} ({referral.rejectedByOrg})</p>
                        <p><strong>Rejection Reason:</strong> {referral.rejectionNotes}</p>
                    </>
                )}

                {/* ✅ Show Approve/Reject if eligible */}
                {currentUserOrg === referral.referralTo && referral.status === "Waiting..." && (
                    <>
                        <button
                            onClick={handleApprove}
                            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                        >
                            Approve
                        </button>
                        <button
                            onClick={handleReject}
                            className="bg-red-600 text-white px-4 py-2 rounded ml-2 hover:bg-red-700"
                        >
                            Reject
                        </button>
                    </>
                )}

                {/* ✅ Supervisor assign form */}
                {referral.status === "Approved" &&
                    !referral.assignedSupervisorId &&
                    currentUserRole === "Focal Person" &&
                    currentUserOrg === referral.referralTo && (
                        <form onSubmit={handleAssign} className="mt-6 space-y-4 border-t pt-4">
                            <h3 className="font-bold">Assign Supervisor</h3>
                            <div>
                                <label className="block font-bold">Supervisor</label>
                                <select
                                    value={selectedSupervisorId}
                                    onChange={(e) => setSelectedSupervisorId(e.target.value)}
                                    className="border px-2 py-1 w-full"
                                >
                                    <option value="">-- Select Supervisor --</option>
                                    {supervisors.map((s) => (
                                        <option key={s.id} value={s.id}>{s.name} | {s.email}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block font-bold">Notes</label>
                                <textarea
                                    value={assignNotes}
                                    onChange={(e) => setAssignNotes(e.target.value)}
                                    className="border px-2 py-1 w-full"
                                />
                            </div>
                            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
                                Assign
                            </button>
                        </form>
                    )}

                {/* ✅ Show assign info if already assigned */}
                {referral.assignedSupervisorName && (
                    <div className="mt-4">
                        <p><strong>Assigned Supervisor:</strong> {referral.assignedSupervisorName}</p>
                        <p><strong>Assign Notes:</strong> {referral.assignNotes}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReferralDetail;
