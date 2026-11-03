---
slug: how-unparty-measures-time
title: "SPRINT. How We Define It"
subtitle: "Commits over estimation. Always."
description: "How the unparty sprint system works — calendar-based weeks measured in real commits, not story points"
author: "jmm"
date: "2026-05-18"
category: "DEPEND"
published: true
---

# SPRINT. HOW WE DEFINE IT

A sprint is a 1-week work period. Monday through Friday. Five days. That is it. No planning poker. No capacity buffers. No story points. Every sprint has a number. The system has been running since January 2021.

## What Makes This Different

| Aspect | Traditional Agile | Unparty System |
|---|---|---|
| Duration | 1–4 weeks (flexible) | Exactly 5 working days |
| Velocity unit | Story points (estimated) | Commits (actual) |
| Planning | Capacity-based | Calendar-based |
| Tracking | Manual status updates | GitHub automation |
| Measurement | Points burned | Commits shipped |
| Reliability | Depends on estimation accuracy | Always accurate |

The core idea: estimation introduces noise. Commits are facts. Velocity measured in real commits cannot be inflated by optimistic pointing or deflated by conservative padding.

## The Sprint Calendar

Sprints are pre-numbered and pre-dated. S1 started January 4, 2021. Every Monday a new sprint begins. Every Friday it ends.

| Field | Value |
|---|---|
| Sprint S1 | 2021-01-04 → 2021-01-08 |
| Sprint numbering | Sequential, S1 onwards |
| Days per sprint | 5 (Mon–Fri only) |
| Calendar coverage | 2021–2026+ |
| Total sprints tracked | 261+ |

The current sprint number is always derivable from today's date. No guessing, no sprint planning meetings to determine where you are.

## How Velocity Is Measured

Sprint velocity is computed from real commit counts across three time windows. Each window maps to a different planning horizon.

| Metric | Window | Formula | Use |
|---|---|---|---|
| Daily velocity | 5 days | commits ÷ 5 | Current sprint pace |
| Weekly velocity | 7 days | commit count | Week-over-week comparison |
| Monthly velocity | 30 days | commits ÷ 4.3 | Trend analysis |

A repo with 30 commits in the last 7 days has a weekly velocity of 30. That number is a fact — it came from git history, not a planning session.

## Issue Labeling

Every GitHub issue is automatically classified and tagged with its sprint number when the `sprint` label is applied. The format is standardized.

### Standard Title Format

`` `type/S249` `filename.py` ``

This encodes three things: what kind of work it is, which sprint it belongs to, and which file it touches — all in the issue title.

### Issue Types

| Type | Meaning | Example |
|---|---|---|
| feat | Single-file code feature | `feat/S249` `dashboard.py` |
| bug | Unexpected behavior fix | `bug/S261` `calendar.py` |
| fail | Failing system | `fail/S255` `api-route.ts` |
| tool | Shell scripts (.sh) | `tool/S261` `backup.sh` |
| app | Top-level directory app | `app/S249` `theunpartyapp` |
| task | Generic work item | `task/S250` `ISSUE_TYPES.csv` |

### How Automation Works

1. Developer opens a GitHub issue
2. Adds the `sprint` label
3. GitHub Actions detects the label
4. Script reads `SPRINT_NUMBER_CALENDAR.csv` to find current sprint
5. Issue title is reformatted to standard format
6. Issue is tagged with sprint number, type, and file

The developer writes. The system does the bookkeeping.

## Work Phases

Each sprint's work is categorized into five phases. These phases shape how issues are routed and how sprint health is reported.

| Phase | Focus | Examples |
|---|---|---|
| PRODUCT | User-facing features | New screens, flows, UI components |
| RISK | Mitigation and fixes | Bug fixes, security patches, critical repairs |
| CORE | Infrastructure | Database schema, APIs, build tooling |
| GROW | Scale and reach | Analytics, onboarding, distribution |
| BUDGET | Financial and cost | Billing logic, cost tracking, audit |

A healthy sprint typically has activity across multiple phases. A sprint entirely in RISK phase signals a problem. A sprint entirely in PRODUCT phase signals greenfield momentum.

## Reading the Velocity Table

When you see the Sprint Velocity table in the repo report, here is how to read it:

| Column | Meaning |
|---|---|
| Weekly Velocity | Commits pushed in the last 7 days |
| 7-Day Commits | Raw commit count for that window |
| Weighted Score | Recency-weighted activity (recent days count more) |

A weighted score of 250 means a repo had very high activity concentrated in the most recent days — the recency multiplier amplifies current momentum. A score of 20 might mean activity happened but tapered off.

## Current System Status

The sprint calendar was generated through S261 (ending 2026-01-02). Sprint detection for dates after that requires extending the calendar by running the calendar generator in theunpartyrunway. This is a known operational item.

The velocity metrics in the report are always current — they pull from live git history on every run, regardless of whether the sprint calendar is up to date.

---

# Week of June 8th (check sprint calendar from theunpartyrunway/theunpartycrawler)

Starting balance Calude API: $91.60

═══ TOP 5 unppps. ═══

- theunpartyapp; 100
- theunpartyrunway; 69
- theunpartydocs; 54
- theunpartyunppp; 48
- theunpartyapi; 45

## GOAL.

Have 5 unppps with an activity score of greater than 60 by June 13, 2026. 

---
## REALITY 

As of June 15th 

1   theunpartyapp             100      36        381.1   0         1     
2   theunpartyrunway          70       21        271.6   0         1     
3   theunpartydocs            55       6         234.6   0         1     
4   theunpartyunppp           46       4         226.2   11        1     
5   theunpartyapi             44       4         75.3    12        1 

Failed goal of having 5 unppps with an activity score of greater than 60 by June 13, 2026. 

## WHY?

I think missing the SPRINT goal is pretty reflective of some of the most consistent problems with unparty-app, the scale is massive. It is a challenge to spread focus across all unppps any given week, unless their is a targeted, step by step plan. 

## was it SMART? (specific, measurable, achievable, relevant, and time-bound )
The goal last week was not truly actionable. It was specific, measurable, achievable, and time-bound, but I would pushback on the relevance.

I think at the core of unparty-app is effort. It is clear the project is growing into something special, but it is missing an audience. Building the project was so personal that it makes sense to me that the concepts that got developed first were products for internal use. 

On a reflective note, this focus on internal use seems to be a pattern for me. When I started this project, it felt like whatever part of the process I shared I got what I percieved to be, negative feedback when sharing with family and friends.

Instead of someone viewing the project and identifying aspects of what might have been cool or curioisty in how it worked, someone would always point out something that did not work. Like a button that was disabled, or some positioning in the interface that was off. 

This made the build process a bit defensive for me. I focused on building infrastructure that had validation systems that relied on effort and progress, rather than external validation, such as social shares, analytics, and views. 

By creating a baseline of effort and cost, I can measure controllable health. Meaning if I did not have any commits on a certain day or if I am not fully utilizing premium dependencies that can surface issues in prioritization, enthusiasm, focus, etc. 

## how can I increase activity score for unppps? 

I think one area that is probably my strongest are the workflows that I created. Most unppps use workflows to automate part of the development process. It has been a while since i have auditted the workflows and I suspect some are failing and or being underutilized. 

## theunpartyrunway has a workflow.sh 

Currently, workflow.sh only audits theunpartyrunway's workflow's. If I can extend the bash script to check all unppps workflows, I can surface which are failing, their core intent, and improve. This will assist in further automating the development process so that I can focus on monetization for unparty-app. 

## THINK. 

Currenty workflow infrastructure 

| unppp | feat |
| :---: | :---:|
|theunpartyrunway| workflow.sh|
|theunpartyapp| UnpppWorkflowDisplay.tsx| 

There are hardcoded workflow definitions in each unppp page

For example 
- theunpartyapp-workflows.json
- theunpartyunppp-workflows.json 

Possible to have workflow.sh manage these .json's? 
---
Activity Score — How It Works
  
  Calculation location: repo/repo-metadata-analyzer line 469

  Formula (Bash arithmetic):
  activity_score =
    stars                     (weight: 1 per star)
    + forks × 2               (weight: 2 per fork)
    + 1 if issues > 0         (binary: just 1 point regardless of 1 or 100 issues)
    + 1 if has_projects
    + 2 if has_pages
    + 3 if has_wiki
    + 4 if has_discussions     (highest single weight)
    + releases_count           (1 per release, capped at 30 by API pagination)
    + has_readme               (1 or 0)

---

# THINK. 

Yes, I think a days_since_push directly into activity_score should be weighted higher than stars by giving 3 points if active past day, 2 points if active last 5 days, 1 if active last 7 days, 0 if active 
  last 30 days, -1 if active last 60 days, -2 if active last 90 days 

--- 

We want to weigh down inactive unppps. 

I have noticed that there is a natural redundancy in some of the unppps repositories. 

--- 

To start a sprint in unparty-app you need: 

- unppp repo
- member of unparty-app org on GitHub

---

# STEPS 

- START. `run-repo-analysis` in theunpartyrunway 
- CHECK. `scripts/sprint-effort-analysis.js` in theunpartyapp 
- REFRESH. `classification_analysis.py` in theunpartybuilder 


---

The parent script is ~/theunpartybuilder/scripts/classification_analysis.py — it writes directly to public/data/unppp-scores.json and .csv in this repo.

Here's the key info for running an update:

Script location: ~/theunpartybuilder/scripts/classification_analysis.py

Output paths (hardcoded in the script):
- public/data/unppp-scores.json
- public/data/unppp-scores.csv
- src/app/theunpartybuilder/classification-analysis.md                                                                
What it does: Pulls all unppp repo metadata, runs the classification rules + commit-feature analysis (via Pinecone for similarity scores), and writes the four-scor

To run the refresh, you'd cd ~/theunpartybuiclassification_analysis.py. It usesbackend.config, backend.commit_features, and backend.pinecone_service — so you'll need the .env loaded in that repo
for the Pinecone key and GitHub token.

`~/theunpartybuilder/.venv/bin/python3 scripts/classification_analysis.py`


---
cd ~/theunpartybuilder
source .venv/bin/activate
python -m scripts.refresh_commits --dry-run

Then smoke test one repo, then run the full refresh:

python -m scripts.refresh_commits --repo unparty-app/theunpartyrunway
python -m scripts.refresh_commits

Once complete, re-run classification_analysis.py to regenerate unppp-scores.json with the updated similarity scores:

python -m scripts.classification_analysis
---

 unppp-scores.json: Before/After Analysis (Apr 29 → Jun 8, 2026)

 What changed and what it means

 TL;DR

 40 days of new commits refreshed Pinecone vectors. Similarity scores corrected significantly for actively-developed repos. Standards scores improved for the most active repos. Confidence dropped overall — a sign the classifier is being more conservative, not less accurate.

 ---
 Similarity Score — the most changed metric

 Similarity measures how much a repo's commit style resembles the canonical pattern for its classified type. Fresh vectors = more accurate signal.

 Big movers up (repos that have been actively committed to and now score higher against their type):

 ┌─────────────────┬───────┬───────┬────────┐
 │      Repo       │  Old  │  New  │   Δ    │
 ├─────────────────┼───────┼───────┼────────┤
 │ theunpartydocs  │ 0.205 │ 0.662 │ +0.457 │                    ├─────────────────┼───────┼───────┼────────┤
 │ theunpartyapp   │ 0.457 │ 0.740 │ +0.283 │                           ├─────────────────┼───────┼───────┼────────┤
 │ theunpartybot   │ 0.808 │ 1.000 │ +0.192 │                               ├─────────────────┼───────┼───────┼────────┤
 │ theunpartyteam  │ 0.767 │ 0.872 │ +0.105 │
 ├─────────────────┼───────┼───────┼────────┤
 │ theunpartyspace │ 0.826 │ 0.918 │ +0.092 │
 └─────────────────┴───────┴───────┴────────┘                             ↓

 Big movers down (repos whose commit style has drifted away from their old↓type label):
                                                                          ↓
   ┌─────────────────────┬───────┬───────┬────────┐
   │        Repo         │  Old  │  New  │   Δ    │                         ↓
   ├─────────────────────┼───────┼───────┼────────┤
   │ theunpartysearch    │ 1.000 │ 0.326 │ -0.674 │                         ↓
 ├─────────────────────┼───────┼───────┼────────┤
 │ theunpartysomewhere │ 0.811 │ 0.326 │ -0.485 │                         ↓
 ├─────────────────────┼───────┼───────┼────────┤
 │ theunpartycore      │ 1.000 │ 0.606 │ -0.394 │                         ↓
   ├─────────────────────┼───────┼───────┼────────┤
   │ theunpartysnake     │ 0.748 │ 0.439 │ -0.309 │                         ↓
   ├─────────────────────┼───────┼───────┼────────┤
   │ theunpartybuilder   │ 0.808 │ 0.603 │ -0.205 │                         ↓
   └─────────────────────┴───────┴───────┴────────┘
                                                                            ↓
   The two repos that dropped from 1.0 (theunpartysearch, theunpartycore) likely had very few commits in Pinecone before — a small cluster is easy ↓o nail; with more commits the true variance shows.
                                                                            ↓
   ---
   Standards Score — commit hygiene                                         ↓

   Full-history commit quality (conventional commits, message length, detail↓d ratio). Most repos didn't change because the majority of their commit history predates the refresh window.                                     ↓

   ┌──────────────────┬───────┬───────┬────────┐                            ↓
   │       Repo       │  Old  │  New  │   Δ    │
   ├──────────────────┼───────┼───────┼────────┤                            ↓
   │ theunpartyrunway │ 0.850 │ 0.957 │ +0.107 │
   ├──────────────────┼───────┼───────┼────────┤                            ↓
 │ runway           │ 0.850 │ 0.957 │ +0.107 │
 ├──────────────────┼───────┼───────┼────────┤                            ↓
   │ theunpartyapp    │ 0.201 │ 0.354 │ +0.153 │
   └──────────────────┴───────┴───────┴────────┘                            ↓

   These three had active, high-quality commit runs in the 40-day window.   ↓theunpartyapp's jump from 0.20 → 0.35 is meaningful — it was being treated as a low-hygiene repo before.                                            ↓

   ---                                                                      ↓
 Type Classification Changes (3 repos flipped)
                                                                          ↓
   ┌─────────────────────┬───────────┬─────────┬───────────────────────────┐
   │        Repo         │ Old Type  │  New    │            Why            │↓
   │                     │           │  Type   │                           │
   ├─────────────────────┼───────────┼─────────┼───────────────────────────┤↓
   │                     │           │         │ New commit patterns       │
   │ theunpartyapp       │ framework │ agent   │ (workflow/automation      │↓
   │                     │           │         │ language) now dominate    │
   ├─────────────────────┼───────────┼─────────┼───────────────────────────┤↓
   │                     │           │         │ Commit content shifted    │
   │ theunpartybuilder   │ bot       │ agent   │ away from bot-style       │↓
   │                     │           │         │ toward agent/automation   │
   ├─────────────────────┼───────────┼─────────┼───────────────────────────┤↓
 │                     │           │         │ Similarity drop (-0.485)  │
 │ theunpartysomewhere │ framework │ service │ pulled it out of the      │↓
   │                     │           │         │ framework cluster         │
   └─────────────────────┴───────────┴─────────┴───────────────────────────┘↓

   ---                                                                      ↓
   Confidence — overall dropped slightly (-0.038 avg)
                                                                            ↓
   Three repos dropped hard:
   - theunpartysomewhere: 0.623 → 0.368 (-0.255)                            ↓
   - theunpartybuilder: 0.400 → 0.233 (-0.167)
   - theunpartyapi: 0.370 → 0.190 (-0.180)                                  ↓

   This is not a problem — it means the classifier is more honest. These rep↓s have ambiguous commit patterns and the fresh vectors expose that ambiguity rather than hiding it with a stale, high-confidence reading.             ↓

   ---                                                                      ↓
 What the data is communicating overall
                                                                          ↓
   1. The 40-day gap mattered most for active repos. Repos with zero new commits (most of the framework/library cluster) show flat similarity scor↓s — their vectors were already accurate.
 2. theunpartysearch and theunpartycore are misclassified or genuinely    ↓ambiguous. Dropping from 1.0 to 0.33 and 0.61 respectively means their commit style doesn't strongly match the type they're labeled as. Worth a ↓manual look.
 3. theunpartyrunway is the healthiest repo by every metric — standards   ↓0.957, similarity 1.0, monthly_standards still active. It's the reference-class repo.                                                    ↓
   4. theunpartyapp is improving fast. Standards jumped +0.153 and similarity +0.283 — this repo is actively getting better commit hygiene.            ↓
 5. Average similarity nudged up (+0.016), average standards up (+0.018) — the portfolio is marginally healthier overall.
 ---

CONSIDER YOUR MAIN PRIORITY. 

In the case of unparty-app, theunpartyunppp is a premium priority. 

DEPEND. 
- GitHub 
- Apple Developer 

The development of theunpartyunppp has declined in effort. Getting theunpartyapp to a place where it tells the story of unparty-app became the highest priority. However, it is important that theunpartyunppp gets completed. In order to do so, I needed to automate some of the development process. 

[SEE: todo.sh by theunpartyunppp]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TODOs found:     77
Skipped:         55 (already tracked)
Created:         22