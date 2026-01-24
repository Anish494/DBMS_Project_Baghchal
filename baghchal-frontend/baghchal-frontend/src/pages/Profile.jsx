import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const navigate = useNavigate();

  useEffect(() => {
    let angle = 0;
    const interval = setInterval(() => {
      angle += 1;
      document.documentElement.style.setProperty("--bg-angle", `${angle}deg`);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Temporary static stats (can be replaced with real data later)
  const stats = {
    username: "Player One",
    gamesPlayed: 12,
    tigerWins: 7,
    goatWins: 5,
    goatsCaptured: 28,
  };

  return (
    <div className="profile-page">
      <div className="profile-card">
        <h1 className="profile-title">Player Profile 👤</h1>

        <div className="profile-info">
          <p><strong>Username:</strong> {stats.username}</p>
        </div>

        <div className="stats-grid">
          <div className="stat-box">
            <h3>🎮 Games</h3>
            <p>{stats.gamesPlayed}</p>
          </div>

          <div className="stat-box">
            <h3>🐯 Tiger Wins</h3>
            <p>{stats.tigerWins}</p>
          </div>

          <div className="stat-box">
            <h3>🐐 Goat Wins</h3>
            <p>{stats.goatWins}</p>
          </div>

          <div className="stat-box">
            <h3>☠️ Goats Captured</h3>
            <p>{stats.goatsCaptured}</p>
          </div>
        </div>

        <div className="profile-actions">
          <button onClick={() => navigate("/dashboard")}>⬅ Back to Dashboard</button>
        </div>
      </div>

      <style jsx>{`
        .profile-page {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          background: linear-gradient(
            var(--bg-angle, 45deg),
            #1f1c2c,
            #928dab
          );
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .profile-card {
          background: rgba(255, 255, 255, 0.25);
          backdrop-filter: blur(20px);
          border-radius: 25px;
          padding: 45px;
          width: 90%;
          max-width: 520px;
          text-align: center;
          box-shadow: 
            0 20px 50px rgba(0,0,0,0.25),
            inset 0 0 0 1px rgba(255,255,255,0.35);
          animation: fadeIn 0.6s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }

        .profile-title {
          font-size: 2.2rem;
          margin-bottom: 20px;
          color: #fff;
        }

        .profile-info {
          margin-bottom: 30px;
          font-size: 1.1rem;
          color: #f1f1f1;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 18px;
          margin-bottom: 30px;
        }

        .stat-box {
          background: rgba(255, 255, 255, 0.35);
          border-radius: 15px;
          padding: 18px;
          color: #1f1c2c;
          font-weight: bold;
          box-shadow: 0 8px 20px rgba(0,0,0,0.2);
        }

        .stat-box h3 {
          margin-bottom: 6px;
          font-size: 1rem;
        }

        .stat-box p {
          font-size: 1.6rem;
          margin: 0;
        }

        .profile-actions button {
          padding: 12px 28px;
          font-size: 1rem;
          border-radius: 15px;
          border: none;
          cursor: pointer;
          background: linear-gradient(135deg, #4facfe, #00f2fe);
          color: #fff;
          font-weight: bold;
          transition: 0.3s;
        }

        .profile-actions button:hover {
          transform: scale(1.05);
          box-shadow: 0 10px 25px rgba(0,127,255,0.4);
        }

        @media (max-width: 480px) {
          .profile-card {
            padding: 35px 25px;
          }
          .stats-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default Profile;
