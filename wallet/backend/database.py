import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Load .env file
# Load .env from backend folder explicitly
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

# Get DB URL from .env
DATABASE_URL = os.getenv("DATABASE_URL")

# Safety check (VERY IMPORTANT)
if not DATABASE_URL:
    raise ValueError("DATABASE_URL is not set in .env file")

# Create engine
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True
)

# Session
SessionLocal = sessionmaker(bind=engine)

# Base
Base = declarative_base()


# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()