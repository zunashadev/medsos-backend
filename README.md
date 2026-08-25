# 🌐 Medsos Backend — Social Media RESTful API

[![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)](https://cloudinary.com/)
[![Scalar](https://img.shields.io/badge/API_Docs-Scalar-059669?style=for-the-badge)](https://medsos-backend-gray.vercel.app/api-docs)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://medsos-backend-gray.vercel.app)

Backend RESTful API untuk platform media sosial modern yang dibangun dengan **Node.js**, **Express.js**, **Prisma ORM**, dan **PostgreSQL**. Dilengkapi sistem autentikasi aman berbasis JWT, validasi skema request menggunakan Zod, manajemen media dengan Cloudinary, serta dokumentasi interaktif menggunakan **OpenAPI 3.0** & **Scalar**.

---

## 🔗 Live Links

- **Production URL:** [https://medsos-backend-gray.vercel.app](https://medsos-backend-gray.vercel.app)
- **Interactive API Documentation (Scalar):** [https://medsos-backend-gray.vercel.app/api-docs](https://medsos-backend-gray.vercel.app/api-docs)

---

## ✨ Fitur Utama

### 🔐 1. Autentikasi & Otorisasi

- **Register & Login**: Hashing password menggunakan `bcrypt` dan pembuatan token `JWT`.
- **User Verification**: Validasi data input ketat menggunakan `Zod`.
- **Session Profile**: Endpoint `/api/auth/me` untuk mendapatkan data profil pengguna yang sedang login.

### 👤 2. Manajemen Pengguna (User)

- **Pencarian Pengguna**: Fitur search user berdasarkan username (case-insensitive & partial match).
- **Profil Pengguna**: Lihat detail akun, daftar postingan, dan daftar bookmark berdasarkan username.
- **Update Profil**: Perbarui data nama lengkap, username, dan biodata.
- **Foto Profil**: Upload dan ganti foto profil langsung terintegrasi dengan Cloudinary (otomatis menghapus foto lama).

### 📸 3. Postingan (Feed)

- **Buat Postingan**: Upload gambar dengan rasio 4:5 otomatis di Cloudinary dan caption.
- **Timeline / Feed**: Menampilkan postingan pengguna dan akun yang di-follow secara paginasi (page & limit).
- **Detail Post**: Melihat detail postingan lengkap beserta komentar-komentarnya.
- **Hapus Post**: Hanya pemilik postingan yang dapat menghapus (aset gambar di Cloudinary otomatis terhapus).

### 🤝 4. Interaksi Sosial

- **Follow System**: Follow / Unfollow pengguna lain, cek status follow, dan rekomendasi akun untuk di-follow (Suggestions).
- **Like System**: Toggle like/unlike pada postingan dan cek status like.
- **Bookmark System**: Simpan postingan ke bookmark / batalkan simpan, serta cek status bookmark.
- **Komentar**: Tambahkan komentar pada postingan dan hapus komentar (hanya pemilik komentar).

---

## 🛠️ Tech Stack

| Kategori                | Teknologi                                                    |
| ----------------------- | ------------------------------------------------------------ |
| **Runtime & Framework** | Node.js (ES Module), Express.js                              |
| **Database & ORM**      | PostgreSQL, Prisma ORM                                       |
| **Authentication**      | JSON Web Token (JWT), Bcrypt                                 |
| **Validation**          | Zod                                                          |
| **Media Storage**       | Multer (Memory Storage), Cloudinary SDK                      |
| **API Documentation**   | OpenAPI Specification 3.0.3, `@scalar/express-api-reference` |
| **Deployment**          | Vercel                                                       |

---

## 📋 Daftar Endpoint API

Semua endpoint dilindungi oleh middleware autentikasi Bearer Token (JWT), kecuali endpoint registrasi, login, search user, dan get user by username.

| Modul        | Method   | Endpoint                         | Deskripsi                          | Auth |
| ------------ | -------- | -------------------------------- | ---------------------------------- | :--: |
| **Auth**     | `POST`   | `/api/auth/register`             | Mendaftarkan user baru             |  ❌  |
|              | `POST`   | `/api/auth/login`                | Login & mendapatkan JWT token      |  ❌  |
|              | `GET`    | `/api/auth/me`                   | Mendapatkan data user yang login   |  ✅  |
| **User**     | `GET`    | `/api/user/search?username=`     | Mencari user berdasarkan username  |  ❌  |
|              | `GET`    | `/api/user/:username`            | Mendapatkan detail profil user     |  ❌  |
|              | `PUT`    | `/api/user/update-user`          | Update bio, fullname, username     |  ✅  |
|              | `PUT`    | `/api/user/update-photo-profile` | Upload & ganti foto profil         |  ✅  |
| **Feed**     | `GET`    | `/api/feed?page=1&limit=3`       | Menampilkan postingan timeline     |  ✅  |
|              | `POST`   | `/api/feed`                      | Membuat postingan baru (multipart) |  ✅  |
|              | `GET`    | `/api/feed/:id`                  | Detail postingan & komentar        |  ✅  |
|              | `DELETE` | `/api/feed/:id`                  | Menghapus postingan                |  ✅  |
| **Follow**   | `GET`    | `/api/follow/suggestions`        | Rekomendasi akun untuk di-follow   |  ✅  |
|              | `POST`   | `/api/follow/:userId`            | Follow user                        |  ✅  |
|              | `DELETE` | `/api/follow/:userId`            | Unfollow user                      |  ✅  |
|              | `GET`    | `/api/follow/:userId`            | Cek status follow ke target user   |  ✅  |
| **Like**     | `POST`   | `/api/like/:postId`              | Toggle Like / Unlike postingan     |  ✅  |
|              | `GET`    | `/api/like/:postId`              | Cek apakah post sudah di-like      |  ✅  |
| **Bookmark** | `POST`   | `/api/bookmark/:postId`          | Toggle Bookmark postingan          |  ✅  |
|              | `GET`    | `/api/bookmark/:postId`          | Cek apakah post sudah di-bookmark  |  ✅  |
| **Comment**  | `POST`   | `/api/comment`                   | Menambahkan komentar ke postingan  |  ✅  |
|              | `DELETE` | `/api/comment/:id`               | Menghapus komentar                 |  ✅  |

---

## 🚀 Panduan Menjalankan di Lokal

### 1. Clone Repository

```bash
git clone https://github.com/zunashadev/medsos-backend.git
cd medsos-backend
```

### 2. Install Dependensi

```bash
npm install
```

### 3. Konfigurasi Environment Variables

Buat file `.env` di direktori root project, lalu lengkapi variabel berikut:

```env
# Database Config (PostgreSQL / Neon / Supabase)
DATABASE_URL="postgresql://username:password@localhost:5432/medsos_db?schema=public"

# JWT Secret Key
JWT_SECRET="your_jwt_secret_key_here"

# Cloudinary Config
CLOUD_NAME="your_cloud_name"
CLOUD_KEY="your_api_key"
CLOUD_SECRET="your_api_secret"
```

### 4. Sinkronisasi Database (Prisma)

Generate Prisma Client dan sinkronkan skema ke database Anda:

```bash
npx prisma generate
npx prisma db push
```

### 5. Jalankan Aplikasi

- **Mode Development (dengan reload otomatis):**
  ```bash
  npm run dev
  ```
- **Mode Build (Prisma Generate):**
  ```bash
  npm run build
  ```
- **Mode Production:**
  ```bash
  npm start
  ```

Server akan aktif di `http://localhost:3000` dan dokumentasi API dapat diakses di `http://localhost:3000/api-docs`.

---

## 📄 Lisensi

Project ini dibuat untuk keperluan pembelajaran dan pengembangan aplikasi. Bebas digunakan dan dikembangkan lebih lanjut.
