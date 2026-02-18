from rest_framework import generics
from .models import User, Game, GameMove, UserStatistics
from .serializers import UserSerializer, GameSerializer, GameMoveSerializer, UserStatisticsSerializer

# -------------------------------
# USER APIs
# -------------------------------
class UserListCreateAPIView(generics.ListCreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer

class UserRetrieveAPIView(generics.RetrieveAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer

# -------------------------------
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import User
# core/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import User
from .serializers import LoginSerializer

class LoginAPIView(APIView):
    def post(self, request):
        serializer = LoginSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        username = serializer.validated_data["username"]
        password = serializer.validated_data["password"]

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response(
                {"error": "User does not exist"},
                status=status.HTTP_404_NOT_FOUND
            )

        if user.password != password:
            return Response(
                {"error": "Invalid password"},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # ✅ SUCCESS: user exists AND password matches
        return Response(
            {
                "success": True,
                "message": "Login successful",
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "role": user.role
                }
            },
            status=status.HTTP_200_OK
        )

# GAME APIs
# -------------------------------
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Game, User
import json

class GameListCreateAPIView(APIView):

    def post(self, request):
        # For DBMS project, assume user info comes in body (simplest)
        user_id = request.data.get("player")  # id from localStorage
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)

        game = Game.objects.create(player=user)
        return Response({
            "id": game.id,
            "player": game.player.username,
            "started_at": game.started_at
        })


from rest_framework.generics import ListAPIView
from .serializers import GameSerializer

class UserGameListAPIView(ListAPIView):
    serializer_class = GameSerializer

    def get_queryset(self):
        user_id = self.kwargs.get("user_id")
        return Game.objects.filter(player_id=user_id)



class GameRetrieveAPIView(generics.RetrieveAPIView):
    queryset = Game.objects.all()
    serializer_class = GameSerializer

# -------------------------------
# GAME_MOVE APIs
# -------------------------------
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Game, GameMove

class GameMoveCreateAPIView(APIView):

    def post(self, request):
        game_id = request.data.get("game")
        piece = request.data.get("piece")
        from_pos = request.data.get("from_position")
        to_pos = request.data.get("to_position")
        is_capture = request.data.get("is_capture", False)

        game = Game.objects.get(id=game_id)

        # Determine move number automatically
        last_move = game.moves.order_by('-move_number').first()
        move_number = last_move.move_number + 1 if last_move else 1

        move = GameMove.objects.create(
            game=game,
            move_number=move_number,
            piece=piece,
            from_position=from_pos,
            to_position=to_pos,
            is_capture=is_capture
        )

        return Response({
            "move_number": move.move_number,
            "piece": move.piece,
            "from_position": move.from_position,
            "to_position": move.to_position
        }, status=201)




from .models import UserStatistics

def update_user_statistics(user, winner, goats_killed):
    stats, created = UserStatistics.objects.get_or_create(user=user)
    stats.games_played += 1
    if winner == "player":  # assume player won
        stats.games_won += 1
    else:
        stats.games_lost += 1
    stats.total_goats_killed += goats_killed
    stats.save()



class GameMoveRetrieveAPIView(generics.RetrieveAPIView):
    queryset = GameMove.objects.all()
    serializer_class = GameMoveSerializer

# -------------------------------
# USER_STATISTICS APIs
# -------------------------------
class UserStatisticsListCreateAPIView(generics.ListCreateAPIView):
    queryset = UserStatistics.objects.all()
    serializer_class = UserStatisticsSerializer

# core/views.py
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import User, Game, GameMove
from django.db.models import Count, Min

class UserStatisticsRetrieveAPIView(APIView):
    def get(self, request, pk, format=None):
        user = get_object_or_404(User, pk=pk)

        # Games played
        games_played = Game.objects.filter(player=user).count()

        # Games won
        games_won = Game.objects.filter(player=user, winner='player').count()

        # Games lost
        games_lost = games_played - games_won

        from django.db.models import F, ExpressionWrapper, DurationField, Min

        best_score_data = Game.objects.filter(player=user, winner='player', ended_at__isnull=False) \
        .annotate(duration=ExpressionWrapper(F('ended_at') - F('started_at'), output_field=DurationField())) \
        .aggregate(best_score=Min('duration'))

        best_score = best_score_data['best_score'].total_seconds() if best_score_data['best_score'] else 0

        return Response({
            "username": user.username,
            "email": user.email,
            "games_played": games_played,
            "games_won": games_won,
            "games_lost": games_lost,
            "best_score": best_score,
        })



from django.utils import timezone

class EndGameAPIView(APIView):
    def patch(self, request, game_id):
        winner = request.data.get("winner")
        goats_killed = request.data.get("goats_killed", 0)
        
        try:
            game = Game.objects.get(id=game_id)
        except Game.DoesNotExist:
            return Response({"error": "Game not found"}, status=404)

        game.winner = winner
        game.goats_killed = goats_killed
        game.ended_at = timezone.now()
        game.save()

        # Update statistics
        update_user_statistics(game.player, winner, goats_killed)

        return Response({
            "id": game.id,
            "winner": winner,
            "goats_killed": goats_killed,
            "ended_at": game.ended_at
        })

class GameMoveListAPIView(APIView):
    def get(self, request, game_id):
        game = get_object_or_404(Game, id=game_id)
        moves = game.moves.order_by("move_number")
        return Response([
            {
                "id": m.id,
                "move_number": m.move_number,
                "piece": m.piece,
                "from_position": m.from_position,
                "to_position": m.to_position,
                "is_capture": m.is_capture
            } for m in moves
        ])


class GameMoveUndoAPIView(APIView):
    def post(self, request, game_id):
        game = get_object_or_404(Game, id=game_id)
        last_move = game.moves.order_by("-move_number").first()
        if not last_move:
            return Response({"error": "No moves to undo"}, status=400)
        last_move.delete()
        return Response({"message": "Last move undone"})


class GameMovesClearAPIView(APIView):
    def post(self, request, game_id):
        game = get_object_or_404(Game, id=game_id)
        game.moves.all().delete()
        return Response({"message": "All moves cleared"})

