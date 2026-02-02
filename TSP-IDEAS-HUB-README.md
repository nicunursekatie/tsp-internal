# TSP Ideas Hub - Setup & Deployment Guide

## What's Included

You have two files:

1. **`tsp-ideas-hub.html`** - Standalone demo (works right now!)
2. **`tsp-ideas-app.jsx`** - React component for production deployment

---

## Quick Start (Demo Mode)

**Just double-click `tsp-ideas-hub.html`** to open it in your browser.

This version works immediately with:
- Full workflow (submit → feedback → second → decide → execute → complete)
- Individual user accounts (stored locally in your browser)
- Comments, seconding, appeals, check-ins
- All data saves to your browser's localStorage

**Limitations of demo mode:**
- Data only exists on one computer/browser
- Team members can't see each other's changes in real-time
- No password recovery or proper security

---

## Production Deployment (Recommended)

For a real team app with shared data, deploy to **Vercel + Supabase**.

### Step 1: Set Up Supabase (Free Database)

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project (name it "tsp-ideas" or similar)
3. Go to **SQL Editor** and run this schema:

```sql
-- Users table (Supabase Auth handles this automatically)

-- Ideas table
CREATE TABLE ideas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  why_it_matters TEXT NOT NULL,
  who_needed TEXT,
  resources TEXT,
  timeline TEXT,
  risks TEXT,
  mission_alignment TEXT,
  submitter_id UUID REFERENCES auth.users(id),
  submitter_name TEXT NOT NULL,
  status TEXT DEFAULT 'submitted',
  feedback_deadline TIMESTAMPTZ,
  seconds JSONB DEFAULT '[]',
  comments JSONB DEFAULT '[]',
  decision JSONB,
  owner JSONB,
  check_ins JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Appeals table
CREATE TABLE appeals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  idea_id UUID REFERENCES ideas(id),
  submitter_id UUID REFERENCES auth.users(id),
  submitter_name TEXT NOT NULL,
  reason TEXT NOT NULL,
  preferred_outcome TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  votes JSONB DEFAULT '[]',
  review_deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'team_member',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE appeals ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies (all authenticated users can read/write)
CREATE POLICY "Anyone can view ideas" ON ideas FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert" ON ideas FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update" ON ideas FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Anyone can view appeals" ON appeals FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert" ON appeals FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update" ON appeals FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Anyone can view profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
```

4. Go to **Settings → API** and copy your:
   - Project URL
   - Anon/Public key

### Step 2: Create Next.js Project

```bash
npx create-next-app@latest tsp-ideas-hub
cd tsp-ideas-hub
npm install @supabase/supabase-js @supabase/auth-helpers-react
```

### Step 3: Add Environment Variables

Create `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Step 4: Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Add your environment variables in Vercel dashboard under **Settings → Environment Variables**.

---

## Features Implemented

### ✅ Full TSP Workflow
| Stage | Description |
|-------|-------------|
| **Submitted** | Idea awaiting team feedback |
| **Feedback Period** | 5-day window for comments |
| **Seconded** | 2+ team members support it |
| **In Review** | Being discussed at review meeting |
| **Decided** | ED/core team made a decision |
| **In Progress** | Being implemented |
| **Completed** | Successfully done! |
| **Declined** | Not moving forward |

### ✅ Idea Submission Form
All fields from your framework:
- Title, Description, Why It Matters (required)
- Who's Needed, Resources, Timeline, Risks (optional)
- Mission Alignment

### ✅ Seconding System
- Any team member can "second" an idea
- 2 seconds automatically advances to review
- Can't second your own idea

### ✅ Comments & Feedback
- Anyone can comment
- 5-day feedback deadline shown

### ✅ Decision Making
- Core team/ED can approve, decline, defer, or request revision
- **Required written rationale** (transparency!)
- Must cite mission, budget, or legal concerns for declines

### ✅ Appeal Process
- 5-day appeal window after decisions
- Team votes on appeals
- Simple majority wins
- Upheld appeals reverse the decision

### ✅ Execution Tracking
- Assign owner to approved ideas
- Progress check-ins with percentage slider
- Mark complete when done

### ✅ User Roles
- **Team Member**: Submit, comment, second
- **Core Team**: All above + make decisions, vote on appeals
- **Executive Director**: All above + final say on major decisions

---

## Customization Ideas

**Want to add:**
- Email notifications when ideas get seconded/decided?
- Slack integration for new submissions?
- Calendar invites for review meetings?

I can help build any of these. Just let me know!

---

## Need Help?

If you run into issues with deployment or want to customize the app, I'm here to help. The demo version (`tsp-ideas-hub.html`) works immediately for testing the workflow with your team.
