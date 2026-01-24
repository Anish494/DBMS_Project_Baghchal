import React from "react";

const CustomAlert = ({ message, onClose }) => {
  return (
    <div className="alert-overlay">
      <div className="alert-box">
        <p>{message}</p>
        <button onClick={onClose}>OK</button>

        <style>{`
          .alert-overlay {
            position: fixed;
            inset: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            animation: fadeIn 0.3s ease;
          }

          .alert-box {
            background: linear-gradient(135deg, #e3f2fd, #ffffff);
            padding: 30px 25px;
            border-radius: 18px;
            width: 90%;
            max-width: 360px;
            text-align: center;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
            animation: scaleIn 0.3s ease;
          }

          .alert-box p {
            color: #333;
            margin-bottom: 20px;
            font-size: 1rem;
          }

          .alert-box button {
            padding: 10px 22px;
            border-radius: 12px;
            border: none;
            background: linear-gradient(135deg, #42a5f5, #1e88e5);
            color: #fff;
            font-weight: bold;
            cursor: pointer;
            transition: transform 0.3s, box-shadow 0.3s;
          }

          .alert-box button:hover {
            transform: scale(1.08);
            box-shadow: 0 10px 25px rgba(33, 150, 243, 0.5);
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          @keyframes scaleIn {
            from { transform: scale(0.8); }
            to { transform: scale(1); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default CustomAlert;
