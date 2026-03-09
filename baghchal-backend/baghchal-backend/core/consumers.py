import json
import jwt
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.conf import settings
from django.utils import timezone


class GameConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.room_code = self.scope['url_route']['kwargs']['room_code']
        self.room_group = f'game_{self.room_code}'

        token = self.get_token_from_scope()
        self.user = await self.get_user_from_token(token)

        if self.user is None:
            await self.close()
            return

        self.game = await self.get_game(self.room_code)
        if self.game is None:
            await self.close()
            return

        self.role = await self.get_role(self.user, self.game)

        await self.channel_layer.group_add(self.room_group, self.channel_name)
        await self.accept()

    # Broadcast to the room that this player connected
        await self.channel_layer.group_send(self.room_group, {
            'type': 'player_joined',
            'username': self.user.username,
            'role': self.role,
        })

    # If the game is already active, the opponent connected before us via HTTP join
    # Send opponent info DIRECTLY to this connection only
    # (group_send won't help here — opponent may not be on WebSocket yet)
        # Replace the opponent send block with this
        opponent = await self.get_opponent(self.user, self.game)
        if opponent:
    # Opponent's role is opposite of ours
            opponent_role = 'tiger' if self.role == 'goat' else 'goat'
            await self.send(text_data=json.dumps({
                'type': 'player_joined',
                'username': opponent['username'],
                'role': opponent_role,
            }))

        board_state = await self.get_board_state(self.game)
        if board_state:
            await self.send(text_data=json.dumps({
                'type': 'game_state',
                'board_state': board_state,
            }))


    async def disconnect(self, close_code):
        if hasattr(self, 'room_group'):
            await self.channel_layer.group_send(self.room_group, {
                'type': 'player_left',
                'username': getattr(self.user, 'username', 'Unknown'),
            })
            await self.channel_layer.group_discard(self.room_group, self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            return

        msg_type = data.get('type')

        if msg_type == 'move':
            # Broadcast the move to both players
            await self.channel_layer.group_send(self.room_group, {
                'type': 'game_move',
                'from_pos': data.get('from_pos'),
                'to_pos': data.get('to_pos'),
                'piece': data.get('piece'),
                'captured': data.get('captured'),        # [r,c] or None
                'goats_captured': data.get('goats_captured', 0),
                'sender': self.user.username,
                'role': self.role,
            })

            if data.get('board_state'):
                await self.save_board_state(self.game, data.get('board_state'))

        elif msg_type == 'chat':
            await self.channel_layer.group_send(self.room_group, {
                'type': 'chat_message',
                'message': data.get('message', ''),
                'sender': self.user.username,
            })

        elif msg_type == 'game_over':
            winner = data.get('winner')  # 'goat' or 'tiger'

            # Update game in DB
            await self.end_game(self.game, winner, data.get('goats_captured', 0))

            # Update statistics for both players
            await self.update_statistics(self.game, winner)

            # Broadcast game over to both players
            await self.channel_layer.group_send(self.room_group, {
                'type': 'game_ended',
                'winner': winner,
            })

    # -----------------------------------------------
    # GROUP MESSAGE HANDLERS
    # These are called when group_send fires an event
    # The 'type' field maps to the method name
    # (dots replaced with underscores)
    # -----------------------------------------------

    async def player_joined(self, event):
        await self.send(text_data=json.dumps({
            'type': 'player_joined',
            'username': event['username'],
            'role': event['role'],
        }))

    async def player_left(self, event):
        await self.send(text_data=json.dumps({
            'type': 'player_left',
            'username': event['username'],
        }))

    async def game_move(self, event):
        await self.send(text_data=json.dumps({
            'type': 'move',
            'from_pos': event['from_pos'],
            'to_pos': event['to_pos'],
            'piece': event['piece'],
            'captured': event['captured'],
            'goats_captured': event['goats_captured'],
            'sender': event['sender'],
            'role': event['role'],
        }))

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'chat',
            'message': event['message'],
            'sender': event['sender'],
        }))

    async def game_ended(self, event):
        await self.send(text_data=json.dumps({
            'type': 'game_over',
            'winner': event['winner'],
        }))

    # -----------------------------------------------
    # HELPER METHODS
    # -----------------------------------------------
    @database_sync_to_async
    def get_opponent(self, user, game):
        from .models import Game
        g = Game.objects.select_related('player', 'guest').get(id=game.id)
        if g.status != 'active':
            return None
        if g.player_id == user.id:
            # I am the host, opponent is guest
            if g.guest:
                return {'username': g.guest.username, 'id': g.guest.id}
        else:
            # I am the guest, opponent is host
            return {'username': g.player.username, 'id': g.player.id}
        return None


    
    @database_sync_to_async
    def save_board_state(self, game, state):
        from .models import Game
        Game.objects.filter(id=game.id).update(board_state=state)

    @database_sync_to_async
    def get_board_state(self, game):
        from .models import Game
        g = Game.objects.get(id=game.id)
        return g.board_state  # None if game just started


    def get_token_from_scope(self):
        # Extract token from query string: ?token=xxx
        query_string = self.scope.get('query_string', b'').decode()
        for part in query_string.split('&'):
            if part.startswith('token='):
                return part[len('token='):]
        return None

    @database_sync_to_async
    def get_user_from_token(self, token):
        if not token:
            return None
        try:
            from rest_framework_simplejwt.tokens import AccessToken
            from django.contrib.auth import get_user_model
            User = get_user_model()
            decoded = AccessToken(token)
            user_id = decoded['user_id']
            return User.objects.get(id=user_id)
        except Exception:
            return None

    @database_sync_to_async
    def get_game(self, room_code):
        from .models import Game
        try:
            return Game.objects.select_related('player', 'guest').get(room_code=room_code)
        except Game.DoesNotExist:
            return None

    @database_sync_to_async
    def get_role(self, user, game):
        if game.player_id == user.id:
            return game.host_role  # 'goat' or 'tiger'
        else:
            return 'tiger' if game.host_role == 'goat' else 'goat'

    @database_sync_to_async
    def end_game(self, game, winner, goats_captured):
        from .models import Game
        g = Game.objects.get(id=game.id)
        g.winner = winner
        g.goats_killed = goats_captured
        g.ended_at = timezone.now()
        g.status = 'finished'
        g.save()

    @database_sync_to_async
    def update_statistics(self, game, winner):
        from .models import Game, UserStatistics
        g = Game.objects.select_related('player', 'guest').get(id=game.id)

        # Host stats
        host_stats, _ = UserStatistics.objects.get_or_create(user=g.player)
        host_stats.games_played += 1
        if g.host_role == winner:
            host_stats.games_won += 1
        else:
            host_stats.games_lost += 1
        host_stats.save()

        # Guest stats
        if g.guest:
            guest_role = 'tiger' if g.host_role == 'goat' else 'goat'
            guest_stats, _ = UserStatistics.objects.get_or_create(user=g.guest)
            guest_stats.games_played += 1
            if guest_role == winner:
                guest_stats.games_won += 1
            else:
                guest_stats.games_lost += 1
            guest_stats.save()