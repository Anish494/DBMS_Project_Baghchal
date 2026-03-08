import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const Rules = () => {
    const navigate = useNavigate();
    const canvasRef = useRef(null);

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

    const divider = (label) => (
        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "32px 0 20px" }}>
            <div style={{ flex: 1, height: 1, background: "rgba(200, 150, 50, 0.15)" }} />
            <span style={{ color: "rgba(180, 150, 100, 0.4)", fontSize: 11, letterSpacing: 2, textTransform: "uppercase" }}>
                {label}
            </span>
            <div style={{ flex: 1, height: 1, background: "rgba(200, 150, 50, 0.15)" }} />
        </div>
    );

    const ruleItem = (text) => (
        <div key={text} style={{
            display: "flex",
            gap: 12,
            alignItems: "flex-start",
            marginBottom: 12,
        }}>
            <div style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#c9922a",
                marginTop: 7,
                flexShrink: 0,
            }} />
            <p style={{
                margin: 0,
                color: "rgba(200, 180, 140, 0.65)",
                fontSize: 14,
                lineHeight: 1.8,
            }}>
                {text}
            </p>
        </div>
    );

    return (
        <div style={{ background: "#0d0b14", minHeight: "100vh" }}>
            <Navbar />

            <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, zIndex: 0 }} />

            <div style={{
                position: "relative",
                zIndex: 1,
                maxWidth: 720,
                margin: "0 auto",
                padding: "100px 24px 80px",
                fontFamily: "'Georgia', 'Times New Roman', serif",
            }}>

                {/* Page header */}
                <div style={{ textAlign: "center", marginBottom: 48 }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>🐯🐐</div>
                    <h1 style={{
                        margin: "0 0 10px",
                        fontSize: 36,
                        fontWeight: 700,
                        letterSpacing: 2,
                        background: "linear-gradient(135deg, #f0c060, #c9922a)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                    }}>
                        Game Rules
                    </h1>
                    <p style={{
                        margin: 0,
                        color: "rgba(200, 180, 140, 0.4)",
                        fontSize: 13,
                        letterSpacing: 1,
                    }}>
                        Everything you need to know to play Bagh-Chal
                    </p>
                </div>

                {/* Card */}
                <div style={{
                    background: "rgba(20, 15, 30, 0.85)",
                    backdropFilter: "blur(24px)",
                    border: "1px solid rgba(200, 150, 50, 0.2)",
                    borderRadius: 24,
                    padding: "40px 44px",
                    boxShadow: "0 30px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,200,80,0.08)",
                }}>

                    {/* Objective */}
                    {divider("Objective")}
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 16,
                        marginBottom: 8,
                    }}>
                        {[
                            { icon: "🐯", title: "Tigers win", desc: "by capturing 5 goats" },
                            { icon: "🐐", title: "Goats win", desc: "by blocking all tigers" },
                        ].map(({ icon, title, desc }) => (
                            <div key={title} style={{
                                background: "rgba(200, 150, 50, 0.06)",
                                border: "1px solid rgba(200, 150, 50, 0.15)",
                                borderRadius: 14,
                                padding: "20px",
                                textAlign: "center",
                            }}>
                                <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
                                <div style={{ color: "#f0c060", fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{title}</div>
                                <div style={{ color: "rgba(200, 180, 140, 0.5)", fontSize: 13 }}>{desc}</div>
                            </div>
                        ))}
                    </div>

                    {/* Setup */}
                    {divider("Game Setup")}
                    {[
                        "The board is a 5×5 grid of intersection points connected by lines including diagonals.",
                        "4 tigers begin the game at the four corners of the board.",
                        "20 goats start off the board and are placed one by one during the first phase.",
                        "Goats always move first.",
                    ].map(ruleItem)}

                    {/* Goat rules */}
                    {divider("Goat Rules")}
                    {[
                        "Phase 1 — Placement: On each goat turn, place one goat on any empty intersection point on the board.",
                        "Phase 2 — Movement: Once all 20 goats are placed, move any goat to an adjacent empty point along a line.",
                        "Goats cannot jump over tigers or other goats.",
                        "Strategy: Try to surround tigers and cut off all their possible moves.",
                    ].map(ruleItem)}

                    {/* Tiger rules */}
                    {divider("Tiger Rules")}
                    {[
                        "Tigers move to any adjacent empty point along a line on every turn.",
                        "Tigers can capture a goat by jumping over it — there must be an empty point directly beyond the goat in a straight line.",
                        "The jumped goat is removed from the board permanently.",
                        "Only one capture is allowed per turn — no chain captures.",
                        "Strategy: Try to capture 5 goats before the goats can trap you.",
                    ].map(ruleItem)}

                    {/* Diagonal note */}
                    {divider("Diagonal Moves")}
                    {[
                        "Not all points allow diagonal movement — only points where (row + column) is even have diagonal connections.",
                        "This means the four corner tigers start with diagonal mobility, but central points on the edges do not.",
                        "Both tigers and goats follow this same diagonal restriction.",
                    ].map(ruleItem)}

                    {/* Back button */}
                    <div style={{ marginTop: 40 }}>
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
            </div>

            <Footer />
        </div>
    );
};

export default Rules;