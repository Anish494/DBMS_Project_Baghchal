# 📙 Bagh-Chal Game – Backend

The **Bagh-Chal Backend** is the server-side application of a DBMS academic project implemented using **Django**.  
It provides **RESTful APIs** to manage users, games, game moves, and player statistics.

The backend uses **PostgreSQL** as the database and focuses on **SQL concepts** such as tables, constraints, joins, transactions, and views, which are essential for a Database Management System subject.


---

## 🎯 Core Responsibilities

- User registration and authentication  
- Game creation and management  
- Storing and retrieving game moves  
- Tracking goats killed and game winner  
- Maintaining user statistics  
- Executing SQL-based database operations  
- Enforcing referential integrity and constraints  

---

## 🧰 Tech Stack Used

- **Framework:** Django  
- **API Style:** Django REST Framework 
- **Database:** PostgreSQL  
- **Database Operations:** SQL-focused (DBMS oriented)  
- **Environment Management:** `.env` file  
- **Server:** Django Development Server  

---

## 📦 Database Design Overview

The PostgreSQL database includes the following main tables:

- `users` – stores user information  
- `games` – stores game sessions  
- `game_move` – stores move history  
- `user_statistics` – stores aggregated player statistics  

The design follows:

- Proper normalization  
- Primary & foreign key constraints  
- One-to-many relationships  
- Transaction usage for consistency  

---

## 💻 Prerequisites

- Python 3.10 or above  
- PostgreSQL 18  
- Git  
- Virtual environment (`venv`)  
- `.env` file with database credentials  

---

## ⚙️ Running Locally

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/Anish494/DBMS_Project_Baghchal.git
cd baghchal-backend
