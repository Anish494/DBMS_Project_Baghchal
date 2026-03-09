import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { API_URL } from "../config";



const OnlineLobby = () => {
    const navigate = useNavigate();
    const canvasRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);
    const [rooms, setRooms] = useState([]);
    const [loadingRooms, setLoadingRooms] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [roomName, setRoomName] = useState("");
    const [hostRole, setHostRole] = useState("goat");
    const [creating, setCreating] = useState(false);
    const [joining, setJoining] = useState(null); // room_code being joined
    const [error, setError] = useState(null);
    const intervalRef = useRef(null);

    // ── Canvas background ──────────────────────────────
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        let animationId;
        let frameCount = 0;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener("resize", resize);

        const draw = () => {
            const cw = canvas.width, ch = canvas.height;
            ctx.clearRect(0, 0, cw, ch);
            ctx.fillStyle = "#0d0b14";
            ctx.fillRect(0, 0, cw, ch);

            ctx.strokeStyle = "rgba(180,130,40,0.07)";
            ctx.lineWidth = 1;
            const g = 60;
            for (let x = 0; x < cw; x += g) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ch); ctx.stroke(); }
            for (let y = 0; y < ch; y += g) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cw, y); ctx.stroke(); }
            ctx.strokeStyle = "rgba(200,150,50,0.04)";
            for (let sx = -ch; sx < cw + ch; sx += g * 2) {
                ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx + ch, ch); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx - ch, ch); ctx.stroke();
            }

            const p = Math.sin(frameCount * 0.01) * 20;
            [[cw * 0.15, ch * 0.2, 180, "rgba(180,100,20,0.06)"],
             [cw * 0.85, ch * 0.7, 220, "rgba(120,60,160,0.06)"],
             [cw * 0.5,  ch * 0.9, 150, "rgba(200,140,30,0.05)"]
            ].forEach(([x, y, r, color]) => {
                const b = ctx.createRadialGradient(x, y, 0, x, y, r + p);
                b.addColorStop(0, color); b.addColorStop(1, "transparent");
                ctx.fillStyle = b; ctx.beginPath(); ctx.arc(x, y, r + p, 0, Math.PI * 2); ctx.fill();
            });

            frameCount++;
            animationId = requestAnimationFrame(draw);
        };

        draw();
        setTimeout(() => setIsVisible(true), 50);
        return () => { cancelAnimationFrame(animationId); window.removeEventListener("resize", resize); };
    }, []);

    // ── Fetch rooms ────────────────────────────────────
    const fetchRooms = useCallback(async () => {
        const token = localStorage.getItem("access_token");
        try {
            const res = await fetch(`${API_URL}/api/online/rooms/`, {
                headers: { "Authorization": `Bearer ${token}` },
            });
            if (res.status === 401) { navigate("/login"); return; }
            const data = await res.json();
            setRooms(data);
        } catch (err) {
            console.error("Failed to fetch rooms:", err);
        } finally {
            setLoadingRooms(false);
        }
    }, [navigate]);

    // Auto-refresh every 5 seconds
    useEffect(() => {
        fetchRooms();
        intervalRef.current = setInterval(fetchRooms, 5000);
        return () => clearInterval(intervalRef.current);
    }, [fetchRooms]);

    // ── Create room ────────────────────────────────────
    const handleCreate = async () => {
        const token = localStorage.getItem("access_token");
        setCreating(true);
        setError(null);

        const name = roomName.trim() || "Room-" + Math.random().toString(36).substring(2, 6).toUpperCase();

        try {
            const res = await fetch(`${API_URL}/api/online/create/`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ room_name: name, host_role: hostRole }),
            });

            const data = await res.json();
            if (!res.ok) { setError(data.error || "Failed to create room."); return; }

            // Navigate to the game as host
            // Pass role via state so OnlineGame knows who we are
            navigate(`/online/${data.room_code}`, {
                state: {
                    role: data.host_role,
                    room_name: data.room_name,
                    is_host: true,
                }
            });
        } catch (err) {
            setError("Network error. Try again.");
        } finally {
            setCreating(false);
        }
    };

    // ── Join room ──────────────────────────────────────
    const handleJoin = async (room_code) => {
        const token = localStorage.getItem("access_token");
        setJoining(room_code);
        setError(null);

        try {
            const res = await fetch(`${API_URL}/api/online/join/${room_code}/`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` },
            });

            const data = await res.json();
            if (!res.ok) { setError(data.error || "Failed to join room."); return; }

            navigate(`/online/${room_code}`, {
                state: {
                    role: data.guest_role,
                    room_name: data.room_name,
                    is_host: false,
                }
            });
        } catch (err) {
            setError("Network error. Try again.");
        } finally {
            setJoining(null);
        }
    };

    // ── Styles ─────────────────────────────────────────
    const cardStyle = {
        background: "rgba(20,15,30,0.85)",
        backdropFilter: "blur(24px)",
        border: "1px solid rgba(200,150,50,0.2)",
        borderRadius: 20,
        boxShadow: "0 30px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,200,80,0.08)",
    };

    const goldBtn = (extra = {}) => ({
        background: "linear-gradient(135deg, #c9922a, #f0c060)",
        border: "none",
        borderRadius: 10,
        color: "#1a1205",
        fontWeight: 700,
        fontSize: 14,
        cursor: "pointer",
        fontFamily: "inherit",
        padding: "10px 20px",
        transition: "transform 0.15s ease, opacity 0.15s ease",
        ...extra,
    });

    const ghostBtn = (extra = {}) => ({
        background: "rgba(200,150,50,0.08)",
        border: "1px solid rgba(200,150,50,0.25)",
        borderRadius: 10,
        color: "#f0c060",
        fontWeight: 700,
        fontSize: 14,
        cursor: "pointer",
        fontFamily: "inherit",
        padding: "10px 20px",
        transition: "transform 0.15s ease",
        ...extra,
    });

    const user = JSON.parse(localStorage.getItem("user") || "{}");

    return (
        <div style={{ background: "#0d0b14", minHeight: "100vh" }}>
            <Navbar />
            <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, zIndex: 0 }} />

            <div style={{
                position: "relative", zIndex: 1,
                maxWidth: 780, margin: "0 auto",
                padding: "100px 24px 80px",
                fontFamily: "'Georgia','Times New Roman',serif",
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? "translateY(0)" : "translateY(24px)",
                transition: "opacity 0.6s ease, transform 0.6s ease",
            }}>

                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: 40 }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>🌐</div>
                    <h1 style={{
                        margin: "0 0 8px", fontSize: 34, fontWeight: 700, letterSpacing: 2,
                        background: "linear-gradient(135deg,#f0c060,#c9922a)",
                        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                    }}>
                        Online Multiplayer
                    </h1>
                    <p style={{ margin: 0, color: "rgba(200,180,140,0.4)", fontSize: 13, letterSpacing: 1 }}>
                        Join a waiting room or create your own
                    </p>
                </div>

                {/* Error banner */}
                {error && (
                    <div style={{
                        background: "rgba(200,60,60,0.1)", border: "1px solid rgba(200,60,60,0.3)",
                        borderRadius: 12, padding: "14px 20px", color: "#e07070",
                        fontSize: 14, textAlign: "center", marginBottom: 20,
                    }}>
                        {error}
                    </div>
                )}

                {/* Create Room button / form */}
                <div style={{ ...cardStyle, padding: "28px 32px", marginBottom: 24 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                            <div style={{ color: "#f0c060", fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
                                Create a Room
                            </div>
                            <div style={{ color: "rgba(200,180,140,0.45)", fontSize: 13 }}>
                                Choose your role and wait for an opponent
                            </div>
                        </div>
                        <button
                            style={showCreateForm ? ghostBtn() : goldBtn()}
                            onClick={() => { setShowCreateForm(v => !v); setError(null); }}
                            onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
                            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                        >
                            {showCreateForm ? "Cancel" : "+ Create Room"}
                        </button>
                    </div>

                    {/* Inline create form */}
                    {showCreateForm && (
                        <div style={{
                            marginTop: 24,
                            paddingTop: 24,
                            borderTop: "1px solid rgba(200,150,50,0.12)",
                        }}>
                            {/* Room name input */}
                            <div style={{ marginBottom: 20 }}>
                                <label style={{
                                    display: "block", color: "rgba(200,180,140,0.5)",
                                    fontSize: 11, letterSpacing: 1.5,
                                    textTransform: "uppercase", marginBottom: 8,
                                }}>
                                    Room Name
                                </label>
                                <div style={{ display: "flex", gap: 10 }}>
                                    <input
                                        value={roomName}
                                        onChange={e => setRoomName(e.target.value)}
                                        placeholder="Enter a room name..."
                                        maxLength={40}
                                        style={{
                                            flex: 1, padding: "10px 14px",
                                            background: "rgba(255,255,255,0.04)",
                                            border: "1px solid rgba(200,150,50,0.2)",
                                            borderRadius: 10, color: "#f0c060",
                                            fontSize: 14, fontFamily: "inherit",
                                            outline: "none",
                                        }}
                                    />
                                    <button
                                        style={ghostBtn({ padding: "10px 14px", fontSize: 13 })}
                                        onClick={() => setRoomName("Room-" + Math.random().toString(36).substring(2, 6).toUpperCase())}
                                    >
                                        🎲 Random
                                    </button>
                                </div>
                            </div>

                            {/* Role selector */}
                            <div style={{ marginBottom: 24 }}>
                                <label style={{
                                    display: "block", color: "rgba(200,180,140,0.5)",
                                    fontSize: 11, letterSpacing: 1.5,
                                    textTransform: "uppercase", marginBottom: 8,
                                }}>
                                    You Play As
                                </label>
                                <div style={{ display: "flex", gap: 12 }}>
                                    {[
                                        { value: "goat", label: "🐐 Goat", desc: "Place & block" },
                                        { value: "tiger", label: "🐯 Tiger", desc: "Hunt & capture" },
                                    ].map(({ value, label, desc }) => (
                                        <div
                                            key={value}
                                            onClick={() => setHostRole(value)}
                                            style={{
                                                flex: 1, padding: "14px",
                                                borderRadius: 12, cursor: "pointer",
                                                textAlign: "center",
                                                background: hostRole === value
                                                    ? "rgba(200,150,50,0.15)"
                                                    : "rgba(255,255,255,0.03)",
                                                border: `1px solid ${hostRole === value
                                                    ? "rgba(200,150,50,0.5)"
                                                    : "rgba(200,150,50,0.1)"}`,
                                                transition: "all 0.2s ease",
                                            }}
                                        >
                                            <div style={{ fontSize: 22, marginBottom: 4 }}>{label.split(" ")[0]}</div>
                                            <div style={{ color: "#f0c060", fontWeight: 700, fontSize: 13 }}>{label.split(" ")[1]}</div>
                                            <div style={{ color: "rgba(200,180,140,0.4)", fontSize: 11 }}>{desc}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button
                                style={goldBtn({ width: "100%", padding: "13px" })}
                                onClick={handleCreate}
                                disabled={creating}
                                onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
                                onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
                            >
                                {creating ? "Creating..." : "Create Room"}
                            </button>
                        </div>
                    )}
                </div>

                {/* Room list */}
                <div style={cardStyle}>
                    {/* List header */}
                    <div style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "20px 28px",
                        borderBottom: "1px solid rgba(200,150,50,0.1)",
                    }}>
                        <div style={{ color: "#f0c060", fontWeight: 700, fontSize: 15 }}>
                            Available Rooms
                        </div>
                        <div style={{ color: "rgba(200,180,140,0.35)", fontSize: 12 }}>
                            🔄 Refreshes every 5s
                        </div>
                    </div>

                    {/* Column headers */}
                    {rooms.length > 0 && (
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 130px 130px 100px",
                            padding: "12px 28px",
                            borderBottom: "1px solid rgba(200,150,50,0.08)",
                            background: "rgba(200,150,50,0.03)",
                        }}>
                            {["Room", "Host", "Host Plays", ""].map(col => (
                                <div key={col} style={{
                                    fontSize: 11, fontWeight: 700,
                                    color: "rgba(180,150,100,0.4)",
                                    letterSpacing: 1.5, textTransform: "uppercase",
                                }}>
                                    {col}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Loading */}
                    {loadingRooms && (
                        <div style={{ padding: "40px", textAlign: "center", color: "rgba(200,180,140,0.4)", fontSize: 14 }}>
                            Loading rooms...
                        </div>
                    )}

                    {/* Empty */}
                    {!loadingRooms && rooms.length === 0 && (
                        <div style={{ padding: "50px 40px", textAlign: "center" }}>
                            <div style={{ fontSize: 32, marginBottom: 12 }}>🏜️</div>
                            <div style={{ color: "rgba(200,180,140,0.4)", fontSize: 15 }}>
                                No open rooms right now
                            </div>
                            <div style={{ color: "rgba(200,180,140,0.25)", fontSize: 13, marginTop: 6 }}>
                                Create one and wait for an opponent
                            </div>
                        </div>
                    )}

                    {/* Room rows */}
                    {rooms.map((room, i) => {
                        const isOwn = room.host === user.username;
                        return (
                            <div
                                key={room.room_code}
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 130px 130px 100px",
                                    padding: "16px 28px",
                                    borderBottom: i < rooms.length - 1
                                        ? "1px solid rgba(200,150,50,0.06)"
                                        : "none",
                                    alignItems: "center",
                                    background: isOwn ? "rgba(200,150,50,0.05)" : "transparent",
                                }}
                            >
                                {/* Room name */}
                                <div>
                                    <div style={{ color: "rgba(200,180,140,0.85)", fontWeight: 700, fontSize: 14 }}>
                                        {room.room_name}
                                    </div>
                                    <div style={{ color: "rgba(200,180,140,0.3)", fontSize: 11, marginTop: 2 }}>
                                        {room.room_code}
                                    </div>
                                </div>

                                {/* Host */}
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <div style={{
                                        width: 28, height: 28, borderRadius: "50%",
                                        background: "rgba(200,150,50,0.15)",
                                        border: "1px solid rgba(200,150,50,0.2)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: 12, fontWeight: 700, color: "#f0c060",
                                    }}>
                                        {room.host[0].toUpperCase()}
                                    </div>
                                    <span style={{ color: "rgba(200,180,140,0.7)", fontSize: 13 }}>
                                        {room.host}
                                    </span>
                                </div>

                                {/* Host role */}
                                <div style={{ fontSize: 18 }}>
                                    {room.host_role === "goat" ? "🐐 Goat" : "🐯 Tiger"}
                                </div>

                                {/* Join button */}
                                <div>
                                    {isOwn ? (
                                        <span style={{ color: "rgba(200,180,140,0.3)", fontSize: 12 }}>
                                            Your room
                                        </span>
                                    ) : (
                                        <button
                                            style={goldBtn({ padding: "8px 16px", fontSize: 13 })}
                                            onClick={() => handleJoin(room.room_code)}
                                            disabled={joining === room.room_code}
                                            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
                                            onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
                                        >
                                            {joining === room.room_code ? "..." : "Join"}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Back button */}
                <button
                    onClick={() => navigate("/dashboard")}
                    style={{ ...ghostBtn({ width: "100%", padding: "13px", marginTop: 20 }) }}
                    onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
                    onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
                >
                    ⬅ Back to Dashboard
                </button>

            </div>
            <Footer />
        </div>
    );
};

export default OnlineLobby;