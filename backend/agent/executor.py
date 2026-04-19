import uuid
from agent.schemas import validate_no_path_traversal


# =============================
# MAIN EXECUTOR
# =============================
def execute_agent_actions(actions, supabase, user_id, project_id):
    """
    Takes validated AI actions and applies them to Supabase safely.
    """

    results = []

    for action in actions:

        # =========================
        # CREATE FILE
        # =========================
        if action.action == "create_file":
            validate_no_path_traversal(action.path)

            res = supabase.table("project_files").insert({
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "project_name": project_id,
                "file_path": action.path,
                "content": action.content,
                "language": "auto"
            }).execute()

            results.append({
                "action": "create_file",
                "path": action.path,
                "status": "created"
            })


        # =========================
        # UPDATE FILE
        # =========================
        elif action.action == "update_file":
            validate_no_path_traversal(action.path)

            res = supabase.table("project_files") \
                .update({
                    "content": action.content
                }) \
                .eq("project_name", project_id) \
                .eq("file_path", action.path) \
                .eq("user_id", user_id) \
                .execute()

            results.append({
                "action": "update_file",
                "path": action.path,
                "status": "updated"
            })


        # =========================
        # DELETE FILE
        # =========================
        elif action.action == "delete_file":
            validate_no_path_traversal(action.path)

            res = supabase.table("project_files") \
                .delete() \
                .eq("project_name", project_id) \
                .eq("file_path", action.path) \
                .eq("user_id", user_id) \
                .execute()

            results.append({
                "action": "delete_file",
                "path": action.path,
                "status": "deleted"
            })


        # =========================
        # RENAME FILE
        # =========================
        elif action.action == "rename_file":
            validate_no_path_traversal(action.old_path)
            validate_no_path_traversal(action.new_path)

            res = supabase.table("project_files") \
                .update({
                    "file_path": action.new_path
                }) \
                .eq("project_name", project_id) \
                .eq("file_path", action.old_path) \
                .eq("user_id", user_id) \
                .execute()

            results.append({
                "action": "rename_file",
                "from": action.old_path,
                "to": action.new_path,
                "status": "renamed"
            })


        # =========================
        # UNKNOWN ACTION (SAFETY)
        # =========================
        else:
            results.append({
                "action": "unknown",
                "status": "ignored"
            })

    return results