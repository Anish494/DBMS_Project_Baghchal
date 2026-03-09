# core/views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from django.contrib.auth import authenticate, get_user_model
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Min, F, ExpressionWrapper, DurationField


import random
import string

from .models import Game, GameMove, UserStatistics
from .serializers import (
    UserSerializer,
    RegisterSerializer,
    LoginSerializer,
    GameSerializer,
    GameMoveSerializer,
    UserStatisticsSerializer,
)

User = get_user_model()


# --------------------------------
# AUTH APIs
# --------------------------------

class RegisterAPIView(APIView):
    permission_classes = [permissions.AllowAny]  # anyone can register

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Issue JWT tokens immediately after registration
        # so user doesn't have to log in separately
        refresh = RefreshToken.for_user(user)

        return Response({
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': user.role,
            },
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_201_CREATED)


class LoginAPIView(APIView):
    permission_classes = [permissions.AllowAny]  # anyone can log in

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        password = serializer.validated_data['password']

        # authenticate() does two things:
        # 1. finds user by email (because USERNAME_FIELD = 'email')
        # 2. calls user.check_password(password) — hashes and compares
        # returns None if either is wrong
        user = authenticate(request, username=email, password=password)

        if user is None:
            # Don't say "wrong password" vs "email not found"
            # That helps attackers enumerate valid emails
            return Response(
                {'error': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user.is_active:
            return Response(
                {'error': 'Account is disabled'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)

        return Response({
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': user.role,
            },
            'access': str(refresh.access_token),   # short lived (15 min)
            'refresh': str(refresh),                # long lived (7 days)
        })


class LogoutAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get('refresh')

        if not refresh_token:
            return Response(
                {'error': 'Refresh token is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Blacklist the refresh token
            # This is why we added rest_framework_simplejwt.token_blacklist
            # to INSTALLED_APPS — it stores invalidated tokens here
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError:
            return Response(
                {'error': 'Invalid or expired token'},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response({'message': 'Logged out successfully'})


class ProfileAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # request.user is automatically populated by JWTAuthentication
        # it decodes the Bearer token and fetches the user
        user = request.user
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': user.role,
            'date_joined': user.date_joined,
        })


# --------------------------------
# USER APIs
# --------------------------------

class UserListCreateAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        users = User.objects.all().values('id', 'username', 'email', 'role')
        return Response(list(users))


class UserRetrieveAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': user.role,
        })


# --------------------------------
# GAME APIs
# --------------------------------

class GameListCreateAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        # Use the logged-in user directly from the JWT
        # No need to pass player_id in request body
        game = Game.objects.create(player=request.user)

        return Response({
            'id': game.id,
            'player': game.player.username,
            'started_at': game.started_at,
        })


class UserGameListAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, user_id):
        games = Game.objects.filter(player_id=user_id).order_by('-started_at')

        data = [{
            'id': g.id,
            'player': g.player.username,
            'winner': g.winner,
            'goats_killed': g.goats_killed,
            'started_at': g.started_at,
            'ended_at': g.ended_at,
        } for g in games]

        return Response(data)


class GameRetrieveAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        game = get_object_or_404(Game, pk=pk)

        return Response({
            'id': game.id,
            'player': game.player.username,
            'winner': game.winner,
            'goats_killed': game.goats_killed,
            'started_at': game.started_at,
            'ended_at': game.ended_at,
        })


# --------------------------------
# GAME MOVE APIs
# --------------------------------

class GameMoveCreateAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        game_id = request.data.get('game')
        piece = request.data.get('piece')
        from_pos = request.data.get('from_position')
        to_pos = request.data.get('to_position')
        is_capture = request.data.get('is_capture', False)

        game = get_object_or_404(Game, id=game_id)

        last_move = game.moves.order_by('-move_number').first()
        move_number = last_move.move_number + 1 if last_move else 1

        move = GameMove.objects.create(
            game=game,
            move_number=move_number,
            piece=piece,
            from_position=from_pos,
            to_position=to_pos,
            is_capture=is_capture,
        )

        return Response({
            'move_number': move.move_number,
            'piece': move.piece,
            'from_position': move.from_position,
            'to_position': move.to_position,
        }, status=status.HTTP_201_CREATED)


class GameMoveRetrieveAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        move = get_object_or_404(GameMove, pk=pk)

        return Response({
            'id': move.id,
            'game': move.game.id,
            'move_number': move.move_number,
            'piece': move.piece,
            'from_position': move.from_position,
            'to_position': move.to_position,
            'is_capture': move.is_capture,
        })


class GameMoveListAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, game_id):
        game = get_object_or_404(Game, id=game_id)
        moves = game.moves.order_by('move_number')

        return Response([{
            'id': m.id,
            'move_number': m.move_number,
            'piece': m.piece,
            'from_position': m.from_position,
            'to_position': m.to_position,
            'is_capture': m.is_capture,
        } for m in moves])


class GameMoveUndoAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, game_id):
        game = get_object_or_404(Game, id=game_id)
        last_move = game.moves.order_by('-move_number').first()

        if not last_move:
            return Response({'error': 'No moves to undo'}, status=status.HTTP_400_BAD_REQUEST)

        last_move.delete()
        return Response({'message': 'Last move undone'})


class GameMovesClearAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, game_id):
        game = get_object_or_404(Game, id=game_id)
        game.moves.all().delete()
        return Response({'message': 'All moves cleared'})


# --------------------------------
# USER STATISTICS APIs
# --------------------------------

class UserStatisticsListCreateAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Compute stats live from Game table for every user
        # Same approach as UserStatisticsRetrieveAPIView
        # This way leaderboard is always accurate without
        # needing to manually sync UserStatistics table
        users = User.objects.all()
        data = []

        for user in users:
            games_played = Game.objects.filter(player=user).count()
            games_won = Game.objects.filter(player=user, winner='goat').count()
            games_lost = Game.objects.filter(player=user, winner='tiger').count()

            data.append({
                'id': user.id,
                'user': user.username,
                'games_played': games_played,
                'games_won': games_won,
                'games_lost': games_lost,
            })

        return Response(data)

    def post(self, request):
        serializer = UserStatisticsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'message': 'Statistics created'}, status=status.HTTP_201_CREATED)
class UserStatisticsRetrieveAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        user = get_object_or_404(User, pk=pk)

        games_played = Game.objects.filter(player=user).count()
        games_won = Game.objects.filter(player=user, winner='goat').count()
        games_lost = games_played - games_won

        best = Game.objects.filter(
            player=user,
            winner='player',
            ended_at__isnull=False,
        ).annotate(
            duration=ExpressionWrapper(
                F('ended_at') - F('started_at'),
                output_field=DurationField()
            )
        ).aggregate(best_score=Min('duration'))

        best_score = best['best_score'].total_seconds() if best['best_score'] else 0

        return Response({
            'username': user.username,
            'email': user.email,
            'games_played': games_played,
            'games_won': games_won,
            'games_lost': games_lost,
            'best_score': best_score,
        })


# --------------------------------
# END GAME API
# --------------------------------

class EndGameAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, game_id):
        winner = request.data.get('winner')
        goats_killed = request.data.get('goats_killed', 0)

        game = get_object_or_404(Game, id=game_id)
        game.winner = winner
        game.goats_killed = goats_killed
        game.ended_at = timezone.now()
        game.save()

        return Response({
            'id': game.id,
            'winner': game.winner,
            'goats_killed': game.goats_killed,
        })




# --------------------------------
# ONLINE ROOM APIs
# --------------------------------

def generate_room_code(length=8):
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))


class OnlineRoomListAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Only return rooms that are still waiting for a second player
        rooms = Game.objects.filter(
            status='waiting',
            room_code__isnull=False
        ).select_related('player')

        return Response([{
            'room_code': g.room_code,
            'room_name': g.room_name,
            'host': g.player.username,
            'host_role': g.host_role,
            'guest_role': 'tiger' if g.host_role == 'goat' else 'goat',
        } for g in rooms])


class OnlineRoomCreateAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        room_name = request.data.get('room_name', '').strip()
        host_role = request.data.get('host_role', 'goat')  # 'goat' or 'tiger'

        if not room_name:
            # Generate random room name if not provided
            room_name = 'Room-' + ''.join(random.choices(string.ascii_uppercase, k=4))

        # Generate unique room code
        room_code = generate_room_code()
        while Game.objects.filter(room_code=room_code).exists():
            room_code = generate_room_code()

        game = Game.objects.create(
            player=request.user,
            room_code=room_code,
            room_name=room_name,
            host_role=host_role,
            status='waiting',
        )

        return Response({
            'room_code': game.room_code,
            'room_name': game.room_name,
            'host': request.user.username,
            'host_role': host_role,
            'guest_role': 'tiger' if host_role == 'goat' else 'goat',
        }, status=status.HTTP_201_CREATED)


class OnlineRoomJoinAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, room_code):
        game = get_object_or_404(Game, room_code=room_code, status='waiting')

        # Can't join your own room
        if game.player == request.user:
            return Response(
                {'error': 'You cannot join your own room'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Assign guest and mark game as active
        game.guest = request.user
        game.status = 'active'
        game.save()

        guest_role = 'tiger' if game.host_role == 'goat' else 'goat'

        return Response({
            'room_code': game.room_code,
            'room_name': game.room_name,
            'host': game.player.username,
            'host_role': game.host_role,
            'guest': request.user.username,
            'guest_role': guest_role,
            'game_id': game.id,
        })






import firebase_admin
from firebase_admin import credentials, auth as firebase_auth
import os

# Initialize Firebase Admin SDK once when Django starts
# It reads your service account JSON to verify tokens
import json
if not firebase_admin._apps:
    firebase_creds = json.loads(os.environ.get('FIREBASE_SERVICE_ACCOUNT_JSON', '{}'))
    cred = credentials.Certificate(firebase_creds)
    firebase_admin.initialize_app(cred)


class FirebaseLoginAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        # Frontend sends the Firebase ID token
        firebase_token = request.data.get('firebase_token')

        if not firebase_token:
            return Response(
                {'error': 'Firebase token is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Verify the token with Firebase
            # This checks the token is valid, not expired, and from our app
            decoded_token = firebase_auth.verify_id_token(firebase_token)
        except Exception:
            return Response(
                {'error': 'Invalid Firebase token'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Get user info from the decoded token
        email = decoded_token.get('email')
        name = decoded_token.get('name', '')
        uid = decoded_token.get('uid')

        if not email:
            return Response(
                {'error': 'No email in Firebase token'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Find existing user or create new one
        # get_or_create returns (user, created) tuple
        # created is True if user is new, False if existing
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'username': name or email.split('@')[0],
                'is_active': True,
            }
        )

        # If username already taken, make it unique
        if created and User.objects.filter(username=user.username).exclude(pk=user.pk).exists():
            user.username = f"{user.username}_{uid[:6]}"
            user.save()

        # Issue our normal JWT tokens — same as regular login
        refresh = RefreshToken.for_user(user)

        return Response({
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': getattr(user, 'role', 'player'),
            },
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        })