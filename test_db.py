import asyncio
from backend.api.index import require_db_client, get_projects

db = require_db_client()
print(get_projects({"sub": "525e1c54-ac34-4452-92fa-3d1c33876f0c"}))
