# build a schema using pydantic
from pydantic import BaseModel


class User(BaseModel):
    username: str
    password: str

    class Config:
        from_attributes = True
