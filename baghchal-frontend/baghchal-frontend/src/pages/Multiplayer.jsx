import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";


const ROWS = 5;
const COLS = 5;
const MAX_GOATS = 20;

// Generate points and neighbors
const points = [];
for (let i = 0; i < ROWS; i++) {
    for (let j = 0; j < COLS; j++) {
        points.push([i, j]);
    }
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

const Multiplayer = () => {
    const [state, setState] = useState(initialState);
    const [selectedTiger, setSelectedTiger] = useState(null);
    const [selectedGoat, setSelectedGoat] = useState(null);
    const [history, setHistory] = useState([]);
    const [winner, setWinner] = useState(null);
    const navigate = useNavigate();
    // Animated gradient
    useEffect(() => {
        let angle = 0;
        const interval = setInterval(() => {
            angle += 1;
            document.documentElement.style.setProperty("--bg-angle", `${angle}deg`);
        }, 50);
        return () => clearInterval(interval);
    }, []);

    const nextTurn = (turn) => (turn === "goat" ? "tiger" : "goat");

    const saveHistory = (newState) => {
        setHistory((prev) => [...prev, JSON.parse(JSON.stringify(newState))]);
    };

    const undoMove = () => {
        if (history.length === 0) return;
        const last = history[history.length - 1];
        setState(last);
        setHistory((prev) => prev.slice(0, -1));
        setSelectedGoat(null);
        setSelectedTiger(null);
        setWinner(null);
    };

    const restartGame = () => {
        setState(initialState);
        setSelectedGoat(null);
        setSelectedTiger(null);
        setHistory([]);
        setWinner(null);
    };

    const isAdjacent = (from, to) => {
        return connections[from]?.some(([i, j]) => i === to[0] && j === to[1]);
    };

    const areAllTigersBlocked = (st) => {
        for (const t of st.tigers) {
            // Normal moves
            const moves = connections[t].filter(([i, j]) =>
                !st.tigers.some(tt => tt[0] === i && tt[1] === j) &&
                !st.goats.some(g => g[0] === i && g[1] === j)
            );
            // Captures
            const captures = connections[t].some(([i, j]) => {
                const di = i - t[0];
                const dj = j - t[1];
                const ti = i + di;
                const tj = j + dj;
                return st.goats.some(g => g[0] === i && g[1] === j) &&
                    !st.goats.some(g => g[0] === ti && g[1] === tj) &&
                    !st.tigers.some(tt => tt[0] === ti && tt[1] === tj) &&
                    connections[[i, j]]?.some(([ni, nj]) => ni === ti && nj === tj);
            });
            if (moves.length || captures) return false;
        }
        return true;
    };

    const handleWinCheck = (st) => {
        if (st.captured >= 5) setWinner("Tiger");
        else if (areAllTigersBlocked(st)) setWinner("Goat");
    };

    const handleClick = (row, col) => {
        if (winner) return;
        const pos = [row, col];

        if (state.turn === "goat") {
            // Goat placement
            if (state.goatsToPlace > 0) {
                if (!state.goats.some(g => g[0] === row && g[1] === col) &&
                    !state.tigers.some(t => t[0] === row && t[1] === col)) {
                    const newState = {
                        ...state,
                        goats: [...state.goats, pos],
                        goatsToPlace: state.goatsToPlace - 1,
                        turn: nextTurn(state.turn)
                    };
                    saveHistory(newState);
                    setState(newState);
                    handleWinCheck(newState);
                }
                return;
            }
            // Goat move
            if (selectedGoat) {
                if (!state.goats.some(g => g[0] === row && g[1] === col) &&
                    !state.tigers.some(t => t[0] === row && t[1] === col) &&
                    isAdjacent(selectedGoat, pos)) {
                    const newGoats = state.goats.map(g => g[0] === selectedGoat[0] && g[1] === selectedGoat[1] ? pos : g);
                    const newState = { ...state, goats: newGoats, turn: nextTurn(state.turn) };
                    saveHistory(newState);
                    setState(newState);
                    setSelectedGoat(null);
                    handleWinCheck(newState);
                } else setSelectedGoat(null);
            } else if (state.goats.some(g => g[0] === row && g[1] === col)) setSelectedGoat(pos);
        } else {
            // Tiger moves
            if (selectedTiger) {
                const [si, sj] = selectedTiger;
                const [ti, tj] = pos;

                const di = ti - si;
                const dj = tj - sj;

                // Capture logic: vertical, horizontal, diagonal
                if ((Math.abs(di) === 2 && dj === 0) ||
                    (Math.abs(dj) === 2 && di === 0) ||
                    (Math.abs(di) === 2 && Math.abs(dj) === 2)) {

                    const mi = si + di / 2;
                    const mj = sj + dj / 2;

                    const goatExists = state.goats.some(g => g[0] === mi && g[1] === mj);
                    const destinationEmpty = !state.goats.some(g => g[0] === ti && g[1] === tj) &&
                        !state.tigers.some(t => t[0] === ti && t[1] === tj);
                    const jumpReachable = connections[[mi, mj]]?.some(([ni, nj]) => ni === ti && nj === tj);

                    if (goatExists && destinationEmpty && jumpReachable) {
                        const newTigers = state.tigers.map(t => t[0] === si && t[1] === sj ? pos : t);
                        const newGoats = state.goats.filter(g => !(g[0] === mi && g[1] === mj));
                        const newState = { ...state, tigers: newTigers, goats: newGoats, turn: nextTurn(state.turn), captured: state.captured + 1 };
                        saveHistory(newState);
                        setState(newState);
                        setSelectedTiger(null);
                        handleWinCheck(newState);
                        return;
                    }
                }

                // Normal move
                if (!state.tigers.some(t => t[0] === ti && t[1] === tj) &&
                    !state.goats.some(g => g[0] === ti && g[1] === tj) &&
                    isAdjacent(selectedTiger, pos)) {
                    const newTigers = state.tigers.map(t => t[0] === si && t[1] === sj ? pos : t);
                    const newState = { ...state, tigers: newTigers, turn: nextTurn(state.turn) };
                    saveHistory(newState);
                    setState(newState);
                    setSelectedTiger(null);
                    handleWinCheck(newState);
                } else setSelectedTiger(null);
            } else if (state.tigers.some(t => t[0] === row && t[1] === col)) setSelectedTiger(pos);
        }
    };

    return (
        <div className="gameboard-page">
            <div className="board-container">
                <h1 className='multiplayer-title'>Bagh-Chal 🐯🐐</h1>
                <p>Turn: {state.turn} | Goats left: {state.goatsToPlace} | Goats killed: {state.captured}</p>
                <div className="board">
                    {Array.from({ length: ROWS }).map((_, r) => (
                        <div key={r} className="row">
                            {Array.from({ length: COLS }).map((_, c) => {
                                const isTiger = state.tigers.some(t => t[0] === r && t[1] === c);
                                const isGoat = state.goats.some(g => g[0] === r && g[1] === c);
                                const isSelected = (selectedTiger?.[0] === r && selectedTiger?.[1] === c) || (selectedGoat?.[0] === r && selectedGoat?.[1] === c);
                                return (
                                    <div key={c} className={`cell ${isSelected ? "selected" : ""}`} onClick={() => handleClick(r, c)}>
                                        {isTiger ? "🐯" : isGoat ? "🐐" : ""}
                                    </div>
                                )
                            })}
                        </div>
                    ))}
                </div>
                <div className="controls">
                    <button onClick={undoMove}>Undo</button>
                    <button onClick={restartGame}>Restart</button>
                    {/* UPDATED: Exit button */}
                    <button onClick={() => navigate("/dashboard")}>Exit</button>
                </div>
                {winner && <div className="winner">{winner} Wins!</div>}
            </div>

            <style jsx>{`
            .multiplayer-title{color: #fff;
          text-shadow: 0 0 15px #00f2fe, 0 0 25px #4facfe;}
        .gameboard-page {
          height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          background: linear-gradient(var(--bg-angle, 45deg), #1f1c2c, #928dab);
        }
        .board-container {
          background: rgba(255,255,255,0.25);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 25px;
          padding: 40px;
          text-align: center;
          box-shadow: 0 20px 50px rgba(0,0,0,0.25),
                      inset 0 0 0 1px rgba(255,255,255,0.35);
        }
        .board { display: grid; gap: 5px; }
        .row { display: grid; grid-template-columns: repeat(${COLS}, 60px); gap: 5px; }
        .cell {
          width: 60px;
          height: 60px;
          background: #f0e5d8;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 2rem;
          cursor: pointer;
          border: 2px solid #000;
          border-radius: 8px;
        }
        .cell.selected { outline: 3px solid yellow; }
        .controls { margin-top: 15px; display: flex; justify-content: center; gap: 15px; }
        button { padding: 8px 16px; font-size: 16px; cursor: pointer; border-radius: 10px; border: none; background: #4facfe; color: #fff; transition: 0.3s; }
        button:hover { transform: scale(1.05); box-shadow: 0 0 10px #fff; }
        .winner { margin-top: 10px; font-size: 1.5rem; font-weight: bold; color: red; }
      `}</style>
        </div>
    )
};

export default Multiplayer;
