# [HandsOn](https://hands-on-fe.vercel.app/) - Community-Driven Social Volunteering Platform (Backend)

## 📌 1. Project Overview

HandsOn is a backend service for a community-driven social volunteering platform that connects individuals with meaningful social impact opportunities. It provides APIs for users to register, manage profiles, create and join volunteer events, post community help requests, form teams for collaborative initiatives, and track contributions. Designed as a "GitHub for social work" backend, HandsOn supports social responsibility and collaboration by rewarding participants with points and enabling recognition features.

## 📌 2. Technologies Used

- **Backend:**
  - Node.js (Express.js)
  - REST API
- **Database:**
  - PostgreSQL
- **Authentication:**
  - JWT-based authentication
- **Dev Tools:**
  - Nodemon (development)
  - Morgan (logging)
  - Helmet (security)
  - CORS (cross-origin resource sharing)
- **Package Management:**
  - NPM

## 📌 3. Features

- **User Registration & Profile Management:**
  - Sign up and log in with email and password via API.
  - Update profiles with skills, causes supported, and personal details.
  - Retrieve volunteer history, hours, and contribution points.
- **Volunteer Events:**
  - Create events with title, description, date, time, location, and category.
  - Browse and filter events by category, location, or date.
  - Join events via API with instant attendee updates.
- **Community Help Requests:**
  - Post help requests with title, description, location, category, and urgency level (low, medium, urgent).
  - Add comments to coordinate or offer assistance.
  - Update request status (open, in_progress, completed, closed).
- **Teams & Group Initiatives:**
  - Form public (open to all) or private (invite-only) teams.
  - Access team dashboards with members, events, and achievements.
  - View a leaderboard of top-performing teams based on achievement points.
- **Impact Tracking & Recognition:**
  - Log volunteer hours with auto-verification for platform events or peer verification for others.
  - Award 5 points per volunteer hour.
  - Support for certificate generation at milestones (20, 50, 100 hours).
  - Provide leaderboard data for active volunteers and teams.

## 📌 4. Database Schema

Below is the database structure based on the table creation scripts:

users

id (SERIAL PRIMARY KEY)
name (VARCHAR(100) NOT NULL)
email (VARCHAR(100) UNIQUE NOT NULL)
password (TEXT NOT NULL)
skills (TEXT[])
causes_supported (TEXT[])
created_at (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
volunteer_hours (INTEGER DEFAULT 0)
volunteer_history (JSONB DEFAULT '[]')
total_contributions (JSONB DEFAULT '{}')
role (VARCHAR(50) NOT NULL DEFAULT 'volunteer')
events

id (SERIAL PRIMARY KEY)
title (VARCHAR(255) NOT NULL)
description (TEXT NOT NULL)
date (TIMESTAMP NOT NULL)
time (TIMESTAMP NOT NULL)
location (VARCHAR(255) NOT NULL)
category (VARCHAR(100) NOT NULL)
created_by (INTEGER REFERENCES users(id) ON DELETE CASCADE)
created_by_role (VARCHAR(50) NOT NULL)
attendees (INTEGER[] DEFAULT '{}')
created_at (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
community_help_requests

id (SERIAL PRIMARY KEY)
title (VARCHAR(255) NOT NULL)
description (TEXT NOT NULL)
location (VARCHAR(255) NOT NULL)
category (VARCHAR(100) NOT NULL)
urgency_level (VARCHAR(20) NOT NULL CHECK (urgency_level IN ('low', 'medium', 'urgent')))
status (VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'closed')))
created_by (INTEGER REFERENCES users(id) ON DELETE CASCADE)
created_by_role (VARCHAR(50) NOT NULL)
helper_count (INTEGER DEFAULT 0)
created_at (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
updated_at (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
community_help_comments

id (SERIAL PRIMARY KEY)
help_request_id (INTEGER REFERENCES community_help_requests(id) ON DELETE CASCADE)
comment_text (TEXT NOT NULL)
created_by (INTEGER REFERENCES users(id) ON DELETE CASCADE)
created_by_role (VARCHAR(50) NOT NULL)
is_helper (BOOLEAN DEFAULT false)
created_at (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
updated_at (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
teams

id (SERIAL PRIMARY KEY)
name (VARCHAR(255) NOT NULL)
description (TEXT)
is_private (BOOLEAN DEFAULT false)
created_by (INTEGER REFERENCES users(id) ON DELETE CASCADE)
created_by_role (VARCHAR(50) NOT NULL)
member_count (INTEGER DEFAULT 1)
achievement_points (INTEGER DEFAULT 0)
avatar_url (TEXT)
created_at (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
updated_at (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
team_members

id (SERIAL PRIMARY KEY)
team_id (INTEGER REFERENCES teams(id) ON DELETE CASCADE)
user_id (INTEGER REFERENCES users(id) ON DELETE CASCADE)
role (team_member_role DEFAULT 'member') -- ENUM ('admin', 'moderator', 'member')
contribution_points (INTEGER DEFAULT 0)
joined_at (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
UNIQUE (team_id, user_id)
team_invitations

id (SERIAL PRIMARY KEY)
team_id (INTEGER REFERENCES teams(id) ON DELETE CASCADE)
invited_by (INTEGER REFERENCES users(id) ON DELETE CASCADE)
invited_user (INTEGER REFERENCES users(id) ON DELETE CASCADE)
status (invitation_status DEFAULT 'pending') -- ENUM ('pending', 'accepted', 'declined')
created_at (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
updated_at (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
UNIQUE (team_id, invited_user)
team_events

id (SERIAL PRIMARY KEY)
team_id (INTEGER REFERENCES teams(id) ON DELETE CASCADE)
event_id (INTEGER REFERENCES events(id) ON DELETE CASCADE)
created_by (INTEGER REFERENCES users(id) ON DELETE CASCADE)
points_awarded (INTEGER DEFAULT 0)
created_at (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
UNIQUE (team_id, event_id)
team_achievements

id (SERIAL PRIMARY KEY)
team_id (INTEGER REFERENCES teams(id) ON DELETE CASCADE)
title (VARCHAR(255) NOT NULL)
description (TEXT)
points (INTEGER DEFAULT 0)
achievement_type (VARCHAR(50) NOT NULL)
achieved_at (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
created_at (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)

**Notes:**

- Custom ENUM types: `team_member_role` ('admin', 'moderator', 'member') and `invitation_status` ('pending', 'accepted', 'declined').
- Triggers exist for `updated_at` columns in `community_help_requests`, `community_help_comments`, `teams`, and `team_invitations` using a shared `update_updated_at_column()` function (defined in `community_help_requests` script).

## 📌 5. Setup Instructions

### Prerequisites

- Node.js (v18+ recommended)
- PostgreSQL (v13+ recommended)
- NPM

### Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/yourusername/handson.git
   cd handson
   ```
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Set Up Environment Variables**:
   Create a .env file in the project root with the following template:
   ```
   DATABASE_URL=postgres://<username>:<password>@<host>:<port>/<dbname>?sslmode=require
   JWT_SECRET=<your-secret-key>
   PORT=5000
   NODE_ENV=development
   ```
   Replace DATABASE_URL with your PostgreSQL connection string (e.g., from Neon.tech or a local instance).
   Set a secure JWT_SECRET (e.g., a 64-character hexadecimal string).
   4 . **Initialize the Database**:
   Ensure your PostgreSQL database is running and accessible via the DATABASE_URL.
   Run the table creation scripts in the database/ folder in the following order (due to dependencies):
   ```bash
   node database/03062025_create_users_table.js
   node database/03072025_create_events_table.js
   node database/03082025_create_community_help_requests_table.js
   node database/03082025_create_community_help_comments_table.js
   node database/03082025_create_teams_table.js
   node database/03082025_create_team_members_table.js
   node database/03082025_create_team_invitations_table.js
   node database/03082025_create_team_events_table.js
   node database/03082025_create_team_achievements_table.js
   ```
   Note: Update the require path in each file from ../../src/db to ../src/config/db to match your project structure before running.

📌 6. API Documentation
All endpoints require Content-Type: application/json. Authentication-protected endpoints need Authorization: Bearer <token> in the headers.

Authentication
POST /api/auth/register
Parameters: { "name": string, "email": string, "password": string, "skills": array, "causes_supported": array }
Response: 201 { "message": "User registered successfully", "user": { "id": integer, "name": string, "email": string, ... } }
POST /api/auth/login
Parameters: { "email": string, "password": string }
Response: 200 { "token": string, "user": { "id": integer, "name": string, "email": string, ... } }
GET /api/auth/profile
Headers: Authorization: Bearer <token>
Response: 200 { "id": integer, "name": string, "email": string, "skills": array, ... }
PUT /api/auth/profile
Headers: Authorization: Bearer <token>
Parameters: { "name": string, "skills": array, "causes_supported": array }
Response: 200 { "id": integer, "name": string, "email": string, ... }
GET /api/auth/users
Headers: Authorization: Bearer <token> (admin only)
Response: 200 [{ "id": integer, "name": string, "email": string, "role": string }, ...]
Events
POST /api/events/
Headers: Authorization: Bearer <token>
Parameters: { "title": string, "description": string, "date": "YYYY-MM-DD", "time": "ISO8601", "location": string, "category": string }
Response: 201 { "message": "Event created successfully", "event": { "id": integer, "title": string, ... } }
GET /api/events/
Query: ?category=string&location=string&date=YYYY-MM-DD&page=number&limit=number&all=boolean
Response: 200 { "pagination": { "total_items": integer, ... }, "events": [{ "id": integer, "title": string, ... }, ...] }
GET /api/events/:event_id
Response: 200 { "id": integer, "title": string, "description": string, ... }
POST /api/events/:eventId/join
Headers: Authorization: Bearer <token>
Response: 200 { "message": "Successfully joined the event", "event": { "id": integer, ... } }
Community Help
POST /api/community-help/
Headers: Authorization: Bearer <token>
Parameters: { "title": string, "description": string, "location": string, "category": string, "urgency_level": "low|medium|urgent" }
Response: 201 { "message": "Help request created successfully", "help_request": { "id": integer, ... } }
GET /api/community-help/
Query: ?category=string&location=string&urgency_level=low|medium|urgent&status=open|in_progress|completed|closed&page=number&limit=number&all=boolean
Response: 200 { "pagination": { "total_items": integer, ... }, "help_requests": [{ "id": integer, "title": string, ... }, ...] }
GET /api/community-help/:help_request_id
Response: 200 { "id": integer, "title": string, "description": string, ... }
POST /api/community-help/:help_request_id/comments
Headers: Authorization: Bearer <token>
Parameters: { "comment_text": string, "is_helper": boolean }
Response: 201 { "message": "Comment added successfully", "comment": { "id": integer, "comment_text": string, ... } }
GET /api/community-help/:help_request_id/comments
Response: 200 { "help_request_id": integer, "comments": [{ "id": integer, "comment_text": string, ... }, ...] }
PATCH /api/community-help/:id/status
Headers: Authorization: Bearer <token>
Parameters: { "status": "open|in_progress|completed|closed" }
Response: 200 { "message": "Status updated successfully", "help_request": { "id": integer, ... } }
Teams
POST /api/teams/
Headers: Authorization: Bearer <token>
Parameters: { "name": string, "description": string, "is_private": boolean, "avatar_url": string }
Response: 201 { "message": "Team created successfully", "team": { "id": integer, "name": string, ... } }
GET /api/teams/
Query: ?page=number&limit=number&search=string&sort_by=achievement_points|member_count|created_at
Response: 200 { "pagination": { "total_items": integer, ... }, "teams": [{ "id": integer, "name": string, ... }, ...] }
POST /api/teams/:team_id/join
Headers: Authorization: Bearer <token>
Response: 200 { "message": "Successfully joined the team" }
GET /api/teams/leaderboard
Response: 200 { "message": "Team leaderboard", "leaderboard": [{ "id": integer, "name": string, "achievement_points": integer, ... }, ...] }
GET /api/teams/:team_id/dashboard
Headers: Authorization: Bearer <token>
Response: 200 { "message": "Team dashboard", "dashboard": { "id": integer, "name": string, "members": array, ... } }
POST /api/teams/:team_id/invite
Headers: Authorization: Bearer <token>
Parameters: { "user_email": string }
Response: 200 { "message": "Invitation sent successfully" }
POST /api/teams/invitations/:invitation_id/respond
Headers: Authorization: Bearer <token>
Parameters: { "accept": boolean }
Response: 200 { "message": "Invitation accepted successfully" | "Invitation declined successfully" }
GET /api/user/teams
Headers: Authorization: Bearer <token>
Response: 200 { "message": "User's team memberships", "teams": [{ "id": integer, "name": string, ... }, ...] }
GET /api/teams/invitations
Headers: Authorization: Bearer <token>
Response: 200 { "message": "Pending team invitations", "invitations": [{ "id": integer, "team_name": string, ... }, ...] }
GET /api/teams/created
Headers: Authorization: Bearer <token>
Response: 200 { "message": "Your created teams", "teams": [{ "id": integer, "name": string, ... }, ...] }
📌 7. Running the Project
Locally

1. **Start the Server**:

```bash
npm run dev
```

Uses nodemon for auto-reloading on changes.
Runs on http://localhost:5000 (or the PORT specified in .env). 2. **Test Database Connection**:
Visit http://localhost:5000/test-db to verify PostgreSQL connectivity.
Expected response: 200 { "message": "Database connected!", "time": "ISO8601" }
In Production (e.g., Vercel)

1. **Deploy to Vercel**:
   Push to a GitHub repository.
   Connect to Vercel and configure environment variables in the Vercel dashboard:

```
   DATABASE_URL=postgres://<username>:<password>@<host>:<port>/<dbname>?sslmode=require
JWT_SECRET=<your-secret-key>
NODE_ENV=production
```

Use the provided vercel.json:

```
{
  "version": 2,
  "builds": [
    {
      "src": "src/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/server.js"
    }
  ]
}
```

2. **Access**:
   Use the Vercel-provided URL (e.g., https://your-app.vercel.app).
