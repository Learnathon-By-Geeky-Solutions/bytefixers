# ByteFixers Project Documentation

## 📋 Table of Contents
- [Overview](#overview)
- [System Architecture](#system-architecture)
- [API Documentation](#api-documentation)
- [Database Models](#database-models)
- [Frontend Components](#frontend-components)
- [Workflows](#workflows)
- [Documentation Guidelines](#documentation-guidelines)
- [Documentation Process](#documentation-process)
- [Tools & Resources](#tools--resources)

## 🔍 Overview
This document serves as the comprehensive documentation for the ByteFixers project management tool. It outlines the system architecture, API endpoints, data models, frontend components, and workflows.

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

### User Endpoints

#### `POST /api/users/register`
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
  "success": true,
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Error responses**:
- 400: Invalid input
- 409: Email already exists

#### `POST /api/users/login`
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
  "success": true,
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Error responses**:
- 400: Invalid credentials
- 404: User not found

### Project Endpoints

#### `GET /api/projects`
**Description**: Get all projects for logged in user

**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "project-id",
      "name": "Project Name",
      "description": "Project Description",
      "createdAt": "2025-04-30T12:00:00Z"
    }
  ]
}
```

#### `POST /api/projects`
**Description**: Create a new project

**Authentication**: Required

**Request body**:
```json
{
  "name": "New Project",
  "description": "Project Description"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "project-id",
    "name": "New Project",
    "description": "Project Description",
    "createdAt": "2025-04-30T12:00:00Z"
  }
}
```

## 💾 Database Models

### User Model
**Description**: Represents a user in the system

**Schema**:
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| name | String | Yes | - | User's full name |
| email | String | Yes | - | User's email address |
| password | String | Yes | - | Hashed password |
| createdAt | Date | No | Date.now | Account creation date |
| projects | [ObjectId] | No | [] | Projects associated with user |

**Indexes**:
- Unique index on `email` for quick lookups and to prevent duplicates

### Project Model
**Description**: Represents a project in the system

**Schema**:
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| name | String | Yes | - | Project name |
| description | String | No | "" | Project description |
| owner | ObjectId | Yes | - | User who created the project |
| members | [ObjectId] | No | [] | Users with access to the project |
| createdAt | Date | No | Date.now | Project creation date |
| tasks | [ObjectId] | No | [] | Tasks within the project |

**Relationships**:
- References User model via `owner` and `members`
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
| createdAt | Date | No | Date.now | Task creation date |

**Relationships**:
- References User model via `assignee`
- References Project model via `project`

## 🖼️ Frontend Components

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

## ✍️ Documentation Guidelines

1. **Keep it updated**: Update documentation when code changes
2. **Use clear language**: Write concisely and avoid jargon
3. **Include examples**: Provide code examples when appropriate
4. **Add diagrams**: Use visual aids for complex concepts
5. **Link related documents**: Cross-reference related documentation

## 📝 Documentation Process

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

## 🔧 Tools & Resources

### Recommended Tools
- **Diagrams**: [draw.io](https://draw.io) or [Mermaid](https://mermaid-js.github.io/)
- **API Documentation**: Consider integrating [Swagger/OpenAPI](https://swagger.io/)
- **Code Documentation**: Use JSDoc comments for function documentation

### Reference Documentation
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Express Documentation](https://expressjs.com/)
- [React Documentation](https://reactjs.org/docs/)
- [Node.js Documentation](https://nodejs.org/en/docs/)

---

This document is a living guide and should be updated as the project evolves.