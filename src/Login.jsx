import { useState, useEffect, useRef } from "react";
import { auth } from "./firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

export default function Login() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmObj, setConfirmObj] = useState(null);
  const [step, setStep] = useState("phone");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const otpRef = useRef(null);

  const sendOTP = async () => {
    if (phone.length !== 10) return;
    setLoading(true);
    setMessage("");
    try {
      const recaptcha = new RecaptchaVerifier(auth, "recaptcha-container", { size: "invisible" });
      const confirmation = await signInWithPhoneNumber(auth, "+91" + phone, recaptcha);
      setConfirmObj(confirmation);
      setStep("otp");
      setMessage("");
      setTimeout(() => otpRef.current?.focus(), 100);
    } catch (err) {
      setMessage("Error: " + err.message);
    }
    setLoading(false);
  };

  const verifyOTP = async (code) => {
    setLoading(true);
    setMessage("");
    try {
      await confirmObj.confirm(code);
    } catch {
      setMessage("गलत OTP / Wrong OTP. दोबारा कोशिश करें / Try again.");
      setOtp("");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (otp.length === 6 && confirmObj) {
      verifyOTP(otp);
    }
  }, [otp]);

  return (
    <div className="card">
      <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "3rem", animation: "bounce 1.5s infinite" }}>🍱</div>
        <h2 style={{ margin: "0.5rem 0 0.25rem" }}>Canteen App</h2>
        <p style={{ margin: 0, color: "#888", fontSize: "0.85rem" }}>कैंटीन ऐप में आपका स्वागत है</p>
      </div>

      {step === "phone" && (
        <>
          <p className="bilingual-label">
            Enter your mobile number
            <span>अपना मोबाइल नंबर दर्ज करें</span>
          </p>
          <input
            className="input-field"
            type="tel"
            placeholder="10-digit number / 10 अंकों का नंबर"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
            maxLength={10}
            autoFocus
          />
          <button
            className="btn-primary"
            onClick={sendOTP}
            disabled={phone.length !== 10 || loading}
          >
            {loading ? "Sending... / भेज रहे हैं..." : "Send OTP / OTP भेजें"}
          </button>
        </>
      )}

      {step === "otp" && (
        <>
          <p className="bilingual-label">
            OTP sent to +91 {phone}
            <span>+91 {phone} पर OTP भेजा गया</span>
          </p>
          <input
            ref={otpRef}
            className="input-field"
            type="number"
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value.slice(0, 6))}
            maxLength={6}
            autoFocus
          />
          {loading && (
            <p style={{ textAlign: "center", color: "#2196F3", animation: "pulse 1s infinite" }}>
              Verifying... / जाँच हो रही है...
            </p>
          )}
          <button
            style={{ background: "none", border: "none", color: "#2196F3", cursor: "pointer", fontSize: "0.9rem", marginTop: "0.5rem" }}
            onClick={() => { setStep("phone"); setOtp(""); setMessage(""); }}
          >
            ← Change number / नंबर बदलें
          </button>
        </>
      )}

      <div id="recaptcha-container"></div>
      {message && <p style={{ color: "red", marginTop: "1rem", textAlign: "center" }}>{message}</p>}
    </div>
  );
}
