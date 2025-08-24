import { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { collection, doc, addDoc, getDoc, getDocs, serverTimestamp } from "firebase/firestore";
import Swal from "sweetalert2";
import { onAuthStateChanged } from "firebase/auth";

const ReferralForm = () => {
    const [referralTo, setReferralTo] = useState("");
    const [caseCode, setCaseCode] = useState("");
    const [clientColorCode, setClientColorCode] = useState("Yellow");
    const [clientContactInfo, setClientContactInfo] = useState("");
    const [notes, setNotes] = useState("");
    const [consentFormUrl, setConsentFormUrl] = useState("");

    const [currentUserName, setCurrentUserName] = useState("");
    const [currentUserEmail, setCurrentUserEmail] = useState("");
    const [currentUserOrg, setCurrentUserOrg] = useState("");
    const [loadingUser, setLoadingUser] = useState(true);

    const [organizations, setOrganizations] = useState([]);


    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoadingUser(true);

                // Load logged in user info
                const unsubscribe = onAuthStateChanged(auth, async (user) => {
                    if (user) {
                        const userDoc = await getDoc(doc(db, "users", user.uid));
                        if (userDoc.exists()) {
                            setCurrentUserOrg(userDoc.data().organization || "");
                            setCurrentUserName(userDoc.data().name || "");
                            setCurrentUserEmail(userDoc.data().email || "");
                        }
                    }
                });

                // Load all orgs
                const orgsSnapshot = await getDocs(collection(db, "organizations"));
                const orgsList = orgsSnapshot.docs.map((doc) => doc.data().name);
                setOrganizations(orgsList);

                setLoadingUser(false);

                return unsubscribe;
            } catch (error) {
                console.error("Error fetching organizations:", error);
                setLoadingUser(false);
            }
        };

        fetchData();
    }, []);

    const handleSubmit = async (e) => {
    e.preventDefault();
    if (loadingUser) {
        Swal.fire("Wait!", "User info still loading. Please wait a moment.", "info");
        return;
    }

    if (!currentUserName || !currentUserOrg) {
        Swal.fire("Error", "User info missing. Cannot submit referral.", "error");
        return;
    }

    if (!caseCode.trim()) {
        Swal.fire("Error", "Case Code cannot be empty.", "error");
        return;
    }

    const { value: userInput } = await Swal.fire({
        title: "Confirm Submission",
        html: `Type the Case Code exactly to confirm: <strong>${caseCode}</strong>`,
        input: "text",
        inputPlaceholder: "Enter Case Code exactly",
        showCancelButton: true,
        confirmButtonText: "Submit",
    });

    if (!userInput || userInput.trim() !== caseCode.trim()) {
        Swal.fire("Error", "Case Code does not match.", "error");
        return;
    }

    try {
        // Add referral to Firestore
        const docRef = await addDoc(collection(db, "referrals"), {
            referralTo,
            caseCode,
            clientColorCode,
            clientContactInfo,
            notes,
            consentFormUrl,
            dateOfReferral: serverTimestamp(),
            referralCode: generateReferralCode(),
            status: "Waiting...",
            createdBy: currentUserName,
            createdByOrg: currentUserOrg,
            createdByEmail: currentUserEmail,
        });

        // ✉️ Send email to focal person(s)
        try {
            const emailRes = await fetch("/api/sendReferralEmails", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    referralToOrg: referralTo,
                    referralData: {
                        caseCode,
                        clientColorCode,
                        clientContactInfo,
                        notes,
                        consentFormUrl,
                        createdBy: currentUserName,
                        createdByOrg: currentUserOrg,
                        createdByEmail: currentUserEmail,
                    }
                })
            });

            const emailResult = await emailRes.json();
            if (!emailRes.ok) console.error("Email API error:", emailResult);

        } catch (emailErr) {
            console.error("Failed to send referral email:", emailErr);
        }

        Swal.fire(
            "Success!",
            `Case has been successfully transferred to ${referralTo}!`,
            "success"
        );

        // Clear form
        setReferralTo("");
        setCaseCode("");
        setClientColorCode("Yellow");
        setClientContactInfo("");
        setNotes("");
        setConsentFormUrl("");

    } catch (error) {
        console.error("Error adding referral:", error);
        Swal.fire("Error", "Failed to create referral.", "error");
    }
};


    const generateReferralCode = () => {
        const prefix = "REF";
        const timestamp = Date.now();
        return `${prefix}-${timestamp}`;
    };

    return (
        <div className="max-w-xl mx-auto p-4">
            <h2 className="text-2xl font-bold mb-4">Create Referral</h2>

            {loadingUser ? (
                <div>Loading user/orgs...</div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block font-bold">Referral To</label>
                        <span className="text-red-500 font-bold">Make sure you do not refer to your org</span>
                        <select
                            value={referralTo}
                            onChange={(e) => setReferralTo(e.target.value)}
                            className="border px-2 py-1 w-full"
                            required
                        >
                            <option value="">-- Select Organization --</option>
                            {organizations
                                // to avoid referring to the current user's organization
                                .filter((org) => org !== currentUserOrg)
                                .map((org) => (
                                    <option key={org} value={org}>
                                        {org}
                                    </option>
                                ))}
                        </select>
                    </div>

                    <div>
                        <label className="block font-bold">Case Code</label>
                        <input
                            type="text"
                            value={caseCode}
                            onChange={(e) => setCaseCode(e.target.value)}
                            className="border px-2 py-1 w-full"
                            required
                        />
                    </div>

                    <div>
                        <label className="block font-bold">Client Referral Color Code</label>
                        <select
                            value={clientColorCode}
                            onChange={(e) => setClientColorCode(e.target.value)}
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
                            type="text"
                            value={clientContactInfo}
                            onChange={(e) => setClientContactInfo(e.target.value)}
                            className="border px-2 py-1 w-full"
                            required
                        />
                    </div>

                    <div>
                        <label className="block font-bold">Notes</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="border px-2 py-1 w-full"
                            required
                        />
                    </div>

                    <div>
                        <label className="block font-bold">Consent Form URL</label>
                        <input
                            type="url"
                            value={consentFormUrl}
                            onChange={(e) => setConsentFormUrl(e.target.value)}
                            className="border px-2 py-1 w-full"
                        />
                    </div>

                    <button
                        type="submit"
                        className={`px-4 py-2 rounded text-white ${loadingUser ? "bg-gray-400" : "bg-blue-600"}`}
                        disabled={loadingUser}
                    >
                        {loadingUser ? "Loading User..." : "Submit Referral"}
                    </button>
                </form>
            )}
        </div>
    );
};

export default ReferralForm;
