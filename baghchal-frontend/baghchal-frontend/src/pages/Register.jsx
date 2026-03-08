import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import CustomAlert from "../Components/CustomAlert";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";

const Register = () => {
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [alertMessage, setAlertMessage] = useState("");
  const [showAlert, setShowAlert] = useState(false);
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

  const handleRegister = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setAlertMessage("Passwords do not match!");
      setShowAlert(true);
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/api/auth/register/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          password2: formData.confirmPassword,  // backend expects password2
          role: "player",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // store tokens so user is immediately logged in
        localStorage.setItem("access_token", data.access);
        localStorage.setItem("refresh_token", data.refresh);
        localStorage.setItem("user", JSON.stringify(data.user));

        setAlertMessage("✅ Registered successfully! Welcome!");
        setShowAlert(true);
      } else {
        // Django returns errors as { field: ["error message"] }
        // flatten them all into one string
        const errors = Object.values(data).flat().join(" ");
        setAlertMessage(errors || "Registration failed!");
        setShowAlert(true);
      }
    } catch (error) {
      setAlertMessage("Network error! Please try again.");
      setShowAlert(true);
    }
  };

  const handleAlertClose = () => {
    setShowAlert(false);
    if (alertMessage.includes("successfully")) {
      navigate("/dashboard");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:8000/accounts/google/login/";
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
    <div>
<Navbar/>
      <div style={{ position: "relative", width: "100%", height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", overflow: "hidden", fontFamily: "'Georgia', 'Times New Roman', serif" }}>

        <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, zIndex: 0 }} />

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
            <div style={{ fontSize: 36, marginBottom: 8 }}>🐐</div>
            <h1 style={{
              margin: 0,
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: 1,
              background: "linear-gradient(135deg, #f0c060, #c9922a)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              Join Bagh-Chal
            </h1>
            <p style={{ margin: "8px 0 0", color: "rgba(200, 180, 140, 0.6)", fontSize: 13, letterSpacing: 0.5 }}>
              Ancient game. Modern battle.
            </p>
          </div>

          {/* Google sign in */}
          <button
            onClick={handleGoogleLogin}
            style={{
              width: "100%",
              padding: "13px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: 12,
              cursor: "pointer",
              color: "#e8dcc8",
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: 0.3,
              marginBottom: 24,
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.22)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.12)";
            }}
          >
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 32.6 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z" />
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 19 12 24 12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.6 8.3 6.3 14.7z" />
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.5 26.8 36 24 36c-5.2 0-9.6-3.3-11.3-8H6.3C9.6 35.6 16.3 44 24 44z" />
              <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.4-2.5 4.5-4.6 5.9l6.2 5.2C40.8 35.7 44 30.3 44 24c0-1.3-.1-2.7-.4-4z" />
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <div style={{ flex: 1, height: 1, background: "rgba(200, 150, 50, 0.15)" }} />
            <span style={{ color: "rgba(180, 150, 100, 0.5)", fontSize: 11, letterSpacing: 1, textTransform: "uppercase" }}>or register manually</span>
            <div style={{ flex: 1, height: 1, background: "rgba(200, 150, 50, 0.15)" }} />
          </div>

          <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              onFocus={() => setFocusedField("username")}
              onBlur={() => setFocusedField(null)}
              required
              style={inputStyle("username")}
            />
            <input
              type="email"
              name="email"
              placeholder="Email address"
              value={formData.email}
              onChange={handleChange}
              onFocus={() => setFocusedField("email")}
              onBlur={() => setFocusedField(null)}
              required
              style={inputStyle("email")}
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              onFocus={() => setFocusedField("password")}
              onBlur={() => setFocusedField(null)}
              required
              style={inputStyle("password")}
            />
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm password"
              value={formData.confirmPassword}
              onChange={handleChange}
              onFocus={() => setFocusedField("confirmPassword")}
              onBlur={() => setFocusedField(null)}
              required
              style={inputStyle("confirmPassword")}
            />

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
              Create Account
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: 24, marginBottom: 0, color: "rgba(180, 150, 100, 0.5)", fontSize: 13 }}>
            Already have an account?{" "}
            <span
              onClick={() => navigate("/login")}
              style={{ color: "#f0c060", cursor: "pointer", fontWeight: 600 }}
            >
              Sign in
            </span>
          </p>
        </div>

        {showAlert && (
          <CustomAlert message={alertMessage} onClose={handleAlertClose} />
        )}

      </div>
      <Footer />
    </div>
  );

};

export default Register;