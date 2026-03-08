import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  captured: 0
};

const GameBoard = () => {
  const [state, setState] = useState(initialState);
  const [selectedGoat, setSelectedGoat] = useState(null);
  const [history, setHistory] = useState([]);
  const [winner, setWinner] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [capturedGoatPos, setCapturedGoatPos] = useState(null);
  const [showCapturePopup, setShowCapturePopup] = useState(false);

  const canvasRef = useRef(null);
  const navigate = useNavigate();
  const { gameId } = useParams();
  const AI_DEPTH = 3;

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
  // AUTH HEADERS — used by all API calls
  // ----------------------------------------
  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
  });

  const saveMoveBackend = async (prevPos, newPos, piece, isCapture = false) => {
    if (!gameId) return;
    try {
      await fetch("http://localhost:8000/api/moves/", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          game: gameId,
          piece,
          from_position: prevPos ? `${prevPos[0]}-${prevPos[1]}` : null,
          to_position: `${newPos[0]}-${newPos[1]}`,
          is_capture: isCapture
        })
      });
    } catch (err) { console.error("Error saving move:", err); }
  };

  const undoMoveBackend = async () => {
    if (!gameId) return;
    try {
      await fetch(`http://localhost:8000/api/games/${gameId}/moves/undo/`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
    } catch (err) { console.error("Undo error:", err); }
  };

  useEffect(() => {
    if (winner && gameId) {
      fetch(`http://localhost:8000/api/games/${gameId}/end/`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          winner: winner.toLowerCase(),
          goats_killed: state.captured,
          ended_at: new Date().toISOString()
        })
      }).catch(err => console.error("Error updating winner:", err));
    }
  }, [winner, gameId, state.captured]);

  // ----------------------------------------
  // GAME LOGIC — unchanged
  // ----------------------------------------
  const isAdjacent = (from, to) =>
    connections[from]?.some(([i, j]) => i === to[0] && j === to[1]);

  const areAllTigersBlocked = (st) => {
    for (const t of st.tigers) {
      const moves = connections[t].filter(([i, j]) =>
        !st.tigers.some(tt => tt[0] === i && tt[1] === j) &&
        !st.goats.some(g => g[0] === i && g[1] === j)
      );
      const captures = connections[t].some(([i, j]) => {
        const mi = 2 * i - t[0], mj = 2 * j - t[1];
        return st.goats.some(g => g[0] === i && g[1] === j) &&
          !st.goats.some(g => g[0] === mi && g[1] === mj) &&
          !st.tigers.some(tt => tt[0] === mi && tt[1] === mj) &&
          connections[[i, j]]?.some(([ni, nj]) => ni === mi && nj === mj);
      });
      if (moves.length || captures) return false;
    }
    return true;
  };

  const handleWinCheck = (st) => {
    if (st.captured >= 5) setWinner("Tiger");
    else if (areAllTigersBlocked(st)) setWinner("Goat");
  };

  const getAllMoves = (st, player) => {
    const moves = [];
    if (player === "goat") {
      if (st.goatsToPlace > 0) {
        for (let p of points) {
          if (!st.goats.some(g => g[0] === p[0] && g[1] === p[1]) &&
            !st.tigers.some(t => t[0] === p[0] && t[1] === p[1]))
            moves.push(["place", p]);
        }
      } else {
        for (let g of st.goats) {
          for (let n of connections[g]) {
            if (!st.goats.some(gg => gg[0] === n[0] && gg[1] === n[1]) &&
              !st.tigers.some(tt => tt[0] === n[0] && tt[1] === n[1]))
              moves.push(["move", g, n]);
          }
        }
      }
    } else {
      for (let t of st.tigers) {
        for (let n of connections[t]) {
          if (!st.goats.some(g => g[0] === n[0] && g[1] === n[1]) &&
            !st.tigers.some(tt => tt[0] === n[0] && tt[1] === n[1]))
            moves.push(["move", t, n]);
          if (st.goats.some(g => g[0] === n[0] && g[1] === n[1])) {
            const jump = [2 * n[0] - t[0], 2 * n[1] - t[1]];
            if (points.some(p => p[0] === jump[0] && p[1] === jump[1]) &&
              !st.goats.some(g => g[0] === jump[0] && g[1] === jump[1]) &&
              !st.tigers.some(tt => tt[0] === jump[0] && tt[1] === jump[1]) &&
              connections[[n[0], n[1]]]?.some(([ni, nj]) => ni === jump[0] && nj === jump[1]))
              moves.push(["capture", t, n, jump]);
          }
        }
      }
    }
    return moves;
  };

  const simulateMove = (st, move, player) => {
    const ns = JSON.parse(JSON.stringify(st));
    if (player === "goat") {
      if (move[0] === "place") { ns.goats.push(move[1]); ns.goatsToPlace -= 1; }
      else ns.goats = ns.goats.map(g =>
        (g[0] === move[1][0] && g[1] === move[1][1] ? move[2] : g));
    } else {
      if (move[0] === "move")
        ns.tigers = ns.tigers.map(t =>
          (t[0] === move[1][0] && t[1] === move[1][1] ? move[2] : t));
      else {
        ns.tigers = ns.tigers.map(t =>
          (t[0] === move[1][0] && t[1] === move[1][1] ? move[3] : t));
        ns.goats = ns.goats.filter(g =>
          !(g[0] === move[2][0] && g[1] === move[2][1]));
        ns.captured += 1;
      }
    }
    return ns;
  };

  const evaluate = (st) => {
    let score = st.captured * 60 - st.goats.length * 8;
    let mob = 0;
    for (let t of st.tigers) {
      mob += connections[t].filter(([i, j]) =>
        !st.goats.some(g => g[0] === i && g[1] === j) &&
        !st.tigers.some(tt => tt[0] === i && tt[1] === j)
      ).length;
    }
    score += mob * 2;
    if (areAllTigersBlocked(st)) score -= 200;
    return score;
  };

  const minimax = (st, depth, player) => {
    if (depth === 0) return evaluate(st);
    const moves = getAllMoves(st, player);
    if (!moves.length) return player === "tiger" ? -9999 : 0;
    if (player === "tiger") {
      let best = -Infinity;
      for (let mv of moves)
        best = Math.max(best, minimax(simulateMove(st, mv, "tiger"), depth - 1, "goat"));
      return best;
    } else {
      let best = Infinity;
      for (let mv of moves)
        best = Math.min(best, minimax(simulateMove(st, mv, "goat"), depth - 1, "tiger"));
      return best;
    }
  };

  const findBestMove = (st) => {
    const moves = getAllMoves(st, "tiger");
    let bestScore = -Infinity, bestMove = null;
    for (let mv of moves) {
      const score = minimax(simulateMove(st, mv, "tiger"), AI_DEPTH - 1, "goat");
      if (score > bestScore) { bestScore = score; bestMove = mv; }
    }
    return bestMove;
  };

  // ----------------------------------------
  // HANDLE GOAT MOVE
  // Capture path has a 700ms animation delay
  // before applying the final state
  // ----------------------------------------
  const handleGoatMove = (from, to, type) => {
    let newState = JSON.parse(JSON.stringify(state));
    const prevState = JSON.parse(JSON.stringify(state));

    if (type === "place") {
      newState.goats.push(to);
      newState.goatsToPlace -= 1;
    } else {
      newState.goats = newState.goats.map(g =>
        (g[0] === from[0] && g[1] === from[1] ? to : g));
    }

    const aiMove = findBestMove(newState);
    setHistory(prev => [...prev, { prevState, goatMove: { from, to, type }, tigerMove: aiMove }]);

    if (aiMove && aiMove[0] === "capture") {
      // Show the goat fading out at aiMove[2] (the goat being jumped)
      setCapturedGoatPos(aiMove[2]);
      setShowCapturePopup(true);

      // Apply intermediate state — goat moved but tiger hasn't captured yet
      // This keeps the goat visible in state during the animation window
      setState({ ...newState, turn: "goat" });

      // After 700ms the animation finishes — now remove the goat from state
      setTimeout(() => {
        const afterTiger = simulateMove(newState, aiMove, "tiger");
        afterTiger.turn = "goat";
        setState(afterTiger);
        setCapturedGoatPos(null);
        handleWinCheck(afterTiger);
      }, 700);

      // Hide the popup after 2.5 seconds
      setTimeout(() => setShowCapturePopup(false), 2500);

    } else {
      // No capture — apply immediately
      const afterTiger = aiMove ? simulateMove(newState, aiMove, "tiger") : newState;
      afterTiger.turn = "goat";
      setState(afterTiger);
      handleWinCheck(afterTiger);
    }

    saveMoveBackend(from, to, "goat");
    if (aiMove) {
      const tigerTo = aiMove[0] === "capture" ? aiMove[3] : aiMove[2];
      saveMoveBackend(aiMove[1], tigerTo, "tiger", aiMove[0] === "capture");
    }
  };

  const handleClick = (row, col) => {
    if (winner || state.turn !== "goat" || capturedGoatPos) return;
    const pos = [row, col];
    if (state.goatsToPlace > 0) {
      if (!state.goats.some(g => g[0] === row && g[1] === col) &&
        !state.tigers.some(t => t[0] === row && t[1] === col))
        handleGoatMove(null, pos, "place");
    } else {
      if (selectedGoat) {
        if (isAdjacent(selectedGoat, pos) &&
          !state.goats.some(g => g[0] === row && g[1] === col) &&
          !state.tigers.some(t => t[0] === row && t[1] === col)) {
          handleGoatMove(selectedGoat, pos, "move");
          setSelectedGoat(null);
        } else setSelectedGoat(null);
      } else if (state.goats.some(g => g[0] === row && g[1] === col)) {
        setSelectedGoat(pos);
      }
    }
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

  return (
    <div>
      <Navbar />
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
            `}</style>

        <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, zIndex: 0 }} />

        {/* Glass card */}
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
            margin: "0 0 6px",
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: 1,
            background: "linear-gradient(135deg, #f0c060, #c9922a)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            Bagh-Chal 🐯🐐
          </h1>

          {/* Status bar */}
          <div style={{
            display: "flex",
            justifyContent: "center",
            gap: 20,
            marginBottom: 20,
            fontSize: 13,
            color: "rgba(200, 180, 140, 0.6)",
            letterSpacing: 0.5,
          }}>
            <span>Turn: <strong style={{ color: "#f0c060" }}>{state.turn}</strong></span>
            <span>Goats left: <strong style={{ color: "#f0c060" }}>{state.goatsToPlace}</strong></span>
            <span>Captured: <strong style={{ color: "#e07070" }}>{state.captured}</strong></span>
          </div>

          {/* Board wrapper — position:relative so popup and animation are relative to it */}
          <div style={{ position: "relative", display: "inline-block" }}>

            {/* Capture popup — sits above the board */}
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
              margin: "0 auto",
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

              {/* Game pieces */}
              <div style={{ position: "absolute", top: 0, left: 0 }}>
                {points.map(([r, c]) => {
                  const isTiger = state.tigers.some(t => t[0] === r && t[1] === c);
                  const isGoat = state.goats.some(g => g[0] === r && g[1] === c);
                  const isSelected = selectedGoat?.[0] === r && selectedGoat?.[1] === c;
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
                        background: isSelected ? "rgba(255, 220, 50, 0.15)" : "transparent",
                        boxShadow: isSelected ? "0 0 18px rgba(255, 220, 50, 0.5)" : "none",
                        transition: "transform 0.2s ease, box-shadow 0.2s ease",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = "translate(-50%, -50%) scale(1.2)"}
                      onMouseLeave={(e) => e.currentTarget.style.transform = "translate(-50%, -50%) scale(1)"}
                    >
                      {isTiger ? "🐯" : isGoat ? "🐐" : ""}
                    </div>
                  );
                })}
              </div>

              {/* Captured goat animation overlay */}
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
              onClick={async () => {
                if (!history.length) return;
                setState({ ...history[history.length - 1].prevState, turn: "goat" });
                setHistory(prev => prev.slice(0, -1));
                setWinner(null);
                await undoMoveBackend();
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-1px)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
            >
              ↩ Undo
            </button>

            <button
              style={btnStyle("primary")}
              onClick={() => { setState(initialState); setWinner(null); setHistory([]); setCapturedGoatPos(null); setShowCapturePopup(false); }}
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
      <Footer />
    </div>
  );
};

export default GameBoard;