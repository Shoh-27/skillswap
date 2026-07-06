# SkillSwap REST API — V1

> Laravel · MySQL · Sanctum · Clean Architecture

---

## Quick Start

```bash
# 1. Install dependencies
composer install

# 2. Copy environment file
cp .env.example .env

# 3. Set DB credentials in .env
DB_DATABASE=skillswap
DB_USERNAME=root
DB_PASSWORD=secret

# 4. Generate app key
php artisan key:generate

# 5. Install Sanctum
php artisan install:api   # Laravel 11
# OR for Laravel 10:
composer require laravel/sanctum
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"

# 6. Run migrations + seed
php artisan migrate --seed

# 7. Serve
php artisan serve
```

---

## Folder Structure

```
app/
├── Http/
│   ├── Controllers/
│   │   └── API/
│   │       ├── AuthController.php
│   │       ├── ProfileController.php
│   │       ├── SkillController.php
│   │       ├── UserController.php
│   │       ├── ConnectionController.php
│   │       └── MessageController.php
│   ├── Requests/
│   │   ├── Auth/
│   │   │   ├── RegisterRequest.php
│   │   │   └── LoginRequest.php
│   │   ├── Profile/
│   │   │   ├── UpdateProfileRequest.php
│   │   │   └── AddSkillRequest.php
│   │   ├── Connection/
│   │   │   └── SendConnectionRequest.php
│   │   └── Message/
│   │       └── SendMessageRequest.php
│   └── Resources/
│       ├── User/
│       │   ├── UserResource.php
│       │   └── AuthResource.php
│       ├── Skill/
│       │   └── SkillResource.php
│       ├── Connection/
│       │   └── ConnectionResource.php
│       └── Message/
│           └── MessageResource.php
├── Models/
│   ├── User.php
│   ├── Skill.php
│   ├── UserSkill.php
│   ├── Connection.php
│   └── Message.php
└── Services/
    ├── AuthService.php
    ├── ProfileService.php
    ├── UserService.php
    ├── ConnectionService.php
    └── MessageService.php

database/
├── migrations/          (5 migration files)
└── seeders/
    ├── DatabaseSeeder.php
    └── SkillSeeder.php  (85+ predefined skills)

routes/
└── api.php
```

---

## Complete Route List

```
Method  URI                                          Middleware
──────  ───────────────────────────────────────────  ──────────
POST    /api/v1/auth/register                        public
POST    /api/v1/auth/login                           public
GET     /api/v1/skills                               public

POST    /api/v1/auth/logout                          auth:sanctum
GET     /api/v1/auth/me                              auth:sanctum

PUT     /api/v1/profile                              auth:sanctum
POST    /api/v1/profile/skills                       auth:sanctum
DELETE  /api/v1/profile/skills/{userSkillId}         auth:sanctum

GET     /api/v1/users                                auth:sanctum
GET     /api/v1/users/{id}                           auth:sanctum

GET     /api/v1/connections                          auth:sanctum
POST    /api/v1/connections                          auth:sanctum
PUT     /api/v1/connections/{id}/accept              auth:sanctum
PUT     /api/v1/connections/{id}/reject              auth:sanctum

GET     /api/v1/connections/{connectionId}/messages  auth:sanctum
POST    /api/v1/connections/{connectionId}/messages  auth:sanctum
```

---

## Database Schema

```sql
users
  id            BIGINT PK
  name          VARCHAR(100)
  email         VARCHAR UNIQUE
  password      VARCHAR
  bio           TEXT NULL
  created_at    TIMESTAMP
  updated_at    TIMESTAMP

skills
  id            BIGINT PK
  name          VARCHAR UNIQUE
  created_at    TIMESTAMP
  updated_at    TIMESTAMP

user_skills
  id            BIGINT PK
  user_id       FK → users.id
  skill_id      FK → skills.id
  type          ENUM('teach','learn')
  UNIQUE(user_id, skill_id, type)
  created_at    TIMESTAMP
  updated_at    TIMESTAMP

connections
  id            BIGINT PK
  sender_id     FK → users.id
  receiver_id   FK → users.id
  status        ENUM('pending','accepted','rejected')  DEFAULT 'pending'
  UNIQUE(sender_id, receiver_id)
  created_at    TIMESTAMP
  updated_at    TIMESTAMP

messages
  id            BIGINT PK
  connection_id FK → connections.id
  sender_id     FK → users.id
  message       TEXT
  INDEX(connection_id, created_at)
  created_at    TIMESTAMP
  updated_at    TIMESTAMP
```

---

## Example API Responses

### POST /api/v1/auth/register — 201

```json
{
  "data": {
    "user": {
      "id": 1,
      "name": "Alice Johnson",
      "email": "alice@example.com",
      "bio": null,
      "skills_can_teach": [],
      "skills_want_to_learn": [],
      "created_at": "2024-01-15T10:30:00.000Z"
    },
    "token": "1|abc123xyz..."
  }
}
```

### POST /api/v1/auth/login — 200

```json
{
  "data": {
    "user": {
      "id": 1,
      "name": "Alice Johnson",
      "email": "alice@example.com",
      "bio": "Full-stack developer based in Tashkent.",
      "skills_can_teach": [
        { "id": 3, "name": "React" }
      ],
      "skills_want_to_learn": [
        { "id": 18, "name": "Go" }
      ],
      "created_at": "2024-01-15T10:30:00.000Z"
    },
    "token": "2|def456uvw..."
  }
}
```

### POST /api/v1/auth/logout — 200

```json
{
  "message": "Logged out successfully."
}
```

### GET /api/v1/auth/me — 200

```json
{
  "data": {
    "id": 1,
    "name": "Alice Johnson",
    "email": "alice@example.com",
    "bio": "Full-stack developer.",
    "skills_can_teach": [
      { "id": 3, "name": "React" },
      { "id": 2, "name": "Laravel" }
    ],
    "skills_want_to_learn": [
      { "id": 18, "name": "Go" }
    ],
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

### GET /api/v1/skills — 200

```json
{
  "data": [
    { "id": 1, "name": "PHP" },
    { "id": 2, "name": "Laravel" },
    { "id": 3, "name": "React" },
    { "id": 4, "name": "Vue.js" },
    "..."
  ]
}
```

### PUT /api/v1/profile — 200

**Request:**
```json
{ "name": "Alice J.", "bio": "Laravel & React enthusiast." }
```

**Response:**
```json
{
  "data": {
    "id": 1,
    "name": "Alice J.",
    "email": "alice@example.com",
    "bio": "Laravel & React enthusiast.",
    "skills_can_teach": [],
    "skills_want_to_learn": [],
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

### POST /api/v1/profile/skills — 201

**Request:**
```json
{ "skill_id": 3, "type": "teach" }
```

**Response:**
```json
{
  "message": "Skill added successfully.",
  "data": {
    "id": 7,
    "skill": { "id": 3, "name": "React" },
    "type": "teach"
  }
}
```

### DELETE /api/v1/profile/skills/7 — 200

```json
{
  "message": "Skill removed successfully."
}
```

### GET /api/v1/users?skill_id=3&type=teach — 200

*"Show users who can teach React"*

```json
{
  "data": [
    {
      "id": 2,
      "name": "Bob Smith",
      "email": "bob@example.com",
      "bio": "5 years React experience.",
      "skills_can_teach": [
        { "id": 3, "name": "React" },
        { "id": 5, "name": "TypeScript" }
      ],
      "skills_want_to_learn": [
        { "id": 2, "name": "Laravel" }
      ],
      "created_at": "2024-01-14T08:00:00.000Z"
    }
  ],
  "links": {
    "first": "http://localhost/api/v1/users?page=1",
    "last": "http://localhost/api/v1/users?page=3",
    "prev": null,
    "next": "http://localhost/api/v1/users?page=2"
  },
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 3,
    "per_page": 15,
    "total": 42
  }
}
```

### POST /api/v1/connections — 201

**Request:**
```json
{ "receiver_id": 2 }
```

**Response:**
```json
{
  "data": {
    "id": 1,
    "status": "pending",
    "sender": { "id": 1, "name": "Alice J.", ... },
    "receiver": { "id": 2, "name": "Bob Smith", ... },
    "created_at": "2024-01-15T11:00:00.000Z",
    "updated_at": "2024-01-15T11:00:00.000Z"
  }
}
```

### GET /api/v1/connections?filter=received — 200

```json
{
  "data": [
    {
      "id": 1,
      "status": "pending",
      "sender": { "id": 1, "name": "Alice J.", ... },
      "receiver": { "id": 2, "name": "Bob Smith", ... },
      "created_at": "2024-01-15T11:00:00.000Z",
      "updated_at": "2024-01-15T11:00:00.000Z"
    }
  ],
  "meta": { "current_page": 1, "total": 1, ... }
}
```

### PUT /api/v1/connections/1/accept — 200

```json
{
  "data": {
    "id": 1,
    "status": "accepted",
    "sender": { "id": 1, "name": "Alice J.", ... },
    "receiver": { "id": 2, "name": "Bob Smith", ... },
    "created_at": "2024-01-15T11:00:00.000Z",
    "updated_at": "2024-01-15T11:05:00.000Z"
  }
}
```

### POST /api/v1/connections/1/messages — 201

**Request:**
```json
{ "message": "Hey Bob! I saw you can teach React. Would love to learn!" }
```

**Response:**
```json
{
  "data": {
    "id": 1,
    "connection_id": 1,
    "sender": { "id": 1, "name": "Alice J.", ... },
    "message": "Hey Bob! I saw you can teach React. Would love to learn!",
    "created_at": "2024-01-15T11:10:00.000Z"
  }
}
```

### GET /api/v1/connections/1/messages — 200

```json
{
  "data": [
    {
      "id": 2,
      "connection_id": 1,
      "sender": { "id": 2, "name": "Bob Smith", ... },
      "message": "Sure! Let's start with hooks.",
      "created_at": "2024-01-15T11:15:00.000Z"
    },
    {
      "id": 1,
      "connection_id": 1,
      "sender": { "id": 1, "name": "Alice J.", ... },
      "message": "Hey Bob! I saw you can teach React. Would love to learn!",
      "created_at": "2024-01-15T11:10:00.000Z"
    }
  ],
  "meta": { "current_page": 1, "total": 2, ... }
}
```

---

## Error Responses

### 422 Validation Error

```json
{
  "message": "The email field must be a valid email address.",
  "errors": {
    "email": ["The email field must be a valid email address."]
  }
}
```

### 401 Unauthenticated

```json
{
  "message": "Unauthenticated."
}
```

### 403 Forbidden

```json
{
  "message": "Only the receiver can accept a connection request."
}
```

### 404 Not Found

```json
{
  "message": "No query results for model [App\\Models\\Connection] 99"
}
```

### 422 Business Logic Error (e.g., duplicate connection)

```json
{
  "message": "A connection request already exists between these users.",
  "errors": {
    "receiver_id": ["A connection request already exists between these users."]
  }
}
```

---

## Authentication

All protected routes require the `Authorization` header:

```
Authorization: Bearer {token}
```

Tokens are issued on register/login and revoked on logout.

---

## Query Parameters

| Route | Parameter | Values | Description |
|---|---|---|---|
| GET /users | `skill_id` | integer | Filter by skill |
| GET /users | `type` | `teach` / `learn` | Combined with skill_id |
| GET /users | `per_page` | 1–50 | Pagination size (default 15) |
| GET /connections | `filter` | `sent` / `received` / `accepted` | Connection list filter |
| GET /connections/.../messages | `per_page` | 1–100 | Pagination size (default 20) |

---

## Design Decisions

| Decision | Rationale |
|---|---|
| `Controller → Service → Model` | Business logic stays out of controllers, easy to test services in isolation |
| `FormRequest` per action | Single responsibility, reusable, automatic 422 on failure |
| `API Resource` for all output | Consistent shape, hides internal column names, easy to version |
| Unique constraint on `(sender_id, receiver_id)` in connections | DB-level guard against race conditions |
| Unique constraint on `(user_id, skill_id, type)` in user_skills | Prevents duplicate entries at DB level |
| Messages paginated newest-first | Mirrors chat UIs; client reverses for display |
| Tokens deleted on login | One active session per user; remove for multi-device support |
| `firstOrCreate` in seeder | Idempotent — safe to run `db:seed` multiple times |
