import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("http://localhost:8000/api/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username,
          password: password,
        }),
      });

      const data = await response.json();
      console.log("Login response:", data);

      if (!response.ok) {
        // ❌ invalid username or password
        setError(data.error || "Invalid username or password");
        return;
      }

      // ✅ login success
      navigate("/dashboard");

    } catch (error) {
      console.error("Login error:", error);
      setError("Network error. Please try again.");
    }
  };

  // Animate gradient background
  useEffect(() => {
    let angle = 0;
    const interval = setInterval(() => {
      angle += 1;
      document.documentElement.style.setProperty("--bg-angle", `${angle}deg`);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="login-page">
      <div className="floating-particles">
        {[...Array(40)].map((_, i) => (
          <span key={i} className="particle"></span>
        ))}
      </div>

      <div className="login-card">
        <h1 className="login-title">Bagh-Chal</h1>
        <p className="login-subtitle">Enter your credentials to play</p>

        <form className="login-form" onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <p style={{ color: "#ffb3b3" }}>{error}</p>}

          <button type="submit">Login</button>
        </form>

        <p className="login-footer">
          Don’t have an account?{" "}
          <span
            className="signup-link"
            onClick={() => navigate("/register")}
          >
            Register
          </span>
        </p>
      </div>

      <style>{`
        html, body, #root {
          height: 100%;
          margin: 0;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .login-page {
          position: relative;
          width: 100%;
          height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          background: linear-gradient(var(--bg-angle, 45deg), #1f1c2c, #928dab);
          overflow: hidden;
        }

        .floating-particles .particle {
          position: absolute;
          width: 6px;
          height: 6px;
          background: rgba(255, 255, 255, 0.4);
          border-radius: 50%;
          box-shadow: 0 0 8px rgba(255,255,255,0.5);
          animation: float 8s linear infinite;
        }

        .floating-particles .particle:nth-child(odd) {
          width: 4px;
          height: 4px;
          animation-duration: 6s;
        }

        @keyframes float {
          0% { transform: translateY(0); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(-800px); opacity: 0; }
        }

        .login-card {
          background: rgba(255, 255, 255, 0.25);
          backdrop-filter: blur(20px);
          border-radius: 25px;
          padding: 50px 40px;
          max-width: 420px;
          width: 90%;
          text-align: center;
          box-shadow: 0 20px 50px rgba(0,0,0,0.2);
          animation: cardFadeIn 0.8s forwards;
        }

        @keyframes cardFadeIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        .login-title {
          font-size: 3rem;
          color: #fff;
          text-shadow: 0 0 15px #00f2fe, 0 0 25px #4facfe;
        }

        .login-subtitle {
          color: #f0f0f0;
          margin-bottom: 30px;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .login-form input {
          padding: 14px 18px;
          border-radius: 15px;
          border: none;
          outline: none;
          background: rgba(255, 255, 255, 0.6);
        }

        .login-form input:focus {
          box-shadow: 0 0 15px rgba(0, 200, 255, 0.6);
        }

        .login-form button {
          padding: 14px;
          border-radius: 15px;
          border: none;
          background: linear-gradient(135deg, #4facfe, #00f2fe);
          color: #fff;
          font-weight: bold;
          cursor: pointer;
        }

        .login-footer {
          margin-top: 20px;
          color: #fff;
        }

        .signup-link {
          color: #00f2fe;
          font-weight: bold;
          cursor: pointer;
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
};

export default Login;
