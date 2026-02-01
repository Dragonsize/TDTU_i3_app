# 📅 Project Scheduling & Collaboration Platform

A comprehensive web application for managing projects, workflows, team schedules, and collaboration. Built with Next.js, Python, and Supabase.

## 🌟 Features

### 1. **Project Management**
- Create and organize multiple projects
- Break down projects into smaller workflows
- Track project status and progress
- Assign team members with specific roles (Lead/Member)

### 2. **Workflow Organization**
- Divide large projects into manageable workflows
- Create workflow-specific teams
- Track workflow completion
- Link documents to specific workflows

### 3. **Smart Scheduling**
- Members can add their busy/free times
- **Automatic conflict detection** when scheduling meetings
- Visual alerts when meetings overlap with member availability
- Integrated calendar view

### 4. **Document Management**
- Upload and store project documents
- Share files with project members
- Organize documents by project or workflow
- Track upload history

### 5. **Deadline Tracking**
- Set deadlines for workflows and tasks
- Assign deadlines to specific members
- **Automatic notifications** when approaching deadlines
- View all upcoming deadlines in dashboard

### 6. **AI Chatbot Assistant**
- Ask questions about using the app (Vietnamese/English)
- Get help with project creation
- Learn about features and workflows
- Context-aware responses

## 🚀 Tech Stack

**Frontend:**
- Next.js 14 (React)
- TypeScript
- Tailwind CSS
- Lucide Icons

**Backend:**
- Python (Vercel Serverless Functions)
- Supabase (PostgreSQL)
- BeautifulSoup (Web scraping for auth)

**Deployment:**
- Vercel (Frontend & API)
- Supabase (Database)

## 📋 Use Cases

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

## 📁 Project Structure

```
├── api/                      # Python backend APIs
│   ├── auth.py              # Authentication logic
│   ├── chatbot.py           # AI chatbot endpoint
│   ├── database.py          # Database functions
│   ├── documents.py         # Document management API
│   ├── login.py             # Login scraping
│   ├── projects.py          # Project & workflow API
│   └── schedule.py          # Calendar & schedule API
├── src/
│   ├── app/                 # Next.js pages
│   │   ├── calendar/        # Calendar & scheduling
│   │   ├── chatbot/         # AI assistant
│   │   ├── dashboard/       # Main dashboard
│   │   ├── login/           # Authentication
│   │   └── settings/        # User settings
│   ├── components/          # Reusable components
│   └── lib/                 # Utilities & translations
├── public/                  # Static assets
├── DATABASE_SCHEMA.md       # Database schema documentation
├── MIGRATION_GUIDE.md       # Migration instructions
└── vercel.json             # Vercel configuration
```

## 🗄️ Database Schema

### Core Tables:
- **profiles** - User information
- **projects** - Main project containers
- **project_members** - Project membership with roles
- **workflows** - Sub-tasks within projects
- **workflow_members** - Workflow assignments
- **busy_times** - User availability schedules
- **documents** - File metadata and links
- **deadlines** - Task deadlines with assignments
- **notifications** - System notifications

See [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) for complete schema with SQL commands.

## 🔧 Setup Instructions

### 1. Clone Repository
```bash
git clone <repository-url>
cd TDTU_i3_app
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create `.env.local`:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

Create `api/.env`:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Setup Supabase Database
1. Go to Supabase Dashboard → SQL Editor
2. Run all CREATE TABLE statements from `DATABASE_SCHEMA.md`
3. Run CREATE INDEX statements
4. Enable Row Level Security (RLS)
5. Create RLS policies for your security needs

### 5. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:3000`

### 6. Deploy to Vercel
```bash
vercel
```

## 📡 API Endpoints

### Projects API (`/api/projects`)
**POST Actions:**
- `create_project` - Create a new project
- `create_workflow` - Create workflow in project
- `add_member` - Add member to project
- `assign_workflow` - Assign member to workflow
- `create_deadline` - Create deadline for workflow

**GET Actions:**
- `get_projects?username=<username>` - Get user's projects
- `get_workflows?project_id=<id>` - Get project workflows
- `get_deadlines?username=<username>&days=7` - Get upcoming deadlines

### Schedule API (`/api/schedule`)
**POST Actions:**
- `add_busy_time` - Add busy time slot
- `check_conflicts` - Check meeting conflicts

**GET Actions:**
- `get_busy_times?username=<username>` - Get user's busy times

### Documents API (`/api/documents`)
**POST Actions:**
- `upload_document` - Upload document metadata

**GET Actions:**
- `get_documents?project_id=<id>` - Get project documents

### Chatbot API (`/api/chatbot`)
**POST:**
- Send `{ "question": "your question" }`
- Receive `{ "answer": "response" }`

## 🎨 Key Features in Detail

### Automatic Conflict Detection
When scheduling a meeting, the system:
1. Retrieves all project members
2. Checks each member's busy times
3. Detects time overlaps
4. Returns list of conflicts with member names and details
5. Frontend displays warnings

**Example Response:**
```json
{
  "has_conflicts": true,
  "conflicts": [
    {
      "username": "student1",
      "busy_start": "2026-02-01T14:00:00",
      "busy_end": "2026-02-01T15:00:00",
      "description": "CS101 Lecture"
    }
  ]
}
```

### Role-Based Access
**Project Lead can:**
- Add/remove members
- Create workflows
- Assign deadlines
- Delete project

**Project Member can:**
- View project details
- Add busy times
- Upload documents
- Complete assigned tasks

### Chatbot Knowledge Base
Supports questions about:
- Creating projects
- Managing workflows
- Adding team members
- Schedule management
- Document sharing
- Deadline tracking
- Role permissions

Responds in **Vietnamese and English**.

## 🔐 Authentication

Uses TDTU e-learning credentials:
1. User enters username/password
2. Backend scrapes TDTU e-learning portal
3. Extracts profile information
4. Saves to database
5. Returns session token

## 🎯 Future Enhancements

- [ ] Real-time notifications
- [ ] File upload to Supabase Storage
- [ ] Email notifications for deadlines
- [ ] Mobile responsive improvements
- [ ] Export project reports
- [ ] Gantt chart view
- [ ] Team analytics dashboard
- [ ] Integration with Google Calendar

## 📝 License

MIT License

## 👥 Contributors

TDTU ITZone Team

## 📞 Support

For questions or issues, contact the development team or use the in-app chatbot.

---

**Built with ❤️ for better project collaboration and team productivity**
