**EngineerBeingWeb** is a next-generation web platform crafted for modern Learning and educational experiences.  
It integrates **secure content distribution**, **premium design**, **payment systems**, and **AI-driven assistance**, creating a professional ecosystem for digital learning and website solutions.

---

## Overview

EngineerBeingWeb delivers a **premium website experience** that seamlessly blends:

- **Content Security**  
- **Automated Payments**  
- **AI-Powered Assistance and learning in Real-Time**

Ideal for **educational institutions**, **startups**, and **engineering communities**.

With **secure memberships**, **UPI-based payments**, and **real-time chatbot support for respective Subject**, the platform ensures a **personalized, protected, and powerful** digital learning environment.

---

## Core Features

### Security & Protection
- **PDF Content Protection**  
  Prevents unauthorized downloads, copying, printing, or sharing using client-side rendering and encryption.
- **JWT Authentication**  
  Secure token-based login and session management.
- **Database Security**  
  Encrypted storage for user data, payment records, and sensitive information.
- **Payment Signature Verification**  
  Ensures transaction authenticity via Razorpay webhook validation.

---

### Payment & Membership System
- **Razorpay Integration**  
  Production-ready gateway supporting **UPI, Cards, Net Banking, Wallets**.
- **Dynamic Pricing Plans**  
  Supports **₹0 (Free)** to **₹99+** or custom subscription tiers.
- **Smart Access Control**  
  Users access **only subscribed notes, lectures, or projects, and Chatbot**.
- **Auto-Verification System**  
  Instant membership activation post successful payment.

---

### AI-Powered Learning & Chatbot *(In Development)*
- **Subject-Aware AI Assistant**  
  Trained on specific course materials and topics.
- **Context-Aware Conversations**  
  Retains chat history across sessions for continuity.
- **Membership-Gated AI**  
  Chatbot activates **only for purchased subjects**.
- **Exam & Lecture Support**  
  Explains concepts, suggests study paths, solves doubts in real time.

---

### User Interface & Experience
- **Dark / Light Mode Toggle**  
  Smooth theme switching with persistent user preference.
- **Fully Responsive Design**  
  Optimized for **desktop, tablet, and mobile**.
- **Premium Learning Theme**  
  Clean, professional, and modern UI tailored for Learners.
- **YouTube Integration**  
  Embedded video lectures and tutorials inside the dashboard.
- **Interactive User Dashboard**  
  Shows notes, memberships, progress, and AI recommendations.

---

## Tech Stack

### Frontend
| Technology         | Purpose |
|--------------------|--------|
| **React.js 18**    | Component-based UI with Hooks |
| **Vite**           | Lightning-fast build tool & dev server |
| **Tailwind CSS**   | Utility-first styling for rapid, responsive design |
| **Axios**          | API communication layer |
| **React Router v6**| Client-side routing & navigation |

### Backend
| Technology             | Purpose |
|------------------------|--------|
| **Python FastAPI**       | Lightweight RESTful API framework |
| **SQLite3**            | Local development database (scalable to PostgreSQL/MySQL in production) |
| **JWT (PyJWT)**        | Secure authentication & authorization |
| **PyMuPDF (fitz)**     | PDF rendering, watermarking, and protection |
| **Razorpay Python SDK**| Payment gateway integration |

---

## Quick Start Guide

### Prerequisites
- React
- Python 
- Database
- Git

---

### Backend Setup

cd backend
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
python app.py

Backend runs on http://localhost:5000


# EngineerBeingWeb

A secure, intelligent platform for universities to host digital content, students to access personalized AI tutors, and businesses to launch subscription-based web services.

---

## Frontend Setup

```bash
cd frontend
npm install
npm run dev

Frontend runs on http://localhost:5173

```
## Frontend Setup

```bash

backend/.env
envSECRET_KEY=your_super_secret_jwt_key_here
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret_key
DATABASE_URL=sqlite:///database/db.sqlite3
frontend/.env
envVITE_API_BASE_URL=http://localhost:5000
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
VITE_APP_NAME=EngineerBeingWeb
VITE_THEME_PRIMARY=#1e40af




Project Structure
textEngineerBeingWeb/
│
├── backend/
│   ├── app.py
│   ├── database/
│   │   └── models.py
│   ├── routes/
│   │   ├── auth.py
│   │   ├── payment.py
│   │   └── content.py
│   ├── utils/
│   │   ├── pdf_protect.py
│   │   └── razorpay_verify.py
│   ├── static/
│   │   └── uploads/
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── PDFViewer.jsx
│   │   │   ├── ChatbotWidget.jsx
│   │   │   └── ThemeToggle.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   ├── PaymentPage.jsx
│   │   │   └── NotesViewer.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── assets/
│   │   │   └── logo.svg
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── public/
│   │   └── favicon.ico
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── .env.example
│
├── README.md
└── .gitignore
```

# Future Roadmap

| Feature                        | Status       | Priority |
|--------------------------------|--------------|----------|
| AI Chatbot Integration         | In Progress  | High     |
| Dynamic Membership Dashboard   | Planned      | High     |
| Institution Multi-Admin Mode   | Upcoming     | Medium   |
| Learning Analytics & Insights  | Planned      | Medium   |
| Third-Party API Ecosystem      | Planned      | Low      |

---

## Long-Term Vision

To become **the unified intelligent platform** where:

- Universities securely host digital content  
- Students get personalized AI tutors  
- Businesses launch subscription-based web services with **zero friction**

---

## Development Status

| Goal                            | Status       |
|---------------------------------|--------------|
| Secure User Authentication      | Completed    |
| Razorpay Payment Integration    | Completed    |
| PDF Protection System           | Completed    |
| AI-Powered Chatbot              | In Progress  |
| Subject-Based Access Control    | In Progress  |
| Institution Deployment Mode     | Planned      |

---

## Built With Passion By

**EngineerBeingWeb**  
*Building scalable, intelligent, and beautifully designed engineering web solutions.*

- **Website**: [Coming Soon]  
- **Email**: engineerbeing.web@gmail.com  
- **LinkedIn**: EngineerBeingWeb  
- **GitHub**: [github.com/EngineerBeingWeb](https://github.com/engineerbeingweb-maker)

---

> **Made for Learners. Secured for Education. Powered by Intelligence.**

---

## Credits

**Developed & Designed by:**  
**Yashraj**  
*Founder - Engineer Being*
-**https://www.youtube.com/@engineerbeing**

---

## Intellectual Property Notice

© 2025 Yashraj. All rights reserved.

This project, its architecture, features, and implementation are the original work of **Yashraj** and are protected under intellectual property laws.

**Unauthorized copying, reproduction, distribution, or derivation of this project is strictly prohibited.**

The core idea, system design, and unique integration of AI-powered education delivery with secure content protection and institutional deployment are **patent-pending**.

For licensing, collaboration, or institutional deployment inquiries, contact:  
- **engineerbeing.web@gmail.com**
- **yashraj25118110@gmail.com**
