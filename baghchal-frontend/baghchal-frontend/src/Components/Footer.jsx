import React from "react";
import { useNavigate } from "react-router-dom";

const Footer = () => {
    const navigate = useNavigate();

    const linkStyle = {
        color: "rgba(200, 180, 140, 0.4)",
        fontSize: 12,
        cursor: "pointer",
        fontFamily: "'Georgia', serif",
        transition: "color 0.2s ease",
        textDecoration: "none",
    };

    return (
        <footer style={{
            background: "rgba(8, 6, 16, 0.95)",
            borderTop: "1px solid rgba(200, 150, 50, 0.1)",
            padding: "32px 40px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 20,
            fontFamily: "'Georgia', serif",
        }}>

            {/* Left — logo + tagline */}
            <div>
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 6,
                }}>
                    <span style={{ fontSize: 18 }}>🐯</span>
                    <span style={{
                        fontSize: 14,
                        fontWeight: 700,
                        background: "linear-gradient(135deg, #f0c060, #c9922a)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        letterSpacing: 1,
                    }}>
                        Bagh-Chal
                    </span>
                </div>
                <p style={{
                    margin: 0,
                    color: "rgba(200, 180, 140, 0.3)",
                    fontSize: 11,
                    letterSpacing: 0.5,
                }}>
                    Ancient game. Modern battle.
                </p>
            </div>

            {/* Center — links */}
            <div style={{ display: "flex", gap: 24 }}>
                <span
                    style={linkStyle}
                    onClick={() => navigate("/")}
                    onMouseEnter={(e) => e.currentTarget.style.color = "#f0c060"}
                    onMouseLeave={(e) => e.currentTarget.style.color = "rgba(200, 180, 140, 0.4)"}
                >
                    Home
                </span>
                <span
                    style={linkStyle}
                    onClick={() => navigate("/rules")}
                    onMouseEnter={(e) => e.currentTarget.style.color = "#f0c060"}
                    onMouseLeave={(e) => e.currentTarget.style.color = "rgba(200, 180, 140, 0.4)"}
                >
                    Rules
                </span>
                <span
                    style={linkStyle}
                    onClick={() => navigate("/login")}
                    onMouseEnter={(e) => e.currentTarget.style.color = "#f0c060"}
                    onMouseLeave={(e) => e.currentTarget.style.color = "rgba(200, 180, 140, 0.4)"}
                >
                    Login
                </span>
                <span
                    style={linkStyle}
                    onClick={() => navigate("/register")}
                    onMouseEnter={(e) => e.currentTarget.style.color = "#f0c060"}
                    onMouseLeave={(e) => e.currentTarget.style.color = "rgba(200, 180, 140, 0.4)"}
                >
                    Register
                </span>
            </div>

            {/* Right — credits */}
            <p style={{
                margin: 0,
                color: "rgba(200, 180, 140, 0.25)",
                fontSize: 11,
                letterSpacing: 0.5,
            }}>
                Built with Django + React · © {new Date().getFullYear()}
            </p>

        </footer>
    );
};

export default Footer;