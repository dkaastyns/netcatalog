# Bab 3. Model Sistem

Dokumen ini memuat pemodelan sistem untuk platform **Netcatalog** menggunakan standar UML (Unified Modeling Language), mencakup interaksi pengguna, alur proses, interaksi komponen, dan struktur data.

---

## 3.1. Use Case Diagram (WAJIB)

### a. Diagram Use Case
```mermaid
flowchart LR
    %% Actors
    Admin([Administrator])
    Visitor([Public Visitor])

    %% System Boundary
    subgraph Netcatalog System
        %% Public Use Cases
        UC1(Melihat Katalog Produk)
        UC2(Mencari & Filter Produk)
        UC3(Melihat Detail Produk)
        
        %% Admin Use Cases
        UC4(Login Dashboard)
        UC5(Kelola Produk)
        UC6(Kelola Kategori)
        UC7(Catat Pesanan Manual)
        UC8(Kelola Inventaris/Stok)
        UC9(Kelola Pengguna)
        
        %% Includes / Extends
        UC7 -.->|<<include>>| UC8
        UC5 -.->|<<include>>| UC6
    end

    %% Relationships
    Visitor --- UC1
    Visitor --- UC2
    Visitor --- UC3

    Admin --- UC4
    Admin --- UC5
    Admin --- UC6
    Admin --- UC7
    Admin --- UC8
    Admin --- UC9
    
    %% Generalization (Admin is a type of User, but here they are separate for clarity)
```

### b. Identifikasi Aktor
1. **Public Visitor**: Pengguna umum yang mengakses landing page dan katalog produk tanpa perlu login.
2. **Administrator**: Pengguna internal/staf yang memiliki akses penuh ke sistem dashboard untuk mengelola seluruh data platform.

### c. Relasi (Include, Extend, Generalization)
- **`<<include>>` Catat Pesanan Manual -> Kelola Inventaris**: Setiap kali Admin mencatat pesanan, sistem secara otomatis *meng-include* proses pengurangan stok di Inventaris.
- **`<<include>>` Kelola Produk -> Kelola Kategori**: Saat mengelola produk, Admin berelasi dengan data kategori untuk pengelompokan.

### d. Deskripsi Singkat Tiap Use Case
- **Melihat Katalog Produk**: Visitor dapat melihat daftar perangkat jaringan yang tersedia.
- **Mencari & Filter Produk**: Visitor dapat mencari berdasarkan nama atau memfilter berdasarkan kategori.
- **Login Dashboard**: Admin melakukan autentikasi email dan password untuk masuk ke area administratif.
- **Kelola Produk**: Admin dapat menambah, mengubah, atau menghapus data perangkat jaringan.
- **Catat Pesanan Manual**: Admin mencatat transaksi penjualan ke pelanggan (offline/manual sales).
- **Kelola Inventaris/Stok**: Admin dapat menambah stok (restock) atau melihat riwayat pergerakan barang masuk/keluar.

---

## 3.2. Activity Diagram (WAJIB)

Diagram ini menggambarkan alur inti saat Admin mencatat pesanan baru, yang melibatkan *decision* pengecekan stok dan *parallel flow* (jika ada).

### Alur Proses Utama: Pencatatan Pesanan (Log Order) & Penyesuaian Stok

```mermaid
stateDiagram-v2
    [*] --> BukaModalPesanan: Admin klik "Catat Pesanan"
    BukaModalPesanan --> IsiFormPesanan: Masukkan detail pelanggan & pilih produk
    IsiFormPesanan --> ValidasiInput: Klik "Konfirmasi"
    
    state ValidasiInput {
        [*] --> CekKelengkapan
        CekKelengkapan --> CekStok
    }
    
    ValidasiInput --> PeringatanStokKosong: [Stok < Jumlah Dipesan]
    PeringatanStokKosong --> IsiFormPesanan: Perbaiki Jumlah
    
    ValidasiInput --> ProsesDatabase: [Stok Tersedia]
    
    state ProsesDatabase {
        direction LR
        BuatPesananBaru --> TambahItemPesanan
        TambahItemPesanan --> CatatPergerakanInventaris: (Pengurangan Stok)
    }
    
    ProsesDatabase --> TampilkanNotifikasiSukses
    TampilkanNotifikasiSukses --> [*]
```

**Deskripsi Proses**:
1. Admin membuka form modal untuk mencatat pesanan.
2. Admin mengisi data pelanggan, produk, dan kuantitas.
3. Sistem melakukan *Decision*: Mengecek ketersediaan stok produk.
4. Jika stok kurang, alur dikembalikan ke form dengan pesan error.
5. Jika stok cukup, sistem melakukan *sequence* ke database: Membuat Order, mencatat Order Items, dan memotong kuantitas di Inventory Movements secara transaksional.

---

## 3.3. Sequence Diagram (DISARANKAN)

Skenario: **Admin Melakukan Pencatatan Pesanan (Transaksi)**

```mermaid
sequenceDiagram
    autonumber
    actor Admin
    participant UI as Frontend (Next.js Client)
    participant API as Backend (Next.js API)
    participant DB as Database (Supabase PG)

    Admin->>UI: Isi form pesanan & klik "Konfirmasi"
    activate UI
    UI->>UI: Validasi input (Required fields)
    UI->>API: POST /api/orders (Data pesanan)
    activate API
    
    API->>API: Validasi Session Auth
    
    API->>DB: SELECT * FROM products WHERE id = ?
    activate DB
    DB-->>API: Data Produk (Harga, Stok saat ini)
    deactivate DB
    
    alt Stok Tidak Cukup
        API-->>UI: 400 Bad Request (Stok tidak cukup)
        UI-->>Admin: Tampilkan Toast Error
    else Stok Cukup
        API->>DB: BEGIN TRANSACTION
        activate DB
        
        DB->>DB: INSERT INTO orders (customer details)
        DB->>DB: INSERT INTO order_items (product_id, qty, price)
        DB->>DB: INSERT INTO inventory_movements (type: 'OUT')
        
        DB->>DB: COMMIT
        DB-->>API: Transaksi Sukses
        deactivate DB
        
        API-->>UI: 200 OK (Berhasil)
        UI-->>Admin: Tutup Modal & Tampilkan Toast Sukses
    end
    
    deactivate API
    UI->>UI: Trigger Refresh Data Tabel
    deactivate UI
```

---

## 3.4. Class Diagram (WAJIB)

Class Diagram ini merepresentasikan entitas utama dalam sistem dan *mapping* langsung ke skema Database (ERD) prisma/drizzle yang digunakan.

```mermaid
classDiagram
    class User {
        +String id
        +String name
        +String email
        +String role
        +DateTime createdAt
        +login()
        +logout()
    }

    class Category {
        +Int id
        +String name
        +String slug
        +String description
        +DateTime createdAt
    }

    class Product {
        +Int id
        +Int categoryId
        +String name
        +String slug
        +String description
        +Float price
        +String status
        +String image
        +calculateStock()
    }

    class InventoryMovement {
        +Int id
        +Int productId
        +String userId
        +String type "IN" | "OUT"
        +Int quantity
        +String notes
        +DateTime createdAt
    }

    class Order {
        +Int id
        +String customerName
        +String customerEmail
        +String customerPhone
        +String status
        +Float totalAmount
        +DateTime createdAt
    }

    class OrderItem {
        +Int id
        +Int orderId
        +Int productId
        +Int quantity
        +Float unitPrice
    }

    %% Relationships
    Category "1" -- "0..*" Product : Mengelompokkan
    Product "1" -- "0..*" InventoryMovement : Memiliki
    User "1" -- "0..*" InventoryMovement : Mencatat
    Order "1" -- "1..*" OrderItem : Terdiri dari
    Product "1" -- "0..*" OrderItem : Termasuk dalam
```

**Atribut dan Method (Relasi ke ERD)**:
- **Product & Category**: Relasi *One-to-Many* (Aggregation). Satu kategori bisa memiliki banyak produk.
- **Product & InventoryMovement**: Sistem tidak menyimpan field `stock` statis di tabel Product, melainkan menghitung (*calculateStock*) dari agregasi tabel `InventoryMovement`. Ini adalah pola *Event Sourcing* sederhana.
- **Order & OrderItem**: Relasi *Composition*, di mana OrderItem tidak bisa berdiri sendiri tanpa Order.

---

## 3.5. Opsi Nilai Tambah (Deployment Diagram)

Arsitektur Fisik (Deployment) yang menunjukkan lokasi komponen di-hosting.

```mermaid
graph TD
    UserClient[Browser Pengguna / Admin]
    
    subgraph Vercel Cloud Platform
        NextJSFrontend[Next.js Frontend\n(React Server Components)]
        NextJSAPI[Next.js API Routes\n(Serverless Functions)]
    end
    
    subgraph Supabase Platform
        PGBouncer[Connection Pooler\nPort 6543]
        PGDatabase[(PostgreSQL Database)]
    end
    
    subgraph External Services
        Cloudinary[(Cloudinary\nImage CDN)]
    end

    UserClient <-->|HTTPS| NextJSFrontend
    UserClient <-->|HTTPS| NextJSAPI
    
    NextJSFrontend -->|Fetch Images| Cloudinary
    
    NextJSAPI <-->|TCP/IP SQL Query| PGBouncer
    PGBouncer <--> PGDatabase
```
