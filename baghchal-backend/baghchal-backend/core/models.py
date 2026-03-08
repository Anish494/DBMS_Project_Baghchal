# core/models.py

from django.db import models
from django.contrib.auth.models import AbstractUser


# -------------------------------
# 1️⃣ USER Table
# -------------------------------
class User(AbstractUser):
    ROLE_CHOICES = [
        ('player', 'Player'),
        ('admin', 'Admin'),
    ]

    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='player')
    email = models.EmailField(unique=True)

    USERNAME_FIELD = 'email'        
    REQUIRED_FIELDS = ['username']  

    def __str__(self):
        return self.username

    class Meta:
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

    
# Add these fields to the Game model
    room_code = models.CharField(max_length=20, unique=True, null=True, blank=True)
    room_name = models.CharField(max_length=50, null=True, blank=True)
    host_role = models.CharField(max_length=10, null=True, blank=True)  # 'goat' or 'tiger'
    guest = models.ForeignKey(
        User,
        null=True,
        blank=True,
        related_name='joined_games',
        on_delete=models.SET_NULL
    )
    status = models.CharField(max_length=20, default='waiting')  # 'waiting', 'active', 'finished'


    def __str__(self):
        return f"Game {self.id} - {self.player.username}"

    class Meta:
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
        db_table = 'user_statistics'

from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=User)
def create_user_statistics(sender, instance, created, **kwargs):
    if created:
        UserStatistics.objects.get_or_create(user=instance)
# ---------------------------------------------------------------
# REFERENCE — AbstractBaseUser version (more control, more code)
# Use this if you ever need to remove username entirely or have
# very custom auth logic. For this project AbstractUser is enough.
# ---------------------------------------------------------------

# from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
# from django.db import models

# class UserManager(BaseUserManager):
#     def create_user(self, email, password=None, **extra_fields):
#         if not email:
#             raise ValueError('Email is required')
#         email = self.normalize_email(email)
#         user = self.model(email=email, **extra_fields)
#         user.set_password(password)
#         user.save(using=self._db)
#         return user

#     def create_superuser(self, email, password=None, **extra_fields):
#         extra_fields.setdefault('is_staff', True)
#         extra_fields.setdefault('is_superuser', True)
#         extra_fields.setdefault('is_active', True)
#         return self.create_user(email, password, **extra_fields)

# class User(AbstractBaseUser, PermissionsMixin):
#     email = models.EmailField(unique=True)
#     username = models.CharField(max_length=50, unique=True)
#     is_active = models.BooleanField(default=True)
#     is_staff = models.BooleanField(default=False)
#     date_joined = models.DateTimeField(auto_now_add=True)
#     objects = UserManager()
#     USERNAME_FIELD = 'email'
#     REQUIRED_FIELDS = ['username']
#     class Meta:
#         db_table = 'users'