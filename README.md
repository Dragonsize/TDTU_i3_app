# Project Scheduling & Collaboration Platform

A comprehensive web application for managing projects, workflows, team schedules, and collaboration. Built with Next.js, FastAPI, and Supabase.

## Features

### 1. **User Authentication**
- Email/password registration and login
- Supabase Auth integration
- JWT-based session management with httpOnly cookies
- Secure refresh token flow
- Profile management with full name and email

### 2. **Project Management**
- Create and organize multiple projects
- Break down projects into smaller workflows
- Track project status and progress
- Assign team members with specific roles (Lead/Member)
- Role-based access control (project leads have admin privileges)

### 3. **Workflow Organization**
- Divide large projects into manageable workflows
- Create workflow-specific teams
- Track workflow completion status
- Assign members to workflows with specific roles
- Link documents to specific workflows

### 4. **Smart Scheduling**
- Add busy/free time slots to personal calendar
- **Automatic conflict detection** when scheduling meetings
- Check meeting conflicts across all project members
- Get detailed conflict reports with member availability

### 5. **Document Management**
- Upload project documents with file support
- Share files with project members
- Organize documents by project or workflow
- Track upload history and uploader information
- Supabase Storage integration

### 6. **Deadline Tracking**
- Set deadlines for workflows and tasks
- Assign deadlines to specific members
- View all upcoming deadlines in dashboard
- Filter deadlines by time range (default 7 days)
- Track deadline status (pending/completed)

### 7. **Notifications System**
- In-app notification center
- Create and manage notifications
- Mark notifications as read
- Track notification history
- Support for push notification subscriptions

### 8. **Chatbot Assistant**
- Ask questions about using the app (Vietnamese/English)
- Get help with project creation, workflows, members, schedules
- Context-aware keyword matching
- Multi-language support

## Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- React 18
- JavaScript (JSX)
- Tailwind CSS
- Lucide React Icons
- @supabase/supabase-js

**Backend:**
- FastAPI (Python)
- Supabase Client (Python)
- Jose JWT for token management
- Pydantic for request validation
- Python Dotenv

**Database & Auth:**
- Supabase (PostgreSQL)
- Supabase Auth
- Supabase Storage

**Deployment:**
- Vercel (Frontend & Serverless API)
- Supabase Cloud (Database & Storage)

## Use Cases

### Use Case 1: Using Chatbot
**Scenario:** User asks "How to create a project in the app?"

**Flow:**
1. User navigates to Chatbot page
2. Types question in Vietnamese or English
3. Chatbot provides step-by-step instructions
4. User can ask follow-up questions

### Use Case 2: Create Project & Workflows
**Scenario:** User creates a new project and divides work

**Flow:**
1. User clicks "Create Project" on Dashboard
2. Enters project title and description
3. Automatically becomes Project Lead
4. Creates multiple workflows within the project
5. Assigns different team members to each workflow

### Use Case 3: Manage Team Schedules
**Scenario:** User adds busy time to prevent scheduling conflicts

**Flow:**
1. User navigates to Calendar
2. Adds busy time slots (meetings, classes, etc.)
3. When project lead schedules a meeting, system checks all members
4. **Alert appears** if meeting conflicts with anyone's busy time
5. Lead can choose a different time

### Use Case 4: Document Storage
**Scenario:** User uploads and shares project documents

**Flow:**
1. User opens a project or workflow
2. Clicks "Upload Document"
3. Selects file from computer
4. All project members can view and download
5. Documents are organized by project/workflow

### Use Case 5: Deadline Management
**Scenario:** Project lead assigns deadlines to team members

**Flow:**
1. Lead creates a workflow
2. Adds deadline with due date
3. Assigns to specific team member
4. **System automatically notifies** member as deadline approaches
5. Member can track all deadlines in dashboard

## Project Structure

```
├── api/                      # FastAPI backend
│   ├── index.py             # Main FastAPI app (all endpoints)
│   └── requirements.txt     # Python dependencies
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── auth/
│   │   │   └── callback/    # Supabase auth callback
│   │   ├── dashboard/       # Main dashboard page
│   │   ├── login/           # Login page
│   │   ├── signup/          # Sign up page
│   │   ├── layout.jsx       # Root layout
│   │   ├── page.jsx         # Home page
│   │   └── globals.css      # Global styles
│   ├── components/          # Reusable React components
│   └── lib/                 # Utilities & helpers
│       └── supabaseClient.js # Supabase client configuration
├── public/                  # Static assets
├── supabase_setup.sql       # Database schema SQL
├── vercel.json              # Vercel configuration (API rewrites)
├── package.json             # Node.js dependencies
├── requirements.txt         # Python dependencies
└── tailwind.config.js       # Tailwind CSS configuration
```

## Database Schema

### Core Tables:
- **profiles** - User information (id, email, full_name, username)
- **projects** - Main project containers (title, description, status, created_by)
- **project_members** - Project membership with roles (lead/member)
- **workflows** - Sub-tasks within projects (title, description, status)
- **workflow_members** - Workflow assignments with roles
- **busy_times** - User availability schedules (start_time, end_time, description)
- **documents** - File metadata and storage URLs
- **deadlines** - Task deadlines with assignments (title, due_date, assigned_to, status)
- **notifications** - System notifications (type, title, message, read status)

See [supabase_setup.sql](./supabase_setup.sql) for complete schema with SQL commands.

## Setup Instructions

### 1. Clone Repository
```bash
git clone "https://github.com/Dragonsize/TDTU_i3_app"
cd TDTU_i3_app
```

### 2. Install Frontend Dependencies
```bash
npm install
```

### 3. Install Backend Dependencies
```bash
pip install -r api/requirements.txt
```

### 4. Configure Environment Variables

Create `.env.local` in root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Create `.env` in `api/` directory:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET_KEY=your_jwt_secret_key
FRONTEND_ORIGIN=http://localhost:3000
```

### 5. Setup Supabase Database
1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to SQL Editor in your Supabase dashboard
3. Run the SQL commands from `supabase_setup.sql`
4. Configure Row Level Security (RLS) policies as needed
5. Create a storage bucket named "documents" for file uploads

### 6. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:3000`

### 7. Deploy to Vercel

Install Vercel CLI:
```bash
npm i -g vercel
```

Deploy:
```bash
vercel
```

Set environment variables in Vercel dashboard for production.

## API Endpoints

All API endpoints are defined in `api/index.py` and routed through `/api/*` via Vercel.

### Authentication (`/api/auth/*`)
- **POST** `/api/auth/register-direct` - Register with email/password
  - Body: `{ email, password, fullname? }`
- **POST** `/api/auth/register` - Register with Supabase token
  - Body: `{ access_token, fullname? }`
- **POST** `/api/auth/session` - Create session from Supabase token
  - Body: `{ access_token }`
- **POST** `/api/auth/refresh` - Refresh access token
  - Uses refresh_token cookie
- **GET** `/api/auth/me` - Get current user info
- **POST** `/api/auth/logout` - Clear auth cookies

### Profile (`/api/profile`)
- **GET** `/api/profile` - Get user profile
- **POST** `/api/profile` - Update profile
  - Body: `{ fullname?, email? }`

### Projects (`/api/projects`)
- **GET** `/api/projects` - Get all user's projects
- **POST** `/api/projects` - Create new project
  - Body: `{ title, description? }`
- **POST** `/api/projects/{project_id}/members` - Add project member
  - Body: `{ member_username, role? }`
- **GET** `/api/projects/{project_id}/workflows` - Get project workflows
- **POST** `/api/projects/{project_id}/workflows` - Create workflow
  - Body: `{ title, description? }`

### Workflows (`/api/workflows/*`)
- **POST** `/api/workflows/{workflow_id}/members` - Assign workflow member
  - Body: `{ username, role? }`
- **POST** `/api/workflows/{workflow_id}/deadlines` - Create deadline
  - Body: `{ title, due_date, assigned_to }`

### Deadlines (`/api/deadlines`)
- **GET** `/api/deadlines?days=7` - Get upcoming deadlines

### Schedule (`/api/busy-times` & `/api/meetings/*`)
- **POST** `/api/busy-times` - Add busy time slot
  - Body: `{ start_time, end_time, description? }`
- **GET** `/api/busy-times` - Get user's busy times
- **POST** `/api/meetings/conflicts` - Check meeting conflicts
  - Body: `{ project_id, start_time, end_time }`

### Documents (`/api/documents`)
- **POST** `/api/documents` - Upload document metadata
  - Body: `{ project_id, workflow_id?, filename, file_url }`
- **POST** `/api/documents/upload` - Upload document file
  - Form: `file`, `project_id`
- **GET** `/api/documents?project_id={id}` - Get project documents

### Notifications (`/api/notifications`)
- **POST** `/api/notifications/create` - Create notification
  - Body: `{ user_id, type, title, message?, related_id? }`
- **GET** `/api/notifications` - Get user notifications
- **PUT** `/api/notifications/{id}/read` - Mark as read
- **POST** `/api/notifications/subscribe` - Subscribe to push
- **POST** `/api/notifications/unsubscribe` - Unsubscribe

### Chatbot (`/api/chatbot`)
- **POST** `/api/chatbot` - Ask chatbot question
  - Body: `{ question }`
  - Response: `{ question, answer }`

### Health Check
- **GET** `/api/health` - Check API and Supabase status

## Key Features in Detail

### JWT Authentication Flow
1. User registers via `/api/auth/register-direct` with email/password
2. Supabase creates the user account
3. Backend generates JWT access & refresh tokens
4. Tokens stored in httpOnly cookies for security
5. Access token expires in 24 hours, refresh token in 7 days
6. Automatic token refresh on expiration

### Automatic Conflict Detection
When scheduling a meeting, the system:
1. Accepts project_id, start_time, and end_time
2. Retrieves all project members from project_members table
3. Checks each member's busy_times for overlaps
4. Detects time conflicts using interval comparison
5. Returns detailed conflict list with usernames and descriptions

**Example Request:**
```json
POST /api/meetings/conflicts
{
  "project_id": "uuid",
  "start_time": "2026-02-15T14:00:00",
  "end_time": "2026-02-15T15:00:00"
}
```

**Example Response:**
```json
{
  "has_conflicts": true,
  "conflicts": [
    {
      "username": "student1",
      "busy_start": "2026-02-15T14:00:00",
      "busy_end": "2026-02-15T15:00:00",
      "description": "CS101 Lecture"
    }
  ]
}
```

### Role-Based Access Control
**Project Lead can:**
- Add/remove members to projects
- Create workflows within projects
- Assign members to workflows
- Create and assign deadlines
- Upload documents
- Manage all project settings

**Project Member can:**
- View project details and workflows
- View assigned deadlines
- Add personal busy times
- Upload documents to assigned workflows
- Receive notifications

### Input Validation & Security
- All user inputs validated with Pydantic models
- Protection against control characters and emojis
- SQL injection prevention via Supabase client
- XSS protection with disallowed character filters
- JWT tokens with expiration and type checking
- httpOnly cookies prevent XSS token theft

### Chatbot Knowledge Base
Supports questions about:
- Creating projects and workflows
- Managing team members
- Adding schedules and busy times
- Document sharing and uploads
- Deadline tracking and assignments
- Role permissions and access control

**Keyword matching in Vietnamese and English.**

## Authentication

Uses Supabase Auth with email/password:
1. User registers via frontend signup form
2. Frontend calls `/api/auth/register-direct` with credentials
3. Backend creates Supabase user account
4. Backend generates JWT access & refresh tokens
5. Tokens stored in httpOnly cookies
6. User profile created in profiles table
7. Subsequent requests include cookies for authentication

Alternative flow via Supabase SDK:
1. Frontend uses Supabase JS client for OAuth/social login
2. Gets Supabase access token
3. Calls `/api/auth/session` to create backend session
4. Backend validates token and issues JWT cookies

## Future Enhancements

- [ ] Real-time collaboration with Supabase Realtime
- [ ] Email notifications for deadlines via SendGrid
- [ ] Calendar view component for schedule visualization
- [ ] Advanced document versioning
- [ ] Project templates and cloning
- [ ] Team analytics and productivity metrics
- [ ] Export project reports (PDF/CSV)
- [ ] Gantt chart visualization
- [ ] Integration with Google Calendar API
- [ ] Mobile app with React Native
- [ ] Advanced chatbot with AI/ML integration
- [ ] File preview for uploaded documents

## License

MIT License

## Contributors

TDTU ITZone Team

## Support

For questions or issues:
- Check the in-app chatbot for feature guidance
- Review API documentation in this README
- Contact the development team

---

**Built for better project collaboration and team productivity**
