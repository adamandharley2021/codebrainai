from pydantic import BaseModel, Field
from typing import List, Literal, Optional, Union


# -----------------------------
# FILE ACTIONS
# -----------------------------

class CreateFileAction(BaseModel):
    action: Literal["create_file"]
    path: str
    content: str


class UpdateFileAction(BaseModel):
    action: Literal["update_file"]
    path: str
    content: str


class DeleteFileAction(BaseModel):
    action: Literal["delete_file"]
    path: str


class RenameFileAction(BaseModel):
    action: Literal["rename_file"]
    old_path: str
    new_path: str


# -----------------------------
# UNION OF ALL ACTIONS
# -----------------------------

AgentAction = Union[
    CreateFileAction,
    UpdateFileAction,
    DeleteFileAction,
    RenameFileAction
]


# -----------------------------
# FULL AGENT RESPONSE FORMAT
# -----------------------------

class AgentResponse(BaseModel):
    """
    This is what the LLM MUST return.
    No free text allowed in production mode.
    """

    type: Literal["agent_actions"]

    actions: List[AgentAction]

    reasoning: Optional[str] = Field(
        default=None,
        description="Short explanation of why these changes are being made"
    )

# =============================
# 🔒 SAFETY HELPERS (PUT HERE)
# =============================

    def validate_no_path_traversal(path: str):
        if ".." in path or path.startswith("/"):
            raise ValueError(f"Invalid unsafe path: {path}")