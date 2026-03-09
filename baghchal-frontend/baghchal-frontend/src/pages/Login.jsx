import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { API_URL } from "../config";

import { auth, googleProvider } from "../firebase";
import { signInWithPopup } from "firebase/auth";



const Login = () => {
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [focusedField, setFocusedField] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 50);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animationId;
    let frameCount = 0;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const drawBackground = () => {
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;

      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      // dark base
      ctx.fillStyle = "#0d0b14";
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // faint grid lines inspired by the baghchal board
      ctx.strokeStyle = "rgba(180, 130, 40, 0.07)";
      ctx.lineWidth = 1;
      const gridSpacing = 60;

      for (let x = 0; x < canvasWidth; x += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvasHeight);
        ctx.stroke();
      }
      for (let y = 0; y < canvasHeight; y += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvasWidth, y);
        ctx.stroke();
      }

      // diagonal lines like the board diagonals
      ctx.strokeStyle = "rgba(200, 150, 50, 0.04)";
      for (let startX = -canvasHeight; startX < canvasWidth + canvasHeight; startX += gridSpacing * 2) {
        ctx.beginPath();
        ctx.moveTo(startX, 0);
        ctx.lineTo(startX + canvasHeight, canvasHeight);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(startX, 0);
        ctx.lineTo(startX - canvasHeight, canvasHeight);
        ctx.stroke();
      }

      // three soft glowing blobs that pulse slowly
      const pulseAmount = Math.sin(frameCount * 0.01) * 20;

      const leftBlob = ctx.createRadialGradient(
        canvasWidth * 0.15, canvasHeight * 0.2, 0,
        canvasWidth * 0.15, canvasHeight * 0.2, 180 + pulseAmount
      );
      leftBlob.addColorStop(0, "rgba(180, 100, 20, 0.06)");
      leftBlob.addColorStop(1, "transparent");
      ctx.fillStyle = leftBlob;
      ctx.beginPath();
      ctx.arc(canvasWidth * 0.15, canvasHeight * 0.2, 180 + pulseAmount, 0, Math.PI * 2);
      ctx.fill();

      const rightBlob = ctx.createRadialGradient(
        canvasWidth * 0.85, canvasHeight * 0.7, 0,
        canvasWidth * 0.85, canvasHeight * 0.7, 220 + pulseAmount
      );
      rightBlob.addColorStop(0, "rgba(120, 60, 160, 0.06)");
      rightBlob.addColorStop(1, "transparent");
      ctx.fillStyle = rightBlob;
      ctx.beginPath();
      ctx.arc(canvasWidth * 0.85, canvasHeight * 0.7, 220 + pulseAmount, 0, Math.PI * 2);
      ctx.fill();

      const bottomBlob = ctx.createRadialGradient(
        canvasWidth * 0.5, canvasHeight * 0.9, 0,
        canvasWidth * 0.5, canvasHeight * 0.9, 150 + pulseAmount
      );
      bottomBlob.addColorStop(0, "rgba(200, 140, 30, 0.05)");
      bottomBlob.addColorStop(1, "transparent");
      ctx.fillStyle = bottomBlob;
      ctx.beginPath();
      ctx.arc(canvasWidth * 0.5, canvasHeight * 0.9, 150 + pulseAmount, 0, Math.PI * 2);
      ctx.fill();

      frameCount++;
      animationId = requestAnimationFrame(drawBackground);
    };

    drawBackground();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/auth/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Invalid email or password");
        return;
      }

      // store all three — tokens for API calls, user for display
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);
      localStorage.setItem("user", JSON.stringify(data.user));

      navigate("/dashboard");

    } catch (error) {
      setError("Network error. Please try again.");
    }
  };

  const handleGoogleLogin = async () => {
    try {
      // Step 1 — Open Google popup via Firebase
      // This handles the entire Google OAuth flow
      const result = await signInWithPopup(auth, googleProvider);

      // Step 2 — Get the Firebase ID token
      // This token proves the user authenticated with Google
      const firebaseToken = await result.user.getIdToken();

      // Step 3 — Send token to Django
      // Django verifies it and returns our normal JWT
      const res = await fetch(`${API_URL}/api/auth/firebase/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firebase_token: firebaseToken }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Google login failed.");
        return;
      }

      // Step 4 — Store tokens exactly like normal login
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Step 5 — Navigate to dashboard
      navigate("/dashboard");

    } catch (err) {
      console.error("Google login error:", err);
      setError("Google login failed. Try again.");
    }
  };


  const inputStyle = (fieldName) => ({
    width: "100%",
    padding: "13px 14px",
    background: focusedField === fieldName ? "rgba(200, 150, 50, 0.08)" : "rgba(255, 255, 255, 0.04)",
    border: `1px solid ${focusedField === fieldName ? "rgba(200, 150, 50, 0.5)" : "rgba(255, 255, 255, 0.08)"}`,
    borderRadius: 12,
    color: "#f0e6c8",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    boxShadow: focusedField === fieldName ? "0 0 0 3px rgba(200, 150, 50, 0.1)" : "none",
    transition: "all 0.2s ease",
    fontFamily: "inherit",
  });

  return (
    <div style={{ background: "#0d0b14", minHeight: "100vh" }}>
      <Navbar />
      <div style={{
        position: "relative",
        width: "100%",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
        fontFamily: "'Georgia', 'Times New Roman', serif",
      }}>
        <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, zIndex: 0 }} />

        <div style={{
          position: "relative",
          zIndex: 1,
          background: "rgba(20, 15, 30, 0.85)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(200, 150, 50, 0.2)",
          borderRadius: 24,
          padding: "48px 44px",
          width: "100%",
          maxWidth: 440,
          boxShadow: "0 30px 80px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 200, 80, 0.08)",
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? "translateY(0)" : "translateY(24px)",
          transition: "opacity 0.6s ease, transform 0.6s ease",
        }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🐯</div>
            <h1 style={{
              margin: 0,
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: 1,
              background: "linear-gradient(135deg, #f0c060, #c9922a)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              Bagh-Chal
            </h1>
            <p style={{ margin: "8px 0 0", color: "rgba(200, 180, 140, 0.6)", fontSize: 13, letterSpacing: 0.5 }}>
              Enter your credentials to play
            </p>
          </div>

          {/* Google login */}
          <button
            onClick={handleGoogleLogin}
            style={{
              width: "100%",
              padding: "13px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(200,150,50,0.2)",
              borderRadius: 12,
              color: "rgba(200,180,140,0.8)",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              transition: "background 0.2s ease",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.09)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
          >
            <img
              src="https://www.google.com/favicon.ico"
              width={18} height={18}
              alt="Google"
              style={{ borderRadius: 2 }}
            />
            Continue with Google
          </button>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <div style={{ flex: 1, height: 1, background: "rgba(200, 150, 50, 0.15)" }} />
            <span style={{ color: "rgba(180, 150, 100, 0.5)", fontSize: 11, letterSpacing: 1, textTransform: "uppercase" }}>or sign in manually</span>
            <div style={{ flex: 1, height: 1, background: "rgba(200, 150, 50, 0.15)" }} />
          </div>

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocusedField("email")}
              onBlur={() => setFocusedField(null)}
              required
              style={inputStyle("email")}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocusedField("password")}
              onBlur={() => setFocusedField(null)}
              required
              style={inputStyle("password")}
            />

            {error && (
              <p style={{ margin: 0, color: "#e07070", fontSize: 13 }}>{error}</p>
            )}

            <button
              type="submit"
              style={{
                marginTop: 6,
                padding: "14px",
                background: "linear-gradient(135deg, #c9922a, #f0c060)",
                border: "none",
                borderRadius: 12,
                color: "#1a1205",
                fontWeight: 700,
                fontSize: 15,
                cursor: "pointer",
                letterSpacing: 0.5,
                boxShadow: "0 4px 20px rgba(200, 150, 50, 0.3)",
                fontFamily: "inherit",
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-1px)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
            >
              Login
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: 24, marginBottom: 0, color: "rgba(180, 150, 100, 0.5)", fontSize: 13 }}>
            Don't have an account?{" "}
            <span
              onClick={() => navigate("/register")}
              style={{ color: "#f0c060", cursor: "pointer", fontWeight: 600 }}
            >
              Register
            </span>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Login;