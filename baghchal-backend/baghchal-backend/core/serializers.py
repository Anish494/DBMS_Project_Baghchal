# core/serializers.py

from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import Game, GameMove, UserStatistics

User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,   
        required=True,
    )
    password2 = serializers.CharField(
        write_only=True,
        required=True,
        label='Confirm Password'
    )

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password2', 'role']
        extra_kwargs = {
            'role': {'required': False},  
        }

    def validate(self, attrs):
        
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({'password': 'Passwords do not match.'})

       
        validate_password(attrs['password'])

        return attrs

    def create(self, validated_data):
        validated_data.pop('password2') 
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            role=validated_data.get('role', 'player'),
        )
        return user



class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'date_joined']
      


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)  
    password = serializers.CharField(required=True)


# -------------------------------
# 4️⃣ GAME Serializer
# -------------------------------
class GameSerializer(serializers.ModelSerializer):
    player = UserSerializer(read_only=True)

    class Meta:
        model = Game
        fields = ['id', 'player', 'winner', 'goats_killed', 'started_at', 'ended_at']


# -------------------------------
# 5️⃣ GAME_MOVE Serializer
# -------------------------------
class GameMoveSerializer(serializers.ModelSerializer):
    class Meta:
        model = GameMove
        fields = ['id', 'game', 'move_number', 'piece', 'from_position', 'to_position', 'is_capture', 'created_at']


# -------------------------------
# 6️⃣ USER_STATISTICS Serializer
# -------------------------------
class UserStatisticsSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    user_id = serializers.IntegerField(source='user.id', read_only=True)

    class Meta:
        model = UserStatistics
        fields = ['id', 'user_id', 'username', 'games_played', 'games_won', 'games_lost', 'total_goats_killed']