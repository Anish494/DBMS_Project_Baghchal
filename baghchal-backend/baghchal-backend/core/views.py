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
class GameListCreateAPIView(generics.ListCreateAPIView):
    queryset = Game.objects.all()
    serializer_class = GameSerializer

class GameRetrieveAPIView(generics.RetrieveAPIView):
    queryset = Game.objects.all()
    serializer_class = GameSerializer

# -------------------------------
# GAME_MOVE APIs
# -------------------------------
class GameMoveListCreateAPIView(generics.ListCreateAPIView):
    queryset = GameMove.objects.all()
    serializer_class = GameMoveSerializer

class GameMoveRetrieveAPIView(generics.RetrieveAPIView):
    queryset = GameMove.objects.all()
    serializer_class = GameMoveSerializer

# -------------------------------
# USER_STATISTICS APIs
# -------------------------------
class UserStatisticsListCreateAPIView(generics.ListCreateAPIView):
    queryset = UserStatistics.objects.all()
    serializer_class = UserStatisticsSerializer

class UserStatisticsRetrieveAPIView(generics.RetrieveAPIView):
    queryset = UserStatistics.objects.all()
    serializer_class = UserStatisticsSerializer
