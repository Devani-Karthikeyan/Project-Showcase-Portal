# Project Showcase Portal - API Documentation

This document outlines the REST API endpoints available in the backend of the Project Showcase Portal.

## Base URL
All API routes are prefixed with `/api`. For example, `http://localhost:5000/api`.



## Authentication (`/api/auth`)

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/google` | Public login endpoint (Google OAuth) | Public |
| `GET` | `/config` | Fetch public OAuth configurations (clientId) | Public |
| `GET` | `/me` | Get current user's profile information | Protected |



## Projects (`/api/projects`)

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Get all projects (supports guest search) | Optional Auth |
| `GET` | `/:id` | Get project by ID | Optional Auth |
| `POST` | `/` | Create a new project (supports thumbnail upload) | Student |
| `PUT` | `/:id` | Update an existing project | Protected |
| `DELETE`| `/:id` | Delete a project | Protected |
| `POST` | `/:id/archive` | Archive a project | Student |
| `POST` | `/:id/unarchive` | Unarchive a project | Student |
| `POST` | `/:id/like` | Like a project | Protected |
| `POST` | `/:id/unlike` | Unlike a project | Protected |
| `POST` | `/:id/bookmark` | Bookmark a project | Protected |
| `POST` | `/:id/unbookmark`| Unbookmark a project | Protected |
| `POST` | `/:id/feedback` | Add feedback to a project | Lecturer |
| `POST` | `/:id/approve` | Approve a project | Lecturer, Admin |
| `POST` | `/:id/reject` | Reject a project | Lecturer, Admin |



## Users (`/api/users`)

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/students` | Get list of all students (directory search) | Protected |
| `GET` | `/:id/profile` | Retrieve a user's public profile | Optional Auth |
| `GET` | `/following/feed`| Get feed of projects from followed users | Protected |
| `GET` | `/following` | Get list of followed users | Protected |
| `GET` | `/recommended` | Get recommended users to follow | Protected |
| `PUT` | `/profile` | Update profile details | Protected |
| `PUT` | `/settings` | Update user settings | Protected |
| `PUT` | `/avatar` | Upload and update user avatar | Protected |
| `DELETE`| `/account` | Delete user account | Protected |
| `POST` | `/:id/follow` | Follow a user | Protected |
| `POST` | `/:id/unfollow` | Unfollow a user | Protected |



## Notifications (`/api/notifications`)

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Get recent notifications list | Protected |
| `PUT` | `/:id/read` | Mark a single notification as read | Protected |
| `PUT` | `/read-all` | Mark all notifications as read | Protected |
| `GET` | `/stream` | Server-Sent Events (SSE) stream endpoint | Protected |



## Collections (`/api/collections`)

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Get user collections | Protected |
| `POST` | `/` | Create a new collection | Protected |
| `PUT` | `/:id` | Update a collection | Protected |
| `DELETE`| `/:id` | Delete a collection | Protected |



## Metadata (`/api/metadata`)

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/universities` | Get list of universities | Public |
| `GET` | `/degree-programs`| Get list of degree programs | Public |



## Admin (`/api/admin`)

*Note: All endpoints under this route are strictly restricted to users with the `admin` role.*

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/users` | Fetch all registered user profiles | Admin |
| `PUT` | `/users/:id/role`| Change a user's role | Admin |
| `PUT` | `/users/:id/active`| Toggle an account's activation status | Admin |
| `DELETE`| `/users/:id` | Delete a user account | Admin |
| `GET` | `/stats` | Fetch platform statistics | Admin |
| `POST` | `/universities` | Create a new university entry | Admin |
| `PUT` | `/universities/:id`| Update a university entry | Admin |
| `DELETE`| `/universities/:id`| Delete a university entry | Admin |
| `POST` | `/degree-programs`| Create a new degree program entry | Admin |
| `PUT` | `/degree-programs/:id`| Update a degree program entry| Admin |
| `DELETE`| `/degree-programs/:id`| Delete a degree program entry | Admin |


## Roles & Authorization
- **Public**: No authentication required.
- **Optional Auth**: Accessible without authentication, but provides more details if authenticated.
- **Protected**: Requires a valid authentication token.
- **Student**: Restricted to users with the 'student' role.
- **Lecturer**: Restricted to users with the 'lecturer' role.
- **Admin**: Restricted to users with the 'admin' role.
- **Recruiter**: Restricted to users with the 'recruiter' role.