from rest_framework import serializers
from .models import User, Game, GameMove, UserStatistics

# -------------------------------
# 1️⃣ User Serializer

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'role']

    def create(self, validated_data):
        # Plain text password (not recommended for production)
        return User.objects.create(**validated_data)




class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()



# -------------------------------
# 2️⃣ Game Serializer
# -------------------------------
class GameSerializer(serializers.ModelSerializer):
    player = UserSerializer(read_only=True)  # nested
    class Meta:
        model = Game
        fields = ['id', 'player', 'winner', 'goats_killed', 'started_at', 'ended_at']

# -------------------------------
# 3️⃣ GameMove Serializer
# -------------------------------
class GameMoveSerializer(serializers.ModelSerializer):
    class Meta:
        model = GameMove
        fields = ['id', 'game', 'move_number', 'piece', 'from_position', 'to_position', 'is_capture', 'created_at']

# -------------------------------
# 4️⃣ UserStatistics Serializer
# -------------------------------
class UserStatisticsSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    class Meta:
        model = UserStatistics
        fields = ['id', 'user', 'games_played', 'games_won', 'games_lost', 'total_goats_killed']
