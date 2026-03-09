import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import GameBoard from "./pages/GameBoard";
import LocalGame from "./pages/LocalGame";
import Rules from "./pages/Rules";
import Profile from "./pages/Profile";
import Leaderboard from "./pages/Leaderboard";
import OnlineLobby from "./pages/OnlineLobby";
import OnlineGame from "./pages/OnlineGame";

function App() {
  return (
    <Router>
      <Routes>
        {/* PUBLIC */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* PROTECTED */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/gameboard/:gameId" element={<ProtectedRoute><GameBoard /></ProtectedRoute>} />
        <Route path="/local" element={<ProtectedRoute><LocalGame /></ProtectedRoute>} />
        <Route path="/rules" element={<ProtectedRoute><Rules /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
        <Route path="/online" element={
          <ProtectedRoute><OnlineLobby /></ProtectedRoute>
        } />
        <Route path="/online/:roomCode" element={
    <ProtectedRoute><OnlineGame /></ProtectedRoute>
} />
      </Routes>
    </Router>
  );
}

export default App;