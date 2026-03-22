

# SkillMatch - Career Readiness Platform

## Overview
A full-stack web app where users sign up, take skill tests, upload resumes/projects, compare themselves against company requirements, and get AI-powered study recommendations.

## Backend Setup (Lovable Cloud + Supabase)
- Enable Lovable Cloud for database, auth, storage, and edge functions
- Connect Twilio for OTP verification during signup

## Pages & Features

### 1. Signup Page
- Form with: Name, Mobile Number, Password, Confirm Password
- "Continue with Email" toggle to switch between phone/email signup
- On submit → send OTP to mobile via Twilio edge function
- OTP verification screen with 6-digit input
- On success → redirect to Login page

### 2. Login Page
- Name/email + password login
- On success → redirect to Home

### 3. Home Page
- Top navigation bar with 5 sections (Take Test, Resume, Projects, Companies, Dashboard)
- Hero section with AI-powered daily/weekly/monthly study plan recommendations
- Personalized suggestions based on test scores and skill gaps

### 4. Take Test (Nav Item 1)
- 5 test categories: Programming, Aptitude, Database, Web Development, Logical Thinking
- Each test: 50 marks, questions stored in database (admin-managed question bank)
- Timer, progress bar, auto-submit
- Results page with score breakdown
- Retake anytime to update skill level

### 5. Upload/Update Resume (Nav Item 2)
- Upload resume (PDF, DOCX, images)
- Preview uploaded resume
- Replace/update functionality
- Store in Supabase Storage

### 6. Upload Projects (Nav Item 3)
- Add multiple projects with: title, description, tech stack, links, files (PDF, DOCX, images)
- Edit/delete projects
- Store files in Supabase Storage

### 7. Company Requirements (Nav Item 4)
- Admin panel to manage 10 companies, each with 15 roles
- Each role has: required skills, experience level, qualifications
- Users can browse and filter companies/roles
- Search functionality

### 8. Dashboard & Analysis (Nav Item 5)
- Select a company (e.g., Google) to compare against
- Colorful charts (pie, bar, radar) showing:
  - Skill test scores vs company requirements (% match)
  - Resume strength analysis
  - Project portfolio coverage
- Overall readiness percentage per role
- Gap analysis highlighting areas to improve

### 9. AI Study Recommendations (Home Page)
- Edge function using Lovable AI to generate personalized study plans
- Daily, weekly, and monthly breakdown
- Based on test scores, target company requirements, and skill gaps

## Database Tables
- `profiles` (user info)
- `user_roles` (admin/user)
- `skill_tests` (test attempts & scores)
- `questions` (question bank per category)
- `resumes` (resume metadata)
- `projects` (user projects)
- `companies` (company info)
- `company_roles` (roles per company with requirements)

## Tech Highlights
- Twilio connector for SMS OTP
- Lovable AI for study plan generation
- Recharts for colorful dashboard charts
- Supabase Storage for file uploads
- RLS policies for data security

