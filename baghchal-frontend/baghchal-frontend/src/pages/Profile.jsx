import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const Profile = () => {
    const navigate = useNavigate();
    const canvasRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);
    const [userData, setUserData] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
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
            const cw = canvas.width;
            const ch = canvas.height;
            ctx.clearRect(0, 0, cw, ch);
            ctx.fillStyle = "#0d0b14";
            ctx.fillRect(0, 0, cw, ch);

            ctx.strokeStyle = "rgba(180, 130, 40, 0.07)";
            ctx.lineWidth = 1;
            const g = 60;
            for (let x = 0; x < cw; x += g) {
                ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ch); ctx.stroke();
            }
            for (let y = 0; y < ch; y += g) {
                ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cw, y); ctx.stroke();
            }

            ctx.strokeStyle = "rgba(200, 150, 50, 0.04)";
            for (let sx = -ch; sx < cw + ch; sx += g * 2) {
                ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx + ch, ch); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx - ch, ch); ctx.stroke();
            }

            const pulse = Math.sin(frameCount * 0.01) * 20;

            const b1 = ctx.createRadialGradient(cw * 0.15, ch * 0.2, 0, cw * 0.15, ch * 0.2, 180 + pulse);
            b1.addColorStop(0, "rgba(180, 100, 20, 0.06)"); b1.addColorStop(1, "transparent");
            ctx.fillStyle = b1; ctx.beginPath(); ctx.arc(cw * 0.15, ch * 0.2, 180 + pulse, 0, Math.PI * 2); ctx.fill();

            const b2 = ctx.createRadialGradient(cw * 0.85, ch * 0.7, 0, cw * 0.85, ch * 0.7, 220 + pulse);
            b2.addColorStop(0, "rgba(120, 60, 160, 0.06)"); b2.addColorStop(1, "transparent");
            ctx.fillStyle = b2; ctx.beginPath(); ctx.arc(cw * 0.85, ch * 0.7, 220 + pulse, 0, Math.PI * 2); ctx.fill();

            const b3 = ctx.createRadialGradient(cw * 0.5, ch * 0.9, 0, cw * 0.5, ch * 0.9, 150 + pulse);
            b3.addColorStop(0, "rgba(200, 140, 30, 0.05)"); b3.addColorStop(1, "transparent");
            ctx.fillStyle = b3; ctx.beginPath(); ctx.arc(cw * 0.5, ch * 0.9, 150 + pulse, 0, Math.PI * 2); ctx.fill();

            frameCount++;
            animationId = requestAnimationFrame(drawBackground);
        };

        drawBackground();
        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener("resize", resizeCanvas);
        };
    }, []);

    useEffect(() => {
        const token = localStorage.getItem("access_token");
        const user = JSON.parse(localStorage.getItem("user"));

        const fetchData = async () => {
            try {
                const [resUser, resStats] = await Promise.all([
                    fetch(`http://localhost:8000/api/users/${user.id}/`, {
                        headers: { "Authorization": `Bearer ${token}` },
                    }),
                    fetch(`http://localhost:8000/api/statistics/${user.id}/`, {
                        headers: { "Authorization": `Bearer ${token}` },
                    }),
                ]);

                if (resUser.status === 401 || resStats.status === 401) {
                    navigate("/login");
                    return;
                }

                const dataUser = await resUser.json();
                const dataStats = await resStats.json();

                setUserData(dataUser);
                setStats(dataStats);
                setLoading(false);
                setTimeout(() => setIsVisible(true), 50);

            } catch (err) {
                console.error("Error fetching profile:", err);
                setLoading(false);
            }
        };

        fetchData();
    }, [navigate]);

    const statBoxStyle = {
        background: "rgba(200, 150, 50, 0.07)",
        border: "1px solid rgba(200, 150, 50, 0.15)",
        borderRadius: 14,
        padding: "20px 16px",
        textAlign: "center",
    };

    if (loading) {
        return (
            <div style={{ background: "#0d0b14", minHeight: "100vh" }}>
                <Navbar />
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "calc(100vh - 60px)",
                    fontFamily: "'Georgia', serif",
                    color: "rgba(200, 180, 140, 0.6)",
                    fontSize: 16,
                    letterSpacing: 1,
                }}>
                    Loading profile...
                </div>
            </div>
        );
    }

    return (
        <div style={{ background: "#0d0b14", minHeight: "100vh" }}>
            <Navbar />

            <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, zIndex: 0 }} />

            <div style={{
                position: "relative",
                zIndex: 1,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "calc(100vh - 60px)",
                padding: "60px 24px",
                boxSizing: "border-box",
                fontFamily: "'Georgia', 'Times New Roman', serif",
            }}>

                {/* Glass card */}
                <div style={{
                    background: "rgba(20, 15, 30, 0.85)",
                    backdropFilter: "blur(24px)",
                    border: "1px solid rgba(200, 150, 50, 0.2)",
                    borderRadius: 24,
                    padding: "48px 44px",
                    width: "100%",
                    maxWidth: 480,
                    boxShadow: "0 30px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,200,80,0.08)",
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? "translateY(0)" : "translateY(24px)",
                    transition: "opacity 0.6s ease, transform 0.6s ease",
                }}>

                    {/* Header */}
                    <div style={{ textAlign: "center", marginBottom: 32 }}>
                        <div style={{ fontSize: 36, marginBottom: 8 }}>👤</div>
                        <h1 style={{
                            margin: 0,
                            fontSize: 26,
                            fontWeight: 700,
                            letterSpacing: 1,
                            background: "linear-gradient(135deg, #f0c060, #c9922a)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                        }}>
                            {userData?.username}
                        </h1>
                        <p style={{
                            margin: "6px 0 0",
                            color: "rgba(200, 180, 140, 0.5)",
                            fontSize: 13,
                            letterSpacing: 0.5,
                        }}>
                            {userData?.email}
                        </p>
                    </div>

                    {/* Divider */}
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                        <div style={{ flex: 1, height: 1, background: "rgba(200, 150, 50, 0.15)" }} />
                        <span style={{ color: "rgba(180, 150, 100, 0.5)", fontSize: 11, letterSpacing: 1, textTransform: "uppercase" }}>
                            statistics
                        </span>
                        <div style={{ flex: 1, height: 1, background: "rgba(200, 150, 50, 0.15)" }} />
                    </div>

                    {/* Stats grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14, marginBottom: 32 }}>
                        <div style={statBoxStyle}>
                            <div style={{ fontSize: 22, marginBottom: 6 }}>🎮</div>
                            <div style={{ fontSize: 28, fontWeight: 700, color: "#f0c060", marginBottom: 4 }}>
                                {stats?.games_played ?? 0}
                            </div>
                            <div style={{ fontSize: 11, color: "rgba(200, 180, 140, 0.5)", letterSpacing: 1, textTransform: "uppercase" }}>
                                Played
                            </div>
                        </div>

                        <div style={statBoxStyle}>
                            <div style={{ fontSize: 22, marginBottom: 6 }}>🏆</div>
                            <div style={{ fontSize: 28, fontWeight: 700, color: "#f0c060", marginBottom: 4 }}>
                                {stats?.games_won ?? 0}
                            </div>
                            <div style={{ fontSize: 11, color: "rgba(200, 180, 140, 0.5)", letterSpacing: 1, textTransform: "uppercase" }}>
                                Won
                            </div>
                        </div>

                        <div style={statBoxStyle}>
                            <div style={{ fontSize: 22, marginBottom: 6 }}>💀</div>
                            <div style={{ fontSize: 28, fontWeight: 700, color: "#f0c060", marginBottom: 4 }}>
                                {stats?.games_lost ?? 0}
                            </div>
                            <div style={{ fontSize: 11, color: "rgba(200, 180, 140, 0.5)", letterSpacing: 1, textTransform: "uppercase" }}>
                                Lost
                            </div>
                        </div>

                        <div style={statBoxStyle}>
                            <div style={{ fontSize: 22, marginBottom: 6 }}>⭐</div>
                            <div style={{ fontSize: 28, fontWeight: 700, color: "#f0c060", marginBottom: 4 }}>
                                {stats?.best_score ? `${Math.round(stats.best_score)}s` : "—"}
                            </div>
                            <div style={{ fontSize: 11, color: "rgba(200, 180, 140, 0.5)", letterSpacing: 1, textTransform: "uppercase" }}>
                                Best Time
                            </div>
                        </div>
                    </div>

                    {/* Win rate bar */}
                    {stats?.games_played > 0 && (
                        <>
                            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                                <div style={{ flex: 1, height: 1, background: "rgba(200, 150, 50, 0.15)" }} />
                                <span style={{ color: "rgba(180, 150, 100, 0.5)", fontSize: 11, letterSpacing: 1, textTransform: "uppercase" }}>
                                    win rate
                                </span>
                                <div style={{ flex: 1, height: 1, background: "rgba(200, 150, 50, 0.15)" }} />
                            </div>

                            <div style={{ marginBottom: 32 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                    <span style={{ color: "rgba(200, 180, 140, 0.6)", fontSize: 13 }}>Win rate</span>
                                    <span style={{ color: "#f0c060", fontSize: 13, fontWeight: 700 }}>
                                        {Math.round((stats.games_won / stats.games_played) * 100)}%
                                    </span>
                                </div>
                                <div style={{ width: "100%", height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 999, overflow: "hidden" }}>
                                    <div style={{
                                        height: "100%",
                                        width: `${(stats.games_won / stats.games_played) * 100}%`,
                                        background: "linear-gradient(90deg, #c9922a, #f0c060)",
                                        borderRadius: 999,
                                        transition: "width 1s ease",
                                    }} />
                                </div>
                            </div>
                        </>
                    )}

                    {/* Back button */}
                    <button
                        onClick={() => navigate("/dashboard")}
                        style={{
                            width: "100%",
                            padding: "14px",
                            background: "rgba(200, 150, 50, 0.1)",
                            border: "1px solid rgba(200, 150, 50, 0.25)",
                            borderRadius: 12,
                            color: "#f0c060",
                            fontSize: 15,
                            fontWeight: 700,
                            cursor: "pointer",
                            letterSpacing: 0.5,
                            fontFamily: "inherit",
                            transition: "transform 0.2s ease",
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-1px)"}
                        onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                    >
                        ⬅ Back to Dashboard
                    </button>

                </div>
            </div>

            <Footer />
        </div>
    );
};

export default Profile;