"""
ConnectionManager — gère les connexions WebSocket actives.

Deux indexes sont maintenus en mémoire :
  - by_user_id   : { user_id  → set of WebSocket }
  - by_role      : { role     → set of WebSocket }

Un même WebSocket est présent dans les deux, ce qui permet
d'envoyer à un user précis OU à tous les users d'un rôle.
"""
import json
from collections import defaultdict
from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        # user_id (int) → ensemble de connexions (multi-onglets)
        self.by_user_id: dict[int, set[WebSocket]] = defaultdict(set)
        # role (str) → ensemble de connexions
        self.by_role: dict[str, set[WebSocket]] = defaultdict(set)

    async def connect(self, websocket: WebSocket, user_id: int, role: str):
        await websocket.accept()
        self.by_user_id[user_id].add(websocket)
        self.by_role[role].add(websocket)

    def disconnect(self, websocket: WebSocket, user_id: int, role: str):
        self.by_user_id[user_id].discard(websocket)
        self.by_role[role].discard(websocket)

    async def send_to_user(self, user_id: int, data: dict):
        """Envoie à toutes les connexions actives d'un utilisateur."""
        dead = set()
        for ws in self.by_user_id.get(user_id, set()):
            try:
                await ws.send_json(data)
            except Exception:
                dead.add(ws)
        # Nettoie les connexions mortes
        for ws in dead:
            self.by_user_id[user_id].discard(ws)

    async def broadcast_to_role(self, role: str, data: dict):
        """Envoie à tous les utilisateurs connectés ayant ce rôle."""
        dead = set()
        for ws in self.by_role.get(role, set()):
            try:
                await ws.send_json(data)
            except Exception:
                dead.add(ws)
        for ws in dead:
            self.by_role[role].discard(ws)


# Instance globale partagée par toute l'application
manager = ConnectionManager()