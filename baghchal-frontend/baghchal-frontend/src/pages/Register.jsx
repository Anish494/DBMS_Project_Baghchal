import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CustomAlert from "../Components/CustomAlert";

const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [alertMessage, setAlertMessage] = useState("");
  const [showAlert, setShowAlert] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setAlertMessage("Passwords do not match!");
      setShowAlert(true);
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/api/users/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          role: "player",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setAlertMessage("✅ Registered successfully! Please login.");
        setShowAlert(true);
      } else {
        // Display all validation errors from DRF
        const errors = Object.values(data)
          .flat()
          .join(" ");
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
      navigate("/"); // redirect to login page
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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
    <div className="register-page">
      <div className="floating-particles">
        {[...Array(40)].map((_, i) => (
          <span key={i} className="particle"></span>
        ))}
      </div>

      <div className="register-card">
        <h1 className="register-title">Create Account</h1>
        <p className="register-subtitle">Join Bagh-Chal and start playing!</p>

        <form className="register-form" onSubmit={handleRegister}>
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
          <button type="submit">Register</button>
        </form>

        <p className="register-footer">
          Already have an account?{" "}
          <span className="login-link" onClick={() => navigate("/")}>
            Login
          </span>
        </p>
      </div>

      {showAlert && (
        <CustomAlert message={alertMessage} onClose={handleAlertClose} />
      )}

      <style>{`
        html,
        body,
        #root {
          height: 100%;
          margin: 0;
          font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
        }

        .register-page {
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
          box-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
          animation: float 8s linear infinite;
        }

        .floating-particles .particle:nth-child(odd) {
          width: 4px;
          height: 4px;
          animation-duration: 6s;
        }

        @keyframes float {
          0% {
            transform: translateY(0);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateY(-800px);
            opacity: 0;
          }
        }

        .register-card {
          background: rgba(255, 255, 255, 0.25);
          backdrop-filter: blur(20px);
          border-radius: 25px;
          padding: 50px 40px;
          max-width: 420px;
          width: 90%;
          text-align: center;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
          animation: fadeIn 0.8s forwards;
        }

        @keyframes fadeIn {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        .register-title {
          font-size: 3rem;
          color: #fff;
          text-shadow: 0 0 15px #00f2fe, 0 0 25px #4facfe;
        }

        .register-subtitle {
          color: #f0f0f0;
          margin-bottom: 30px;
        }

        .register-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .register-form input {
          padding: 14px 18px;
          border-radius: 15px;
          border: none;
          outline: none;
          background: rgba(255, 255, 255, 0.7);
        }

        .register-form input:focus {
          box-shadow: 0 0 15px rgba(0, 200, 255, 0.6);
        }

        .register-form button {
          padding: 14px;
          border-radius: 15px;
          border: none;
          background: linear-gradient(135deg, #4facfe, #00f2fe);
          color: #fff;
          font-weight: bold;
          cursor: pointer;
        }

        .register-footer {
          margin-top: 20px;
          color: #fff;
        }

        .login-link {
          color: #00f2fe;
          font-weight: bold;
          cursor: pointer;
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
};

export default Register;
