import json
import os


DATA_FILE = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    "exercises.json"
)


def _match_field(input_val: str, target_val: str) -> bool:
    v1 = str(input_val).strip().lower()
    v2 = str(target_val).strip().lower()
    if v1 == v2:
        return True
    if v1.rstrip("s") == v2.rstrip("s"):
        return True
    return False


def get_next_exercise(subject: str, topic: str, level: str):
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as file:
            exercises = json.load(file)

        for exercise in exercises:
            if (
                _match_field(subject, exercise["subject"])
                and _match_field(topic, exercise["topic"])
                and _match_field(level, exercise["level"])
            ):
                return {
                    "success": True,
                    "source": "Local Learning Exercise Dataset",
                    "data_date": "2026-08-13",
                    "exercise": exercise
                }

        return {
            "success": False,
            "message": "No matching exercise was found."
        }

    except Exception as e:
        return {
            "success": False,
            "message": "The exercise library is currently unavailable."
        }
    print("TOOLS FILE IS RUNNING")

