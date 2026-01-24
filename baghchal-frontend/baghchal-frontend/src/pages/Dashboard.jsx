import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        navigate("/");
    };

    const startSinglePlayer = () => {
        // Navigate to GameBoard page
        navigate("/gameboard");
    };

    const startProfile = () => {
        // Navigate to profile page
        navigate("/profile");
    };

    const openRules = () => {
        // Navigate to Rules page
        navigate("/rules");
    };

    // Animated gradient background
    useEffect(() => {
        let angle = 0;
        const interval = setInterval(() => {
            angle += 1;
            document.documentElement.style.setProperty("--bg-angle", `${angle}deg`);
        }, 50);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="dashboard-page">
            {/* Floating particles */}
            <div className="floating-particles">
                {[...Array(40)].map((_, i) => (
                    <span key={i} className="particle"></span>
                ))}
            </div>

            {/* Glass Card */}
            <div className="dashboard-card">
                <h1 className="dashboard-title">Welcome to Bagh-Chal 🐯🐐</h1>
                <p className="dashboard-subtitle">
                    Choose a mode and start your game
                </p>

                <div className="dashboard-buttons">
                    <button className="primary" onClick={startSinglePlayer}>
                        🎮 AI Mode
                    </button>

                    <button className="secondary" onClick={startProfile}>
                        🌐 Profile
                    </button>

                    <button className="outline" onClick={openRules}>
                        📜 Game Rules
                    </button>
                </div>

                <button className="logout-btn" onClick={handleLogout}>
                    🚪 Logout
                </button>
            </div>

            <style jsx>{`
        html,
        body,
        #root {
          height: 100%;
          margin: 0;
          font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
        }

        /* Background */
        .dashboard-page {
          position: relative;
          width: 100%;
          height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          background: linear-gradient(var(--bg-angle, 45deg), #1f1c2c, #928dab);
          overflow: hidden;
        }

        /* Floating particles */
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
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(-800px) translateX(60px); opacity: 0; }
        }

        /* Glass Card */
        .dashboard-card {
          background: rgba(255, 255, 255, 0.25);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 25px;
          padding: 50px 45px;
          text-align: center;
          width: 90%;
          max-width: 500px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25),
                      inset 0 0 0 1px rgba(255, 255, 255, 0.35);
          transform: scale(0.9);
          opacity: 0;
          animation: cardFadeIn 0.8s forwards;
        }
        @keyframes cardFadeIn {
          to { transform: scale(1); opacity: 1; }
        }

        .dashboard-title {
          font-size: 3rem;
          color: #fff;
          text-shadow: 0 0 15px #00f2fe, 0 0 25px #4facfe;
          margin-bottom: 10px;
        }

        .dashboard-subtitle {
          color: #f0f0f0;
          margin-bottom: 35px;
          font-weight: 500;
        }

        .dashboard-buttons {
          display: flex;
          flex-direction: column;
          gap: 18px;
          margin-bottom: 30px;
        }

        .dashboard-buttons button {
          padding: 14px;
          font-size: 1rem;
          border-radius: 15px;
          border: none;
          cursor: pointer;
          font-weight: bold;
          transition: all 0.3s;
        }

        .primary {
          background: linear-gradient(135deg, #4facfe, #00f2fe);
          color: #fff;
        }

        .secondary {
          background: linear-gradient(135deg, #7c57ee, #2313b1);
          color: #fff;
        }

        .outline {
          background: rgba(255, 255, 255, 0.35);
          border: 2px solid rgba(255, 255, 255, 0.6);
          color: #0d47a1;
        }

        .dashboard-buttons button:hover {
          transform: scale(1.06);
          box-shadow: 0 10px 25px rgba(0, 127, 255, 0.35);
        }

        .logout-btn {
          padding: 12px 28px;
          border-radius: 15px;
          border: none;
          background: linear-gradient(135deg, #ff5f6d, #ffc371);
          color: #fff;
          font-weight: bold;
          cursor: pointer;
          transition: 0.3s;
        }

        .logout-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 10px 25px rgba(255, 95, 109, 0.45);
        }

        @media (max-width: 480px) {
          .dashboard-card {
            padding: 40px 25px;
          }
          .dashboard-title {
            font-size: 2rem;
          }
        }
      `}</style>
        </div>
    );
};

export default Dashboard;
