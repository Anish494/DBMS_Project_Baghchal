import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

const ROWS = 5;
const COLS = 5;
const MAX_GOATS = 20;

// Generate points and neighbors
const points = [];
for (let i = 0; i < ROWS; i++) {
  for (let j = 0; j < COLS; j++) points.push([i, j]);
}

// Directions: orthogonal + diagonal
const directions = [
  [-1, 0], [1, 0], [0, -1], [0, 1],
  [-1, -1], [-1, 1], [1, -1], [1, 1]
];

// Map neighbors
const connections = {};
points.forEach(([i, j]) => {
  const neighbors = [];
  directions.forEach(([dx, dy]) => {
    const ni = i + dx;
    const nj = j + dy;
    if (ni >= 0 && ni < ROWS && nj >= 0 && nj < COLS) neighbors.push([ni, nj]);
  });
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

  const navigate = useNavigate();
  const { gameId } = useParams();
  const AI_DEPTH = 3;

  // --- Backend API helpers ---
  const saveMoveBackend = async (prevPos, newPos, piece, isCapture = false) => {
    if (!gameId) return;
    await fetch(`http://localhost:8000/api/games/${gameId}/moves/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        game:gameId,
        piece,
        from_position: prevPos ? `${prevPos[0]}-${prevPos[1]}` : null,
        to_position: `${newPos[0]}-${newPos[1]}`,
        is_capture: isCapture
      })
    });
  };

  const undoMoveBackend = async () => {
    if (!gameId) return;
    await fetch(`http://localhost:8000/api/games/${gameId}/moves/undo/`, { method: "POST" });
  };

  // --- Auth & Animated Background ---
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) navigate("/");
  }, [navigate]);

  useEffect(() => {
    let angle = 0;
    const interval = setInterval(() => {
      angle += 1;
      document.documentElement.style.setProperty("--bg-angle", `${angle}deg`);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // --- Utility functions ---
  const nextTurn = (turn) => (turn === "goat" ? "tiger" : "goat");

  const isAdjacent = (from, to) =>
    connections[from]?.some(([i, j]) => i === to[0] && j === to[1]);

  const areAllTigersBlocked = (st) => {
    for (const t of st.tigers) {
      const moves = connections[t].filter(([i, j]) =>
        !st.tigers.some(tt => tt[0] === i && tt[1] === j) &&
        !st.goats.some(g => g[0] === i && g[1] === j)
      );
      const captures = connections[t].some(([i, j]) => {
        const mi = 2 * i - t[0];
        const mj = 2 * j - t[1];
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

  // --- Move Simulation & AI ---
  const getAllMoves = (st, player) => {
    const moves = [];
    if (player === "goat") {
      if (st.goatsToPlace > 0) {
        for (let p of points) {
          if (!st.goats.some(g => g[0] === p[0] && g[1] === p[1]) &&
              !st.tigers.some(t => t[0] === p[0] && t[1] === p[1])) moves.push(["place", p]);
        }
      } else {
        for (let g of st.goats) {
          for (let n of connections[g]) {
            if (!st.goats.some(gg => gg[0] === n[0] && gg[1] === n[1]) &&
                !st.tigers.some(tt => tt[0] === n[0] && tt[1] === n[1])) moves.push(["move", g, n]);
          }
        }
      }
    } else { // tiger
      for (let t of st.tigers) {
        for (let n of connections[t]) {
          if (!st.goats.some(g => g[0] === n[0] && g[1] === n[1]) &&
              !st.tigers.some(tt => tt[0] === n[0] && tt[1] === n[1])) moves.push(["move", t, n]);
          // capture
          if (st.goats.some(g => g[0] === n[0] && g[1] === n[1])) {
            const jump = [2 * n[0] - t[0], 2 * n[1] - t[1]];
            if (points.some(p => p[0] === jump[0] && p[1] === jump[1]) &&
                !st.goats.some(g => g[0] === jump[0] && g[1] === jump[1]) &&
                !st.tigers.some(tt => tt[0] === jump[0] && tt[1] === jump[1]) &&
                connections[[n[0], n[1]]]?.some(([ni, nj]) => ni === jump[0] && nj === jump[1])) {
              moves.push(["capture", t, n, jump]);
            }
          }
        }
      }
    }
    return moves;
  };

  const simulateMove = (st, move, player) => {
    const ns = JSON.parse(JSON.stringify(st));
    if (player === "goat") {
      if (move[0] === "place") {
        ns.goats.push(move[1]);
        ns.goatsToPlace -= 1;
      } else {
        ns.goats = ns.goats.map(g => (g[0] === move[1][0] && g[1] === move[1][1] ? move[2] : g));
      }
    } else {
      if (move[0] === "move") ns.tigers = ns.tigers.map(t => (t[0] === move[1][0] && t[1] === move[1][1] ? move[2] : t));
      else { // capture
        ns.tigers = ns.tigers.map(t => (t[0] === move[1][0] && t[1] === move[1][1] ? move[3] : t));
        ns.goats = ns.goats.filter(g => !(g[0] === move[2][0] && g[1] === move[2][1]));
        ns.captured += 1;
      }
    }
    return ns;
  };

  const evaluate = (st) => {
    let score = st.captured * 60 - st.goats.length * 8;
    let mob = 0;
    for (let t of st.tigers) {
      mob += connections[t].filter(([i, j]) => !st.goats.some(g => g[0] === i && g[1] === j) &&
                                                !st.tigers.some(tt => tt[0] === i && tt[1] === j)).length;
    }
    score += mob * 2;
    if (getAllMoves(st, "tiger").some(m => m[0] === "capture")) score += 25;
    if (areAllTigersBlocked(st)) score -= 200;
    return score;
  };

  const minimax = (st, depth, player) => {
    if (depth === 0) return evaluate(st);
    const moves = getAllMoves(st, player);
    if (!moves.length) return player === "tiger" ? -9999 : 0;
    if (player === "tiger") {
      let best = -Infinity;
      for (let mv of moves) best = Math.max(best, minimax(simulateMove(st, mv, "tiger"), depth - 1, "goat"));
      return best;
    } else {
      let best = Infinity;
      for (let mv of moves) best = Math.min(best, minimax(simulateMove(st, mv, "goat"), depth - 1, "tiger"));
      return best;
    }
  };

  const findBestMove = (st, player) => {
    const moves = getAllMoves(st, player);
    let bestScore = -Infinity, bestMove = null;
    for (let mv of moves) {
      const score = minimax(simulateMove(st, mv, player), AI_DEPTH - 1, "goat");
      if (score > bestScore) {
        bestScore = score;
        bestMove = mv;
      }
    }
    return bestMove;
  };

  // --- Tiger AI moves (after goat) ---
  const performTigerMove = (currentState) => {
    if (winner) return currentState;
    const aiMove = findBestMove(currentState, "tiger");
    if (!aiMove) return { ...currentState, turn: "goat" };

    const ns = simulateMove(currentState, aiMove, "tiger");
    return { ...ns, turn: "goat", lastTigerMove: aiMove };
  };

  // --- Handle goat move and AI together ---
  const handleGoatMove = (from, to, type, capturedGoat = null) => {
    let newState = JSON.parse(JSON.stringify(state));

    // Save prev state
    const prevState = JSON.parse(JSON.stringify(state));

    // Goat move
    if (type === "place") {
      newState.goats.push(to);
      newState.goatsToPlace -= 1;
    } else if (type === "move") {
      newState.goats = newState.goats.map(g => (g[0] === from[0] && g[1] === from[1] ? to : g));
    }

    // Tiger AI move
    const afterTiger = performTigerMove(newState);

    // Save history: prevState + goatMove + tigerMove
    setHistory(prev => [...prev, {
      prevState,
      goatMove: { from, to, type, capturedGoat },
      tigerMove: afterTiger.lastTigerMove ? { ...afterTiger.lastTigerMove } : null
    }]);

    setState(afterTiger);
    handleWinCheck(afterTiger);

    // Save moves to backend
    if (type === "place" || type === "move") saveMoveBackend(from, to, "goat");
    if (afterTiger.lastTigerMove) {
      const mv = afterTiger.lastTigerMove;
      const tigerTo = mv[0] === "capture" ? mv[3] : mv[2];
      saveMoveBackend(mv[1], tigerTo, "tiger", mv[0] === "capture");
    }
  };

  // --- Undo move ---
  const undoMove = async () => {
    if (!history.length) return;
    const last = history[history.length - 1];
    const restoredState = JSON.parse(JSON.stringify(last.prevState));
    setState({ ...restoredState, turn: "goat" });
    setHistory(prev => prev.slice(0, -1));
    setWinner(null);
    setSelectedGoat(null);
    await undoMoveBackend();
  };

  // --- User click handler ---
  const handleClick = (row, col) => {
    if (winner) return;
    const pos = [row, col];

    if (state.turn !== "goat") return;

    // Place goat
    if (state.goatsToPlace > 0 &&
        !state.goats.some(g => g[0] === row && g[1] === col) &&
        !state.tigers.some(t => t[0] === row && t[1] === col)) {
      handleGoatMove(null, pos, "place");
      return;
    }

    // Move goat
    if (selectedGoat) {
      if (!state.goats.some(g => g[0] === row && g[1] === col) &&
          !state.tigers.some(t => t[0] === row && t[1] === col) &&
          isAdjacent(selectedGoat, pos)) {
        handleGoatMove(selectedGoat, pos, "move");
        setSelectedGoat(null);
      } else setSelectedGoat(null);
    } else if (state.goats.some(g => g[0] === row && g[1] === col)) {
      setSelectedGoat(pos);
    }
  };

  // --- Restart game ---
  const restartGame = () => {
    setState(initialState);
    setSelectedGoat(null);
    setHistory([]);
    setWinner(null);
  };

  // --- Render ---
  return (
    <div className="gameboard-page">
      <div className="board-container">
        <h1 className="gameboard-title">Bagh-Chal 🐯🐐</h1>
        <p>Turn: {state.turn} | Goats left: {state.goatsToPlace} | Goats killed: {state.captured}</p>

        <div className="svg-board">
          <svg width="360" height="360" viewBox="0 0 360 360">
            {[0,1,2,3,4].map(i => <line key={`h-${i}`} x1="40" y1={40+i*70} x2="320" y2={40+i*70} stroke="black" strokeWidth="2"/>)}
            {[0,1,2,3,4].map(i => <line key={`v-${i}`} x1={40+i*70} y1="40" x2={40+i*70} y2="320" stroke="black" strokeWidth="2"/>)}
            <line x1="40" y1="40" x2="320" y2="320" stroke="black" strokeWidth="2"/>
            <line x1="320" y1="40" x2="40" y2="320" stroke="black" strokeWidth="2"/>
          </svg>

          <div className="nodes">
            {points.map(([r, c]) => {
              const isTiger = state.tigers.some(t => t[0] === r && t[1] === c);
              const isGoat = state.goats.some(g => g[0] === r && g[1] === c);
              const isSelected = (selectedGoat?.[0] === r && selectedGoat?.[1] === c);
              return (
                <div
                  key={`${r}-${c}`}
                  className={`node ${isSelected ? "selected" : ""}`}
                  style={{ left: `${40+c*70}px`, top: `${40+r*70}px` }}
                  onClick={() => handleClick(r, c)}
                >
                  {isTiger ? "🐯" : isGoat ? "🐐" : ""}
                </div>
              );
            })}
          </div>
        </div>

        <div className="controls">
          <button onClick={undoMove}>Undo</button>
          <button onClick={restartGame}>Restart</button>
          <button onClick={() => navigate("/dashboard")}>Exit</button>
        </div>

        {winner && <div className="winner">{winner} Wins!</div>}
      </div>

      <style jsx>{`
        .gameboard-page {
          height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          background: linear-gradient(var(--bg-angle, 45deg), #1f1c2c, #928dab);
        }
        .board-container {
          background: rgba(255, 255, 255, 0.25);
          backdrop-filter: blur(20px);
          border-radius: 25px;
          padding: 40px;
          text-align: center;
        }
        .gameboard-title {
          color: white;
          text-shadow: 0 0 15px #00f2fe, 0 0 25px #4facfe;
        }
        .svg-board { position: relative; width: 360px; height: 360px; margin: 20px auto; }
        .nodes { position: absolute; top: 0; left: 0; }
        .node {
          position: absolute;
          width: 32px;
          height: 32px;
          transform: translate(-50%, -50%);
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 26px;
          cursor: pointer;
        }
        .node.selected { outline: 3px solid yellow; border-radius: 50%; }
        .controls { margin-top: 15px; display: flex; justify-content: center; gap: 15px; }
        button { padding: 8px 16px; font-size: 16px; border-radius: 10px; border: none; background: #4facfe; color: white; cursor: pointer; }
        .winner { margin-top: 10px; font-size: 1.5rem; font-weight: bold; color: red; }
      `}</style>
    </div>
  );
};

export default GameBoard;
