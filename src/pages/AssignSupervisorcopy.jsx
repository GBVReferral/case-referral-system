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
  const [selectedSupervisor, setSelectedSupervisor] = useState(null); // store as object

  // Get current user info
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

  // Fetch referrals and supervisors
  useEffect(() => {
    const fetchData = async () => {
      if (!currentUserOrg) return;

      // Approved referrals
      const q1 = query(
        collection(db, "referrals"),
        where("referralTo", "==", currentUserOrg),
        where("status", "==", "Approved"),
        where("assignedSupervisorId", "==", null)
      );
      const snapshot1 = await getDocs(q1);
      setApprovedReferrals(snapshot1.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Supervisors
      const q2 = query(
        collection(db, "users"),
        where("role", "==", "Case Supervisor"),
        where("organization", "==", currentUserOrg)
      );
      const snapshot2 = await getDocs(q2);
      const supervisorsList = snapshot2.docs.map(doc => doc.data());
      setSupervisors(supervisorsList);
    };

    fetchData();
  }, [currentUserOrg]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedReferralId || !selectedSupervisor) {
      Swal.fire("Error", "Please select both referral and supervisor", "error");
      return;
    }

    try {
      await updateDoc(doc(db, "referrals", selectedReferralId), {
        assignedSupervisorId: selectedSupervisor.uid,
        assignedSupervisorName: selectedSupervisor.name,
        assignedSupervisorEmail: selectedSupervisor.email,
        assignedAt: serverTimestamp(),
      });
      Swal.fire("Success", "Supervisor assigned!", "success");
      setSelectedReferralId("");
      setSelectedSupervisor(null);
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

        {/* Referral select */}
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

        {/* Supervisor select */}
        <div>
          <label className="block font-bold">Select Supervisor</label>
          <select
            value={selectedSupervisor?.uid || ""}
            onChange={(e) => {
              const selected = supervisors.find(s => s.uid === e.target.value);
              setSelectedSupervisor(selected || null);
            }}
            className="border px-2 py-1 w-full"
          >
            <option value="">-- Select Supervisor --</option>
            {supervisors.map((s) => (
              <option key={s.uid} value={s.uid}>
                {s.name} | {s.email}
              </option>
            ))}
          </select>

          {/* Live display */}
          {selectedSupervisor && (
            <p className="mt-2 text-sm text-gray-700">
              Selected: <strong>{selectedSupervisor.name} | {selectedSupervisor.email}</strong>
            </p>
          )}
        </div>
        <p>{s.email}</p>
        <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Repellat necessitatibus, tenetur, et ab consequatur impedit laborum quae aspernatur doloribus sed harum exercitationem obcaecati, corrupti expedita deleniti? Adipisci commodi doloremque quidem.</p>

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
