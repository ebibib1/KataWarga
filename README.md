# KataWarga

<div align="center">

Modern Public Complaint & Community Reporting Platform

Built with Next.js • Express.js • MySQL • JWT • Supabase

</div>

---

## English

### Overview

KataWarga is a modern public complaint platform that enables citizens to report issues within their local community, such as damaged roads, waste management, street lighting, public facilities, and other public services.

The platform provides transparent communication between citizens and administrators while allowing report tracking, commenting, and social interactions similar to modern community platforms.

---

## Main Features

### Authentication

- JWT Authentication
- Secure Login & Register
- Role-based Authorization
- User Session

### Report Management

- Create Report
- Edit Report
- Delete Report
- Upload Images
- Categories
- Priority Level
- Report Status Tracking

### Community Features

- Comments
- Likes
- Bookmarks
- User Profile
- Notifications
- Hashtags
- Follow Users

### Administration

- Admin Dashboard
- Report Moderation
- Status Management
- Category Management
- User Management
- Super Admin Panel

---

## Tech Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- NextAuth

### Backend

- Express.js
- MySQL2
- JWT
- Bcrypt
- Multer
- Supabase Storage

### Database

- MySQL

---

## Project Structure

```
KataWarga/
│
├── KataWarga-FE/
│   ├── app/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   ├── services/
│   └── public/
│
├── KataWarga-BE/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   │
│   ├── uploads/
│   └── package.json
│
└── README.md
```

---

## Architecture

```
Client (Next.js)

↓

Express REST API

↓

JWT Authentication

↓

MySQL Database

↓

Supabase Storage (Images)
```

---

## Installation

### Clone Repository

```bash
git clone https://github.com/yourusername/katawarga.git
```

### Frontend

```bash
cd KataWarga-FE
npm install
npm run dev
```

### Backend

```bash
cd KataWarga-BE
npm install
npm run dev
```

---

## Environment Variables

Backend

```
PORT=
DB_HOST=
DB_USER=
DB_PASSWORD=
DB_NAME=

JWT_SECRET=
JWT_EXPIRES_IN=

SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_BUCKET=
```

---

## Roadmap

- Email Verification
- OTP Authentication
- AI Report Classification
- Maps Integration
- Mobile Application
- Push Notification
- Real-time Chat
- Analytics Dashboard

---

## License

This project is developed for educational purposes.

---

# Bahasa Indonesia

## Tentang Proyek

KataWarga merupakan platform pelaporan pengaduan masyarakat berbasis web yang dirancang untuk mempermudah komunikasi antara masyarakat dan pemerintah dalam menyampaikan berbagai permasalahan di lingkungan sekitar.

Mulai dari jalan rusak, sampah, lampu jalan mati, fasilitas umum, hingga pelayanan publik dapat dilaporkan secara mudah melalui satu platform.

Selain sistem pelaporan, KataWarga juga menghadirkan fitur interaksi komunitas seperti komentar, bookmark, likes, hashtag, dan notifikasi sehingga masyarakat dapat ikut memantau perkembangan setiap laporan.

---

## Fitur Utama

- Login & Register
- JWT Authentication
- Manajemen Laporan
- Upload Gambar
- Kategori Laporan
- Tracking Status
- Komentar
- Like
- Bookmark
- Notifikasi
- Dashboard Admin
- Dashboard Super Admin
- Manajemen User
- Manajemen Kategori
- Upload Gambar menggunakan Supabase Storage

---

## Teknologi

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS

### Backend

- Express.js
- MySQL2
- JWT
- Bcrypt
- Multer
- Supabase

### Database

- MySQL

---

## Kontributor

Developed by **Ebii**.

---

Made with ❤️ for better community reporting.
