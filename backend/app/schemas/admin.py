from pydantic import BaseModel


class AdminStatsOut(BaseModel):
    transfers: int
    pending: int
    currencies: int
    services: int
    branches: int
    articles: int
    pending_comments: int
    pending_feedbacks: int
