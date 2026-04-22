import { useState } from "react";
import { auth, db } from "./firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

export default function Onboard({ onComplete }) {
  const [empId, setEmpId] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const saveProfile = async () => {
    if (!empId || !name) {
      setMessage("सभी फ़ील्ड भरें / Please fill all fields.");
      return;
    }
    setLoading(true);
    try {
      const user = auth.currentUser;
      const empRef = doc(db, "employees", empId);
      const empSnap = await getDoc(empRef);
      if (empSnap.exists()) {
        setMessage("यह Employee ID पहले से रजिस्टर है। HR से संपर्क करें / This Employee ID is already registered. Contact HR.");
        setLoading(false);
        return;
      }
      await setDoc(doc(db, "employees", empId), {
        uid: user.uid,
        phone: user.phoneNumber,
        employeeId: empId,
        name: name,
        role: "employee",
        createdAt: new Date().toISOString(),
      });
      onComplete();
    } catch (err) {
      setMessage("Error: " + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="card">
      <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "2.5rem" }}>👤</div>
        <h2 style={{ margin: "0.5rem 0 0.25rem" }}>Set Up Your Profile</h2>
        <p style={{ margin: 0, color: "#888", fontSize: "0.85rem" }}>अपनी प्रोफ़ाइल बनाएं — एक बार ही करना है</p>
      </div>

      <p className="bilingual-label">
        Your Full Name
        <span>आपका पूरा नाम</span>
      </p>
      <input
        className="input-field"
        style={{ letterSpacing: "0" }}
        type="text"
        placeholder="Full Name / पूरा नाम"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
      />

      <p className="bilingual-label">
        Employee ID
        <span>कर्मचारी आईडी (बाद में नहीं बदल सकते)</span>
      </p>
      <input
        className="input-field"
        style={{ letterSpacing: "0" }}
        type="text"
        placeholder="e.g. EMP001"
        value={empId}
        onChange={(e) => setEmpId(e.target.value.toUpperCase())}
      />

      <button className="btn-primary" onClick={saveProfile} disabled={loading}>
        {loading ? "Saving... / सहेज रहे हैं..." : "Save & Continue / सहेजें और जारी रखें"}
      </button>

      {message && <p style={{ color: "red", marginTop: "1rem", textAlign: "center", fontSize: "0.9rem" }}>{message}</p>}
    </div>
  );
}
