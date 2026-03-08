import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const ROWS = 5;
const COLS = 5;
const MAX_GOATS = 20;

const points = [];
for (let i = 0; i < ROWS; i++) {
    for (let j = 0; j < COLS; j++) points.push([i, j]);
}

const connections = {};
points.forEach(([i, j]) => {
    const neighbors = [];
    const orthogonal = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    const diagonals = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    orthogonal.forEach(([dx, dy]) => {
        const ni = i + dx, nj = j + dy;
        if (ni >= 0 && ni < ROWS && nj >= 0 && nj < COLS) neighbors.push([ni, nj]);
    });
    if ((i + j) % 2 === 0) {
        diagonals.forEach(([dx, dy]) => {
            const ni = i + dx, nj = j + dy;
            if (ni >= 0 && ni < ROWS && nj >= 0 && nj < COLS) neighbors.push([ni, nj]);
        });
    }
    connections[[i, j]] = neighbors;
});

const initialState = {
    tigers: [[0, 0], [0, 4], [4, 0], [4, 4]],
    goats: [],
    goatsToPlace: MAX_GOATS,
    turn: "goat",
    captured: 0,
};

const LocalGame = () => {
    const [state, setState] = useState(initialState);
    const [selectedPiece, setSelectedPiece] = useState(null);
    const [winner, setWinner] = useState(null);
    const [isVisible, setIsVisible] = useState(false);
    const [capturedGoatPos, setCapturedGoatPos] = useState(null);
    const [showCapturePopup, setShowCapturePopup] = useState(false);
    const [validMoves, setValidMoves] = useState([]);

    // Separate undo stacks for each player
    // When goat moves → push to goatHistory
    // When tiger moves → push to tigerHistory
    // Undo only pops from the current player's stack
    // Turn stays with current player after undo
    const [goatHistory, setGoatHistory] = useState([]);
    const [tigerHistory, setTigerHistory] = useState([]);

    const canvasRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        setTimeout(() => setIsVisible(true), 50);
    }, []);

    // ----------------------------------------
    // CANVAS BACKGROUND
    // ----------------------------------------
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

    // ----------------------------------------
    // WIN CONDITIONS
    // ----------------------------------------
    const areAllTigersBlocked = (st) => {
        for (const t of st.tigers) {
            const canMove = connections[t].some(([i, j]) =>
                !st.tigers.some(tt => tt[0] === i && tt[1] === j) &&
                !st.goats.some(g => g[0] === i && g[1] === j)
            );
            const canCapture = connections[t].some(([i, j]) => {
                const mi = 2 * i - t[0], mj = 2 * j - t[1];
                return st.goats.some(g => g[0] === i && g[1] === j) &&
                    !st.goats.some(g => g[0] === mi && g[1] === mj) &&
                    !st.tigers.some(tt => tt[0] === mi && tt[1] === mj) &&
                    connections[[i, j]]?.some(([ni, nj]) => ni === mi && nj === mj);
            });
            if (canMove || canCapture) return false;
        }
        return true;
    };

    const checkWin = (st) => {
        if (st.captured >= 5) setWinner("Tiger");
        else if (areAllTigersBlocked(st)) setWinner("Goat");
    };

    // ----------------------------------------
    // VALID MOVE CALCULATION
    // Called when a piece is selected
    // Returns array of {row, col} destinations
    // so we can highlight them on the board
    // ----------------------------------------
    const getValidGoatMoves = (from, st) => {
        if (st.goatsToPlace > 0) {
            // Placement phase — all empty squares are valid
            return points.filter(([r, c]) =>
                !st.goats.some(g => g[0] === r && g[1] === c) &&
                !st.tigers.some(t => t[0] === r && t[1] === c)
            ).map(([r, c]) => ({ row: r, col: c }));
        }
        // Move phase — adjacent empty squares only
        return (connections[from] || [])
            .filter(([r, c]) =>
                !st.goats.some(g => g[0] === r && g[1] === c) &&
                !st.tigers.some(t => t[0] === r && t[1] === c)
            )
            .map(([r, c]) => ({ row: r, col: c }));
    };

    const getValidTigerMoves = (from, st) => {
        const moves = [];
        for (const [r, c] of (connections[from] || [])) {
            const isEmpty = !st.goats.some(g => g[0] === r && g[1] === c) &&
                            !st.tigers.some(t => t[0] === r && t[1] === c);
            if (isEmpty) {
                // Regular move
                moves.push({ row: r, col: c, type: "move" });
            } else if (st.goats.some(g => g[0] === r && g[1] === c)) {
                // Potential capture — calculate landing square
                const lr = 2 * r - from[0];
                const lc = 2 * c - from[1];
                const landingValid =
                    points.some(p => p[0] === lr && p[1] === lc) &&
                    !st.goats.some(g => g[0] === lr && g[1] === lc) &&
                    !st.tigers.some(t => t[0] === lr && t[1] === lc) &&
                    connections[[r, c]]?.some(([ni, nj]) => ni === lr && nj === lc);
                if (landingValid) {
                    moves.push({ row: lr, col: lc, type: "capture", over: [r, c] });
                }
            }
        }
        return moves;
    };

    // ----------------------------------------
    // GOAT MOVE HANDLER
    // ----------------------------------------
    const applyGoatMove = (from, to, type) => {
        // Save current full state to goat's history before mutating
        setGoatHistory(prev => [...prev, JSON.parse(JSON.stringify(state))]);

        const next = JSON.parse(JSON.stringify(state));
        if (type === "place") {
            next.goats.push(to);
            next.goatsToPlace -= 1;
        } else {
            next.goats = next.goats.map(g =>
                g[0] === from[0] && g[1] === from[1] ? to : g
            );
        }
        next.turn = "tiger";
        setState(next);
        checkWin(next);
        setSelectedPiece(null);
        setValidMoves([]);
    };

    // ----------------------------------------
    // TIGER MOVE HANDLER
    // Captures have the 700ms animation delay
    // ----------------------------------------
    const applyTigerMove = (from, to, type, over = null) => {
        // Save current full state to tiger's history before mutating
        setTigerHistory(prev => [...prev, JSON.parse(JSON.stringify(state))]);

        if (type === "capture" && over) {
            // Show capture animation at the goat being jumped
            setCapturedGoatPos(over);
            setShowCapturePopup(true);

            // Intermediate state — tiger has moved, goat not removed yet
            const intermediate = JSON.parse(JSON.stringify(state));
            intermediate.tigers = intermediate.tigers.map(t =>
                t[0] === from[0] && t[1] === from[1] ? to : t
            );
            intermediate.turn = "goat";
            setState(intermediate);

            // After animation, remove the goat
            setTimeout(() => {
                const final = JSON.parse(JSON.stringify(intermediate));
                final.goats = final.goats.filter(g =>
                    !(g[0] === over[0] && g[1] === over[1])
                );
                final.captured += 1;
                setState(final);
                setCapturedGoatPos(null);
                checkWin(final);
            }, 700);

            setTimeout(() => setShowCapturePopup(false), 2500);

        } else {
            const next = JSON.parse(JSON.stringify(state));
            next.tigers = next.tigers.map(t =>
                t[0] === from[0] && t[1] === from[1] ? to : t
            );
            next.turn = "goat";
            setState(next);
            checkWin(next);
        }

        setSelectedPiece(null);
        setValidMoves([]);
    };

    // ----------------------------------------
    // UNDO
    // Pops from the CURRENT player's history.
    // Turn stays with the same player.
    // The other player's moves are untouched.
    // ----------------------------------------
    const handleUndo = () => {
        if (state.turn === "goat") {
            if (!goatHistory.length) return;
            const prev = goatHistory[goatHistory.length - 1];
            setState({ ...prev, turn: "goat" });
            setGoatHistory(h => h.slice(0, -1));
        } else {
            if (!tigerHistory.length) return;
            const prev = tigerHistory[tigerHistory.length - 1];
            setState({ ...prev, turn: "tiger" });
            setTigerHistory(h => h.slice(0, -1));
        }
        setWinner(null);
        setSelectedPiece(null);
        setValidMoves([]);
        setCapturedGoatPos(null);
        setShowCapturePopup(false);
    };

    // ----------------------------------------
    // CLICK HANDLER
    // Handles both goat and tiger turns
    // ----------------------------------------
    const handleClick = (row, col) => {
        if (winner || capturedGoatPos) return;
        const pos = [row, col];

        if (state.turn === "goat") {
            if (state.goatsToPlace > 0) {
                // Placement phase — click any empty square
                const empty = !state.goats.some(g => g[0] === row && g[1] === col) &&
                              !state.tigers.some(t => t[0] === row && t[1] === col);
                if (empty) applyGoatMove(null, pos, "place");
            } else {
                // Move phase
                if (selectedPiece) {
                    const move = validMoves.find(m => m.row === row && m.col === col);
                    if (move) {
                        applyGoatMove(selectedPiece, pos, "move");
                    } else if (state.goats.some(g => g[0] === row && g[1] === col)) {
                        // Select a different goat
                        setSelectedPiece(pos);
                        setValidMoves(getValidGoatMoves(pos, state));
                    } else {
                        setSelectedPiece(null);
                        setValidMoves([]);
                    }
                } else {
                    if (state.goats.some(g => g[0] === row && g[1] === col)) {
                        setSelectedPiece(pos);
                        setValidMoves(getValidGoatMoves(pos, state));
                    }
                }
            }
        } else {
            // Tiger's turn
            if (selectedPiece) {
                const move = validMoves.find(m => m.row === row && m.col === col);
                if (move) {
                    applyTigerMove(selectedPiece, pos, move.type, move.over || null);
                } else if (state.tigers.some(t => t[0] === row && t[1] === col)) {
                    // Select a different tiger
                    setSelectedPiece(pos);
                    setValidMoves(getValidTigerMoves(pos, state));
                } else {
                    setSelectedPiece(null);
                    setValidMoves([]);
                }
            } else {
                if (state.tigers.some(t => t[0] === row && t[1] === col)) {
                    setSelectedPiece(pos);
                    setValidMoves(getValidTigerMoves(pos, state));
                }
            }
        }
    };

    const handleRestart = () => {
        setState(initialState);
        setWinner(null);
        setSelectedPiece(null);
        setValidMoves([]);
        setGoatHistory([]);
        setTigerHistory([]);
        setCapturedGoatPos(null);
        setShowCapturePopup(false);
    };

    const btnStyle = (variant = "default") => ({
        padding: "10px 20px",
        borderRadius: 10,
        border: variant === "primary" ? "none" : "1px solid rgba(200, 150, 50, 0.25)",
        background: variant === "primary"
            ? "linear-gradient(135deg, #c9922a, #f0c060)"
            : "rgba(200, 150, 50, 0.08)",
        color: variant === "primary" ? "#1a1205" : "#f0c060",
        fontWeight: 700,
        fontSize: 13,
        cursor: "pointer",
        fontFamily: "'Georgia', serif",
        letterSpacing: 0.5,
        transition: "transform 0.2s ease",
    });

    // Turn indicator colors
    const turnColor = state.turn === "goat" ? "#70c080" : "#e07070";
    const turnLabel = state.turn === "goat" ? "🐐 Goat's Turn" : "🐯 Tiger's Turn";

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
            <style>{`
                @keyframes goatCaptured {
                    0%   { opacity: 1; transform: translate(-50%, -50%) scale(1); filter: brightness(1); }
                    40%  { opacity: 0.8; transform: translate(-50%, -50%) scale(1.6); filter: brightness(2.5); }
                    100% { opacity: 0; transform: translate(-50%, -50%) scale(0.2); filter: brightness(0); }
                }
                @keyframes popupSlide {
                    0%   { opacity: 0; transform: translateX(-50%) translateY(-10px); }
                    15%  { opacity: 1; transform: translateX(-50%) translateY(0); }
                    80%  { opacity: 1; transform: translateX(-50%) translateY(0); }
                    100% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
                }
                @keyframes turnPulse {
                    0%, 100% { opacity: 1; }
                    50%      { opacity: 0.6; }
                }
            `}</style>

            <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, zIndex: 0 }} />

            <div style={{
                position: "relative",
                zIndex: 1,
                background: "rgba(20, 15, 30, 0.85)",
                backdropFilter: "blur(24px)",
                border: "1px solid rgba(200, 150, 50, 0.2)",
                borderRadius: 24,
                padding: "36px 40px",
                textAlign: "center",
                boxShadow: "0 30px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,200,80,0.08)",
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? "translateY(0)" : "translateY(24px)",
                transition: "opacity 0.6s ease, transform 0.6s ease",
            }}>

                {/* Title */}
                <h1 style={{
                    margin: "0 0 4px",
                    fontSize: 22,
                    fontWeight: 700,
                    letterSpacing: 1,
                    background: "linear-gradient(135deg, #f0c060, #c9922a)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                }}>
                    Bagh-Chal — Local 2 Player
                </h1>

                {/* Turn indicator — pulses to grab attention */}
                <div style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: turnColor,
                    letterSpacing: 0.5,
                    marginBottom: 6,
                    animation: "turnPulse 1.8s ease infinite",
                }}>
                    {turnLabel}
                </div>

                {/* Stats row */}
                <div style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: 20,
                    marginBottom: 18,
                    fontSize: 12,
                    color: "rgba(200, 180, 140, 0.5)",
                    letterSpacing: 0.5,
                }}>
                    <span>Goats to place: <strong style={{ color: "#f0c060" }}>{state.goatsToPlace}</strong></span>
                    <span>Captured: <strong style={{ color: "#e07070" }}>{state.captured}</strong> / 5</span>
                </div>

                {/* Board wrapper */}
                <div style={{ position: "relative", display: "inline-block" }}>

                    {/* Capture popup */}
                    {showCapturePopup && (
                        <div style={{
                            position: "absolute",
                            top: -44,
                            left: "50%",
                            background: "rgba(160, 30, 30, 0.9)",
                            backdropFilter: "blur(10px)",
                            border: "1px solid rgba(220, 80, 80, 0.4)",
                            borderRadius: 10,
                            padding: "8px 20px",
                            color: "#ffcccc",
                            fontWeight: 700,
                            fontSize: 13,
                            letterSpacing: 0.5,
                            animation: "popupSlide 2.5s ease forwards",
                            pointerEvents: "none",
                            whiteSpace: "nowrap",
                            zIndex: 20,
                            boxShadow: "0 4px 20px rgba(180,40,40,0.4)",
                        }}>
                            🐐 Goat Captured! — {state.captured} / 5
                        </div>
                    )}

                    {/* Board */}
                    <div style={{
                        position: "relative",
                        width: 360,
                        height: 360,
                        background: "rgba(210, 180, 140, 0.08)",
                        border: "1px solid rgba(200, 150, 50, 0.25)",
                        borderRadius: 12,
                        boxShadow: "inset 0 0 30px rgba(0,0,0,0.5)",
                    }}>
                        <svg width="360" height="360" viewBox="0 0 360 360">
                            {[0, 1, 2, 3, 4].map(i => (
                                <React.Fragment key={i}>
                                    <line x1="40" y1={40 + i * 70} x2="320" y2={40 + i * 70} stroke="rgba(200,150,50,0.45)" strokeWidth="1.5" />
                                    <line x1={40 + i * 70} y1="40" x2={40 + i * 70} y2="320" stroke="rgba(200,150,50,0.45)" strokeWidth="1.5" />
                                </React.Fragment>
                            ))}
                            <line x1="40" y1="40" x2="320" y2="320" stroke="rgba(200,150,50,0.45)" strokeWidth="1.5" />
                            <line x1="320" y1="40" x2="40" y2="320" stroke="rgba(200,150,50,0.45)" strokeWidth="1.5" />
                            <line x1="180" y1="40" x2="40" y2="180" stroke="rgba(200,150,50,0.45)" strokeWidth="1.5" />
                            <line x1="180" y1="40" x2="320" y2="180" stroke="rgba(200,150,50,0.45)" strokeWidth="1.5" />
                            <line x1="40" y1="180" x2="180" y2="320" stroke="rgba(200,150,50,0.45)" strokeWidth="1.5" />
                            <line x1="320" y1="180" x2="180" y2="320" stroke="rgba(200,150,50,0.45)" strokeWidth="1.5" />
                        </svg>

                        <div style={{ position: "absolute", top: 0, left: 0 }}>
                            {points.map(([r, c]) => {
                                const isTiger = state.tigers.some(t => t[0] === r && t[1] === c);
                                const isGoat = state.goats.some(g => g[0] === r && g[1] === c);
                                const isSelected = selectedPiece?.[0] === r && selectedPiece?.[1] === c;
                                const isValidDest = validMoves.some(m => m.row === r && m.col === c);

                                return (
                                    <div
                                        key={`${r}-${c}`}
                                        onClick={() => handleClick(r, c)}
                                        style={{
                                            position: "absolute",
                                            left: `${40 + c * 70}px`,
                                            top: `${40 + r * 70}px`,
                                            width: 45,
                                            height: 45,
                                            transform: "translate(-50%, -50%)",
                                            display: "flex",
                                            justifyContent: "center",
                                            alignItems: "center",
                                            fontSize: 30,
                                            cursor: "pointer",
                                            borderRadius: "50%",
                                            // Selected piece glows in its player's color
                                            background: isSelected
                                                ? state.turn === "goat"
                                                    ? "rgba(100, 200, 120, 0.15)"
                                                    : "rgba(220, 80, 80, 0.15)"
                                                : isValidDest && !isTiger && !isGoat
                                                    // Valid empty destination — subtle dot hint
                                                    ? "rgba(200, 150, 50, 0.12)"
                                                    : "transparent",
                                            boxShadow: isSelected
                                                ? state.turn === "goat"
                                                    ? "0 0 18px rgba(100, 200, 120, 0.5)"
                                                    : "0 0 18px rgba(220, 80, 80, 0.5)"
                                                : "none",
                                            transition: "transform 0.15s ease, box-shadow 0.15s ease",
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.transform = "translate(-50%, -50%) scale(1.2)"}
                                        onMouseLeave={(e) => e.currentTarget.style.transform = "translate(-50%, -50%) scale(1)"}
                                    >
                                        {/* Valid destination dot when empty */}
                                        {isValidDest && !isTiger && !isGoat && (
                                            <div style={{
                                                width: 10,
                                                height: 10,
                                                borderRadius: "50%",
                                                background: state.turn === "goat"
                                                    ? "rgba(100, 200, 120, 0.7)"
                                                    : "rgba(220, 80, 80, 0.7)",
                                            }} />
                                        )}
                                        {isTiger ? "🐯" : isGoat ? "🐐" : ""}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Captured goat animation */}
                        {capturedGoatPos && (
                            <div style={{
                                position: "absolute",
                                left: `${40 + capturedGoatPos[1] * 70}px`,
                                top: `${40 + capturedGoatPos[0] * 70}px`,
                                width: 45,
                                height: 45,
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                fontSize: 32,
                                animation: "goatCaptured 0.7s ease forwards",
                                pointerEvents: "none",
                                zIndex: 10,
                            }}>
                                🐐
                            </div>
                        )}
                    </div>
                </div>

                {/* Controls */}
                <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 20 }}>
                    <button
                        style={btnStyle()}
                        onClick={handleUndo}
                        onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-1px)"}
                        onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                    >
                        ↩ Undo
                    </button>
                    <button
                        style={btnStyle("primary")}
                        onClick={handleRestart}
                        onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-1px)"}
                        onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                    >
                        ↺ Restart
                    </button>
                    <button
                        style={btnStyle()}
                        onClick={() => navigate("/dashboard")}
                        onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-1px)"}
                        onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                    >
                        ✕ Exit
                    </button>
                </div>

                {/* Winner banner */}
                {winner && (
                    <div style={{
                        marginTop: 20,
                        padding: "14px 24px",
                        background: winner === "Tiger"
                            ? "rgba(200, 60, 60, 0.15)"
                            : "rgba(60, 180, 100, 0.15)",
                        border: `1px solid ${winner === "Tiger"
                            ? "rgba(200, 60, 60, 0.35)"
                            : "rgba(60, 180, 100, 0.35)"}`,
                        borderRadius: 12,
                        fontSize: 20,
                        fontWeight: 700,
                        color: winner === "Tiger" ? "#e07070" : "#70c080",
                        letterSpacing: 1,
                    }}>
                        {winner === "Tiger" ? "🐯 Tigers Win!" : "🐐 Goats Win!"}
                    </div>
                )}

            </div>
        </div>
        <Footer/>
        </div>
    );
};

export default LocalGame;