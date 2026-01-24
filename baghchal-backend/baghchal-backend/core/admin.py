# core/admin.py

from django.contrib import admin
from .models import User, Game, GameMove, UserStatistics

# -------------------------------
# 1️⃣ USER Admin
# -------------------------------
@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('id', 'username', 'email', 'role', 'created_at')
    search_fields = ('username', 'email')
    list_filter = ('role',)
    readonly_fields = ('id', 'created_at')


# -------------------------------
# 2️⃣ GAME Admin
# -------------------------------
@admin.register(Game)
class GameAdmin(admin.ModelAdmin):
    list_display = ('id', 'player', 'winner', 'goats_killed', 'started_at', 'ended_at')
    search_fields = ('player__username', 'winner')
    readonly_fields = ('id', 'started_at')


# -------------------------------
# 3️⃣ GAME_MOVE Admin
# -------------------------------
@admin.register(GameMove)
class GameMoveAdmin(admin.ModelAdmin):
    list_display = ('id', 'game', 'move_number', 'piece', 'from_position', 'to_position', 'is_capture', 'created_at')
    search_fields = ('game__id', 'piece')
    list_filter = ('piece', 'is_capture')
    readonly_fields = ('id', 'created_at')


# -------------------------------
# 4️⃣ USER_STATISTICS Admin
# -------------------------------
@admin.register(UserStatistics)
class UserStatisticsAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'games_played', 'games_won', 'games_lost', 'total_goats_killed')
    search_fields = ('user__username',)
    readonly_fields = ('id',)

