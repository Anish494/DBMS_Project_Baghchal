import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { API_URL } from "../config";

const Leaderboard = () => {
    const navigate = useNavigate();
    const canvasRef = useRef(null);
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentUsername, setCurrentUsername] = useState(null);
    const [isVisible, setIsVisible] = useState(false);

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

        // Store username — API returns user as username string
        setCurrentUsername(user?.username);

        const fetchLeaderboard = async () => {
            try {
                const res = await fetch(`${API_URL}/api/statistics/`, {
                    headers: { "Authorization": `Bearer ${token}` },
                });

                if (res.status === 401) {
                    navigate("/login");
                    return;
                }

                const data = await res.json();

                // Sort by games_played descending
                // Ties broken by games_won descending
                const sorted = [...data].sort((a, b) => {
                    if (b.games_played !== a.games_played) return b.games_played - a.games_played;
                    return b.games_won - a.games_won;
                });

                setPlayers(sorted);
                setLoading(false);
                setTimeout(() => setIsVisible(true), 50);

            } catch (err) {
                console.error("Leaderboard fetch error:", err);
                setError("Failed to load leaderboard.");
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, [navigate]);

    const rankDisplay = (rank) => {
        if (rank === 1) return "🥇";
        if (rank === 2) return "🥈";
        if (rank === 3) return "🥉";
        return `#${rank}`;
    };

    const rowAccent = (rank) => {
        if (rank === 1) return "rgba(240, 192, 96, 0.08)";
        if (rank === 2) return "rgba(180, 180, 200, 0.06)";
        if (rank === 3) return "rgba(180, 120, 60, 0.06)";
        return "transparent";
    };

    const rankBorderColor = (rank) => {
        if (rank === 1) return "rgba(240, 192, 96, 0.3)";
        if (rank === 2) return "rgba(180, 180, 200, 0.2)";
        if (rank === 3) return "rgba(180, 120, 60, 0.2)";
        return "transparent";
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
                    Loading leaderboard...
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
                maxWidth: 760,
                margin: "0 auto",
                padding: "100px 24px 80px",
                fontFamily: "'Georgia', 'Times New Roman', serif",
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? "translateY(0)" : "translateY(24px)",
                transition: "opacity 0.6s ease, transform 0.6s ease",
            }}>

                {/* Page header */}
                <div style={{ textAlign: "center", marginBottom: 48 }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>🏆</div>
                    <h1 style={{
                        margin: "0 0 10px",
                        fontSize: 36,
                        fontWeight: 700,
                        letterSpacing: 2,
                        background: "linear-gradient(135deg, #f0c060, #c9922a)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                    }}>
                        Leaderboard
                    </h1>
                    <p style={{
                        margin: 0,
                        color: "rgba(200, 180, 140, 0.4)",
                        fontSize: 13,
                        letterSpacing: 1,
                    }}>
                        Ranked by games played — ties broken by wins
                    </p>
                </div>

                {/* Error state */}
                {error && (
                    <div style={{
                        background: "rgba(200, 60, 60, 0.1)",
                        border: "1px solid rgba(200, 60, 60, 0.3)",
                        borderRadius: 12,
                        padding: "16px 20px",
                        color: "#e07070",
                        fontSize: 14,
                        textAlign: "center",
                        marginBottom: 24,
                    }}>
                        {error}
                    </div>
                )}

                {/* Empty state */}
                {!error && players.length === 0 && (
                    <div style={{
                        background: "rgba(20, 15, 30, 0.85)",
                        backdropFilter: "blur(24px)",
                        border: "1px solid rgba(200, 150, 50, 0.2)",
                        borderRadius: 24,
                        padding: "60px 40px",
                        textAlign: "center",
                        color: "rgba(200, 180, 140, 0.4)",
                        fontSize: 15,
                        letterSpacing: 0.5,
                    }}>
                        No players yet. Be the first to play!
                    </div>
                )}

                {/* Leaderboard table */}
                {players.length > 0 && (
                    <div style={{
                        background: "rgba(20, 15, 30, 0.85)",
                        backdropFilter: "blur(24px)",
                        border: "1px solid rgba(200, 150, 50, 0.2)",
                        borderRadius: 24,
                        overflow: "hidden",
                        boxShadow: "0 30px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,200,80,0.08)",
                    }}>

                        {/* Table header */}
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "60px 1fr 120px 120px",
                            padding: "16px 28px",
                            borderBottom: "1px solid rgba(200, 150, 50, 0.12)",
                            background: "rgba(200, 150, 50, 0.05)",
                        }}>
                            {["Rank", "Player", "Played", "Won"].map((col) => (
                                <div key={col} style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: "rgba(180, 150, 100, 0.5)",
                                    letterSpacing: 1.5,
                                    textTransform: "uppercase",
                                    textAlign: col === "Player" ? "left" : "center",
                                }}>
                                    {col}
                                </div>
                            ))}
                        </div>

                        {/* Table rows */}
                        {players.map((player, index) => {
                            const rank = index + 1;
                            // player.user is the username string from the API
                            const isCurrentUser = player.user === currentUsername;

                            return (
                                <div
                                    key={player.id}
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "60px 1fr 120px 120px",
                                        padding: "18px 28px",
                                        background: isCurrentUser
                                            ? "rgba(200, 150, 50, 0.1)"
                                            : rowAccent(rank),
                                        borderBottom: "1px solid rgba(200, 150, 50, 0.06)",
                                        borderLeft: isCurrentUser
                                            ? "3px solid rgba(200, 150, 50, 0.6)"
                                            : `3px solid ${rankBorderColor(rank)}`,
                                        transition: "background 0.2s ease",
                                        cursor: "default",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = isCurrentUser
                                            ? "rgba(200, 150, 50, 0.15)"
                                            : "rgba(200, 150, 50, 0.05)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = isCurrentUser
                                            ? "rgba(200, 150, 50, 0.1)"
                                            : rowAccent(rank);
                                    }}
                                >
                                    {/* Rank */}
                                    <div style={{
                                        fontSize: rank <= 3 ? 20 : 14,
                                        fontWeight: 700,
                                        color: rank <= 3 ? "#f0c060" : "rgba(200, 180, 140, 0.4)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}>
                                        {rankDisplay(rank)}
                                    </div>

                                    {/* Player */}
                                    <div style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 12,
                                    }}>
                                        <div style={{
                                            width: 34,
                                            height: 34,
                                            borderRadius: "50%",
                                            background: isCurrentUser
                                                ? "linear-gradient(135deg, #c9922a, #f0c060)"
                                                : "rgba(200, 150, 50, 0.15)",
                                            border: `1px solid ${isCurrentUser
                                                ? "rgba(240, 192, 96, 0.5)"
                                                : "rgba(200, 150, 50, 0.2)"}`,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontSize: 13,
                                            fontWeight: 700,
                                            color: isCurrentUser ? "#1a1205" : "#f0c060",
                                            flexShrink: 0,
                                        }}>
                                            {player.user?.[0]?.toUpperCase() ?? "?"}
                                        </div>

                                        <div>
                                            <div style={{
                                                fontSize: 14,
                                                fontWeight: 700,
                                                color: isCurrentUser ? "#f0c060" : "rgba(200, 180, 140, 0.85)",
                                            }}>
                                                {player.user}
                                            </div>
                                            {isCurrentUser && (
                                                <div style={{
                                                    fontSize: 10,
                                                    color: "rgba(200, 150, 50, 0.6)",
                                                    letterSpacing: 1,
                                                    textTransform: "uppercase",
                                                }}>
                                                    You
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Games Played */}
                                    <div style={{
                                        fontSize: 15,
                                        fontWeight: 600,
                                        color: "rgba(200, 180, 140, 0.6)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}>
                                        {player.games_played ?? 0}
                                    </div>

                                    {/* Games Won */}
                                    <div style={{
                                        fontSize: 15,
                                        fontWeight: 700,
                                        color: "#f0c060",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}>
                                        {player.games_won ?? 0}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Back button */}
                <button
                    onClick={() => navigate("/dashboard")}
                    style={{
                        width: "100%",
                        marginTop: 24,
                        padding: "14px",
                        background: "rgba(200, 150, 50, 0.08)",
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

            <Footer />
        </div>
    );
};

export default Leaderboard;