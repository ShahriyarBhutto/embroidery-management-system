from typing import Any


def ok(data: Any = None, message: str = "Success") -> dict:
    return {"success": True, "data": data, "message": message}


def fail(message: str = "An error occurred") -> dict:
    return {"success": False, "data": None, "message": message}
