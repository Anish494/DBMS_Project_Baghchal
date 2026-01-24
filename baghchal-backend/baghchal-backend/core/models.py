# core/models.py

from django.db import models

# -------------------------------
# 1️⃣ USER Table
# -------------------------------
class User(models.Model):
    ROLE_CHOICES = [
        ('player', 'Player'),
        ('admin', 'Admin'),
    ]

    id = models.AutoField(primary_key=True)
    username = models.CharField(max_length=100, unique=True)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=255)  # store hashed passwords
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='player')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.username

    class Meta:
        managed = False
        db_table = 'users'


# -------------------------------
# 2️⃣ GAME Table
# -------------------------------
class Game(models.Model):
    id = models.AutoField(primary_key=True)
    player = models.ForeignKey(User, on_delete=models.CASCADE, db_column='player_id')
    winner = models.CharField(max_length=10, null=True, blank=True)
    goats_killed = models.IntegerField(default=0)
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Game {self.id} - {self.player.username}"

    class Meta:
        managed = False
        db_table = 'game'


# -------------------------------
# 3️⃣ GAME_MOVE Table
# -------------------------------
class GameMove(models.Model):
    PIECE_CHOICES = [
        ('tiger', 'Tiger'),
        ('goat', 'Goat'),
    ]

    id = models.AutoField(primary_key=True)
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='moves', db_column='game_id')
    move_number = models.IntegerField()
    piece = models.CharField(max_length=10, choices=PIECE_CHOICES)
    from_position = models.CharField(max_length=10)
    to_position = models.CharField(max_length=10)
    is_capture = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Move {self.move_number} ({self.piece})"

    class Meta:
        managed = False
        db_table = 'game_move'


# -------------------------------
# 4️⃣ USER_STATISTICS Table
# -------------------------------
class UserStatistics(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.OneToOneField(User, on_delete=models.CASCADE, db_column='user_id')
    games_played = models.IntegerField(default=0)
    games_won = models.IntegerField(default=0)
    games_lost = models.IntegerField(default=0)
    total_goats_killed = models.IntegerField(default=0)

    def __str__(self):
        return f"Stats - {self.user.username}"

    class Meta:
        managed = False
        db_table = 'user_statistics'
