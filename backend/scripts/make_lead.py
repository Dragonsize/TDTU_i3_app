import argparse
import os
import sys
from typing import Any, Dict, Optional

from dotenv import load_dotenv


def require_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise SystemExit(f"Missing required env var: {name}")
    return value


def get_supabase_admin() -> Any:
    from supabase import create_client

    url = require_env("SUPABASE_URL")
    service_key = require_env("SUPABASE_SERVICE_ROLE_KEY")
    return create_client(url, service_key)


def find_user_id_by_email(sb: Any, email: str) -> str:
    # Supabase Python admin API doesn't provide a server-side email filter;
    # we list users and match locally.
    page = 1
    per_page = 200
    while True:
        resp = sb.auth.admin.list_users(page=page, per_page=per_page)
        users = getattr(resp, "users", None) or []
        for u in users:
            if (getattr(u, "email", None) or "").lower() == email.lower():
                uid = getattr(u, "id", None)
                if uid:
                    return uid
        if len(users) < per_page:
            break
        page += 1
    raise SystemExit(f"No Supabase auth user found for email: {email}")


def upsert_profile(sb: Any, user_id: str, email: str, full_name: Optional[str]) -> Dict[str, Any]:
    payload: Dict[str, Any] = {
        "id": user_id,
        "email": email,
        "username": email,
    }
    if full_name:
        payload["full_name"] = full_name
    resp = sb.table("profiles").upsert(payload).execute()
    data = getattr(resp, "data", None) or []
    return data[0] if data else payload


def ensure_project_exists(sb: Any, project_id: str) -> None:
    resp = sb.table("projects").select("id").eq("id", project_id).limit(1).execute()
    if not getattr(resp, "data", None):
        raise SystemExit(f"Project not found: {project_id}")


def promote_to_lead(sb: Any, user_id: str, project_id: str) -> None:
    ensure_project_exists(sb, project_id)
    sb.table("project_members").upsert(
        {"project_id": project_id, "user_id": user_id, "role": "lead"},
        on_conflict="project_id,user_id",
    ).execute()


def list_projects(sb: Any, limit: int) -> None:
    resp = sb.table("projects").select("id,name,created_at").order("created_at", desc=True).limit(limit).execute()
    rows = getattr(resp, "data", None) or []
    if not rows:
        print("No projects found.")
        return
    for r in rows:
        print(f'{r.get("id")}  {r.get("name")}')


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Bootstrap a user profile and promote them to project lead (testing utility)."
    )
    parser.add_argument("--email", required=True, help="User email to promote")
    parser.add_argument("--project-id", help="Project UUID to promote within")
    parser.add_argument("--full-name", help="Optional full name to store in profiles")
    parser.add_argument("--list-projects", action="store_true", help="List recent projects and exit")
    parser.add_argument("--limit", type=int, default=20, help="List limit for --list-projects (default: 20)")
    args = parser.parse_args()

    load_dotenv()  # loads backend/.env if present, otherwise inherited env

    sb = get_supabase_admin()

    if args.list_projects:
        list_projects(sb, args.limit)
        return

    user_id = find_user_id_by_email(sb, args.email)
    profile = upsert_profile(sb, user_id=user_id, email=args.email, full_name=args.full_name)

    if args.project_id:
        promote_to_lead(sb, user_id=user_id, project_id=args.project_id)
        print(f"OK: promoted {args.email} ({user_id}) to lead for project {args.project_id}")
    else:
        print(f"OK: ensured profile for {args.email} ({user_id})")
        print("Tip: pass --project-id <uuid> to promote to lead.")

    # Print a minimal summary for copy/paste.
    print(f'profile.id={profile.get("id")} profile.email={profile.get("email")}')


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        sys.exit(130)

