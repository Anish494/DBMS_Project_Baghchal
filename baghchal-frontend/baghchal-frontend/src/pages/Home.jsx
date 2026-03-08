import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const Home = () => {
    const navigate = useNavigate();
    const canvasRef = useRef(null);
    const [user, setUser] = useState(null);
    const [heroVisible, setHeroVisible] = useState(false);
    const [aboutVisible, setAboutVisible] = useState(false);
    const [modesVisible, setModesVisible] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem("user");
        setUser(stored ? JSON.parse(stored) : null);
        setTimeout(() => setHeroVisible(true), 100);
    }, []);

    // Intersection observer — fade sections in as user scrolls
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        if (entry.target.id === "about") setAboutVisible(true);
                        if (entry.target.id === "modes") setModesVisible(true);
                    }
                });
            },
            { threshold: 0.15 }
        );
        const about = document.getElementById("about");
        const modes = document.getElementById("modes");
        if (about) observer.observe(about);
        if (modes) observer.observe(modes);
        return () => observer.disconnect();
    }, []);

    // Canvas background — fixed so it stays while scrolling
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

            const pulse = Math.sin(frameCount * 0.008) * 25;

            const b1 = ctx.createRadialGradient(cw * 0.1, ch * 0.3, 0, cw * 0.1, ch * 0.3, 250 + pulse);
            b1.addColorStop(0, "rgba(180, 100, 20, 0.07)"); b1.addColorStop(1, "transparent");
            ctx.fillStyle = b1; ctx.beginPath(); ctx.arc(cw * 0.1, ch * 0.3, 250 + pulse, 0, Math.PI * 2); ctx.fill();

            const b2 = ctx.createRadialGradient(cw * 0.9, ch * 0.6, 0, cw * 0.9, ch * 0.6, 280 + pulse);
            b2.addColorStop(0, "rgba(120, 60, 160, 0.07)"); b2.addColorStop(1, "transparent");
            ctx.fillStyle = b2; ctx.beginPath(); ctx.arc(cw * 0.9, ch * 0.6, 280 + pulse, 0, Math.PI * 2); ctx.fill();

            const b3 = ctx.createRadialGradient(cw * 0.5, ch * 0.8, 0, cw * 0.5, ch * 0.8, 200 + pulse);
            b3.addColorStop(0, "rgba(200, 140, 30, 0.05)"); b3.addColorStop(1, "transparent");
            ctx.fillStyle = b3; ctx.beginPath(); ctx.arc(cw * 0.5, ch * 0.8, 200 + pulse, 0, Math.PI * 2); ctx.fill();

            frameCount++;
            animationId = requestAnimationFrame(drawBackground);
        };

        drawBackground();
        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener("resize", resizeCanvas);
        };
    }, []);

    const dividerStyle = {
        display: "flex",
        alignItems: "center",
        gap: 16,
        marginBottom: 48,
    };

    const dividerLineStyle = {
        flex: 1,
        height: 1,
        background: "rgba(200, 150, 50, 0.15)",
    };

    const dividerLabelStyle = {
        color: "rgba(180, 150, 100, 0.4)",
        fontSize: 11,
        letterSpacing: 2,
        textTransform: "uppercase",
        fontFamily: "'Georgia', serif",
    };

    return (
        <div style={{
            position: "relative",
            minHeight: "100vh",
            fontFamily: "'Georgia', 'Times New Roman', serif",
            color: "#f0e6c8",
        }}>
            {/* Fixed canvas — stays in place while content scrolls */}
            <canvas ref={canvasRef} style={{
                position: "fixed",
                inset: 0,
                zIndex: 0,
            }} />

            {/* All content sits above canvas */}
            <div style={{ position: "relative", zIndex: 1 }}>

                <Navbar />

                {/* ============================================
                    HERO SECTION
                    Full viewport height, centered content
                    ============================================ */}
                <section style={{
                    minHeight: "100vh",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    textAlign: "center",
                    padding: "0 24px",
                    opacity: heroVisible ? 1 : 0,
                    transform: heroVisible ? "translateY(0)" : "translateY(30px)",
                    transition: "opacity 0.9s ease, transform 0.9s ease",
                }}>

                    {/* Emoji pair */}
                    <div style={{ fontSize: 64, marginBottom: 24, lineHeight: 1 }}>
                        🐯🐐
                    </div>

                    {/* Main title */}
                    <h1 style={{
                        margin: "0 0 8px",
                        fontSize: "clamp(48px, 8vw, 88px)",
                        fontWeight: 700,
                        letterSpacing: 4,
                        background: "linear-gradient(135deg, #f0c060 0%, #c9922a 50%, #f0c060 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        lineHeight: 1.1,
                    }}>
                        Bagh-Chal
                    </h1>

                    {/* Nepali subtitle */}
                    <p style={{
                        margin: "0 0 16px",
                        fontSize: "clamp(18px, 3vw, 26px)",
                        color: "rgba(200, 180, 140, 0.5)",
                        letterSpacing: 3,
                        fontWeight: 400,
                    }}>
                        बाघचाल
                    </p>

                    {/* Tagline */}
                    <p style={{
                        margin: "0 0 48px",
                        fontSize: "clamp(14px, 2vw, 18px)",
                        color: "rgba(200, 180, 140, 0.55)",
                        letterSpacing: 1,
                        maxWidth: 480,
                        lineHeight: 1.7,
                    }}>
                        A 2000-year-old Nepali strategy game of tigers and goats.
                        Ancient wisdom. Modern battlefield.
                    </p>

                    {/* CTA buttons */}
                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
                        <button
                            onClick={() => user ? navigate("/dashboard") : navigate("/register")}
                            style={{
                                padding: "16px 40px",
                                background: "linear-gradient(135deg, #c9922a, #f0c060)",
                                border: "none",
                                borderRadius: 12,
                                color: "#1a1205",
                                fontWeight: 700,
                                fontSize: 15,
                                cursor: "pointer",
                                letterSpacing: 0.5,
                                fontFamily: "'Georgia', serif",
                                boxShadow: "0 4px 30px rgba(200, 150, 50, 0.35)",
                                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = "translateY(-2px)";
                                e.currentTarget.style.boxShadow = "0 8px 40px rgba(200, 150, 50, 0.5)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "translateY(0)";
                                e.currentTarget.style.boxShadow = "0 4px 30px rgba(200, 150, 50, 0.35)";
                            }}
                        >
                            {user ? "Play Now" : "Get Started"}
                        </button>

                        <button
                            onClick={() => document.getElementById("about")?.scrollIntoView({ behavior: "smooth" })}
                            style={{
                                padding: "16px 40px",
                                background: "rgba(200, 150, 50, 0.08)",
                                border: "1px solid rgba(200, 150, 50, 0.3)",
                                borderRadius: 12,
                                color: "#f0c060",
                                fontWeight: 700,
                                fontSize: 15,
                                cursor: "pointer",
                                letterSpacing: 0.5,
                                fontFamily: "'Georgia', serif",
                                transition: "transform 0.2s ease",
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
                            onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                        >
                            Learn More
                        </button>
                    </div>

                    {/* Scroll hint */}
                    <div style={{
                        position: "absolute",
                        bottom: 36,
                        left: "50%",
                        transform: "translateX(-50%)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 8,
                        color: "rgba(200, 180, 140, 0.3)",
                        fontSize: 11,
                        letterSpacing: 2,
                        textTransform: "uppercase",
                    }}>
                        <span>Scroll</span>
                        <div style={{
                            width: 1,
                            height: 40,
                            background: "linear-gradient(to bottom, rgba(200,150,50,0.4), transparent)",
                            animation: "scrollPulse 2s ease infinite",
                        }} />
                    </div>
                </section>

                {/* ============================================
                    ABOUT SECTION
                    Cultural info about the game
                    ============================================ */}
                <section
                    id="about"
                    style={{
                        maxWidth: 960,
                        margin: "0 auto",
                        padding: "100px 40px",
                        opacity: aboutVisible ? 1 : 0,
                        transform: aboutVisible ? "translateY(0)" : "translateY(40px)",
                        transition: "opacity 0.8s ease, transform 0.8s ease",
                    }}
                >
                    <div style={dividerStyle}>
                        <div style={dividerLineStyle} />
                        <span style={dividerLabelStyle}>What is Bagh-Chal</span>
                        <div style={dividerLineStyle} />
                    </div>

                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 60,
                        alignItems: "center",
                    }}>
                        {/* Left — text */}
                        <div>
                            <h2 style={{
                                margin: "0 0 20px",
                                fontSize: 32,
                                fontWeight: 700,
                                background: "linear-gradient(135deg, #f0c060, #c9922a)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                                lineHeight: 1.3,
                            }}>
                                Nepal's ancient strategy game
                            </h2>
                            <p style={{
                                margin: "0 0 16px",
                                color: "rgba(200, 180, 140, 0.65)",
                                fontSize: 15,
                                lineHeight: 1.85,
                            }}>
                                Bagh-Chal (बाघचाल) — meaning "Tigers Move" — is a traditional
                                two-player abstract strategy game originating in Nepal over
                                2000 years ago. It is one of the few indigenous board games
                                still actively played today.
                            </p>
                            <p style={{
                                margin: 0,
                                color: "rgba(200, 180, 140, 0.5)",
                                fontSize: 14,
                                lineHeight: 1.85,
                            }}>
                                The game is asymmetric — four tigers hunt twenty goats on
                                a 5×5 grid. Tigers win by capturing five goats. Goats win
                                by trapping all four tigers so none can move. Simple rules,
                                deep strategy.
                            </p>
                        </div>

                        {/* Right — stat cards */}
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 16,
                        }}>
                            {[
                                { value: "2000+", label: "Years old", icon: "📜" },
                                { value: "4 vs 20", label: "Tigers vs Goats", icon: "⚔️" },
                                { value: "5×5", label: "Grid size", icon: "🏁" },
                                { value: "Nepal", label: "Origin", icon: "🏔️" },
                            ].map(({ value, label, icon }) => (
                                <div key={label} style={{
                                    background: "rgba(20, 15, 30, 0.7)",
                                    backdropFilter: "blur(12px)",
                                    border: "1px solid rgba(200, 150, 50, 0.15)",
                                    borderRadius: 14,
                                    padding: "20px 16px",
                                    textAlign: "center",
                                }}>
                                    <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
                                    <div style={{
                                        fontSize: 20,
                                        fontWeight: 700,
                                        color: "#f0c060",
                                        marginBottom: 4,
                                    }}>
                                        {value}
                                    </div>
                                    <div style={{
                                        fontSize: 11,
                                        color: "rgba(200, 180, 140, 0.4)",
                                        letterSpacing: 1,
                                        textTransform: "uppercase",
                                    }}>
                                        {label}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ============================================
                    GAME MODES SECTION
                    3 cards — AI, Local, Online
                    ============================================ */}
                <section
                    id="modes"
                    style={{
                        maxWidth: 960,
                        margin: "0 auto",
                        padding: "0px 40px 120px",
                        opacity: modesVisible ? 1 : 0,
                        transform: modesVisible ? "translateY(0)" : "translateY(40px)",
                        transition: "opacity 0.8s ease 0.1s, transform 0.8s ease 0.1s",
                    }}
                >
                    <div style={dividerStyle}>
                        <div style={dividerLineStyle} />
                        <span style={dividerLabelStyle}>Game Modes</span>
                        <div style={dividerLineStyle} />
                    </div>

                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: 24,
                    }}>
                        {[
                            {
                                icon: "🎮",
                                title: "vs AI",
                                subtitle: "Single Player",
                                description: "Face a minimax AI opponent. Play as the goat side and outmaneuver four tiger pieces.",
                                cta: "Play vs AI",
                                available: true,
                                onClick: () => user ? navigate("/dashboard") : navigate("/login"),
                                accent: "#f0c060",
                            },
                            {
                                icon: "🪑",
                                title: "Local 2 Player",
                                subtitle: "Same Device",
                                description: "Pass and play on the same screen. One player controls tigers, the other controls goats.",
                                cta: "Play Local",
                                available: true,
                                onClick: () => user ? navigate("/local") : navigate("/login"),
                                accent: "#70c080",
                            },
                            {
                                icon: "🌐",
                                title: "Online",
                                subtitle: "Coming Soon",
                                description: "Challenge players from anywhere in real time. Live matchmaking and in-game chat.",
                                cta: "Coming Soon",
                                available: false,
                                onClick: null,
                                accent: "#a080e0",
                            },
                        ].map(({ icon, title, subtitle, description, cta, available, onClick, accent }) => (
                            <div
                                key={title}
                                style={{
                                    background: "rgba(20, 15, 30, 0.75)",
                                    backdropFilter: "blur(16px)",
                                    border: `1px solid rgba(200, 150, 50, 0.15)`,
                                    borderRadius: 20,
                                    padding: "32px 28px",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 16,
                                    opacity: available ? 1 : 0.5,
                                    transition: "transform 0.2s ease, border-color 0.2s ease",
                                    cursor: available ? "pointer" : "default",
                                }}
                                onMouseEnter={(e) => {
                                    if (!available) return;
                                    e.currentTarget.style.transform = "translateY(-4px)";
                                    e.currentTarget.style.borderColor = `rgba(200, 150, 50, 0.35)`;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = "translateY(0)";
                                    e.currentTarget.style.borderColor = "rgba(200, 150, 50, 0.15)";
                                }}
                                onClick={onClick}
                            >
                                <div style={{ fontSize: 36 }}>{icon}</div>

                                <div>
                                    <h3 style={{
                                        margin: "0 0 4px",
                                        fontSize: 20,
                                        fontWeight: 700,
                                        color: accent,
                                    }}>
                                        {title}
                                    </h3>
                                    <p style={{
                                        margin: 0,
                                        fontSize: 11,
                                        color: "rgba(200, 180, 140, 0.4)",
                                        letterSpacing: 1,
                                        textTransform: "uppercase",
                                    }}>
                                        {subtitle}
                                    </p>
                                </div>

                                <p style={{
                                    margin: 0,
                                    fontSize: 13,
                                    color: "rgba(200, 180, 140, 0.55)",
                                    lineHeight: 1.75,
                                    flexGrow: 1,
                                }}>
                                    {description}
                                </p>

                                <div style={{
                                    padding: "10px 0",
                                    borderTop: "1px solid rgba(200, 150, 50, 0.1)",
                                    fontSize: 13,
                                    fontWeight: 700,
                                    color: available ? accent : "rgba(200, 180, 140, 0.3)",
                                    letterSpacing: 0.5,
                                }}>
                                    {cta} →
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <Footer />
            </div>

            <style>{`
                @keyframes scrollPulse {
                    0%, 100% { opacity: 0.3; transform: scaleY(1); }
                    50% { opacity: 0.8; transform: scaleY(1.1); }
                }
                @media (max-width: 768px) {
                    section > div[style*="grid-template-columns: 1fr 1fr"] {
                        grid-template-columns: 1fr !important;
                    }
                    section > div[style*="grid-template-columns: repeat(3"] {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default Home;