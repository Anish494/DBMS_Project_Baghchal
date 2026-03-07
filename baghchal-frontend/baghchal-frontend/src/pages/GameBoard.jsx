import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

const ROWS = 5;
const COLS = 5;
const MAX_GOATS = 20;

const points = [];
for (let i = 0; i < ROWS; i++) {
  for (let j = 0; j < COLS; j++) points.push([i, j]);
}

/** * UPDATED GRID CONNECTIONS: 
 * Restricts diagonal moves to only those points where (i+j) is even.
 */
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

  const navigate = useNavigate();
  const { gameId } = useParams();
  const AI_DEPTH = 3;

  const saveMoveBackend = async (prevPos, newPos, piece, isCapture = false) => {
    if (!gameId) return;
    try {
      await fetch("http://localhost:8000/api/moves/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game: gameId,
          piece: piece,
          from_position: prevPos ? `${prevPos[0]}-${prevPos[1]}` : null,
          to_position: `${newPos[0]}-${newPos[1]}`,
          is_capture: isCapture
        })
      });
    } catch (error) { console.error("Error saving move:", error); }
  };

  const undoMoveBackend = async () => {
    if (!gameId) return;
    try {
      await fetch(`http://localhost:8000/api/games/${gameId}/moves/undo/`, { method: "POST" });
    } catch (error) { console.error("Undo error:", error); }
  };

  const isAdjacent = (from, to) => connections[from]?.some(([i, j]) => i === to[0] && j === to[1]);

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

  useEffect(() => {
    if (winner && gameId) {
      fetch(`http://localhost:8000/api/games/${gameId}/end/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          winner: winner.toLowerCase(),
          goats_killed: state.captured,
          ended_at: new Date().toISOString()
        })
      }).catch(err => console.error("Error updating winner:", err));
    }
  }, [winner, gameId, state.captured]);

  const handleWinCheck = (st) => {
    if (st.captured >= 5) setWinner("Tiger");
    else if (areAllTigersBlocked(st)) setWinner("Goat");
  };

  // --- AI Logic (Kept from previous version) ---
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
    } else {
      for (let t of st.tigers) {
        for (let n of connections[t]) {
          if (!st.goats.some(g => g[0] === n[0] && g[1] === n[1]) &&
              !st.tigers.some(tt => tt[0] === n[0] && tt[1] === n[1])) moves.push(["move", t, n]);
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
      if (move[0] === "place") { ns.goats.push(move[1]); ns.goatsToPlace -= 1; }
      else ns.goats = ns.goats.map(g => (g[0] === move[1][0] && g[1] === move[1][1] ? move[2] : g));
    } else {
      if (move[0] === "move") ns.tigers = ns.tigers.map(t => (t[0] === move[1][0] && t[1] === move[1][1] ? move[2] : t));
      else {
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
      mob += connections[t].filter(([i, j]) => !st.goats.some(g => g[0] === i && g[1] === j) && !st.tigers.some(tt => tt[0] === i && tt[1] === j)).length;
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
      for (let mv of moves) best = Math.max(best, minimax(simulateMove(st, mv, "tiger"), depth - 1, "goat"));
      return best;
    } else {
      let best = Infinity;
      for (let mv of moves) best = Math.min(best, minimax(simulateMove(st, mv, "goat"), depth - 1, "tiger"));
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

  const handleGoatMove = (from, to, type) => {
    let newState = JSON.parse(JSON.stringify(state));
    const prevState = JSON.parse(JSON.stringify(state));

    if (type === "place") {
      newState.goats.push(to);
      newState.goatsToPlace -= 1;
    } else {
      newState.goats = newState.goats.map(g => (g[0] === from[0] && g[1] === from[1] ? to : g));
    }

    const aiMove = findBestMove(newState);
    let afterTiger = aiMove ? simulateMove(newState, aiMove, "tiger") : newState;
    afterTiger.turn = "goat";

    setHistory(prev => [...prev, { prevState, goatMove: { from, to, type }, tigerMove: aiMove }]);
    setState(afterTiger);
    handleWinCheck(afterTiger);

    saveMoveBackend(from, to, "goat");
    if (aiMove) {
      const tigerTo = aiMove[0] === "capture" ? aiMove[3] : aiMove[2];
      saveMoveBackend(aiMove[1], tigerTo, "tiger", aiMove[0] === "capture");
    }
  };

  const handleClick = (row, col) => {
    if (winner || state.turn !== "goat") return;
    const pos = [row, col];

    if (state.goatsToPlace > 0) {
      if (!state.goats.some(g => g[0] === row && g[1] === col) && !state.tigers.some(t => t[0] === row && t[1] === col)) {
        handleGoatMove(null, pos, "place");
      }
    } else {
      if (selectedGoat) {
        if (isAdjacent(selectedGoat, pos) && !state.goats.some(g => g[0] === row && g[1] === col) && !state.tigers.some(t => t[0] === row && t[1] === col)) {
          handleGoatMove(selectedGoat, pos, "move");
          setSelectedGoat(null);
        } else setSelectedGoat(null);
      } else if (state.goats.some(g => g[0] === row && g[1] === col)) {
        setSelectedGoat(pos);
      }
    }
  };

  return (
    <div className="gameboard-page">
      <div className="board-container">
        <h1 className="gameboard-title">Bagh-Chal 🐯🐐</h1>
        <p className="status-text">Turn: {state.turn} | Goats left: {state.goatsToPlace} | Killed: {state.captured}</p>

        <div className="svg-board">
          <svg width="360" height="360" viewBox="0 0 360 360">
            {/* Grid Lines */}
            {[0,1,2,3,4].map(i => (
              <React.Fragment key={i}>
                <line x1="40" y1={40+i*70} x2="320" y2={40+i*70} stroke="black" strokeWidth="2"/>
                <line x1={40+i*70} y1="40" x2={40+i*70} y2="320" stroke="black" strokeWidth="2"/>
              </React.Fragment>
            ))}

            {/* Corrected Diagonal Connections */}
            <line x1="40" y1="40" x2="320" y2="320" stroke="black" strokeWidth="2"/>
            <line x1="320" y1="40" x2="40" y2="320" stroke="black" strokeWidth="2"/>
            
            {/* Inner Diagonal Diamonds */}
            <line x1="180" y1="40" x2="40" y2="180" stroke="black" strokeWidth="2"/>
            <line x1="180" y1="40" x2="320" y2="180" stroke="black" strokeWidth="2"/>
            <line x1="40" y1="180" x2="180" y2="320" stroke="black" strokeWidth="2"/>
            <line x1="320" y1="180" x2="180" y2="320" stroke="black" strokeWidth="2"/>
          </svg>

          <div className="nodes">
            {points.map(([r, c]) => {
              const isTiger = state.tigers.some(t => t[0] === r && t[1] === c);
              const isGoat = state.goats.some(g => g[0] === r && g[1] === c);
              const isSelected = selectedGoat?.[0] === r && selectedGoat?.[1] === c;
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
          <button onClick={async () => {
             if (!history.length) return;
             setState({ ...history[history.length - 1].prevState, turn: "goat" });
             setHistory(prev => prev.slice(0, -1));
             setWinner(null);
             await undoMoveBackend();
          }}>Undo</button>
          <button onClick={() => { setState(initialState); setWinner(null); setHistory([]); }}>Restart</button>
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
          animation: bgRotate 10s infinite linear;
        }
        @keyframes bgRotate {
          from { --bg-angle: 0deg; }
          to { --bg-angle: 360deg; }
        }
        .board-container {
          background: rgba(255, 255, 255, 0.25);
          backdrop-filter: blur(20px);
          border-radius: 25px;
          padding: 40px;
          text-align: center;
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
          border: 1px solid rgba(255, 255, 255, 0.18);
        }
        .gameboard-title {
          color: white;
          text-shadow: 0 0 15px #00f2fe, 0 0 25px #4facfe;
          font-size: 2.5rem;
          margin-bottom: 5px;
        }
        .status-text {
          color: #e0e0e0;
          font-weight: 500;
          margin-bottom: 20px;
        }
        .svg-board { 
          position: relative; 
          width: 360px; 
          height: 360px; 
          margin: 20px auto; 
          background: rgba(210, 180, 140, 0.8);
          border-radius: 10px;
          padding: 5px;
          box-shadow: inset 0 0 10px rgba(0,0,0,0.2);
        }
        .nodes { position: absolute; top: 0; left: 0; }
        .node {
          position: absolute;
          width: 45px;
          height: 45px;
          transform: translate(-50%, -50%);
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 30px;
          cursor: pointer;
          transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .node:hover { transform: translate(-50%, -50%) scale(1.2); }
        .node.selected { 
          background: rgba(255, 255, 0, 0.3);
          box-shadow: 0 0 15px yellow;
          border-radius: 50%; 
        }
        .controls { margin-top: 25px; display: flex; justify-content: center; gap: 15px; }
        button { 
          padding: 10px 20px; 
          font-size: 16px; 
          border-radius: 12px; 
          border: none; 
          background: #4facfe; 
          color: white; 
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }
        button:hover {
          background: #00f2fe;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 242, 254, 0.4);
        }
        .winner { 
          margin-top: 20px; 
          font-size: 2rem; 
          font-weight: bold; 
          color: #ff3e3e; 
          text-shadow: 0 0 10px rgba(0,0,0,0.5);
          animation: pulse 1s infinite alternate;
        }
        @keyframes pulse {
          from { transform: scale(1); }
          to { transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
};

export default GameBoard;