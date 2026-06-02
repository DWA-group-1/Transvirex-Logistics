from collections import defaultdict

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        self.by_user_id: dict[str, set[WebSocket]] = defaultdict(set)
        self.by_role: dict[str, set[WebSocket]] = defaultdict(set)

    async def connect(self, websocket: WebSocket, user_id: str, role: str):
        await websocket.accept()
        self.by_user_id[user_id].add(websocket)
        self.by_role[role].add(websocket)

    def disconnect(self, websocket: WebSocket, user_id: str, role: str):
        self.by_user_id[user_id].discard(websocket)
        self.by_role[role].discard(websocket)

    async def send_to_user(self, user_id: str, data: dict):
        dead = set()
        for ws in self.by_user_id.get(user_id, set()):
            try:
                await ws.send_json(data)
            except Exception:
                dead.add(ws)
        for ws in dead:
            self.by_user_id[user_id].discard(ws)

    async def broadcast_to_role(self, role: str, data: dict):
        dead = set()
        for ws in self.by_role.get(role, set()):
            try:
                await ws.send_json(data)
            except Exception:
                dead.add(ws)
        for ws in dead:
            self.by_role[role].discard(ws)


manager = ConnectionManager()
