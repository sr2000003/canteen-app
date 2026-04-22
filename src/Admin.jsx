import { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import { signOut } from "firebase/auth";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  query,
  orderBy,
  getDoc,
} from "firebase/firestore";

export default function Admin() {
  const [orders, setOrders] = useState([]);
  const [isLive, setIsLive] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Check if current user is an admin
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setIsAuthorized(false);
        setLoading(false);
        return;
      }
      const adminRef = doc(db, "admins", user.phoneNumber);
      const adminSnap = await getDoc(adminRef);
      setIsAuthorized(adminSnap.exists());
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Real-time orders listener
  useEffect(() => {
    if (!isAuthorized) return;
    const q = query(collection(db, "orders"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setOrders(data);
    });
    return () => unsubscribe();
  }, [isAuthorized]);

  // Fetch meal window config
  useEffect(() => {
    if (!isAuthorized) return;
    const unsubscribe = onSnapshot(doc(db, "config", "mealWindow"), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setIsLive(data.isLive);
        setStartTime(data.startTime);
        setEndTime(data.endTime);
      }
    });
    return () => unsubscribe();
  }, [isAuthorized]);

  const toggleWindow = async () => {
    await updateDoc(doc(db, "config", "mealWindow"), {
      isLive: !isLive,
    });
  };

  const updateTime = async () => {
    await updateDoc(doc(db, "config", "mealWindow"), {
      startTime,
      endTime,
    });
    alert("Time window updated!");
  };

  const today = new Date().toLocaleDateString("en-IN");
  const todayOrders = orders.filter((o) => o.date === today);
  const totalAmount = todayOrders.reduce((sum, o) => sum + o.price, 0);
  const totalBreakfast = todayOrders.filter((o) => o.foodType === "Breakfast").length;
  const totalLunch = todayOrders.filter((o) => o.foodType === "Lunch").length;

  if (loading) return <p style={{ padding: "2rem" }}>Checking access...</p>;

  // Block unauthorized users
  if (!isAuthorized) {
    return (
      <div style={{ padding: "2rem", maxWidth: "400px", margin: "auto", textAlign: "center" }}>
        <h2>🔒 Access Denied</h2>
        <p style={{ color: "red" }}>You are not authorized to view this page.</p>
        <p style={{ color: "gray" }}>Contact IT/HR if you think this is a mistake.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "auto", marginTop: "4vh", marginBottom: "4vh", background: "rgba(255,255,255,0.92)", borderRadius: "16px", boxShadow: "0 8px 32px rgba(0,0,0,0.25)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ margin: 0 }}>⚙️ Admin Panel</h2>
          <p style={{ margin: 0, color: "#888", fontSize: "0.8rem" }}>एडमिन पैनल</p>
        </div>
        <button
          onClick={() => signOut(auth)}
          style={{ padding: "0.5rem 1rem", background: "#f44336", color: "white", border: "none", borderRadius: "8px", cursor: "pointer" }}
        >
          Sign Out / साइन आउट
        </button>
      </div>

      {/* Meal Window Control */}
      <div style={{
        background: isLive ? "#e8f5e9" : "#ffebee",
        padding: "1.5rem",
        borderRadius: "8px",
        marginBottom: "2rem"
      }}>
        <h3 style={{ margin: "0 0 0.25rem 0" }}>🕐 Meal Window Control</h3>
        <p style={{ margin: "0 0 1rem", color: "#888", fontSize: "0.8rem" }}>खाने का समय नियंत्रण</p>

        <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
          <div>
            <label>Start Time</label><br />
            <input
              type="text"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              placeholder="e.g. 8:00 AM"
              style={{ padding: "0.5rem", marginTop: "0.25rem", boxSizing: "border-box", width: "100%", borderRadius: "6px", border: "1px solid #ccc" }}
            />
          </div>
          <div>
            <label>End Time</label><br />
            <input
              type="text"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              placeholder="e.g. 11:00 AM"
              style={{ padding: "0.5rem", marginTop: "0.25rem", boxSizing: "border-box", width: "100%", borderRadius: "6px", border: "1px solid #ccc" }}
            />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button
              onClick={updateTime}
              style={{
                padding: "0.5rem 1rem",
                background: "#2196F3",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer"
              }}
            >
              Update Time
            </button>
          </div>
        </div>

        <button
          onClick={toggleWindow}
          style={{
            padding: "0.75rem 2rem",
            background: isLive ? "#f44336" : "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "1rem",
            cursor: "pointer"
          }}
        >
          {isLive ? "🔴 Close Ordering / बंद करें" : "🟢 Open Ordering / शुरू करें"}
        </button>

        <p style={{ margin: "0.5rem 0 0 0", color: "gray" }}>
          Status: {isLive ? "✅ Ordering is OPEN" : "❌ Ordering is CLOSED"}
        </p>
      </div>

      {/* Today's Summary */}
      <div style={{
        display: "flex",
        gap: "1rem",
        marginBottom: "2rem",
        flexWrap: "wrap"
      }}>
        <div style={{ background: "#e3f2fd", padding: "1rem", borderRadius: "8px", flex: 1 }}>
          <h4 style={{ margin: 0 }}>Total Orders / आज के ऑर्डर</h4>
          <p style={{ fontSize: "2rem", margin: "0.5rem 0 0 0" }}>{todayOrders.length}</p>
        </div>
        <div style={{ background: "#fff3e0", padding: "1rem", borderRadius: "8px", flex: 1 }}>
          <h4 style={{ margin: 0 }}>🌅 Breakfast</h4>
          <p style={{ fontSize: "2rem", margin: "0.5rem 0 0 0" }}>{totalBreakfast}</p>
        </div>
        <div style={{ background: "#f3e5f5", padding: "1rem", borderRadius: "8px", flex: 1 }}>
          <h4 style={{ margin: 0 }}>🍛 Lunch</h4>
          <p style={{ fontSize: "2rem", margin: "0.5rem 0 0 0" }}>{totalLunch}</p>
        </div>
        <div style={{ background: "#e8f5e9", padding: "1rem", borderRadius: "8px", flex: 1 }}>
          <h4 style={{ margin: 0 }}>💰 Total Amount</h4>
          <p style={{ fontSize: "2rem", margin: "0.5rem 0 0 0" }}>₹{totalAmount}</p>
        </div>
      </div>

      {/* Orders Table */}
      <h3>📋 Today's Orders / आज के ऑर्डर</h3>
      {todayOrders.length === 0 ? (
        <p style={{ color: "gray" }}>No orders yet today.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "500px" }}>
          <thead>
            <tr style={{ background: "#f5f5f5" }}>
              <th style={{ padding: "0.75rem", textAlign: "left", border: "1px solid #ddd" }}>Name</th>
              <th style={{ padding: "0.75rem", textAlign: "left", border: "1px solid #ddd" }}>Emp ID</th>
              <th style={{ padding: "0.75rem", textAlign: "left", border: "1px solid #ddd" }}>Meal</th>
              <th style={{ padding: "0.75rem", textAlign: "left", border: "1px solid #ddd" }}>Amount</th>
              <th style={{ padding: "0.75rem", textAlign: "left", border: "1px solid #ddd" }}>Time</th>
            </tr>
          </thead>
          <tbody>
            {todayOrders.map((order) => (
              <tr key={order.id}>
                <td style={{ padding: "0.75rem", border: "1px solid #ddd" }}>{order.name}</td>
                <td style={{ padding: "0.75rem", border: "1px solid #ddd" }}>{order.employeeId}</td>
                <td style={{ padding: "0.75rem", border: "1px solid #ddd" }}>{order.foodType}</td>
                <td style={{ padding: "0.75rem", border: "1px solid #ddd" }}>₹{order.price}</td>
                <td style={{ padding: "0.75rem", border: "1px solid #ddd" }}>
                  {new Date(order.timestamp).toLocaleTimeString("en-IN")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
}