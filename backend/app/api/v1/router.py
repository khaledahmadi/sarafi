from fastapi import APIRouter

from app.api.v1 import admin, auth, public, transfers

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router)
api_router.include_router(public.router)
api_router.include_router(transfers.router)
api_router.include_router(admin.router)
