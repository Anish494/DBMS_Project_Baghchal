import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { API_URL } from "../config";


const Dashboard = () => {
    const navigate = useNavigate();
    const canvasRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);
    const [user, setUser] = useState(null);

    // ----------------------------------------
    // AUTH CHECK
    // On every load, check both token AND user
    // If either is missing, kick to login
    // ----------------------------------------
 useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    setUser(storedUser);
    setTimeout(() => setIsVisible(true), 50);
}, []);

    // ----------------------------------------
    // CANVAS BACKGROUND
    // Exact same drawing code as Login/Register
    // so all three pages feel like one system
    // ----------------------------------------
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

            // dark base — same as login
            ctx.fillStyle = "#0d0b14";
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);

            // faint grid lines
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

            // diagonal lines
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

            // pulsing blobs
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

    // ----------------------------------------
    // LOGOUT
    // 1. Tell server to blacklist refresh token
    // 2. Clear all three localStorage items
    // 3. Navigate to login
    // ----------------------------------------
    const handleLogout = async () => {
        const refreshToken = localStorage.getItem("refresh_token");

        try {
            await fetch(`${API_URL}/api/auth/logout/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
                },
                body: JSON.stringify({ refresh: refreshToken }),
            });
        } catch (err) {
            // server call failed but we still log out locally
            console.error("Logout error:", err);
        }

        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        navigate("/");
    };

    // ----------------------------------------
    // START SINGLE PLAYER GAME
    // Sends JWT in Authorization header
    // Backend reads player from request.user
    // No need to send player ID in body
    // ----------------------------------------
    const startSinglePlayer = async () => {
        const token = localStorage.getItem("access_token");
        if (!token) return navigate("/");

        try {
            const response = await fetch(`${API_URL}/api/games/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
            });

            if (response.status === 401) {
                // access token expired
                navigate("/");
                return;
            }

            const gameData = await response.json();
            if (!response.ok) return alert(gameData.error || "Error creating game");

            navigate(`/gameboard/${gameData.id}`);
        } catch (err) {
            console.error(err);
            alert("Network error. Try again.");
        }
    };

    const startProfile = () => navigate("/profile");
    const openRules = () => navigate("/rules");
    const openLeaderboard = () => navigate("/leaderboard");

    // ----------------------------------------
    // BUTTON STYLE FACTORY
    // Takes a variant, returns the inline style
    // Same pattern as inputStyle() in Login
    // ----------------------------------------
    const buttonStyle = (variant) => {
        const base = {
            width: "100%",
            padding: "14px",
            borderRadius: 12,
            border: "none",
            fontSize: 15,
            fontWeight: 700,
            cursor: "pointer",
            letterSpacing: 0.5,
            fontFamily: "inherit",
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
        };

        const variants = {
            // primary — same gold gradient as the submit button in Login/Register
            primary: {
                background: "linear-gradient(135deg, #c9922a, #f0c060)",
                color: "#1a1205",
                boxShadow: "0 4px 20px rgba(200, 150, 50, 0.3)",
            },
            // secondary — muted, matches the divider color palette
            secondary: {
                background: "rgba(200, 150, 50, 0.1)",
                color: "#f0c060",
                border: "1px solid rgba(200, 150, 50, 0.25)",
            },
            // outline — even more subtle
            outline: {
                background: "rgba(255, 255, 255, 0.04)",
                color: "rgba(200, 180, 140, 0.8)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
            },
            // danger — for logout
            danger: {
                background: "rgba(200, 60, 60, 0.12)",
                color: "#e07070",
                border: "1px solid rgba(200, 60, 60, 0.25)",
            },
        };

        return { ...base, ...variants[variant] };
    };

    return (
      <div>
        <Navbar/>
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

            {/* Same canvas as Login/Register */}
            <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, zIndex: 0 }} />

            {/* Glass card — identical structure to Login/Register */}
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

                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: 36 }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>🐯🐐</div>
                    <h1 style={{
                        margin: 0,
                        fontSize: 26,
                        fontWeight: 700,
                        letterSpacing: 1,
                        background: "linear-gradient(135deg, #f0c060, #c9922a)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                    }}>
                        Welcome, {user?.username}
                    </h1>
                    <p style={{
                        margin: "8px 0 0",
                        color: "rgba(200, 180, 140, 0.6)",
                        fontSize: 13,
                        letterSpacing: 0.5,
                    }}>
                        Choose your battle
                    </p>
                </div>

                {/* Divider — same style as Login/Register */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                    <div style={{ flex: 1, height: 1, background: "rgba(200, 150, 50, 0.15)" }} />
                    <span style={{
                        color: "rgba(180, 150, 100, 0.5)",
                        fontSize: 11,
                        letterSpacing: 1,
                        textTransform: "uppercase",
                    }}>
                        game modes
                    </span>
                    <div style={{ flex: 1, height: 1, background: "rgba(200, 150, 50, 0.15)" }} />
                </div>

                {/* Game mode buttons */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
                    <button
                        style={buttonStyle("primary")}
                        onClick={startSinglePlayer}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "translateY(-1px)";
                            e.currentTarget.style.boxShadow = "0 8px 25px rgba(200, 150, 50, 0.4)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "0 4px 20px rgba(200, 150, 50, 0.3)";
                        }}
                    >
                        🎮 Single Player vs AI
                    </button>

                    <button
                        style={buttonStyle("secondary")}
                        onClick={() => navigate("/local")}
                        onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-1px)"}
                        onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                    >
                        🪑 Local 2 Player
                    </button>

                    <button
                        style={buttonStyle("secondary")}
                        onClick={() => navigate("/online")}
                        onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-1px)"}
                        onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                    >
                        🌐 Online Multiplayer
                    </button>
                </div>

                {/* Second divider */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                    <div style={{ flex: 1, height: 1, background: "rgba(200, 150, 50, 0.15)" }} />
                    <span style={{
                        color: "rgba(180, 150, 100, 0.5)",
                        fontSize: 11,
                        letterSpacing: 1,
                        textTransform: "uppercase",
                    }}>
                        account
                    </span>
                    <div style={{ flex: 1, height: 1, background: "rgba(200, 150, 50, 0.15)" }} />
                </div>

                {/* Account buttons */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
                    <div style={{ display: "flex", gap: 12 }}>
                        <button
                            style={{ ...buttonStyle("outline"), flex: 1 }}
                            onClick={startProfile}
                            onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-1px)"}
                            onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                        >
                            👤 Profile
                        </button>

                        <button
                            style={{ ...buttonStyle("outline"), flex: 1 }}
                            onClick={openLeaderboard}
                            onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-1px)"}
                            onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                        >
                            🏆 Leaderboard
                        </button>

                        <button
                            style={{ ...buttonStyle("outline"), flex: 1 }}
                            onClick={openRules}
                            onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-1px)"}
                            onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                        >
                            📜 Rules
                        </button>
                    </div>
                </div>

                {/* Logout */}
                <button
                    style={buttonStyle("danger")}
                    onClick={handleLogout}
                    onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-1px)"}
                    onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                >
                    🚪 Logout
                </button>

            </div>
        </div>
        <Footer/>
        </div>
    );
};

export default Dashboard;