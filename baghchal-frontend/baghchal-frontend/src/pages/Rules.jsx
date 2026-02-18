import React from "react";
import { Link } from "react-router-dom";

const Rules = () => {
  return (
    <div className="rules-page">
      <div className="rules-container">
        <h1 className='rules-title'>Bagh-Chal Rules 🐯🐐</h1>

        <section>
          <h2>Objective</h2>
          <p>
            Tigers aim to <b>capture goats</b>, while goats aim to <b>block all tigers</b>.
          </p>
        </section>

        <section>
          <h2>Game Setup</h2>
          <ul>
            <li>The board is a <b>5x5 grid</b> with intersecting lines forming points.</li>
            <li><b>Tigers:</b> 4 tigers start at the four corners.</li>
            <li><b>Goats:</b> 20 goats start off the board and are placed one by one.</li>
          </ul>
        </section>

        <section>
          <h2>Gameplay</h2>
          <h3>Turns</h3>
          <p>Players alternate turns. Goats move first.</p>

          <h3>Goat Rules</h3>
          <ul>
            <li>During placement, goats can be placed on any empty point.</li>
            <li>After all goats are placed, they move to adjacent empty points along lines.</li>
            <li>Goal: Surround tigers to restrict their movement.</li>
          </ul>

          <h3>Tiger Rules</h3>
          <ul>
            <li>Tigers move to any adjacent empty point along lines.</li>
            <li>Tigers can capture goats by jumping over an adjacent goat into an empty point directly beyond.</li>
            <li>Multiple captures in one turn are not allowed.</li>
            <li>Goal: Capture at least 5 goats to win.</li>
          </ul>
        </section>

        <section>
          <h2>Winning Conditions</h2>
          <ul>
            <li>Tigers win if they capture 5 goats.</li>
            <li>Goats win if all tigers are blocked and cannot move.</li>
          </ul>
        </section>

        <Link to="/Dashboard" className="back-button">← Back to Game</Link>
      </div>

      <style>{`
        :root {
          --bg-angle: 45deg;
        }


        .rules-title {color: #fff;
          text-shadow: 0 0 15px #00f2fe, 0 0 25px #4facfe;}

          
        .rules-page {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          background: linear-gradient(var(--bg-angle), #1f1c2c, #928dab);
          animation: rotate 20s linear infinite;
          padding: 20px;
        }

        @keyframes rotate {
          from { --bg-angle: 0deg; }
          to { --bg-angle: 360deg; }
        }

        .rules-container {
          max-width: 800px;
          background: rgba(255,255,255,0.25);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 25px;
          padding: 40px;
          text-align: left;
          box-shadow: 0 20px 50px rgba(0,0,0,0.25),
                      inset 0 0 0 1px rgba(255,255,255,0.35);
          color: #000;
        }

        h1 {
          text-align: center;
          margin-bottom: 25px;
          color: #fff;
          text-shadow: 0 0 5px #000;
        }

        h2 {
          color: #fff;
          text-shadow: 0 0 5px #000;
          margin-top: 20px;
        }

        h3 {
          color: #eee;
          margin-top: 10px;
        }

        ul {
          margin-left: 20px;
          margin-bottom: 10px;
        }

        p {
          margin-bottom: 10px;
        }

        .back-button {
          display: inline-block;
          margin-top: 20px;
          padding: 8px 20px;
          background: #4facfe;
          color: #fff;
          text-decoration: none;
          font-weight: bold;
          border-radius: 12px;
          box-shadow: 0 5px 15px rgba(0,0,0,0.2);
          transition: 0.3s;
        }

        .back-button:hover {
          transform: scale(1.05);
          box-shadow: 0 0 15px #fff;
        }
      `}</style>
    </div>
  );
};

export default Rules;
