from django.urls import path
from .views import (
    UserListCreateAPIView, UserRetrieveAPIView,
    GameListCreateAPIView, GameRetrieveAPIView,
    GameMoveCreateAPIView, GameMoveRetrieveAPIView,
    GameMoveListAPIView, GameMoveUndoAPIView, GameMovesClearAPIView,  
    UserStatisticsListCreateAPIView, UserStatisticsRetrieveAPIView, LoginAPIView
)


urlpatterns = [
    path('users/', UserListCreateAPIView.as_view(), name='user-list-create'),
    path('login/', LoginAPIView.as_view()),  

    path('users/<int:pk>/', UserRetrieveAPIView.as_view(), name='user-detail'),
    path('games/', GameListCreateAPIView.as_view(), name='game-list-create'),
    path('games/<int:pk>/', GameRetrieveAPIView.as_view(), name='game-detail'),
    path('moves/', GameMoveCreateAPIView.as_view(), name='gamemove-list-create'),
    path('moves/<int:pk>/', GameMoveRetrieveAPIView.as_view(), name='gamemove-detail'),
    path('statistics/', UserStatisticsListCreateAPIView.as_view(), name='stats-list-create'),
    path('statistics/<int:pk>/', UserStatisticsRetrieveAPIView.as_view(), name='stats-detail'),
    path("games/<int:game_id>/moves/", GameMoveListAPIView.as_view()),
    path("games/<int:game_id>/moves/undo/", GameMoveUndoAPIView.as_view()),
    path("games/<int:game_id>/moves/clear/", GameMovesClearAPIView.as_view()),



]
