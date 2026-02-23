from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.db import connection

from .serializers import UserSerializer, GameSerializer, GameMoveSerializer, UserStatisticsSerializer, LoginSerializer

# -------------------------------
# USER APIs
# -------------------------------
class UserListCreateAPIView(APIView):
    def get(self, request):
        with connection.cursor() as cursor:
            cursor.execute("SELECT id, username, email, role FROM users")
            rows = cursor.fetchall()

        users = [
            {"id": r[0], "username": r[1], "email": r[2], "role": r[3]}
            for r in rows
        ]
        return Response(users)

    def post(self, request):
        serializer = UserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        with connection.cursor() as cursor:
            cursor.execute(
                "INSERT INTO users (username, email, password, role, created_at) VALUES (%s, %s, %s, %s, %s) RETURNING id, username, email, role",
                [data["username"], data["email"], data["password"], data.get("role", "player"), timezone.now()]
            )
            user = cursor.fetchone()

        return Response({
            "id": user[0],
            "username": user[1],
            "email": user[2],
            "role": user[3]
        }, status=201)


class UserRetrieveAPIView(APIView):
    def get(self, request, pk):
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT id, username, email, role FROM users WHERE id = %s",
                [pk]
            )
            user = cursor.fetchone()
            if not user:
                return Response({"error": "User not found"}, status=404)

        return Response({
            "id": user[0],
            "username": user[1],
            "email": user[2],
            "role": user[3]
        })


# -------------------------------
# LOGIN API
# -------------------------------
class LoginAPIView(APIView):
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        username = serializer.validated_data["username"]
        password = serializer.validated_data["password"]

        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT id, username, password, role FROM users WHERE username = %s",
                [username]
            )
            row = cursor.fetchone()

        if not row:
            return Response({"error": "User does not exist"}, status=404)

        user_id, db_username, db_password, role = row
        if db_password != password:
            return Response({"error": "Invalid password"}, status=401)

        return Response({
            "success": True,
            "message": "Login successful",
            "user": {
                "id": user_id,
                "username": db_username,
                "role": role
            }
        })


# -------------------------------
# GAME APIs
# -------------------------------
class GameListCreateAPIView(APIView):
    def post(self, request):
        user_id = request.data.get("player")
        with connection.cursor() as cursor:
            cursor.execute("SELECT id, username FROM users WHERE id = %s", [user_id])
            user = cursor.fetchone()
            if not user:
                return Response({"error": "User not found"}, status=404)

            cursor.execute(
                "INSERT INTO game (player_id, started_at) VALUES (%s, %s) RETURNING id, started_at",
                [user_id, timezone.now()]
            )
            game = cursor.fetchone()

        game_id, started_at = game
        return Response({
            "id": game_id,
            "player": user[1],
            "started_at": started_at
        })


class UserGameListAPIView(APIView):
    def get(self, request, user_id):
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT g.id, u.username, g.winner, g.goats_killed, g.started_at, g.ended_at
                FROM game g
                JOIN users u ON g.player_id = u.id
                WHERE u.id = %s
                ORDER BY g.started_at DESC
            """, [user_id])
            rows = cursor.fetchall()

        games = [
            {
                "id": r[0],
                "player": r[1],
                "winner": r[2],
                "goats_killed": r[3],
                "started_at": r[4],
                "ended_at": r[5]
            }
            for r in rows
        ]
        return Response(games)


class GameRetrieveAPIView(APIView):
    def get(self, request, pk):
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT g.id, u.username, g.winner, g.goats_killed, g.started_at, g.ended_at
                FROM game g
                JOIN users u ON g.player_id = u.id
                WHERE g.id = %s
            """, [pk])
            row = cursor.fetchone()
            if not row:
                return Response({"error": "Game not found"}, status=404)

        return Response({
            "id": row[0],
            "player": row[1],
            "winner": row[2],
            "goats_killed": row[3],
            "started_at": row[4],
            "ended_at": row[5]
        })


# -------------------------------
# GAME MOVE APIs
# -------------------------------
class GameMoveCreateAPIView(APIView):
    def post(self, request):
        game_id = request.data.get("game")
        piece = request.data.get("piece")
        from_pos = request.data.get("from_position")
        to_pos = request.data.get("to_position")
        is_capture = request.data.get("is_capture", False)

        with connection.cursor() as cursor:
            cursor.execute("SELECT id FROM game WHERE id = %s", [game_id])
            if not cursor.fetchone():
                return Response({"error": "Game not found"}, status=404)

            cursor.execute("SELECT MAX(move_number) FROM game_move WHERE game_id = %s", [game_id])
            last = cursor.fetchone()[0]
            move_number = last + 1 if last else 1

            cursor.execute("""
                INSERT INTO game_move (game_id, move_number, piece, from_position, to_position, is_capture, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, [game_id, move_number, piece, from_pos, to_pos, is_capture, timezone.now()])

        return Response({
            "move_number": move_number,
            "piece": piece,
            "from_position": from_pos,
            "to_position": to_pos
        }, status=201)


class GameMoveRetrieveAPIView(APIView):
    def get(self, request, pk):
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT id, game_id, move_number, piece, from_position, to_position, is_capture
                FROM game_move
                WHERE id = %s
            """, [pk])
            row = cursor.fetchone()
            if not row:
                return Response({"error": "Move not found"}, status=404)

        return Response({
            "id": row[0],
            "game": row[1],
            "move_number": row[2],
            "piece": row[3],
            "from_position": row[4],
            "to_position": row[5],
            "is_capture": row[6]
        })


class GameMoveListAPIView(APIView):
    def get(self, request, game_id):
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT id, move_number, piece, from_position, to_position, is_capture
                FROM game_move
                WHERE game_id = %s
                ORDER BY move_number
            """, [game_id])
            rows = cursor.fetchall()

        return Response([
            {
                "id": r[0],
                "move_number": r[1],
                "piece": r[2],
                "from_position": r[3],
                "to_position": r[4],
                "is_capture": r[5]
            }
            for r in rows
        ])


class GameMoveUndoAPIView(APIView):
    def post(self, request, game_id):
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT id FROM game_move
                WHERE game_id = %s
                ORDER BY move_number DESC
                LIMIT 1
            """, [game_id])
            last = cursor.fetchone()
            if not last:
                return Response({"error": "No moves to undo"}, status=400)

            cursor.execute("DELETE FROM game_move WHERE id = %s", [last[0]])

        return Response({"message": "Last move undone"})


class GameMovesClearAPIView(APIView):
    def post(self, request, game_id):
        with connection.cursor() as cursor:
            cursor.execute("DELETE FROM game_move WHERE game_id = %s", [game_id])
        return Response({"message": "All moves cleared"})


# -------------------------------
# USER STATISTICS
# -------------------------------
class UserStatisticsListCreateAPIView(APIView):
    def get(self, request):
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT s.id, u.username, s.games_played, s.games_won, s.games_lost, s.total_goats_killed
                FROM user_statistics s
                JOIN users u ON s.user_id = u.id
            """)
            rows = cursor.fetchall()

        stats = [
            {
                "id": r[0],
                "user": r[1],
                "games_played": r[2],
                "games_won": r[3],
                "games_lost": r[4],
                "total_goats_killed": r[5]
            }
            for r in rows
        ]
        return Response(stats)

    def post(self, request):
        data = request.data
        with connection.cursor() as cursor:
            cursor.execute("""
                INSERT INTO user_statistics (user_id, games_played, games_won, games_lost, total_goats_killed)
                VALUES (%s, %s, %s, %s, %s)
            """, [
                data.get("user_id"),
                data.get("games_played", 0),
                data.get("games_won", 0),
                data.get("games_lost", 0),
                data.get("total_goats_killed", 0)
            ])
        return Response({"message": "Statistics created"}, status=201)


class UserStatisticsRetrieveAPIView(APIView):
    def get(self, request, pk):
        with connection.cursor() as cursor:
            cursor.execute("SELECT username, email FROM users WHERE id = %s", [pk])
            user = cursor.fetchone()
            if not user:
                return Response({"error": "User not found"}, status=404)

            username, email = user

            cursor.execute("SELECT COUNT(*) FROM game WHERE player_id = %s", [pk])
            games_played = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) FROM game WHERE player_id = %s AND winner = 'player'", [pk])
            games_won = cursor.fetchone()[0]

            games_lost = games_played - games_won

            cursor.execute("""
                SELECT MIN(EXTRACT(EPOCH FROM ended_at - started_at))
                FROM game
                WHERE player_id = %s
                AND winner = 'player'
                AND ended_at IS NOT NULL
            """, [pk])
            best = cursor.fetchone()[0]
            best_score = float(best) if best else 0

        return Response({
            "username": username,
            "email": email,
            "games_played": games_played,
            "games_won": games_won,
            "games_lost": games_lost,
            "best_score": best_score
        })


# -------------------------------
# END GAME
# -------------------------------
class EndGameAPIView(APIView):
    def patch(self, request, game_id):
        winner = request.data.get("winner")
        goats_killed = request.data.get("goats_killed", 0)

        with connection.cursor() as cursor:
            cursor.execute("SELECT player_id FROM game WHERE id = %s", [game_id])
            game = cursor.fetchone()
            if not game:
                return Response({"error": "Game not found"}, status=404)

            cursor.execute("""
                UPDATE game
                SET winner = %s, goats_killed = %s, ended_at = %s
                WHERE id = %s
            """, [winner, goats_killed, timezone.now(), game_id])

        return Response({
            "id": game_id,
            "winner": winner,
            "goats_killed": goats_killed
        })