# User Progress Schema & API Documentation

## Overview

The `/api/analytics/user-progress` endpoint manages user progression tracking across the application pillars (About, Build, Connect). It handles user profiles, milestones, and session data.

## Prisma Schema Models

### UserProfile (`user_profiles`)

Core profile linking a user to their progress data.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (CUID) | Primary Key |
| `userId` | String | Unique user identifier (from Auth) |
| `userType` | `UserType` | Default: `NON_TECHNICAL_FOUNDER` |
| `onboardingCompleted` | Boolean | Default: `false` |
| `aboutPillarProgress` | Json? | Progress meta-data for About pillar |
| `buildPillarProgress` | Json? | Progress meta-data for Build pillar |
| `connectPillarProgress` | Json? | Progress meta-data for Connect pillar |
| `firstIdeaStartedAt` | DateTime? | Timestamp of first idea creation |
| `firstIdeaCompletedAt` | DateTime? | Timestamp of first idea completion |
| `lastActiveAt` | DateTime | Last user activity timestamp |
| `retentionScore` | Float? | Calculated retention metric |
| `totalIdeasStarted` | Int | Count of started ideas |
| `totalIdeasCompleted` | Int | Count of completed ideas |
| `createdAt` | DateTime | Profile creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |

**Relations:**
- `milestones`: `UserMilestone[]`
- `sessions`: `UserSession[]`
- `ideaProgression`: `IdeaProgression[]`

### UserMilestone (`user_milestones`)

Tracks significant achievements or events for a user.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (CUID) | Primary Key |
| `userId` | String | Foreign Key -> `UserProfile.userId` |
| `milestone` | `MilestoneType` | Type of milestone achieved |
| `achievedAt` | DateTime | When the milestone was reached |
| `metadata` | Json? | specific data related to the milestone |

**Unique Constraint:** `[userId, milestone]`

### UserSession (`user_sessions`)

Logs user engagement sessions.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (CUID) | Primary Key |
| `userId` | String | Foreign Key -> `UserProfile.userId` |
| `startedAt` | DateTime | Session start time |
| `endedAt` | DateTime? | Session end time |
| `duration` | Int? | Duration in seconds |
| `pillarsUsed` | String[] | Pillars accessed during session |
| `pageViews` | Int | Number of pages viewed |
| `actions` | Json? | Specific actions tracked |

### IdeaProgression (`idea_progressions`)

Tracks the lifecycle of specific ideas.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (CUID) | Primary Key |
| `userId` | String | Foreign Key -> `UserProfile.userId` |
| `ideaTitle` | String | Title of the idea |
| `currentStage` | `IdeaStage` | Current development stage |
| `pillarProgress` | Json | Track pillars used for this idea |
| `stepsCompleted` | Int | Number of steps finished |
| `totalSteps` | Int | Total steps required |
| `completionRate` | Float | Percentage complete |
| `startedAt` | DateTime | Start timestamp |
| `completedAt` | DateTime? | Completion timestamp |
| `status` | `IdeaStatus` | Current status |
| `metadata` | Json? | Additional tracking data |

**Unique Constraint:** `[userId, ideaTitle]`

## Enums

### UserType
- `NON_TECHNICAL_FOUNDER`
- `TECHNICAL_FOUNDER`
- `CREATIVE`
- `ENTREPRENEUR`
- `STUDENT`
- `OTHER`

### MilestoneType
- `FIRST_LOGIN`
- `ONBOARDING_COMPLETED`
- `FIRST_IDEA_STARTED`
- `ABOUT_PILLAR_EXPLORED`
- `BUILD_PILLAR_EXPLORED`
- `CONNECT_PILLAR_EXPLORED`
- `ALL_PILLARS_USED`
- `FIRST_IDEA_COMPLETED`
- `COMMUNITY_ENGAGEMENT`
- `RESOURCE_USAGE`
- `RETENTION_7_DAYS`
- `RETENTION_30_DAYS`
- `RETENTION_90_DAYS`

### IdeaStage
- `CONCEPTION`
- `RESEARCH`
- `PLANNING`
- `DEVELOPMENT`
- `TESTING`
- `LAUNCH`
- `COMPLETED`

### IdeaStatus
- `IN_PROGRESS`
- `PAUSED`
- `COMPLETED`
- `ABANDONED`

## API Endpoints

### GET `/api/analytics/user-progress`

Fetches the current user's profile, milestones, idea progression, and recent sessions.

**Response:**
```json
{
  "userProfile": {
    // ... UserProfile fields
    "milestones": [ ... ],
    "ideaProgression": [ ... ],
    "sessions": [ ... ] // Last 5 sessions
  },
  "progressStats": {
    "aboutPillarUsed": boolean,
    "buildPillarUsed": boolean,
    "connectPillarUsed": boolean,
    "totalIdeas": number,
    "completedIdeas": number,
    "retentionScore": number,
    "milestoneCount": number
  }
}
```

### POST `/api/analytics/user-progress`

Updates usage progress for a specific pillar and checks for new milestones.

**Request Body:**
```json
{
  "pillar": "ABOUT" | "BUILD" | "CONNECT",
  "metadata": object // Optional metadata to store in pillarProgress
}
```

**Response:**
```json
{
  "success": true,
  "userProfile": { ... }
}
```
