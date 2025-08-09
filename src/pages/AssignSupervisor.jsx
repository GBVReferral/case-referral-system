import { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Swal from "sweetalert2";

export default function AssignSupervisor() {
  const [currentUserOrg, setCurrentUserOrg] = useState("");
  const [currentUserRole, setCurrentUserRole] = useState("");
  const [approvedReferrals, setApprovedReferrals] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [selectedReferralId, setSelectedReferralId] = useState("");
  const [selectedSupervisorId, setSelectedSupervisorId] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setCurrentUserOrg(data.organization || "");
          setCurrentUserRole(data.role || "");
        }
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUserOrg) return;

      // 1️⃣ Approved referrals not yet assigned
      const q1 = query(
        collection(db, "referrals"),
        where("referralTo", "==", currentUserOrg),
        where("status", "==", "Approved"),
        where("assignedSupervisorId", "==", null) // unassigned only
      );
      const snapshot1 = await getDocs(q1);
      setApprovedReferrals(snapshot1.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // 2️⃣ Supervisors in same org
      const q2 = query(
        collection(db, "users"),
        where("role", "==", "Case Supervisor"),
        where("organization", "==", currentUserOrg)
      );
      const snapshot2 = await getDocs(q2);
      setSupervisors(snapshot2.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    if (currentUserOrg) fetchData();
  }, [currentUserOrg]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedReferralId || !selectedSupervisorId) {
      Swal.fire("Error", "Please select both referral and supervisor", "error");
      return;
    }

    const supervisor = supervisors.find(s => s.id === selectedSupervisorId);
    try {
      await updateDoc(doc(db, "referrals", selectedReferralId), {
        assignedSupervisorId: selectedSupervisorId,
        assignedSupervisorName: supervisor.name,
        assignedAt: serverTimestamp(),
      });
      Swal.fire("Success", "Supervisor assigned!", "success");
      setSelectedReferralId("");
      setSelectedSupervisorId("");
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to assign supervisor.", "error");
    }
  };

  if (currentUserRole !== "Focal Person") return <p>Not authorized</p>;

  return (
    <div className="max-w-xl mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">Assign Case Supervisor</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-bold">Select Referral</label>
          <select
            value={selectedReferralId}
            onChange={(e) => setSelectedReferralId(e.target.value)}
            className="border px-2 py-1 w-full"
          >
            <option value="">-- Select Approved Referral --</option>
            {approvedReferrals.map(r => (
              <option key={r.id} value={r.id}>
                {r.referralCode} | {r.caseCode}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-bold">Select Supervisor</label>
          <select
            value={selectedSupervisorId}
            onChange={(e) => setSelectedSupervisorId(e.target.value)}
            className="border px-2 py-1 w-full"
          >
            <option value="">-- Select Supervisor --</option>
            {supervisors.map(s => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Assign Supervisor
        </button>
      </form>
    </div>
  );
}
