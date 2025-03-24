from sqlmodel import SQLModel, Field, Session, create_engine
from ..entities import *
from dotenv import load_dotenv

import os

load_dotenv()
DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://bidwize_user:bidwize_password@postgres:5432/bidwize_db"
)

engine = create_engine(DATABASE_URL)


def get_db():
    """
    Dependency to provide a database session.
    Ensures the session is properly closed after use.
    """
    with Session(engine, expire_on_commit=False) as session:
        yield session


def create_db_and_tables():
    """
    Create the database and tables.
    """
    # drop all tables first
    SQLModel.metadata.drop_all(engine)
    SQLModel.metadata.create_all(engine)
    print("Database and tables created")
    check_db()


def check_db():
    # select all tables from the database
    from sqlalchemy import text

    query = text(
        "SELECT table_name FROM information_schema.tables WHERE table_schema='public';"
    )
    with Session(engine) as session:
        result = session.execute(query)
        print(result)
        for row in result:
            print(row)
