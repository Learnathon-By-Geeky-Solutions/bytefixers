# ByteFixers Project Documentation Guidelines

## 📋 Table of Contents
- [Overview](#overview)
- [Documentation Structure](#documentation-structure)
- [System Architecture](#system-architecture)
- [API Documentation](#api-documentation)
- [Database Models](#database-models)
- [Frontend Documentation](#frontend-documentation)
- [Workflows](#workflows)
- [Documentation Standards](#documentation-standards)
- [Documentation Process](#documentation-process)
- [Tools & Resources](#tools--resources)

## 🔍 Overview
This document outlines the standards and practices for documenting the ByteFixers project management tool. Following these guidelines ensures consistent and comprehensive documentation across the project.

## 📚 Documentation Structure
The documentation is organized into the following sections:

1. **System Architecture** - `/docs/architecture.md`
2. **API Documentation** - `/docs/api/`
3. **Database Models** - `/docs/models/`
4. **Frontend Documentation** - `/docs/frontend/`
5. **Workflows** - `/docs/workflows/`
6. **User Guides** - `/docs/user/`

## 🏗️ System Architecture

### High-Level System Design
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Frontend   │     │   Backend   │     │  Database   │
│   (React)   │◄───►│  (Express)  │◄───►│  (MongoDB)  │
└─────────────┘     └─────────────┘     └─────────────┘
```

### Technology Stack
- **Frontend**: React, Redux, Material UI
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **Authentication**: JWT
- **Testing**: Jest, React Testing Library
- **CI/CD**: GitHub Actions

### Component Interactions
1. Frontend sends API requests to the backend
2. Backend processes requests and interacts with the database
3. Backend sends responses back to the frontend
4. Frontend updates UI based on responses

## 📡 API Documentation

### API Endpoint Documentation Format

```markdown
## `[METHOD] /path/to/endpoint`

**Description**: Brief description of what this endpoint does

**Authentication**: Required/Not required

**Request Parameters**:
- `paramName` (type): Description

**Request Body**:
```json
{
  "field": "value"
}
```

**Response**:
```json
{
  "field": "value"
}
```

**Error Responses**:
- `400`: Bad Request - [reason]
- `401`: Unauthorized - [reason]
- `404`: Not Found - [reason]
- `500`: Server Error - [reason]

**Examples**:
```bash
curl -X POST ${process.env.REACT_APP_BASE_URL}/api/user/sign-up \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com", "password": "password123"}'
```
```

### User Endpoints

#### `POST /api/user/sign-up`
**Description**: Register a new user

**Authentication**: None

**Request body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "token": "jwt-token-here",
  "user": {
    "_id": "user-id",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Error responses**:
- 400: Invalid input
- 409: Email already exists

#### `POST /api/user/login`
**Description**: Login a user

**Authentication**: None

**Request body**:
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "token": "jwt-token-here",
  "user": {
    "_id": "user-id",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Error responses**:
- 400: Invalid credentials
- 404: User not found

### Project Endpoints

#### `POST /projects/create`
**Description**: Create a new project

**Authentication**: Required

**Request body**:
```json
{
  "name": "New Project",
  "description": "Project Description",
  "team": "teamId"
}
```

**Response**:
```json
{
  "_id": "project-id",
  "name": "New Project",
  "description": "Project Description",
  "createdBy": "userId",
  "team": "teamId",
  "status": "Planning",
  "members": ["userId"],
  "createdAt": "2025-04-30T12:00:00Z"
}
```

#### `GET /projects`
**Description**: Get all projects

**Authentication**: Required

**Response**:
```json
[
  {
    "_id": "project-id",
    "name": "Project Name",
    "description": "Project Description",
    "createdBy": "userId",
    "team": "teamId",
    "status": "Planning",
    "members": ["userId"],
    "createdAt": "2025-04-30T12:00:00Z"
  }
]
```

#### `GET /projects/:id`
**Description**: Get a project by ID

**Authentication**: Required

**Response**:
```json
{
  "_id": "project-id",
  "name": "Project Name",
  "description": "Project Description",
  "createdBy": "userId",
  "team": "teamId",
  "status": "Planning",
  "members": ["userId"],
  "createdAt": "2025-04-30T12:00:00Z"
}
```

#### `PUT /projects/:id`
**Description**: Update a project

**Authentication**: Required

**Request body**:
```json
{
  "name": "Updated Project Name",
  "description": "Updated Description",
  "status": "Active"
}
```

**Response**: Updated project object

#### `DELETE /projects/:id`
**Description**: Delete a project

**Authentication**: Required

**Response**: Deleted project object or success message

#### `POST /projects/addUserToProject`
**Description**: Add a user to a project

**Authentication**: Required

**Request body**:
```json
{
  "userId": "user-id",
  "projectId": "project-id"
}
```

**Response**: Updated project object

### Task Endpoints

#### `POST /tasks/:projectId/addTasks`
**Description**: Create a new task in a project

**Authentication**: Required

**Request body**:
```json
{
  "title": "Task Title",
  "description": "Task Description",
  "status": "todo",
  "dueDate": "2025-05-15T00:00:00Z"
}
```

**Response**:
```json
{
  "_id": "task-id",
  "title": "Task Title",
  "description": "Task Description",
  "status": "todo",
  "project": "project-id",
  "dueDate": "2025-05-15T00:00:00Z",
  "createdAt": "2025-04-30T12:00:00Z"
}
```

#### `GET /tasks/:projectId`
**Description**: Get all tasks in a project

**Authentication**: Required

**Response**:
```json
[
  {
    "_id": "task-id",
    "title": "Task Title",
    "description": "Task Description",
    "status": "todo",
    "project": "project-id",
    "dueDate": "2025-05-15T00:00:00Z",
    "createdAt": "2025-04-30T12:00:00Z"
  }
]
```

#### `GET /tasks/task/:taskId`
**Description**: Get a task by ID

**Authentication**: Required

**Response**: Task object

#### `PUT /tasks/:taskId`
**Description**: Update a task

**Authentication**: Required

**Request body**: Fields to update

**Response**: Updated task object

#### `DELETE /tasks/:taskId`
**Description**: Delete a task

**Authentication**: Required

**Response**: Deleted task object or success message

#### `GET /tasks/:projectId/status/:status`
**Description**: Get tasks by status

**Authentication**: Required

**Response**: Array of task objects with the specified status

#### `GET /tasks/:projectId/status-counts`
**Description**: Get task count by status

**Authentication**: Required

**Response**:
```json
{
  "todo": 5,
  "in-progress": 3,
  "done": 2
}
```

#### `POST /tasks/:taskId/add-subtask`
**Description**: Add a subtask to a task

**Authentication**: Required

**Request body**:
```json
{
  "title": "Subtask Title",
  "description": "Subtask Description"
}
```

**Response**: Updated task object with subtasks

### Team Endpoints

#### `POST /teams/create/:userId`
**Description**: Create a new team

**Authentication**: Required

**Request body**:
```json
{
  "name": "Team Name",
  "description": "Team Description"
}
```

**Response**:
```json
{
  "_id": "team-id",
  "name": "Team Name",
  "description": "Team Description",
  "owner": "userId",
  "members": ["userId"],
  "createdAt": "2025-04-30T12:00:00Z"
}
```

#### `POST /teams/assign/:teamId`
**Description**: Assign members to team

**Authentication**: Required

**Request body**:
```json
{
  "members": ["userId1", "userId2"]
}
```

**Response**: Updated team object

#### `GET /teams/my-teams/:userId`
**Description**: Get all teams for a user

**Authentication**: Required

**Response**:
```json
[
  {
    "_id": "team-id",
    "name": "Team Name",
    "description": "Team Description",
    "owner": "userId",
    "members": ["userId", "userId1", "userId2"],
    "createdAt": "2025-04-30T12:00:00Z"
  }
]
```

#### `GET /teams/:teamId`
**Description**: Get team by ID

**Authentication**: Required

**Response**: Team object

#### `POST /teams/leave/:teamId`
**Description**: Leave a team

**Authentication**: Required

**Response**: Updated team object or success message

#### `DELETE /teams/:teamId`
**Description**: Delete team

**Authentication**: Required

**Response**: Deleted team object or success message

## 💾 Database Models

### Model Documentation Format

```markdown
## ModelName

**Description**: What this model represents

**Fields**:
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| field | Type | Yes/No | `value` | Description |

**Indexes**:
- Index on `field` (reason)

**Relationships**:
- Related to `OtherModel` via `fieldName`

**Example Document**:
```json
{
  "field": "value"
}
```
```

### User Model
**Description**: Represents a user in the system

**Schema**:
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| name | String | Yes | - | User's full name |
| email | String | Yes | - | User's email address |
| password | String | Yes | - | Hashed password |
| createdAt | Date | No | Date.now | Account creation date |
| profilePicture | String | No | - | URL to user's profile picture |

**Indexes**:
- Unique index on `email` for quick lookups and to prevent duplicates

### Project Model
**Description**: Represents a project in the system

**Schema**:
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| name | String | Yes | - | Project name |
| description | String | No | "" | Project description |
| createdBy | ObjectId | Yes | - | User who created the project |
| team | ObjectId | No | - | Team associated with the project |
| status | String | No | "Planning" | Project status (Planning, Active, On Hold, Completed, Archived) |
| members | [ObjectId] | No | [] | Users with access to the project |
| progress | Number | No | 0 | Project progress percentage |
| createdAt | Date | No | Date.now | Project creation date |

**Relationships**:
- References User model via `createdBy` and `members`
- References Team model via `team`
- Referenced by Task model

### Task Model
**Description**: Represents a task within a project

**Schema**:
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| title | String | Yes | - | Task title |
| description | String | No | "" | Task description |
| status | String | No | "todo" | Task status (todo, in-progress, done) |
| assignee | ObjectId | No | null | User assigned to the task |
| project | ObjectId | Yes | - | Project this task belongs to |
| dueDate | Date | No | null | Task due date |
| priority | String | No | "medium" | Task priority (low, medium, high) |
| subtasks | Array | No | [] | Subtasks within this task |
| createdAt | Date | No | Date.now | Task creation date |

**Relationships**:
- References User model via `assignee`
- References Project model via `project`

### Team Model
**Description**: Represents a team of users

**Schema**:
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| name | String | Yes | - | Team name |
| description | String | No | "" | Team description |
| owner | ObjectId | Yes | - | User who created the team |
| members | [ObjectId] | No | [] | Users in the team |
| projects | [ObjectId] | No | [] | Projects associated with the team |
| createdAt | Date | No | Date.now | Team creation date |

**Relationships**:
- References User model via `owner` and `members`
- References Project model via `projects`

## 🖼️ Frontend Documentation

### Component Documentation Format

```markdown
## ComponentName

**Purpose**: What this component does

**Props**:
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| prop | type | Yes/No | `value` | Description |

**State**:
- `stateName`: Description

**Example**:
```jsx
<ComponentName prop="value" />
```

**Notes**:
- Any important implementation details or gotchas
```

### AppLayout Component
**Purpose**: Main layout component that wraps all pages

**Props**:
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| children | ReactNode | Yes | - | Content to render within layout |

**State Management**:
- Uses AuthContext for user authentication state

**Example Usage**:
```jsx
<AppLayout>
  <Dashboard />
</AppLayout>
```

### ProjectCard Component
**Purpose**: Displays project information in a card format

**Props**:
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| project | Project | Yes | - | Project data object |
| onEdit | Function | No | () => {} | Called when edit button is clicked |
| onDelete | Function | No | () => {} | Called when delete button is clicked |

**Example Usage**:
```jsx
<ProjectCard 
  project={projectData}
  onEdit={handleEditProject}
  onDelete={handleDeleteProject} 
/>
```

### TaskForm Component
**Purpose**: Form for creating and editing tasks

**Props**:
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| initialData | Task | No | null | Initial task data for editing |
| projectId | String | Yes | - | ID of project this task belongs to |
| onSubmit | Function | Yes | - | Called with form data when submitted |
| onCancel | Function | No | () => {} | Called when cancel button is clicked |

**State Management**:
- Form state for task fields
- Validation state

**Example Usage**:
```jsx
<TaskForm
  projectId="project-123"
  onSubmit={handleCreateTask}
  onCancel={closeTaskModal}
/>
```

## 🔄 Workflows

### Workflow Documentation Format

```markdown
## Workflow Name

**Purpose**: Description of what this workflow accomplishes

**Actors**: Who is involved in this workflow

**Steps**:
1. Step 1
2. Step 2
3. Step 3

**Diagrams**:
[Include flowchart or sequence diagram]

**Notes**:
- Important considerations
- Edge cases
```

### User Registration and Login
1. User navigates to registration page
2. User completes registration form and submits
3. System validates form data
4. System creates new user account
5. System logs user in and redirects to dashboard
6. For returning users, the login workflow is similar but skips registration

### Project Creation Workflow
1. User clicks "New Project" button on dashboard
2. User completes project creation form
3. System creates new project
4. System redirects to project details page

### Task Management Workflow
1. User navigates to project details page
2. User creates new tasks or modifies existing ones
3. User can change task status by dragging between columns
4. User can assign tasks to project members

### Team Management Workflow
1. User creates a new team
2. User adds members to the team
3. Team members can be assigned to projects
4. Team members can collaborate on projects and tasks

## 📝 Documentation Standards

1. **Keep it updated**: Update documentation when code changes
2. **Use clear language**: Write concisely and avoid jargon
3. **Include examples**: Provide code examples when appropriate
4. **Add diagrams**: Use visual aids for complex concepts
5. **Link related documents**: Cross-reference related documentation
6. **Be consistent**: Follow the templates and formats specified in this guide
7. **Document edge cases**: Include information about limitations and special cases
8. **Version documentation**: Indicate when documentation was last updated

## 🔄 Documentation Process

### Creating New Documentation
- Create documentation alongside feature development
- Follow the templates provided in this document
- Update the table of contents when adding new sections

### Updating Documentation
- Update documentation when related code changes
- Mark outdated sections with `[DEPRECATED]` if necessary
- Document breaking changes prominently

### Reviewing Documentation
- Include documentation in code reviews
- Ensure accuracy and clarity
- Check for completeness

## 🔍 API Endpoints Reference

### 👤 User Authentication

- `POST /api/user/sign-up`: Register new user
- `POST /api/user/login`: Login user
- `PUT /api/user/profile`: Update user profile
- `PUT /api/user/password`: Update user password
- `GET /api/user/profile`: Get current user profile

### 📋 Projects

- `POST /projects/create`: Create new project
- `GET /projects`: Get all projects
- `GET /projects/:id`: Get project by ID
- `PUT /projects/:id`: Update project
- `DELETE /projects/:id`: Delete project
- `GET /projects/user/:userId`: Get user's projects
- `POST /projects/addUserToProject`: Add user to project

### ✅ Tasks

- `POST /tasks/:projectId/addTasks`: Create task
- `GET /tasks/:projectId`: Get all tasks in project
- `GET /tasks/task/:taskId`: Get task by ID
- `PUT /tasks/:taskId`: Update task
- `DELETE /tasks/:taskId`: Delete task
- `GET /tasks/:projectId/status/:status`: Get tasks by status
- `GET /tasks/:projectId/status-counts`: Get task count by status
- `POST /tasks/:taskId/add-subtask`: Add subtask

### 👥 Teams

- `POST /teams/create/:userId`: Create team
- `POST /teams/assign/:teamId`: Assign members to team
- `GET /teams/my-teams/:userId`: Get user's teams
- `GET /teams/:teamId`: Get team by ID
- `POST /teams/leave/:teamId`: Leave a team
- `DELETE /teams/:teamId`: Delete team

### 📎 Files

- `POST /files/upload/:taskId`: Upload file
- `GET /files/:taskId`: Get files for task
- `GET /files/user/:userId`: Get user's files
- `GET /files/download/:taskId/:fileId`: Download file

### 📧 Email

- `POST /sendEmail`: Send email notification

### 🔔 Notifications

- `GET /api/notifications/user/:userId`: Get user notifications
- `POST /api/notifications`: Create notification
- `PUT /api/notifications/:notificationId/read`: Mark notification as read

### 📅 Calendar

- `GET /api/calendar/project/:projectId`: Get calendar events
- `POST /api/calendar`: Create calendar event
- `PUT /api/calendar/:eventId`: Update calendar event

### 💬 Chat

- `POST /api/chat/message`: Send chat message
- `GET /api/chat/history/:conversationId`: Get chat history

### Reference Documentation
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Express Documentation](https://expressjs.com/)
- [React Documentation](https://reactjs.org/docs/)
- [Node.js Documentation](https://nodejs.org/en/docs/)