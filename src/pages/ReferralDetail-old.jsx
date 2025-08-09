import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
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
import { onAuthStateChanged } from "firebase/auth";
import Swal from "sweetalert2";

// ✅ ReferralDetail Component
export default function ReferralDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [referral, setReferral] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Track logged-in user org + role
  const [currentUserOrg, setCurrentUserOrg] = useState("");
  const [currentUserRole, setCurrentUserRole] = useState("");

  // ✅ Supervisors for Focal Person to choose
  const [supervisors, setSupervisors] = useState([]);
  const [selectedSupervisorId, setSelectedSupervisorId] = useState("");
  const [assignNotes, setAssignNotes] = useState("");

  // ✅ 1️⃣ GET LOGGED-IN USER INFO
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

  // ✅ 2️⃣ FETCH REFERRAL BY ID
  useEffect(() => {
    const fetchReferral = async () => {
      try {
        const docRef = doc(db, "referrals", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setReferral({ id: docSnap.id, ...docSnap.data() });
        } else {
          Swal.fire("Error", "Referral not found.", "error");
          navigate("/master-referral-log");
        }
      } catch (err) {
        console.error(err);
        Swal.fire("Error", "Failed to fetch referral.", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchReferral();
  }, [id, navigate]);

  // ✅ 3️⃣ FETCH SUPERVISORS FROM SAME ORG — for dropdown
  useEffect(() => {
    const fetchSupervisors = async () => {
      if (!currentUserOrg) return;
      const q = query(
        collection(db, "users"),
        where("role", "==", "Supervisor"),
        where("organization", "==", currentUserOrg)
      );
      const snap = await getDocs(q);
      setSupervisors(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    if (currentUserOrg) fetchSupervisors();
  }, [currentUserOrg]);

  // ✅ 4️⃣ ASSIGN SUPERVISOR FORM HANDLER
  const handleAssign = async (e) => {
    e.preventDefault();
    if (!selectedSupervisorId) {
      Swal.fire("Error", "Please select a supervisor.", "error");
      return;
    }

    const supervisor = supervisors.find(s => s.id === selectedSupervisorId);

    try {
      await updateDoc(doc(db, "referrals", id), {
        assignedSupervisorId: selectedSupervisorId,
        assignedSupervisorName: supervisor.name,
        assignNotes: assignNotes,
        assignedAt: serverTimestamp(),
        status: "Assigned", // ✅ UPDATE status too!
      });
      Swal.fire("Success", "Supervisor assigned.", "success");
      // ✅ REFRESH to show updated status & hide form
      window.location.reload();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to assign.", "error");
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!referral) return null;

  return (
    <div className="max-w-xl mx-auto p-4">
      {/* ✅ Show Referral Details */}
      <h2 className="text-2xl font-bold mb-4">
        Referral Detail - <span className="text-blue-600">{referral.referralCode}</span>
      </h2>
      <p><strong>Case Code:</strong> {referral.caseCode}</p>
      <p><strong>Status:</strong> {referral.status}</p>
      <p><strong>Referred To:</strong> {referral.referralTo}</p>
      <p><strong>Notes:</strong> {referral.notes}</p>

      {/* ✅ SHOW ASSIGN FORM IF:
            - Status === Approved
            - Not already assigned
            - User is Focal Person
      */}
      {(referral.status === "Approved" && !referral.assignedSupervisorId && currentUserRole === "Focal Person") && (
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
              {supervisors.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
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

          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">
            Assign
          </button>
        </form>
      )}

      {/* ✅ If already assigned — show assignment info */}
      {referral.assignedSupervisorName && (
        <div className="mt-4">
          <p><strong>Supervisor:</strong> {referral.assignedSupervisorName}</p>
          <p><strong>Assigned At:</strong> {referral.assignedAt?.toDate().toLocaleString() || "N/A"}</p>
          <p><strong>Assign Notes:</strong> {referral.assignNotes}</p>
        </div>
      )}
    </div>
  );
}
