# API Documentation - Backend & Frontend Interaction

## Authentication Flow
All authenticated endpoints require an `access_token` cookie (httpOnly). Tokens are set automatically by auth endpoints.

---

## Auth Endpoints

### POST `/api/auth/register-direct`
**Purpose:** Register new user with email/password (direct registration)

**Request Body:**
```json
{
  "email": "string (required, min 1 char)",
  "password": "string (required, min 6 chars)",
  "fullname": "string (optional)"
}
```

**Response:**
```json
{
  "status": "success",
  "user": {
    "id": "string (UUID)",
    "email": "string",
    "fullname": "string"
  }
}
```

**Cookies Set:** `access_token`, `refresh_token` (httpOnly)

**Frontend Usage:** Sign-up page, creates user account and auto-login

---

### POST `/api/auth/register`
**Purpose:** Register user from existing Supabase token

**Request Body:**
```json
{
  "access_token": "string (required, min 10 chars) - Supabase token",
  "fullname": "string (optional)"
}
```

**Response:**
```json
{
  "status": "success",
  "user": {
    "id": "string (UUID)",
    "email": "string",
    "fullname": "string"
  }
}
```

**Cookies Set:** `access_token`, `refresh_token` (httpOnly)

---

### POST `/api/auth/session`
**Purpose:** Create backend session from Supabase token

**Request Body:**
```json
{
  "access_token": "string (required, min 10 chars) - Supabase token"
}
```

**Response:**
```json
{
  "status": "success",
  "user": {
    "id": "string (UUID)",
    "email": "string",
    "fullname": "string"
  }
}
```

**Cookies Set:** `access_token`, `refresh_token` (httpOnly)

**Frontend Usage:** Login page after Supabase authentication

---

### POST `/api/auth/refresh`
**Purpose:** Refresh expired access token

**Cookies Required:** `refresh_token`

**Response:**
```json
{
  "status": "success"
}
```

**Cookies Set:** New `access_token`, `refresh_token`

**Frontend Usage:** Automatic token refresh on 401 errors

---

### GET `/api/auth/me`
**Purpose:** Get current authenticated user info

**Auth Required:** Yes (access_token cookie)

**Response:**
```json
{
  "authenticated": true,
  "user": {
    "id": "string (UUID)",
    "email": "string"
  }
}
```

**Frontend Usage:** Verify user session status

---

### POST `/api/auth/logout`
**Purpose:** Clear auth cookies and logout

**Response:**
```json
{
  "status": "success"
}
```

**Cookies Cleared:** `access_token`, `refresh_token`

**Frontend Usage:** Logout button, clears session

---

## Profile Endpoints

### GET `/api/profile`
**Purpose:** Get current user's profile

**Auth Required:** Yes

**Response:**
```json
{
  "profile": {
    "id": "string (UUID)",
    "username": "string",
    "email": "string",
    "fullname": "string",
    "created_at": "ISO timestamp",
    "updated_at": "ISO timestamp"
  }
}
```

**Frontend Usage:** Dashboard, settings page to display user info

---

### POST `/api/profile`
**Purpose:** Update current user's profile

**Auth Required:** Yes

**Request Body:**
```json
{
  "fullname": "string (optional)",
  "email": "string (optional)"
}
```

**Response:**
```json
{
  "profile": {
    "id": "string (UUID)",
    "username": "string",
    "email": "string",
    "fullname": "string",
    "created_at": "ISO timestamp",
    "updated_at": "ISO timestamp"
  }
}
```

**Frontend Usage:** Settings page profile update

---

## Project Endpoints

### GET `/api/projects`
**Purpose:** Get all projects user is a member of

**Auth Required:** Yes

**Response:**
```json
[
  {
    "id": "string (UUID)",
    "title": "string",
    "description": "string",
    "status": "active | archived",
    "created_by": "string (UUID)",
    "created_at": "ISO timestamp",
    "updated_at": "ISO timestamp"
  }
]
```

**Frontend Usage:** Dashboard to list user's projects

---

### POST `/api/projects`
**Purpose:** Create new project (user becomes project lead)

**Auth Required:** Yes

**Request Body:**
```json
{
  "title": "string (required, min 1 char)",
  "description": "string (optional, default empty)"
}
```

**Response:**
```json
{
  "id": "string (UUID)",
  "title": "string",
  "description": "string",
  "status": "active",
  "created_by": "string (UUID)",
  "created_at": "ISO timestamp",
  "updated_at": "ISO timestamp"
}
```

**Frontend Usage:** Dashboard create project button

---

### POST `/api/projects/{project_id}/members`
**Purpose:** Add member to project (lead only)

**Auth Required:** Yes (must be project lead)

**URL Params:** `project_id` (UUID)

**Request Body:**
```json
{
  "member_username": "string (required, min 1 char)",
  "role": "string (default: 'member')"
}
```

**Response:**
```json
{
  "id": "string (UUID)",
  "project_id": "string (UUID)",
  "user_id": "string (UUID)",
  "role": "string",
  "joined_at": "ISO timestamp"
}
```

**Frontend Usage:** Project settings page to add team members

---

## Workflow Endpoints

### GET `/api/projects/{project_id}/workflows`
**Purpose:** Get all workflows in a project

**Auth Required:** Yes (must be project member)

**URL Params:** `project_id` (UUID)

**Response:**
```json
[
  {
    "id": "string (UUID)",
    "project_id": "string (UUID)",
    "title": "string",
    "description": "string",
    "status": "active | completed",
    "created_by": "string (UUID)",
    "created_at": "ISO timestamp",
    "updated_at": "ISO timestamp"
  }
]
```

**Frontend Usage:** Project detail page to list workflows

---

### POST `/api/projects/{project_id}/workflows`
**Purpose:** Create workflow in project (lead only)

**Auth Required:** Yes (must be project lead)

**URL Params:** `project_id` (UUID)

**Request Body:**
```json
{
  "title": "string (required, min 1 char)",
  "description": "string (optional, default empty)"
}
```

**Response:**
```json
{
  "id": "string (UUID)",
  "project_id": "string (UUID)",
  "title": "string",
  "description": "string",
  "status": "active",
  "created_by": "string (UUID)",
  "created_at": "ISO timestamp",
  "updated_at": "ISO timestamp"
}
```

**Frontend Usage:** Project page to create new workflow

---

### POST `/api/workflows/{workflow_id}/members`
**Purpose:** Assign member to workflow (lead only)

**Auth Required:** Yes (must be project lead)

**URL Params:** `workflow_id` (UUID)

**Request Body:**
```json
{
  "username": "string (required, min 1 char)",
  "role": "string (default: 'member')"
}
```

**Response:**
```json
{
  "id": "string (UUID)",
  "workflow_id": "string (UUID)",
  "user_id": "string (UUID)",
  "role": "string",
  "assigned_at": "ISO timestamp"
}
```

**Frontend Usage:** Workflow page to assign team members

---

### POST `/api/workflows/{workflow_id}/deadlines`
**Purpose:** Create deadline for workflow (lead only)

**Auth Required:** Yes (must be project lead)

**URL Params:** `workflow_id` (UUID)

**Request Body:**
```json
{
  "title": "string (required, min 1 char)",
  "due_date": "string (required, ISO timestamp)",
  "assigned_to": "string (required, username)"
}
```

**Response:**
```json
{
  "id": "string (UUID)",
  "workflow_id": "string (UUID)",
  "title": "string",
  "due_date": "ISO timestamp",
  "assigned_to": "string (UUID)",
  "status": "pending",
  "created_at": "ISO timestamp",
  "updated_at": "ISO timestamp"
}
```

**Frontend Usage:** Workflow page to set deadlines

---

### GET `/api/deadlines`
**Purpose:** Get upcoming deadlines for current user

**Auth Required:** Yes

**Query Params:** `days` (int, optional, default: 7) - how many days ahead to check

**Response:**
```json
[
  {
    "id": "string (UUID)",
    "workflow_id": "string (UUID)",
    "title": "string",
    "due_date": "ISO timestamp",
    "assigned_to": "string (UUID)",
    "status": "pending | completed",
    "created_at": "ISO timestamp",
    "workflows": {
      "title": "string",
      "project_id": "string (UUID)"
    }
  }
]
```

**Frontend Usage:** Dashboard to show upcoming deadlines

---

## Schedule Endpoints

### POST `/api/busy-times`
**Purpose:** Add busy time slot for current user

**Auth Required:** Yes

**Request Body:**
```json
{
  "start_time": "string (required, ISO timestamp)",
  "end_time": "string (required, ISO timestamp)",
  "description": "string (optional, default empty)"
}
```

**Response:**
```json
{
  "id": "string (UUID)",
  "user_id": "string (UUID)",
  "start_time": "ISO timestamp",
  "end_time": "ISO timestamp",
  "description": "string",
  "created_at": "ISO timestamp"
}
```

**Frontend Usage:** Calendar page to block time slots

---

### GET `/api/busy-times`
**Purpose:** Get all busy times for current user

**Auth Required:** Yes

**Response:**
```json
[
  {
    "id": "string (UUID)",
    "user_id": "string (UUID)",
    "start_time": "ISO timestamp",
    "end_time": "ISO timestamp",
    "description": "string",
    "created_at": "ISO timestamp"
  }
]
```

**Frontend Usage:** Calendar page to display schedule

---

### POST `/api/meetings/conflicts`
**Purpose:** Check scheduling conflicts for project members

**Auth Required:** Yes (must be project member)

**Request Body:**
```json
{
  "project_id": "string (required, min 1 char)",
  "start_time": "string (required, ISO timestamp)",
  "end_time": "string (required, ISO timestamp)"
}
```

**Response:**
```json
{
  "has_conflicts": true,
  "conflicts": [
    {
      "username": "string",
      "busy_start": "ISO timestamp",
      "busy_end": "ISO timestamp",
      "description": "string"
    }
  ]
}
```

**Frontend Usage:** Meeting scheduler to find available times

---

## Document Endpoints

### POST `/api/documents`
**Purpose:** Upload document metadata (URL-based)

**Auth Required:** Yes (must be project member)

**Request Body:**
```json
{
  "project_id": "string (required, min 1 char)",
  "workflow_id": "string (optional)",
  "filename": "string (required, min 1 char)",
  "file_url": "string (required, min 1 char)"
}
```

**Response:**
```json
{
  "id": "string (UUID)",
  "project_id": "string (UUID)",
  "workflow_id": "string (UUID) | null",
  "filename": "string",
  "file_url": "string",
  "uploaded_by": "string (UUID)",
  "created_at": "ISO timestamp"
}
```

**Frontend Usage:** Document page with external file URLs

---

### POST `/api/documents/upload`
**Purpose:** Upload document file directly (multipart form)

**Auth Required:** Yes (must be project member)

**Content-Type:** `multipart/form-data`

**Form Data:**
- `file`: File (required)
- `project_id`: string (required)

**Response:**
```json
{
  "id": "string (UUID)",
  "project_id": "string (UUID)",
  "workflow_id": null,
  "filename": "string",
  "file_url": "string (Supabase storage public URL)",
  "uploaded_by": "string (UUID)",
  "created_at": "ISO timestamp"
}
```

**Frontend Usage:** Document page with file upload widget

---

### GET `/api/documents`
**Purpose:** Get all documents for a project

**Auth Required:** Yes (must be project member)

**Query Params:** `project_id` (required, UUID)

**Response:**
```json
[
  {
    "id": "string (UUID)",
    "project_id": "string (UUID)",
    "workflow_id": "string (UUID) | null",
    "filename": "string",
    "file_url": "string",
    "uploaded_by": "string (UUID)",
    "created_at": "ISO timestamp",
    "profiles": {
      "username": "string"
    }
  }
]
```

**Frontend Usage:** Document page to list all files

---

## Notification Endpoints

### POST `/api/notifications/create`
**Purpose:** Create notification for a user

**Auth Required:** Yes

**Request Body:**
```json
{
  "user_id": "string (required, min 1 char)",
  "type": "string (required, min 1 char)",
  "title": "string (required, min 1 char)",
  "message": "string (optional)",
  "related_id": "string (optional)"
}
```

**Response:**
```json
{
  "id": "string (UUID)",
  "user_id": "string (UUID)",
  "type": "string",
  "title": "string",
  "message": "string | null",
  "related_id": "string | null",
  "read": false,
  "created_at": "ISO timestamp"
}
```

**Frontend Usage:** System events to notify users

---

### GET `/api/notifications`
**Purpose:** Get notifications for current user (last 50)

**Auth Required:** Yes

**Response:**
```json
[
  {
    "id": "string (UUID)",
    "user_id": "string (UUID)",
    "type": "string",
    "title": "string",
    "message": "string | null",
    "related_id": "string | null",
    "read": boolean,
    "created_at": "ISO timestamp"
  }
]
```

**Frontend Usage:** Notification bell dropdown

---

### PUT `/api/notifications/{notification_id}/read`
**Purpose:** Mark notification as read

**Auth Required:** Yes

**URL Params:** `notification_id` (UUID)

**Response:**
```json
{
  "status": "success"
}
```

**Frontend Usage:** When user views notification

---

### POST `/api/notifications/subscribe`
**Purpose:** Subscribe to push notifications (placeholder)

**Request Body:**
```json
{
  "subscription": {
    "endpoint": "string",
    "keys": {}
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription saved"
}
```

**Frontend Usage:** Push notification setup

---

### POST `/api/notifications/unsubscribe`
**Purpose:** Unsubscribe from push notifications (placeholder)

**Request Body:**
```json
{
  "subscription": {
    "endpoint": "string"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Unsubscribed"
}
```

**Frontend Usage:** Disable push notifications

---

## Chat Endpoints

### PATCH `/api/chat/channels/{channel_id}/members/{target_user_id}/role`
**Purpose:** Promote/demote a member role in non-project channels.

**Auth Required:** Yes

**Request Body:**
```json
{
  "role": "admin | member"
}
```

**Notes:**
- Channel creator always remains admin.
- Project-linked channels must use project role management.

**Response:**
```json
{
  "status": "success"
}
```

---

### DELETE `/api/chat/channels/{channel_id}/members/{target_user_id}`
**Purpose:** Remove a member from a channel.

**Auth Required:** Yes

**Notes:**
- Allowed for effective channel admins (creator/admin, or project lead for project-linked channels).
- Channel creator cannot be removed.
- For non-project channels, if removal would leave zero admins, the oldest remaining member is auto-promoted to admin.

**Response:**
```json
{
  "status": "success"
}
```

---

### DELETE `/api/chat/channels/{channel_id}/leave`
**Purpose:** Leave a non-project chat channel.

**Auth Required:** Yes

**Notes:**
- Channel creator cannot leave.
- Project-linked channels cannot be left directly via this endpoint.

**Response:**
```json
{
  "status": "success"
}
```

---

## Chatbot Endpoint

### POST `/api/chatbot`
**Purpose:** Ask chatbot a question (knowledge-based)

**Auth Required:** No

**Request Body:**
```json
{
  "question": "string (required, min 1 char)"
}
```

**Response:**
```json
{
  "question": "string (echoed)",
  "answer": "string (matched response from knowledge base)"
}
```

**Frontend Usage:** Chatbot page for user help

**Knowledge Topics:**
- create_project
- create_workflow
- add_members
- schedule
- documents
- deadline
- general

---

## Calendar Endpoints

### GET `/api/calendar/events`
**Purpose:** List calendar events for current user and their project memberships.

**Auth Required:** Yes

**Query Params (optional):**
- `start` ISO datetime (inclusive)
- `end` ISO datetime (exclusive)
- `project_id` UUID (restrict to one project)

**Response:**
```json
[
  {
    "id": "uuid",
    "project_id": "uuid|null",
    "user_id": "uuid",
    "title": "Sprint Planning",
    "description": "Kickoff",
    "start_time": "2026-03-20T08:00:00Z",
    "end_time": "2026-03-20T09:00:00Z",
    "event_type": "meeting",
    "color": "#3b82f6"
  }
]
```

---

### POST `/api/calendar/events`
**Purpose:** Create a calendar event.

**Auth Required:** Yes

**Request Body:**
```json
{
  "title": "string (required)",
  "start_time": "ISO datetime (required)",
  "end_time": "ISO datetime (required)",
  "project_id": "uuid (optional)",
  "description": "string (optional)",
  "event_type": "meeting|deadline|task (optional)",
  "color": "#RRGGBB (optional)"
}
```

**Validation:**
- `end_time` must be later than `start_time`
- If `project_id` is provided, user must be a member of that project

---

### DELETE `/api/calendar/events/{event_id}`
**Purpose:** Delete a calendar event.

**Auth Required:** Yes

**Authorization:**
- Event creator can delete
- Project lead can delete project-linked events

**Response:**
```json
{
  "status": "success"
}
```

---

### PATCH `/api/calendar/events/{event_id}`
**Purpose:** Update an existing calendar event.

**Auth Required:** Yes

**Request Body:** any subset of event fields
```json
{
  "title": "string (optional)",
  "description": "string (optional)",
  "start_time": "ISO datetime (optional)",
  "end_time": "ISO datetime (optional)",
  "event_type": "string (optional)",
  "color": "#RRGGBB (optional)"
}
```

**Authorization:** event owner or project lead (for project-linked events).

---

### GET `/api/projects/{project_id}/calendar/team`
**Purpose:** View team calendar and busy blocks for project members in a date window.

**Auth Required:** Yes (project member)

**Query Params:**
- `start` ISO datetime (required)
- `end` ISO datetime (required)

**Response:**
```json
{
  "members": [],
  "events": [],
  "busy_times": []
}
```

---

### POST `/api/projects/{project_id}/calendar/meeting-slots`
**Purpose:** Find mutually free meeting slots across selected project members.

**Auth Required:** Yes (project member)

**Request Body:**
```json
{
  "start_time": "ISO datetime",
  "end_time": "ISO datetime",
  "duration_minutes": 60,
  "member_ids": ["uuid"],
  "working_hours_start": "08:00",
  "working_hours_end": "18:00",
  "step_minutes": 30
}
```

**Response:**
```json
{
  "member_ids": ["uuid"],
  "duration_minutes": 60,
  "slots": [
    { "start_time": "ISO", "end_time": "ISO" }
  ]
}
```

---

### POST `/api/projects/{project_id}/calendar/meetings`
**Purpose:** Schedule a meeting for selected project members (creates member events).

**Auth Required:** Yes (project member)

**Request Body:**
```json
{
  "title": "Sprint Sync",
  "start_time": "ISO datetime",
  "end_time": "ISO datetime",
  "member_ids": ["uuid"],
  "description": "optional",
  "color": "#0ea5e9",
  "event_type": "meeting"
}
```

---

## Health Check

### GET `/api/health`
**Purpose:** Check API health status

**Auth Required:** No

**Response:**
```json
{
  "status": "ok"
}
```

**Frontend Usage:** Monitoring, service health checks

---

## Common Error Responses

### 401 Unauthorized
```json
{
  "detail": "Not authenticated" | "Invalid or expired token"
}
```

### 403 Forbidden
```json
{
  "detail": "Not a project member" | "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "detail": "Profile not found" | "User not found" | "Workflow not found"
}
```

### 400 Bad Request
```json
{
  "detail": "No updates provided" | "No subscription provided"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Failed to create project" | "Failed to update profile" | ...
}
```

---

## Frontend Integration Notes

### Authentication Flow
1. User signs up via `/api/auth/register-direct` → receives httpOnly cookies
2. Frontend stores user info in `localStorage` under `userProfile`
3. All subsequent API calls automatically include cookies
4. On 401 error, attempt token refresh via `/api/auth/refresh`
5. If refresh fails, redirect to login page

### CORS Configuration
- Allowed origins: `http://localhost:3000` + `FRONTEND_ORIGIN` env var
- Credentials: Enabled (cookies sent with requests)
- Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS

### Cookie Configuration
- `access_token`: 24 hours expiry, httpOnly, secure in production
- `refresh_token`: 7 days expiry, httpOnly, secure in production
- SameSite: lax
- Path: /

### Vercel Deployment
Backend is deployed as serverless function at `/api/*` via rewrites in [vercel.json](vercel.json).
