# core/urls.py

from django.urls import path
from . import views
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    # auth
    RegisterAPIView,
    LoginAPIView,
    LogoutAPIView,
    ProfileAPIView,

    # users
    UserListCreateAPIView,
    UserRetrieveAPIView,

    # games
    GameListCreateAPIView,
    GameRetrieveAPIView,
    UserGameListAPIView,
    EndGameAPIView,

    # moves
    GameMoveCreateAPIView,
    GameMoveRetrieveAPIView,
    GameMoveListAPIView,
    GameMoveUndoAPIView,
    GameMovesClearAPIView,

    # statistics
    UserStatisticsListCreateAPIView,
    UserStatisticsRetrieveAPIView,
)

urlpatterns = [

    # --------------------------------
    # AUTH
    # --------------------------------
    path('auth/register/', RegisterAPIView.as_view(), name='register'),
    path('auth/login/', LoginAPIView.as_view(), name='login'),
    path('auth/logout/', LogoutAPIView.as_view(), name='logout'),
    path('auth/profile/', ProfileAPIView.as_view(), name='profile'),

    # simplejwt handles token refresh internally
    # POST { refresh } → { access, refresh }
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),

    # --------------------------------
    # USERS
    # --------------------------------
    path('users/', UserListCreateAPIView.as_view(), name='user-list'),
    path('users/<int:pk>/', UserRetrieveAPIView.as_view(), name='user-detail'),

    # --------------------------------
    # GAMES
    # --------------------------------
    path('games/', GameListCreateAPIView.as_view(), name='game-list-create'),
    path('games/<int:pk>/', GameRetrieveAPIView.as_view(), name='game-detail'),
    path('games/user/<int:user_id>/', UserGameListAPIView.as_view(), name='user-games'),
    path('games/<int:game_id>/end/', EndGameAPIView.as_view(), name='end-game'),

    # --------------------------------
    # MOVES
    # --------------------------------
    path('moves/', GameMoveCreateAPIView.as_view(), name='move-create'),
    path('moves/<int:pk>/', GameMoveRetrieveAPIView.as_view(), name='move-detail'),
    path('games/<int:game_id>/moves/', GameMoveListAPIView.as_view(), name='game-moves'),
    path('games/<int:game_id>/moves/undo/', GameMoveUndoAPIView.as_view(), name='move-undo'),
    path('games/<int:game_id>/moves/clear/', GameMovesClearAPIView.as_view(), name='moves-clear'),

    # --------------------------------
    # STATISTICS
    # --------------------------------
    path('statistics/', UserStatisticsListCreateAPIView.as_view(), name='stats-list'),
    path('statistics/<int:pk>/', UserStatisticsRetrieveAPIView.as_view(), name='stats-detail'),


    # online game apis
    path('online/rooms/', views.OnlineRoomListAPIView.as_view()),
    path('online/create/', views.OnlineRoomCreateAPIView.as_view()),
    path('online/join/<str:room_code>/', views.OnlineRoomJoinAPIView.as_view()),


    path('auth/firebase/', views.FirebaseLoginAPIView.as_view()),
]