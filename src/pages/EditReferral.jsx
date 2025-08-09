import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { db, auth } from "../firebase";
import {
  doc,
  getDoc,
  getDocs, // ✅ NEW: for loading orgs
  updateDoc,
  serverTimestamp,
  collection // ✅ NEW: for orgs
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Swal from "sweetalert2";

const EditReferral = () => {
  const [currentUserRole, setCurrentUserRole] = useState("");
  const [currentUserName, setCurrentUserName] = useState("");
  const [currentUserOrg, setCurrentUserOrg] = useState(""); // ✅ NEW: track user org

  const [organizations, setOrganizations] = useState([]); // ✅ NEW: org list

  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [referral, setReferral] = useState({
    referralTo: "",
    caseCode: "",
    clientColorCode: "",
    clientContactInfo: "",
    notes: "",
    consentFormUrl: "",
  });

  // ✅ Fetch referral + user info + organizations on mount
  useEffect(() => {
    const fetchReferralAndUser = async () => {
      try {
        const docRef = doc(db, "referrals", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setReferral(docSnap.data());
        } else {
          Swal.fire("Error", "Referral not found.", "error");
          navigate("/master-referral-log");
        }

        // Auth check
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          if (user) {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
              const data = userDoc.data();
              setCurrentUserRole(data.role || "");
              setCurrentUserName(data.name || "");
              setCurrentUserOrg(data.organization || ""); // ✅ load org
            }
          } else {
            navigate("/login");
          }
        });

        // ✅ Fetch orgs
        const orgsSnapshot = await getDocs(collection(db, "organizations"));
        const orgList = orgsSnapshot.docs.map((doc) => doc.data().name);
        setOrganizations(orgList);

        return unsubscribe;
      } catch (error) {
        console.error(error);
        Swal.fire("Error", "Failed to load referral.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchReferralAndUser();
  }, [id, navigate]);

  // ✅ Block edit if not owner or admin
  useEffect(() => {
    if (
      referral &&
      currentUserRole &&
      currentUserName &&
      !(
        currentUserRole === "Administrator" ||
        currentUserName === referral.createdBy
      )
    ) {
      navigate("/not-authorized");
    }
  }, [referral, currentUserRole, currentUserName, navigate]);

  const handleChange = (e) => {
    setReferral({ ...referral, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const docRef = doc(db, "referrals", id);
      await updateDoc(docRef, {
        ...referral,
        lastUpdated: serverTimestamp(),
      });

      Swal.fire("Updated!", "Referral updated successfully.", "success");
      navigate("/master-referral-log");
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Failed to update referral.", "error");
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="max-w-xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">
        Edit Referral Code{" "}
        <span className="text-blue-500 font-bold">{referral.referralCode}</span>
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-bold">Referral To</label>
          <select
            name="referralTo"
            value={referral.referralTo}
            onChange={handleChange}
            className="border px-2 py-1 w-full"
            required
            disabled={referral.status === "Approved" || referral.status === "Rejected"} // ✅ LOCK if approved
          >
            <option value="">-- Select Organization --</option>
            {organizations
              .filter((org) => org !== currentUserOrg)
              .map((org) => (
                <option key={org} value={org}>
                  {org}
                </option>
              ))}
          </select>
          {(referral.status === "Approved" || referral.status === "Rejected") && (
            <p className="text-red-600 text-sm mt-1">
              Referral To cannot be changed because this referral is {referral.status}.
            </p>
          )}

        </div>


        <div>
          <label className="block font-bold">Case Code</label>
          <input
            name="caseCode"
            type="text"
            value={referral.caseCode}
            onChange={handleChange}
            className="border px-2 py-1 w-full"
            required
          />
        </div>

        <div>
          <label className="block font-bold">Client Referral Color Code</label>
          <select
            name="clientColorCode"
            value={referral.clientColorCode}
            onChange={handleChange}
            className="border px-2 py-1 w-full"
            required
          >
            <option value="Red">Red (Urgent)</option>
            <option value="Yellow">Yellow (Non-Urgent)</option>
          </select>
        </div>

        <div>
          <label className="block font-bold">Client Contact Info</label>
          <input
            name="clientContactInfo"
            type="text"
            value={referral.clientContactInfo}
            onChange={handleChange}
            className="border px-2 py-1 w-full"
            required
          />
        </div>

        <div>
          <label className="block font-bold">Notes</label>
          <textarea
            name="notes"
            value={referral.notes}
            onChange={handleChange}
            className="border px-2 py-1 w-full"
            required
          />
        </div>

        <div>
          <label className="block font-bold">Consent Form URL</label>
          <input
            name="consentFormUrl"
            type="url"
            value={referral.consentFormUrl}
            onChange={handleChange}
            className="border px-2 py-1 w-full"
          />
        </div>

        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Update Referral
        </button>
      </form>
    </div>
  );
};

export default EditReferral;
