# Branch model is defined in app/models/user.py to avoid circular import issues
from app.models.user import Branch

__all__ = ['Branch']

