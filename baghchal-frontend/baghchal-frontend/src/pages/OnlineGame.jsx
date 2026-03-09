import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { API_URL, WS_URL } from "../config";


const CONNECTIONS = {};
for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
        const key = `${r},${c}`;
        const neighbors = [];
        const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
        if ((r + c) % 2 === 0) dirs.push([-1,-1],[-1,1],[1,-1],[1,1]);
        for (const [dr, dc] of dirs) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < 5 && nc >= 0 && nc < 5) neighbors.push([nr, nc]);
        }
        CONNECTIONS[key] = neighbors;
    }
}

const getNeighbors = (r, c) => CONNECTIONS[`${r},${c}`] || [];

const getValidTigerMoves = (r, c, board) => {
    const moves = [];
    for (const [nr, nc] of getNeighbors(r, c)) {
        if (!board[nr][nc]) {
            moves.push({ type: "move", to: [nr, nc] });
        } else if (board[nr][nc] === "goat") {
            const jr = 2 * nr - r, jc = 2 * nc - c;
            if (jr >= 0 && jr < 5 && jc >= 0 && jc < 5 && !board[jr][jc]) {
                moves.push({ type: "capture", to: [jr, jc], over: [nr, nc] });
            }
        }
    }
    return moves;
};

const getValidGoatMoves = (r, c, board) => {
    const moves = [];
    for (const [nr, nc] of getNeighbors(r, c)) {
        if (!board[nr][nc]) moves.push([nr, nc]);
    }
    return moves;
};

const initialBoard = () => {
    const b = Array(5).fill(null).map(() => Array(5).fill(null));
    b[0][0] = b[0][4] = b[4][0] = b[4][4] = "tiger";
    return b;
};

const checkTigersBlocked = (board) => {
    for (let r = 0; r < 5; r++)
        for (let c = 0; c < 5; c++)
            if (board[r][c] === "tiger" && getValidTigerMoves(r, c, board).length > 0)
                return false;
    return true;
};

const OnlineGame = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { role, room_name } = location.state || {};
    const room_code = window.location.pathname.split("/online/")[1];

    const canvasRef = useRef(null);
    const wsRef = useRef(null);
    const chatEndRef = useRef(null);

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const myRole = role;

    // ── Game state + ref mirrors ─────────────────────
    // WS handler reads from refs (always current),
    // UI reads from state (triggers re-render)
    const [board, setBoard] = useState(initialBoard());
    const boardRef = useRef(initialBoard());

    const [phase, setPhase] = useState("placement");
    const phaseRef = useRef("placement");

    const [goatsPlaced, setGoatsPlaced] = useState(0);
    const goatsPlacedRef = useRef(0);

    const [goatsCaptured, setGoatsCaptured] = useState(0);
    const goatsCapturedRef = useRef(0);

    const [turn, setTurn] = useState("goat");
    const turnRef = useRef("goat");

    const [selectedTiger, setSelectedTiger] = useState(null);
    const [selectedGoat, setSelectedGoat] = useState(null);
    const [validMoves, setValidMoves] = useState([]);
    const [capturedAnim, setCapturedAnim] = useState(null);
    const capturedAnimRef = useRef(null);

    // Always update state AND ref together
    const updateBoard = (v) => { boardRef.current = v; setBoard(v); };
    const updatePhase = (v) => { phaseRef.current = v; setPhase(v); };
    const updateGoatsPlaced = (v) => { goatsPlacedRef.current = v; setGoatsPlaced(v); };
    const updateGoatsCaptured = (v) => { goatsCapturedRef.current = v; setGoatsCaptured(v); };
    const updateTurn = (v) => { turnRef.current = v; setTurn(v); };
    const updateCapturedAnim = (v) => { capturedAnimRef.current = v; setCapturedAnim(v); };

    // ── Connection state ─────────────────────────────
    const [opponentName, setOpponentName] = useState(null);
    const [connected, setConnected] = useState(false);
    const [opponentLeft, setOpponentLeft] = useState(false);
    const [winner, setWinner] = useState(null);

    // ── Chat ─────────────────────────────────────────
    const [messages, setMessages] = useState([]);
    const [chatInput, setChatInput] = useState("");

    // ─────────────────────────────────────────────────
    // SERIALIZE GAME STATE — sent with every move
    // backend saves this so refresh can restore it
    // ─────────────────────────────────────────────────
    const serializeGameState = (b, t, p, gp, gc) => ({
        board: b,
        turn: t,
        phase: p,
        goats_placed: gp,
        goats_captured: gc,
    });

    // ─────────────────────────────────────────────────
    // CANVAS
    // ─────────────────────────────────────────────────
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        let animId, frame = 0;
        const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
        resize();
        window.addEventListener("resize", resize);
        const draw = () => {
            const cw = canvas.width, ch = canvas.height;
            ctx.clearRect(0, 0, cw, ch);
            ctx.fillStyle = "#0d0b14"; ctx.fillRect(0, 0, cw, ch);
            ctx.strokeStyle = "rgba(180,130,40,0.07)"; ctx.lineWidth = 1;
            for (let x = 0; x < cw; x += 60) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,ch); ctx.stroke(); }
            for (let y = 0; y < ch; y += 60) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(cw,y); ctx.stroke(); }
            const p = Math.sin(frame * 0.01) * 20;
            [[cw*.15,ch*.2,180,"rgba(180,100,20,0.06)"],[cw*.85,ch*.7,220,"rgba(120,60,160,0.06)"],[cw*.5,ch*.9,150,"rgba(200,140,30,0.05)"]].forEach(([x,y,r,col])=>{
                const b = ctx.createRadialGradient(x,y,0,x,y,r+p);
                b.addColorStop(0,col); b.addColorStop(1,"transparent");
                ctx.fillStyle=b; ctx.beginPath(); ctx.arc(x,y,r+p,0,Math.PI*2); ctx.fill();
            });
            frame++; animId = requestAnimationFrame(draw);
        };
        draw();
        return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
    }, []);

    // ─────────────────────────────────────────────────
    // WEBSOCKET
    // ─────────────────────────────────────────────────
    useEffect(() => {
        if (!role || !room_code) { navigate("/online"); return; }

        const token = localStorage.getItem("access_token");
        const ws = new WebSocket(`${WS_URL}/ws/game/${room_code}/?token=${token}`);
        wsRef.current = ws;

        ws.onopen = () => console.log("WS open");

        ws.onmessage = (e) => {
            let data;
            try { data = JSON.parse(e.data); }
            catch { return; }

            console.log("WS received:", data);

            switch (data.type) {

                case "player_joined":
                    if (data.username !== user.username) {
                        setOpponentName(data.username);
                        setConnected(true);
                        setOpponentLeft(false); // ← reset on reconnect
                        setMessages(prev => [...prev, {
                            type: "system",
                            // if messages already exist, it's a reconnect not a first join
                            text: `${data.username} ${prev.length > 0 ? "reconnected" : "joined"} as ${data.role === "goat" ? "🐐 Goat" : "🐯 Tiger"}`,
                        }]);
                    }
                    break;

                case "player_left":
                    if (data.username !== user.username) {
                        setOpponentLeft(true);
                        setMessages(prev => [...prev, {
                            type: "system",
                            text: `${data.username} disconnected`,
                        }]);
                    }
                    break;

                case "game_state":
                    // Sent by backend on connect if game was already in progress
                    // Restores full board state after refresh
                    if (data.board_state) {
                        const gs = data.board_state;
                        updateBoard(gs.board);
                        updateTurn(gs.turn);
                        updatePhase(gs.phase);
                        updateGoatsPlaced(gs.goats_placed);
                        updateGoatsCaptured(gs.goats_captured);
                        setConnected(true); // board restored = game is live
                    }
                    break;

                case "move":
                    if (data.sender === user.username) break;

                    const { from_pos, to_pos, piece, captured, goats_captured } = data;
                    const [tr, tc] = to_pos;
                    const newBoard = boardRef.current.map(row => [...row]);

                    if (piece === "goat" && from_pos === null) {
                        newBoard[tr][tc] = "goat";
                        const newGoatsPlaced = goatsPlacedRef.current + 1;
                        updateGoatsPlaced(newGoatsPlaced);
                        if (newGoatsPlaced >= 20) updatePhase("movement");
                    } else if (from_pos) {
                        const [fr, fc] = from_pos;
                        newBoard[tr][tc] = newBoard[fr][fc];
                        newBoard[fr][fc] = null;
                        if (captured) {
                            const [cr, cc] = captured;
                            newBoard[cr][cc] = null;
                            updateCapturedAnim([cr, cc]);
                            setTimeout(() => updateCapturedAnim(null), 700);
                        }
                    }

                    updateBoard(newBoard);
                    updateGoatsCaptured(goats_captured ?? goatsCapturedRef.current);
                    updateTurn(piece === "goat" ? "tiger" : "goat");
                    setSelectedTiger(null);
                    setSelectedGoat(null);
                    setValidMoves([]);
                    break;

                case "chat":
                    setMessages(prev => [...prev, {
                        type: "chat",
                        sender: data.sender,
                        text: data.message,
                        mine: data.sender === user.username,
                    }]);
                    break;

                case "game_over":
                    setWinner(data.winner);
                    break;

                default:
                    break;
            }
        };

        ws.onclose = () => console.log("WS closed");
        ws.onerror = (e) => console.error("WS error", e);

        return () => ws.close();
        // eslint-disable-next-line
    }, [room_code, role]);

    // ─────────────────────────────────────────────────
    // SEND HELPER
    // ─────────────────────────────────────────────────
    const sendWS = (payload) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(payload));
        } else {
            console.warn("WS not open:", wsRef.current?.readyState);
        }
    };

    // ─────────────────────────────────────────────────
    // BOARD CLICK
    // ─────────────────────────────────────────────────
    const isMyTurn = turn === myRole;

    const handleCellClick = (r, c) => {
        if (!isMyTurn || winner || !connected || capturedAnim) return;

        // ── GOAT ───────────────────────────────────
        if (myRole === "goat" && turn === "goat") {

            if (phase === "placement") {
                if (board[r][c]) return;
                const newBoard = board.map(row => [...row]);
                newBoard[r][c] = "goat";
                const newGoatsPlaced = goatsPlaced + 1;
                const newPhase = newGoatsPlaced >= 20 ? "movement" : phase;

                updateBoard(newBoard);
                updateGoatsPlaced(newGoatsPlaced);
                if (newGoatsPlaced >= 20) updatePhase("movement");
                updateTurn("tiger");

                sendWS({
                    type: "move", from_pos: null, to_pos: [r, c],
                    piece: "goat", captured: null, goats_captured: goatsCaptured,
                    // include full board state so backend can save it
                    board_state: serializeGameState(newBoard, "tiger", newPhase, newGoatsPlaced, goatsCaptured),
                });

                if (checkTigersBlocked(newBoard)) {
                    setWinner("goat");
                    sendWS({ type: "game_over", winner: "goat", goats_captured: goatsCaptured });
                }
                return;
            }

            if (phase === "movement") {
                if (selectedGoat) {
                    const isValid = validMoves.some(([vr, vc]) => vr === r && vc === c);
                    if (isValid) {
                        const [fr, fc] = selectedGoat;
                        const newBoard = board.map(row => [...row]);
                        newBoard[r][c] = "goat";
                        newBoard[fr][fc] = null;

                        updateBoard(newBoard);
                        updateTurn("tiger");
                        setSelectedGoat(null);
                        setValidMoves([]);

                        sendWS({
                            type: "move", from_pos: [fr, fc], to_pos: [r, c],
                            piece: "goat", captured: null, goats_captured: goatsCaptured,
                            board_state: serializeGameState(newBoard, "tiger", phase, goatsPlaced, goatsCaptured),
                        });

                        if (checkTigersBlocked(newBoard)) {
                            setWinner("goat");
                            sendWS({ type: "game_over", winner: "goat", goats_captured: goatsCaptured });
                        }
                        return;
                    }
                }
                if (board[r][c] === "goat") {
                    setSelectedGoat([r, c]);
                    setSelectedTiger(null);
                    setValidMoves(getValidGoatMoves(r, c, board));
                } else {
                    setSelectedGoat(null);
                    setValidMoves([]);
                }
                return;
            }
        }

        // ── TIGER ──────────────────────────────────
        if (myRole === "tiger" && turn === "tiger") {
            if (selectedTiger) {
                const move = validMoves.find(m => m.to[0] === r && m.to[1] === c);
                if (move) {
                    const [fr, fc] = selectedTiger;
                    const newBoard = board.map(row => [...row]);
                    newBoard[r][c] = "tiger";
                    newBoard[fr][fc] = null;

                    let newGoatsCaptured = goatsCaptured;
                    let capturedPos = null;

                    if (move.type === "capture") {
                        const [cr, cc] = move.over;
                        newBoard[cr][cc] = null;
                        newGoatsCaptured++;
                        capturedPos = [cr, cc];
                        updateCapturedAnim([cr, cc]);
                        setTimeout(() => updateCapturedAnim(null), 700);
                    }

                    updateBoard(newBoard);
                    updateGoatsCaptured(newGoatsCaptured);
                    updateTurn("goat");
                    setSelectedTiger(null);
                    setValidMoves([]);

                    sendWS({
                        type: "move", from_pos: [fr, fc], to_pos: [r, c],
                        piece: "tiger", captured: capturedPos, goats_captured: newGoatsCaptured,
                        board_state: serializeGameState(newBoard, "goat", phase, goatsPlaced, newGoatsCaptured),
                    });

                    if (newGoatsCaptured >= 5) {
                        setWinner("tiger");
                        sendWS({ type: "game_over", winner: "tiger", goats_captured: newGoatsCaptured });
                    }
                    return;
                }
            }
            if (board[r][c] === "tiger") {
                setSelectedTiger([r, c]);
                setSelectedGoat(null);
                setValidMoves(getValidTigerMoves(r, c, board));
            } else {
                setSelectedTiger(null);
                setValidMoves([]);
            }
        }
    };

    // ─────────────────────────────────────────────────
    // CHAT
    // ─────────────────────────────────────────────────
    const sendChat = () => {
        const msg = chatInput.trim();
        if (!msg) return;
        sendWS({ type: "chat", message: msg });
        setChatInput("");
    };

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // ─────────────────────────────────────────────────
    // BOARD RENDER
    // ─────────────────────────────────────────────────
    const CELL = 72, PADDING = 36, SIZE = CELL * 4 + PADDING * 2;

    const renderBoard = () => {
        const lines = [];
        for (let r = 0; r < 5; r++) {
            for (let c = 0; c < 5; c++) {
                for (const [nr, nc] of getNeighbors(r, c)) {
                    if (nr > r || (nr === r && nc > c)) {
                        lines.push(
                            <line key={`l${r}${c}${nr}${nc}`}
                                x1={PADDING + c * CELL} y1={PADDING + r * CELL}
                                x2={PADDING + nc * CELL} y2={PADDING + nr * CELL}
                                stroke="rgba(200,150,50,0.35)" strokeWidth="1.5" />
                        );
                    }
                }
            }
        }

        const cells = [];
        for (let r = 0; r < 5; r++) {
            for (let c = 0; c < 5; c++) {
                const cx = PADDING + c * CELL, cy = PADDING + r * CELL;
                const piece = board[r][c];
                const isTigerSel = selectedTiger?.[0] === r && selectedTiger?.[1] === c;
                const isGoatSel = selectedGoat?.[0] === r && selectedGoat?.[1] === c;
                const isValidDest = validMoves.some(m =>
                    Array.isArray(m) ? m[0] === r && m[1] === c : m.to[0] === r && m.to[1] === c
                );
                const isCaptured = capturedAnim?.[0] === r && capturedAnim?.[1] === c;

                cells.push(
                    <g key={`${r}${c}`} onClick={() => handleCellClick(r, c)}
                        style={{ cursor: isMyTurn && !winner ? "pointer" : "default" }}>
                        <circle cx={cx} cy={cy} r={28} fill="transparent" />
                        {isValidDest && !piece && (
                            <circle cx={cx} cy={cy} r={8}
                                fill={myRole === "tiger" ? "rgba(255,80,80,0.6)" : "rgba(80,200,80,0.6)"} />
                        )}
                        {piece === "tiger" && (
                            <>
                                <circle cx={cx} cy={cy} r={22}
                                    fill={isTigerSel ? "rgba(255,120,40,0.9)" : "rgba(220,80,40,0.85)"}
                                    stroke={isTigerSel ? "#ffcc44" : "rgba(255,160,80,0.6)"}
                                    strokeWidth={isTigerSel ? 3 : 1.5} />
                                <text x={cx} y={cy+7} textAnchor="middle" fontSize="18" style={{userSelect:"none"}}>🐯</text>
                            </>
                        )}
                        {piece === "goat" && (
                            <>
                                <circle cx={cx} cy={cy} r={20}
                                    fill={isCaptured ? "rgba(255,60,60,0.9)" : isGoatSel ? "rgba(60,180,80,0.9)" : "rgba(60,160,60,0.8)"}
                                    stroke={isGoatSel ? "#aaffaa" : "rgba(100,220,100,0.5)"}
                                    strokeWidth={isGoatSel ? 3 : 1.5}
                                    opacity={isCaptured ? 0 : 1}
                                    style={{transition:"opacity 0.4s ease"}} />
                                {!isCaptured && (
                                    <text x={cx} y={cy+7} textAnchor="middle" fontSize="16" style={{userSelect:"none"}}>🐐</text>
                                )}
                            </>
                        )}
                        {!piece && !isValidDest && (
                            <circle cx={cx} cy={cy} r={4} fill="rgba(200,150,50,0.3)" />
                        )}
                    </g>
                );
            }
        }

        return (
            <svg width={SIZE} height={SIZE} style={{ display: "block", margin: "0 auto" }}>
                {lines}{cells}
            </svg>
        );
    };

    const panelStyle = {
        background: "rgba(20,15,30,0.85)",
        backdropFilter: "blur(24px)",
        border: "1px solid rgba(200,150,50,0.2)",
        borderRadius: 20,
        boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
    };

    // ─────────────────────────────────────────────────
    // WAITING SCREEN
    // shown until opponent joins OR board state restores
    // ─────────────────────────────────────────────────
    if (!connected && !opponentLeft) {
        return (
            <div style={{ background: "#0d0b14", minHeight: "100vh" }}>
                <Navbar />
                <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, zIndex: 0 }} />
                <div style={{
                    position: "relative", zIndex: 1,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    height: "calc(100vh - 60px)", fontFamily: "'Georgia',serif",
                }}>
                    <div style={{ ...panelStyle, padding: "48px 52px", textAlign: "center", maxWidth: 420 }}>
                        <div style={{ fontSize: 44, marginBottom: 16 }}>⏳</div>
                        <h2 style={{
                            margin: "0 0 8px", fontSize: 22, fontWeight: 700,
                            background: "linear-gradient(135deg,#f0c060,#c9922a)",
                            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                        }}>
                            {room_name}
                        </h2>
                        <p style={{ color: "rgba(200,180,140,0.5)", fontSize: 14, margin: "0 0 24px" }}>
                            Waiting for an opponent to join...
                        </p>
                        <div style={{
                            background: "rgba(200,150,50,0.08)", border: "1px solid rgba(200,150,50,0.15)",
                            borderRadius: 12, padding: "14px 20px", color: "#f0c060", fontSize: 14, marginBottom: 24,
                        }}>
                            You are playing as <strong>{myRole === "goat" ? "🐐 Goat" : "🐯 Tiger"}</strong>
                        </div>
                        <div style={{ color: "rgba(200,180,140,0.3)", fontSize: 12, marginBottom: 20 }}>
                            Room code: {room_code}
                        </div>
                        <button onClick={() => navigate("/online")} style={{
                            padding: "10px 24px", background: "transparent",
                            border: "1px solid rgba(200,150,50,0.25)", borderRadius: 10,
                            color: "#f0c060", fontFamily: "inherit", fontSize: 13, cursor: "pointer",
                        }}>
                            ← Leave Room
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ─────────────────────────────────────────────────
    // MAIN GAME
    // ─────────────────────────────────────────────────
    return (
        <div style={{ background: "#0d0b14", minHeight: "100vh" }}>
            <Navbar />
            <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, zIndex: 0 }} />

            <div style={{
                position: "relative", zIndex: 1,
                display: "flex", gap: 20,
                maxWidth: 1100, margin: "0 auto",
                padding: "80px 24px 40px",
                fontFamily: "'Georgia','Times New Roman',serif",
                alignItems: "flex-start",
            }}>

                {/* ── LEFT: Board ── */}
                <div style={{ flex: "0 0 auto" }}>
                    <div style={{ ...panelStyle, padding: "14px 24px", marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
                        <div style={{ fontSize: 13, color: "rgba(200,180,140,0.6)" }}>
                            🐐 Captured: <span style={{ color: "#f0c060", fontWeight: 700 }}>{goatsCaptured}/5</span>
                        </div>
                        <div style={{ fontSize: 13, color: "rgba(200,180,140,0.6)" }}>
                            📦 Placed: <span style={{ color: "#f0c060", fontWeight: 700 }}>{goatsPlaced}/20</span>
                        </div>
                    </div>

                    <div style={{
                        ...panelStyle, padding: "12px 24px", marginBottom: 16, textAlign: "center",
                        background: isMyTurn ? "rgba(200,150,50,0.12)" : "rgba(20,15,30,0.85)",
                        borderColor: isMyTurn ? "rgba(200,150,50,0.5)" : "rgba(200,150,50,0.2)",
                    }}>
                        {winner ? (
                            <span style={{ fontWeight: 700, fontSize: 16, color: winner === myRole ? "#6dff9a" : "#ff6b6b" }}>
                                {winner === myRole ? "🏆 You Win!" : "💀 You Lose"}
                            </span>
                        ) : opponentLeft ? (
                            <span style={{ color: "#f0c060", fontSize: 14 }}>
                                Opponent disconnected — waiting for reconnect...
                            </span>
                        ) : isMyTurn ? (
                            <span style={{ color: "#f0c060", fontWeight: 700, fontSize: 15 }}>
                                ✨ Your Turn — {myRole === "goat" ? "🐐 Goat" : "🐯 Tiger"}
                                {phase === "placement" && myRole === "goat" && " (place a goat)"}
                            </span>
                        ) : (
                            <span style={{ color: "rgba(200,180,140,0.5)", fontSize: 14 }}>
                                Waiting for {opponentName || "opponent"}...
                            </span>
                        )}
                    </div>

                    <div style={{ ...panelStyle, padding: "20px", opacity: !isMyTurn && !winner ? 0.85 : 1 }}>
                        {renderBoard()}
                    </div>

                    <button onClick={() => navigate("/online")} style={{
                        marginTop: 14, width: "100%", padding: "11px",
                        background: "transparent", border: "1px solid rgba(200,150,50,0.2)",
                        borderRadius: 10, color: "rgba(200,180,140,0.5)",
                        fontFamily: "inherit", fontSize: 13, cursor: "pointer",
                    }}>
                        ← Leave Game
                    </button>
                </div>

                {/* ── RIGHT: Info + Chat ── */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>

                    <div style={{ ...panelStyle, padding: "20px 24px" }}>
                        <div style={{ fontSize: 11, color: "rgba(180,150,100,0.4)", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>Room</div>
                        <div style={{ color: "#f0c060", fontWeight: 700, fontSize: 16, marginBottom: 16 }}>{room_name}</div>

                        {[
                            { name: user.username, r: myRole, isYou: true },
                            { name: opponentName || "Waiting...", r: myRole === "goat" ? "tiger" : "goat", isYou: false },
                        ].map(({ name, r, isYou }) => (
                            <div key={r} style={{
                                display: "flex", alignItems: "center", gap: 12,
                                padding: "10px 14px", borderRadius: 10, marginBottom: 8,
                                background: turn === r && !winner ? "rgba(200,150,50,0.1)" : "rgba(255,255,255,0.02)",
                                border: `1px solid ${turn === r && !winner ? "rgba(200,150,50,0.3)" : "rgba(200,150,50,0.08)"}`,
                            }}>
                                <div style={{
                                    width: 32, height: 32, borderRadius: "50%",
                                    background: isYou ? "linear-gradient(135deg,#c9922a,#f0c060)" : "rgba(200,150,50,0.15)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontWeight: 700, fontSize: 13, color: isYou ? "#1a1205" : "#f0c060",
                                }}>
                                    {name[0]?.toUpperCase() || "?"}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ color: isYou ? "#f0c060" : "rgba(200,180,140,0.8)", fontSize: 13, fontWeight: 700 }}>
                                        {name} {isYou && <span style={{ fontSize: 10, opacity: 0.6 }}>(you)</span>}
                                    </div>
                                    <div style={{ fontSize: 11, color: "rgba(200,180,140,0.4)" }}>
                                        {r === "goat" ? "🐐 Goat" : "🐯 Tiger"}
                                    </div>
                                </div>
                                {turn === r && !winner && (
                                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#f0c060" }} />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Chat */}
                    <div style={{ ...panelStyle, flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                        <div style={{
                            padding: "14px 20px", borderBottom: "1px solid rgba(200,150,50,0.1)",
                            fontSize: 12, fontWeight: 700, color: "rgba(180,150,100,0.5)",
                            letterSpacing: 1.5, textTransform: "uppercase",
                        }}>
                            Chat
                        </div>

                        <div style={{
                            flex: 1, overflowY: "auto", padding: "16px",
                            display: "flex", flexDirection: "column", gap: 8,
                            minHeight: 220, maxHeight: 320,
                        }}>
                            {messages.length === 0 && (
                                <div style={{ color: "rgba(200,180,140,0.25)", fontSize: 12, textAlign: "center", marginTop: 20 }}>
                                    No messages yet
                                </div>
                            )}
                            {messages.map((msg, i) => {
                                if (msg.type === "system") return (
                                    <div key={i} style={{ textAlign: "center", fontSize: 11, color: "rgba(200,180,140,0.35)", padding: "4px 0" }}>
                                        {msg.text}
                                    </div>
                                );
                                return (
                                    <div key={i} style={{ display: "flex", flexDirection: msg.mine ? "row-reverse" : "row", gap: 8, alignItems: "flex-end" }}>
                                        <div style={{
                                            maxWidth: "75%", padding: "8px 12px",
                                            borderRadius: msg.mine ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                                            background: msg.mine ? "rgba(200,150,50,0.2)" : "rgba(255,255,255,0.05)",
                                            border: `1px solid ${msg.mine ? "rgba(200,150,50,0.3)" : "rgba(255,255,255,0.06)"}`,
                                        }}>
                                            {!msg.mine && (
                                                <div style={{ fontSize: 10, color: "rgba(200,180,140,0.4)", marginBottom: 3 }}>{msg.sender}</div>
                                            )}
                                            <div style={{ fontSize: 13, color: "rgba(200,180,140,0.85)", wordBreak: "break-word" }}>
                                                {msg.text}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={chatEndRef} />
                        </div>

                        <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(200,150,50,0.1)", display: "flex", gap: 8 }}>
                            <input
                                value={chatInput}
                                onChange={e => setChatInput(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && sendChat()}
                                placeholder="Type a message..."
                                maxLength={200}
                                style={{
                                    flex: 1, padding: "9px 12px",
                                    background: "rgba(255,255,255,0.04)",
                                    border: "1px solid rgba(200,150,50,0.15)",
                                    borderRadius: 10, color: "#f0c060",
                                    fontSize: 13, fontFamily: "inherit", outline: "none",
                                }}
                            />
                            <button onClick={sendChat} style={{
                                padding: "9px 16px",
                                background: "linear-gradient(135deg,#c9922a,#f0c060)",
                                border: "none", borderRadius: 10, color: "#1a1205",
                                fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit",
                            }}>
                                Send
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default OnlineGame;