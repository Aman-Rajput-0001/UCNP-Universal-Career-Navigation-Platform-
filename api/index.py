import sys
from pathlib import Path

# Add backend directory to sys.path so modules under backend/app are directly importable
ROOT_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = ROOT_DIR / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from backend.app.main import app

# Vercel Python runtime detects standard ASGI / WSGI application
handler = app

