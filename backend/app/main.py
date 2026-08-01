from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .routers import admin, agent, auth, workspace


def create_app() -> FastAPI:
    app = FastAPI(title="Otto API", version="0.1.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(auth.router)
    app.include_router(agent.router)
    app.include_router(workspace.router)
    app.include_router(admin.router)

    @app.get("/health")
    def health() -> dict:
        return {"ok": True, "service": "otto-api"}

    return app


app = create_app()
