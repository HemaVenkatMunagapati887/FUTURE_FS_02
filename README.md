# Mini CRM Application

A lightweight CRM built with a React + Vite frontend and a Node.js + Express + MongoDB backend. This project supports role-based lead management, follow-up scheduling, communication logging, and mobile-friendly lead detail workflows.

## 🚀 Project Overview

This CRM is designed for modern sales workflows:
- role-based access for `Admin`, `Manager`, and `Employee`
- secure lead details and ownership control
- follow-up scheduling and task completion
- communication logging for calls, emails, and meetings
- mobile-responsive user interface

## ✨ Key Features

- Lead pipeline with status and priority tracking
- Lead detail page with editable general details
- Follow-Ups tab to schedule and complete tasks
- Communication Log tab for call/email summaries
- Role-based lead access and authorization
- Mobile-friendly layout for on-the-go work
- Seed and migration support for updating demo employees

## 🧩 Tech Stack

- Frontend: `React`, `Vite`, `Tailwind CSS`
- Backend: `Node.js`, `Express`, `Mongoose`
- Database: `MongoDB`
- Authentication: JWT-based role protection

## 📁 Repository Structure

```text
backend/
  controllers/
  middlewares/
  models/
  routes/
  utils/
frontend/
  src/
    pages/
    components/
    context/
    services/
```

## ⚙️ Setup Instructions

### 1. Backend

```bash
cd backend
npm install
```

Copy `backend/.env.example` to `backend/.env` and update the MongoDB URI with your Atlas connection string:

```env
MONGODB_URI=mongodb+srv://<db_username>:<db_password>@cluster0.klpmixl.mongodb.net/<dbname>?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

Then start the backend server:

```bash
npm run dev
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open the supplied Vite URL in your browser.

## ✅ How to Use

### Login

Use seeded employee demo accounts or your own created users.

### Lead Workflow

1. Open a lead from the pipeline.
2. Use `General Details` to update information and notes.
3. Set lead status to `Follow-up`, `Converted`, or `Rejected`.
4. Use `Follow-Ups` to complete scheduled tasks or plan the next follow-up.
5. Use `Communication Log` to record call or email summaries.

## 📱 Mobile Support

The UI is responsive and adapts for mobile screens, with stacked actions, scrollable tab controls, and better spacing for phone use.

## 🛠️ Recent Updates

- updated seeded employees to `Venkat` and `Vicky`
- fixed employee lead access via follow-up assignment
- improved mobile lead detail layout
- added clear next-step guidance for employees on lead pages

## 💡 Notes

The backend uses role-based access control, so employees can only view leads they are assigned to or linked to through follow-up tasks.

## 📌 Want to Share a Demo?

Use the app to show:
- login as an employee
- open lead details
- complete the follow-up task
- log communication
- update status to `Converted` or `Rejected`

---

Built for internship and portfolio demonstration. Feel free to customize this README further for your GitHub repo presentation.