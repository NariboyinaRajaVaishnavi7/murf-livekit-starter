import sqlite3
import json
from datetime import datetime


DB_NAME = "memory.db"


def init_db():
    conn = sqlite3.connect(DB_NAME)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            user_id TEXT PRIMARY KEY,
            name TEXT,
            language_preference TEXT,
            facts TEXT,
            last_interaction TEXT
        )
    """)

    conn.commit()
    conn.close()


def get_user(user_id):
    conn = sqlite3.connect(DB_NAME)

    cursor = conn.execute(
        """
        SELECT user_id, name, language_preference, facts, last_interaction
        FROM users
        WHERE user_id = ?
        """,
        (user_id,)
    )

    row = cursor.fetchone()

    conn.close()

    if row is None:
        return None

    return {
        "user_id": row[0],
        "name": row[1],
        "language_preference": row[2],
        "facts": json.loads(row[3]) if row[3] else {},
        "last_interaction": row[4],
    }


def save_user(
    user_id,
    name,
    language_preference,
    facts
):
    conn = sqlite3.connect(DB_NAME)

    # Convert facts into JSON if it was passed as a string
    if isinstance(facts, str):
        try:
            facts_json = json.dumps(json.loads(facts))
        except json.JSONDecodeError:
            facts_json = json.dumps({"info": facts})
    else:
        facts_json = json.dumps(facts)

    conn.execute(
        """
        INSERT INTO users (
            user_id,
            name,
            language_preference,
            facts,
            last_interaction
        )
        VALUES (?, ?, ?, ?, ?)

        ON CONFLICT(user_id) DO UPDATE SET
            name = excluded.name,
            language_preference = excluded.language_preference,
            facts = excluded.facts,
            last_interaction = excluded.last_interaction
        """,
        (
            user_id,
            name,
            language_preference,
            facts_json,
            datetime.now().isoformat(),
        )
    )

    conn.commit()
    conn.close()