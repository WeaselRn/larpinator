<img width="1280" height="640" alt="git (1)" src="https://github.com/user-attachments/assets/8920b256-2ba8-4988-b824-5351134eb4bd" />



# Larpinator 🎯


## Basic Details
### Team Name: Tetris


### Team Members
- Team Lead: Ruebin Vargheese Joseph - School of Engineering, CUSAT

### Project Description
Larpinator is an AI-powered bullshit detector for your digital personality. Upload your CV, analyze your GitHub and music taste, battle your friends, take unhinged quizzes, and discover how hard you're actually LARPing.

Every analysis contributes to your overall LARP score, tier, profile, and leaderboard rank.

### The Problem (that doesn't exist)
People are constantly pretending to be more productive, talented, mysterious, technical, or interesting than they actually are.

There was absolutely no way to scientifically measure this extremely serious problem.

Until now.

### The Solution (that nobody asked for)
Larpinator uses AI to analyze your CV, GitHub, music taste, quiz answers, and more — then exposes your buzzwords, cringe, fakeness, delusion, substance, and aura.

It roasts you, gives you a LARP score, assigns you a ridiculous tier, and lets you prove to everyone that you're either a LARP GOD or an NPC.

## Technical Details
### Technologies/Components Used
For Software:
- Languages: TypeScript, JavaScript, Python
- Framework: Next.js
- Authentication: Clerk
- Database: Supabase (PostgreSQL)
- AI: Groq
- PDF Processing: PyMuPDF
- Frontend: React, HTML, CSS
- Tools: Git, GitHub, Docker
- Assets: JPG, WebP, GIF, MP3


### Implementation
For Software:

Larpinator is implemented as a Next.js web application with Clerk authentication, Supabase for persistent data, Groq for AI-powered LARP analysis, and a separate FastAPI/PyMuPDF service for extracting text from uploaded PDF resumes.

The application supports CV, GitHub, Music, Combined, LARP Battle, LARP Quiz, Daily LARP, profile scoring, achievements, leaderboards, and shareable LARP cards. Every completed activity contributes to the user's overall LARP profile.

# Installation
```bash
npm install

cd pdf-service
python -m pip install -r requirements.txt
cd ..
```

Configure the required environment variables using .env.example, including Clerk, Supabase, Groq, GitHub, Last.fm, and the PDF service URL.

# Run
Start the PDF extraction service:
```bash
cd pdf-service
python -m uvicorn main:app --port 8000
```
In a separate terminal, start the Next.js application:
```bash
npm run dev
```
Open:

http://localhost:3000

### Project Documentation
For Software:
    - Architecture: Next.js → Python/PyMuPDF → Groq → Supabase
    - Authentication: Clerk
    - Database: Supabase PostgreSQL
    - AI Analysis: Groq
    - PDF Processing: PyMuPDF
    - Scoring: Centralized LARP scoring and tier system
    - Media: Local meme, GIF, WebP, JPG and MP3 assets
    - Database setup: Run supabase/migrations/001_schema.sql followed by 002_seed.sql in the Supabase SQL Editor.
    - Agent/development notes: See AGENTS.md for project architecture rules, commands, environment requirements, and implementation conventions.


# Screenshots

## Home
![Homepage](readme%20assets/home.png)
*Larpinator landing page: the oversized, chaotic entry point where users choose how they want to get roasted.*

## Analyze — LARP Battle
![LARP Battle](readme%20assets/larp%20battle.png)
*LARP Battle lets two users compare their overall LARP scores and decide who is truly the bigger LARPer.*

## Leaderboard
![Leaderboard](readme%20assets/leaderboard.png)
*The global leaderboard ranks LARPers by score, aura, buzzword density, and other ridiculous metrics.*

## Profile
![Profile](readme%20assets/profile.png)
*User dashboard showing the overall LARP score, tier badge, category breakdowns, analysis history, and recent activity.*

# Diagrams

## System Workflow
![Workflow](readme%20assets/workflow.png)
*High-level architecture: users authenticate with Clerk, submit content through Next.js, the Python PDF service extracts resume text, Groq roasts the evidence, and Supabase stores the profile, scores, and history.*

### Project Demo
https://larpinator-delta.vercel.app/

## Team Contributions
- Ruebin Vargheese Joseph : Professional larper, did the whole proect solo.

---
Made with ❤️ at TinkerHub Useless Projects 

![Static Badge](https://img.shields.io/badge/TinkerHub-24?color=%23000000&link=https%3A%2F%2Fwww.tinkerhub.org%2F)
![Static Badge](https://img.shields.io/badge/UselessProjects--26-26?link=https%3A%2F%2Ftinkerhub.org%2Fevents%2F1M8ORET9A1%2Fuseless-projects-3.0)



