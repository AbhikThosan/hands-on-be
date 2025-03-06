# HandsOn - Community-Driven Social Volunteering Platform

## 📌 1. Project Overview

HandsOn is a community-driven social volunteering platform designed to connect individuals with meaningful social impact opportunities. Users can discover and join volunteer-driven events, post requests for community help, form teams for large-scale initiatives, and track their contributions. The platform encourages social responsibility, collaboration, and proactive engagement in volunteer work, rewarding participants with a point-based system and recognition through certificates.

Think of it as a "GitHub for social work," where people contribute their time instead of code, building real-world impact together.

## 📌 2. Technologies Used

- **Frontend:**
  - React.js
- **Backend:**
  - Node.js (Express.js)
- **Database:**
  - PostgreSQL
- **Authentication:**
  - JWT-based authentication
- **API Communication:**
  - REST API
- **Others:**
  - Redux Toolkit Query
  - Tailwind CSS
  - NPM

## 📌 3. Features

- **User Registration & Profile Management:**
  - Sign up and log in with email and password.
  - Manage user profiles, including skills and causes supported.
  - Track volunteer history and contributions.
- **Discover & Join Volunteer Events:**
  - Event creation with title, description, date, time, and location.
  - Browse and filter volunteer events by category, location, and availability.
  - One-click registration for events, with instant addition to the attendee list.
- **Community Help Requests:**

  - Post help requests with an urgency level (low, medium, urgent).
  - Coordinate through comments or private messaging.
  - Offer help in response to requests.

- **Form Teams & Group Initiatives:**

  - Create private or public teams for long-term volunteering projects.
  - Private teams are invite-only, while public teams are open to all users.
  - Each team has a dashboard with members, events, and achievements.
  - Leaderboard showcasing the most active teams.

- **Impact Tracking & Social Recognition:**
  - Log volunteer hours after attending events.
  - Auto-verification for platform-created events and peer verification for others.
  - Points awarded for hours volunteered (5 points per hour).
  - Auto-generated certificates for milestones (e.g., 20, 50, 100 hours).
  - Public leaderboard to rank the most active volunteers.

## 📌 4. Database Schema

```plaintext
users
- id (PK)
- username
- email
- password_hash
- role (admin, organization, volunteer)
- skills
- supported_causes
- volunteer_hours
- volunteer_history

events
- id (PK)
- title
- description
- date
- time
- location
- category
- created_by (FK to users)
- attendees (array of user ids)

requests
- id (PK)
- title
- description
- urgency (low, medium, urgent)
- created_by (FK to users)
- responders (array of user ids)

teams
- id (PK)
- name
- type (private, public)
- created_by (FK to users)
- members (array of user ids)
- projects (array of event ids)

volunteer_hours
- id (PK)
- user_id (FK to users)
- event_id (FK to events)
- hours_logged
- verified (boolean)
```
