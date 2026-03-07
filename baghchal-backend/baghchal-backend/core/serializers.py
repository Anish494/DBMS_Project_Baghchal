from rest_framework import serializers
from .models import User, Game, GameMove, UserStatistics


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'role']

    def create(self, validated_data):
        return User.objects.create(**validated_data)




class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()



class GameSerializer(serializers.ModelSerializer):
    player = UserSerializer(read_only=True)  # nested
    class Meta:
        model = Game
        fields = ['id', 'player', 'winner', 'goats_killed', 'started_at', 'ended_at']


class GameMoveSerializer(serializers.ModelSerializer):
    class Meta:
        model = GameMove
        fields = ['id', 'game', 'move_number', 'piece', 'from_position', 'to_position', 'is_capture', 'created_at']


class UserStatisticsSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    class Meta:
        model = UserStatistics
        fields = ['id', 'user', 'games_played', 'games_won', 'games_lost', 'total_goats_killed']
