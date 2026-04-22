import { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import Login from "./Login";
import Onboard from "./Onboard";
import Order from "./Order";
import Admin from "./Admin";

function App() {
  const [user, setUser] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const q = query(
          collection(db, "employees"),
          where("uid", "==", firebaseUser.uid)
        );
        const snap = await getDocs(q);
        setIsRegistered(!snap.empty);
      } else {
        setUser(null);
        setIsRegistered(false);
      }
      setLoading(false);
    });
  }, []);

  if (loading) return <p style={{ padding: "2rem" }}>Loading...</p>;
  if (!user) return <Login />;
  if (!isRegistered) return <Onboard onComplete={() => setIsRegistered(true)} />;
  if (window.location.pathname === "/admin") return <Admin />;
return <Order />;
}

export default App;