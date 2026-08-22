"""
SAATHI AI Engine Server Launcher
"""

import sys
import os
import uvicorn

# Add current dir and project root to sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(os.path.dirname(CURRENT_DIR))

for p in [CURRENT_DIR, PROJECT_ROOT]:
    if p not in sys.path:
        sys.path.insert(0, p)

if __name__ == "__main__":
    port = int(os.getenv("PORT", "8000"))
    host = os.getenv("HOST", "0.0.0.0")
    print(f"==================================================")
    print(f" SAATHI AI Engine Starting on http://{host}:{port}")
    print(f" Interactive Swagger Docs: http://localhost:{port}/docs")
    print(f"==================================================")
    uvicorn.run("app.main:app", host=host, port=port, reload=False)
