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





# full custom user model with hashed password

# # models.py
# from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
# from django.db import models

# class UserManager(BaseUserManager):
#     """
#     Django requires a custom manager when you use AbstractBaseUser.
#     This manager defines HOW users are created.
#     """

#     def create_user(self, email, password=None, **extra_fields):
#         if not email:
#             raise ValueError('Email is required')
        
#         email = self.normalize_email(email)  # lowercases the domain part
#         user = self.model(email=email, **extra_fields)
#         user.set_password(password)          # hashes the password
#         user.save(using=self._db)
#         return user

#     def create_superuser(self, email, password=None, **extra_fields):
#         # Django's createsuperuser command calls this
#         extra_fields.setdefault('is_staff', True)
#         extra_fields.setdefault('is_superuser', True)
#         extra_fields.setdefault('is_active', True)
#         return self.create_user(email, password, **extra_fields)


# class User(AbstractBaseUser, PermissionsMixin):
#     """
#     AbstractBaseUser gives you:
#       - password field (hashed)
#       - last_login field
#       - set_password(), check_password()
#       - is_anonymous, is_authenticated properties

#     PermissionsMixin gives you:
#       - is_superuser
#       - groups and user_permissions (for Django's permission system)
#       - has_perm(), has_module_perms()

#     Everything else, YOU define.
#     """

#     email = models.EmailField(unique=True)
#     username = models.CharField(max_length=50, unique=True)
#     first_name = models.CharField(max_length=50, blank=True)
#     last_name = models.CharField(max_length=50, blank=True)
    
#     # Your custom fields — add whatever you need
#     phone = models.CharField(max_length=20, blank=True)
#     avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
#     bio = models.TextField(blank=True)
    
#     # Required by Django's admin and auth system
#     is_active = models.BooleanField(default=True)
#     is_staff = models.BooleanField(default=False)   # can access admin panel
#     date_joined = models.DateTimeField(auto_now_add=True)

#     objects = UserManager()  # Attach your custom manager

#     # Tell Django: use email to log in, not username
#     USERNAME_FIELD = 'email'
    
#     # Fields prompted when running: python manage.py createsuperuser
#     # (besides email and password, which are always asked)
#     REQUIRED_FIELDS = ['username']

#     class Meta:
#         db_table = 'users'  # Custom table name instead of app_user

#     def __str__(self):
#         return self.email

#     def get_full_name(self):
#         return f"{self.first_name} {self.last_name}".strip()








# changes for settings.py 

# AUTH_USER_MODEL = 'yourapp.User'
# ```

# **This must be set BEFORE your first migration.** Django bakes this into every foreign key that points to the user model across the whole project. If you set it after running migrations, you'll face a web of broken references.

# ---

# ## What happens under the hood when you log in

# When you call `authenticate(request, username=email, password='hunter2')`:
# ```
# 1. Django looks up: User.objects.get(email=email)

# 2. Calls user.check_password('hunter2')
#    → Reads the stored hash: "pbkdf2_sha256$720000$xK9mR2$d4e5f6..."
#    → Extracts the salt: "xK9mR2"
#    → Runs PBKDF2("hunter2" + "xK9mR2", 720000 iterations)
#    → Compares result to stored hash
#    → Returns True / False

# 3. If True, returns the user object
#    If False, returns None (same response whether email is wrong or password is wrong)