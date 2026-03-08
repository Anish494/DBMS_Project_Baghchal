import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState(null);
    const [scrolled, setScrolled] = useState(false);

    // Read auth state from localStorage
    // Re-runs whenever route changes so navbar
    // updates immediately after login/logout
    useEffect(() => {
        const stored = localStorage.getItem("user");
        setUser(stored ? JSON.parse(stored) : null);
    }, [location.pathname]);

    // Navbar becomes more opaque when scrolled
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const handleLogout = async () => {
        try {
            await fetch("http://localhost:8000/api/auth/logout/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
                },
                body: JSON.stringify({ refresh: localStorage.getItem("refresh_token") }),
            });
        } catch (err) {
            console.error("Logout error:", err);
        }
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        setUser(null);
        navigate("/");
    };

    const navLinkStyle = (active) => ({
        color: active ? "#f0c060" : "rgba(200, 180, 140, 0.6)",
        textDecoration: "none",
        fontSize: 13,
        fontWeight: 600,
        letterSpacing: 0.5,
        cursor: "pointer",
        transition: "color 0.2s ease",
        fontFamily: "'Georgia', serif",
        borderBottom: active ? "1px solid rgba(200, 150, 50, 0.5)" : "1px solid transparent",
        paddingBottom: 2,
    });

    const btnStyle = (variant = "outline") => ({
        padding: "7px 16px",
        borderRadius: 8,
        fontSize: 12,
        fontWeight: 700,
        cursor: "pointer",
        fontFamily: "'Georgia', serif",
        letterSpacing: 0.5,
        transition: "transform 0.2s ease, opacity 0.2s ease",
        border: variant === "solid" ? "none" : "1px solid rgba(200, 150, 50, 0.35)",
        background: variant === "solid"
            ? "linear-gradient(135deg, #c9922a, #f0c060)"
            : "rgba(200, 150, 50, 0.08)",
        color: variant === "solid" ? "#1a1205" : "#f0c060",
    });

    return (
        <nav style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            height: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 40px",
            background: scrolled
                ? "rgba(13, 11, 20, 0.92)"
                : "rgba(13, 11, 20, 0.6)",
            backdropFilter: "blur(20px)",
            borderBottom: "1px solid rgba(200, 150, 50, 0.1)",
            transition: "background 0.3s ease",
        }}>

            {/* Logo */}
            <div
                onClick={() => navigate("/")}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    cursor: "pointer",
                }}
            >
                <span style={{ fontSize: 22 }}>🐯</span>
                <span style={{
                    fontSize: 16,
                    fontWeight: 700,
                    letterSpacing: 1,
                    background: "linear-gradient(135deg, #f0c060, #c9922a)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    fontFamily: "'Georgia', serif",
                }}>
                    Bagh-Chal
                </span>
            </div>

            {/* Center nav links */}
            <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
                <span
                    style={navLinkStyle(location.pathname === "/")}
                    onClick={() => navigate("/")}
                >
                    Home
                </span>
                <span
                    style={navLinkStyle(false)}
                    onClick={() => {
    if (location.pathname === "/") {
        document.getElementById("about")?.scrollIntoView({ behavior: "smooth" });
    } else {
        navigate("/");
        // small delay so homepage mounts before scrolling
        setTimeout(() => {
            document.getElementById("about")?.scrollIntoView({ behavior: "smooth" });
        }, 300);
    }
}}
                >
                    About
                </span>
                <span
                    style={navLinkStyle(location.pathname === "/rules")}
                    onClick={() => navigate("/rules")}
                >
                    Rules
                </span>
                {user && (
                    <span
                        style={navLinkStyle(location.pathname === "/dashboard")}
                        onClick={() => navigate("/dashboard")}
                    >
                        Dashboard
                    </span>
                )}
            </div>

            {/* Right side — auth state dependent */}
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                {user ? (
                    <>
                        {/* Avatar + username */}
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "5px 12px",
                            background: "rgba(200, 150, 50, 0.08)",
                            border: "1px solid rgba(200, 150, 50, 0.2)",
                            borderRadius: 8,
                            cursor: "pointer",
                        }}
                            onClick={() => navigate("/profile")}
                        >
                            <div style={{
                                width: 26,
                                height: 26,
                                borderRadius: "50%",
                                background: "linear-gradient(135deg, #c9922a, #f0c060)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 12,
                                fontWeight: 700,
                                color: "#1a1205",
                                fontFamily: "'Georgia', serif",
                            }}>
                                {user.username?.[0]?.toUpperCase()}
                            </div>
                            <span style={{
                                fontSize: 12,
                                color: "rgba(200, 180, 140, 0.8)",
                                fontFamily: "'Georgia', serif",
                                fontWeight: 600,
                            }}>
                                {user.username}
                            </span>
                        </div>

                        <button
                            style={btnStyle("outline")}
                            onClick={handleLogout}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                        >
                            Logout
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            style={btnStyle("outline")}
                            onClick={() => navigate("/login")}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                        >
                            Sign In
                        </button>
                        <button
                            style={btnStyle("solid")}
                            onClick={() => navigate("/register")}
                            onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-1px)"}
                            onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                        >
                            Register
                        </button>
                    </>
                )}
            </div>
        </nav>
    );
};

export default Navbar;