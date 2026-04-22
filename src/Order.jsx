import { useState, useEffect, useRef } from "react";
import { auth, db } from "./firebase";
import { signOut } from "firebase/auth";
import { collection, query, where, getDocs, addDoc, doc, getDoc } from "firebase/firestore";
import confetti from "canvas-confetti";

export default function Order() {
  const [employee, setEmployee] = useState(null);
  const [foodType, setFoodType] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [orderState, setOrderState] = useState("idle"); // idle | confetti | preparing
  const [placedOrder, setPlacedOrder] = useState(null);
  const [prepStep, setPrepStep] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const user = auth.currentUser;
        const q = query(collection(db, "employees"), where("uid", "==", user.uid));
        const snap = await getDocs(q);
        if (!snap.empty) setEmployee(snap.docs[0].data());
        else setMessage("Employee profile not found. Contact HR.");
      } catch (err) {
        setMessage("Error loading profile: " + err.message);
      }
      setLoading(false);
    };
    fetchEmployee();
  }, []);

  const launchConfetti = () => {
    const end = Date.now() + 2800;
    const colors = ["#ff6b6b", "#ffd93d", "#6bcb77", "#4d96ff", "#ff922b"];
    const frame = () => {
      confetti({ particleCount: 6, angle: 60, spread: 65, origin: { x: 0 }, colors });
      confetti({ particleCount: 6, angle: 120, spread: 65, origin: { x: 1 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  };

  const getPrice = () => {
    if (foodType === "Breakfast") return 17;
    if (foodType === "Lunch") return 35;
    return 0;
  };

  const placeOrder = async () => {
    if (!foodType) {
      setMessage("Breakfast या Lunch चुनें / Please select Breakfast or Lunch.");
      return;
    }
    setPlacing(true);
    setMessage("");
    try {
      const windowSnap = await getDoc(doc(db, "config", "mealWindow"));
      if (!windowSnap.exists()) {
        setMessage("❌ Meal window not configured. Contact HR.");
        setPlacing(false);
        return;
      }
      const { isLive, startTime, endTime } = windowSnap.data();
      if (!isLive) {
        setMessage(`❌ ऑर्डरिंग बंद है / Ordering closed. Window: ${startTime} - ${endTime}`);
        setPlacing(false);
        return;
      }
      const today = new Date().toLocaleDateString("en-IN");
      const dupSnap = await getDocs(query(
        collection(db, "orders"),
        where("uid", "==", auth.currentUser.uid),
        where("date", "==", today),
        where("foodType", "==", foodType)
      ));
      if (!dupSnap.empty) {
        setMessage(`❌ आज का ${foodType} ऑर्डर पहले ही हो चुका है / Already ordered ${foodType} today!`);
        setPlacing(false);
        return;
      }
      await addDoc(collection(db, "orders"), {
        uid: auth.currentUser.uid,
        employeeId: employee.employeeId,
        name: employee.name,
        phone: employee.phone,
        foodType,
        price: getPrice(),
        timestamp: new Date().toISOString(),
        date: today,
      });
      setPlacedOrder({ foodType, price: getPrice(), time: new Date() });
      setOrderState("confetti");
      launchConfetti();
      timerRef.current = setTimeout(() => {
        setOrderState("preparing");
        let step = 0;
        const interval = setInterval(() => {
          step++;
          setPrepStep(step);
          if (step >= 3) clearInterval(interval);
        }, 1000);
      }, 3000);
    } catch (err) {
      setMessage("Error: " + err.message);
    }
    setPlacing(false);
  };

  useEffect(() => () => clearTimeout(timerRef.current), []);

  if (loading) return (
    <div className="card" style={{ textAlign: "center" }}>
      <div style={{ fontSize: "2rem", animation: "spin 1s linear infinite" }}>⏳</div>
      <p>Loading... / लोड हो रहा है...</p>
    </div>
  );

  if (!employee) return <p style={{ padding: "2rem", color: "red" }}>{message}</p>;

  if (orderState === "confetti") return (
    <div className="card" style={{ textAlign: "center" }}>
      <div style={{ fontSize: "4rem", animation: "bounce 0.6s infinite" }}>🎉</div>
      <h2 style={{ color: "#4CAF50", margin: "0.5rem 0" }}>Order Placed!</h2>
      <p style={{ color: "#555", margin: 0 }}>ऑर्डर हो गया!</p>
      <p style={{ color: "#888", fontSize: "0.85rem", marginTop: "0.5rem" }}>
        {placedOrder?.foodType} · ₹{placedOrder?.price}
      </p>
    </div>
  );

  if (orderState === "preparing") return (
    <div className="card" style={{ textAlign: "center" }}>
      <div style={{ fontSize: "3.5rem", animation: "bounce 1s infinite", marginBottom: "0.5rem" }}>
        {placedOrder?.foodType === "Breakfast" ? "🍳" : "🍛"}
      </div>
      <h2 style={{ margin: "0 0 0.25rem" }}>Your order is being prepared!</h2>
      <p style={{ margin: "0 0 1.5rem", color: "#888" }}>आपका ऑर्डर तैयार हो रहा है!</p>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem", textAlign: "left" }}>
        {[
          { en: "Order Received", hi: "ऑर्डर मिल गया", icon: "✅" },
          { en: "Being Prepared", hi: "तैयार हो रहा है", icon: "👨‍🍳" },
          { en: "Ready Soon", hi: "जल्द तैयार होगा", icon: "🍽️" },
        ].map((s, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: "0.75rem",
            padding: "0.75rem 1rem", borderRadius: "10px",
            background: prepStep > i ? "#e8f5e9" : "#f5f5f5",
            opacity: prepStep >= i ? 1 : 0.35,
            transition: "all 0.5s ease",
            animation: prepStep === i + 1 ? "pulse 0.6s ease" : "none"
          }}>
            <span style={{ fontSize: "1.4rem" }}>{s.icon}</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>{s.en}</div>
              <div style={{ color: "#888", fontSize: "0.8rem" }}>{s.hi}</div>
            </div>
            {prepStep > i && <span style={{ marginLeft: "auto", color: "#4CAF50", fontWeight: 700 }}>✓</span>}
          </div>
        ))}
      </div>

      <div style={{ background: "#f9f9f9", borderRadius: "10px", padding: "1rem", textAlign: "left", fontSize: "0.9rem" }}>
        <p style={{ margin: "0 0 0.35rem" }}><b>Name / नाम:</b> {employee.name}</p>
        <p style={{ margin: "0 0 0.35rem" }}><b>ID:</b> {employee.employeeId}</p>
        <p style={{ margin: "0 0 0.35rem" }}><b>Meal / खाना:</b> {placedOrder?.foodType === "Breakfast" ? "Breakfast / नाश्ता" : "Lunch / दोपहर का खाना"}</p>
        <p style={{ margin: 0 }}><b>Amount / राशि:</b> ₹{placedOrder?.price}</p>
      </div>
    </div>
  );

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <div>
          <h2 style={{ margin: 0 }}>Place Your Order</h2>
          <p style={{ margin: 0, color: "#888", fontSize: "0.8rem" }}>अपना ऑर्डर दें</p>
        </div>
        <button
          onClick={() => signOut(auth)}
          style={{ padding: "0.4rem 0.85rem", background: "#f44336", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "0.85rem" }}
        >
          Sign Out
        </button>
      </div>

      <div style={{ background: "#f0f4ff", padding: "0.85rem 1rem", borderRadius: "10px", marginBottom: "1.5rem" }}>
        <p style={{ margin: 0, fontWeight: 600 }}>👤 {employee.name}</p>
        <p style={{ margin: 0, color: "#666", fontSize: "0.85rem" }}>ID: {employee.employeeId}</p>
      </div>

      <p style={{ margin: "0 0 0.75rem", fontWeight: 500 }}>
        Select your meal / अपना खाना चुनें:
      </p>

      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
        {[
          { type: "Breakfast", hi: "नाश्ता", emoji: "🌅", price: 17 },
          { type: "Lunch", hi: "दोपहर का खाना", emoji: "🍛", price: 35 },
        ].map(({ type, hi, emoji, price }) => (
          <button
            key={type}
            onClick={() => setFoodType(type)}
            style={{
              padding: "1rem",
              flex: 1,
              background: foodType === type ? "linear-gradient(135deg,#4CAF50,#2e7d32)" : "#f5f5f5",
              color: foodType === type ? "white" : "#333",
              border: foodType === type ? "none" : "2px solid #e0e0e0",
              borderRadius: "12px",
              cursor: "pointer",
              fontSize: "1rem",
              fontWeight: 600,
              transition: "all 0.2s",
              transform: foodType === type ? "scale(1.04)" : "scale(1)",
              boxShadow: foodType === type ? "0 4px 12px rgba(76,175,80,0.35)" : "none",
            }}
          >
            <div style={{ fontSize: "1.8rem" }}>{emoji}</div>
            <div>{type}</div>
            <div style={{ fontSize: "0.8rem", opacity: 0.85 }}>{hi}</div>
            <div style={{ fontWeight: 700 }}>₹{price}</div>
          </button>
        ))}
      </div>

      <button
        className="btn-primary"
        onClick={placeOrder}
        disabled={placing || !foodType}
      >
        {placing ? "Placing... / ऑर्डर हो रहा है..." : "Place Order / ऑर्डर करें"}
      </button>

      {message && <p style={{ color: "red", marginTop: "1rem", textAlign: "center", fontSize: "0.9rem" }}>{message}</p>}
    </div>
  );
}
