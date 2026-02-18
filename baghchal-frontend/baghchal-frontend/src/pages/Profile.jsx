import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Animated background gradient
  useEffect(() => {
    let angle = 0;
    const interval = setInterval(() => {
      angle += 1;
      document.documentElement.style.setProperty("--bg-angle", `${angle}deg`);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
      navigate("/"); // redirect if not logged in
      return;
    }

    const fetchUserData = async () => {
      try {
        // Fetch user info
        const resUser = await fetch(`http://localhost:8000/api/users/${user.id}/`);
        const dataUser = await resUser.json();
        setUserData(dataUser);

        // Fetch statistics (games played, won, lost, best score)
        const resStats = await fetch(`http://localhost:8000/api/statistics/${user.id}/`);
        const dataStats = await resStats.json();
        setStats(dataStats);

        setLoading(false);
      } catch (err) {
        console.error("Error fetching profile data:", err);
        alert("Error loading profile data. Please try again.");
      }
    };

    fetchUserData();
  }, [navigate]);

  if (loading) {
    return (
      <div style={{ color: "white", textAlign: "center", marginTop: "50px" }}>
        Loading...
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-card">
        <h1 className="profile-title">Player Profile 👤</h1>

        <div className="profile-info">
          <p><strong>Username:</strong> {userData.username}</p>
          {userData.email && <p><strong>Email:</strong> {userData.email}</p>}
        </div>

        <div className="stats-grid">
          <div className="stat-box">
            <h3>🎮 Games Played</h3>
            <p>{stats.games_played}</p>
          </div>

          <div className="stat-box">
            <h3>🏆 Games Won</h3>
            <p>{stats.games_won}</p>
          </div>

          <div className="stat-box">
            <h3>❌ Games Lost</h3>
            <p>{stats.games_lost}</p>
          </div>

          <div className="stat-box">
            <h3>⭐ Best Score</h3>
            <p>{stats.best_score}</p>
          </div>
        </div>

        <div className="profile-actions">
          <button onClick={() => navigate("/dashboard")}>⬅ Back to Dashboard</button>
        </div>
      </div>

      <style>{`
        .profile-page {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          background: linear-gradient(var(--bg-angle, 45deg), #1f1c2c, #928dab);
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
