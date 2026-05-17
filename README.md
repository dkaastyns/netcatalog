# Netcatalog - Product Catalog with Stock Count

Netcatalog adalah aplikasi **Product Catalog with Stock Count** yang dirancang untuk memudahkan publikasi katalog produk dengan pemantauan stok secara real-time. Aplikasi ini memiliki alur satu arah (one-directional flow) untuk mengamankan data dan memberikan pengalaman terbaik:
- **Pengunjung/User:** Dapat menjelajahi katalog produk secara publik, mengecek ketersediaan stok secara akurat, dan menghubungi admin untuk penawaran produk.
- **Admin:** Mengelola data produk, memantau stok inventaris, serta mencatat pesanan manual melalui dasbor yang aman.

## Tech Stack

Proyek ini dibangun dengan teknologi modern:
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS & Heroicons
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Better-Auth
- **Package Manager:** Bun
- **Image Hosting:** Cloudinary

## Prasyarat (Prerequisites)

Pastikan kamu sudah menginstal **[Bun](https://bun.sh/)** di sistem kamu sebelum menjalankan proyek ini.

## Cara Instalasi & Menjalankan di Lokal

1. **Clone repository ini** (atau jalankan di direktori ini):
   ```bash
   git clone <url-repo-anda>
   cd netcatalog
   ```

2. **Install dependensi menggunakan Bun:**
   ```bash
   bun install
   ```

3. **Konfigurasi Environment Variables:**
   Salin `.env.example` ke `.env` (atau edit file `.env` jika sudah ada) dan isi dengan kredensial dari Supabase, Better-Auth, dan Cloudinary Anda.

   *Contoh isi `.env`:*
   ```env
   # Database (Gunakan port 5432 untuk lokal, atau 6543 untuk Transaction Pooler serverless)
   DATABASE_URL="postgresql://postgres.xxx:xxx@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"

   # Better Auth
   BETTER_AUTH_SECRET="secret-anda-disini"
   BETTER_AUTH_URL="http://localhost:3000"
   NEXT_PUBLIC_BETTER_AUTH_URL="http://localhost:3000"

   # Cloudinary
   CLOUDINARY_URL="cloudinary://..."
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="cloudnameanda"
   ```

4. **Jalankan Migrasi Database & Seed Data (Opsional tapi penting):**
   Menerapkan migrasi tabel ke Supabase:
   ```bash
   bun run db:migrate
   ```
   *Jika perlu melakukan seed pada akun admin awal, jalankan:*
   ```bash
   bun run db:seed-admin
   ```
   *(Secara bawaan `seed-admin` akan membuat akun: `admin@netcatalog.com` dan `reviewer@netcatalog.com` dengan kata sandi `Admin.3669`)*

5. **Jalankan Development Server:**
   ```bash
   bun run dev
   ```

   Buka [http://localhost:3000](http://localhost:3000) di browser Anda untuk melihat hasilnya.

## Cara Deploy ke Vercel

Proyek ini sudah dikonfigurasi untuk berjalan dengan Vercel secara mudah, memanfaatkan **Bun** untuk instalasi yang lebih cepat.

1. **Upload ke GitHub/GitLab/Bitbucket** (atau push kodenya terlebih dahulu).
2. Di Dashboard Vercel, pilih **"Import Project"**.
3. Pastikan Framework Preset tersetting ke **Next.js**.
4. File `vercel.json` yang disertakan di repository ini akan memberitahu Vercel untuk memakai perintah instalasi/build Bun secara otomatis (`bun install` dan `bun run build`).
5. **Tambahkan Environment Variables (Wajib!):**
   Masukkan variabel yang sama persis dengan `.env` kamu, dengan pengecualian berikut:
   - `DATABASE_URL`: Pastikan menggunakan port **6543** (Transaction Pooler di Supabase) jika mendeploy aplikasi serverless di Vercel agar koneksi tidak habis (*Connection Exhaustion*).
   - `BETTER_AUTH_URL` dan `NEXT_PUBLIC_BETTER_AUTH_URL`: Ganti isinya dari `localhost:3000` menjadi **URL production Vercel kamu** (contoh: `https://netcatalog-anda.vercel.app`).
6. Klik **Deploy** dan tunggu proses selesai.
