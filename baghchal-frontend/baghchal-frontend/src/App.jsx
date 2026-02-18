import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import GameBoard from "./pages/GameBoard";
import Multiplayer from "./pages/Multiplayer";
import Rules from "./pages/Rules";
import Profile from "./pages/Profile";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/gameboard/:gameId" element={<GameBoard />} />
        <Route path="/multiplayer" element={<Multiplayer />} />
        <Route path="/rules" element={<Rules />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Router>
  );
}

export default App;
