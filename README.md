# 💰 Whealth Tracker

Aplikasi pencatatan keuangan modern dengan fitur lengkap untuk memantau pemasukan, pengeluaran, dan target tabungan Anda.

**Creator**: Tyger Earth | Ahtjong Labs

---

## ✨ Fitur Utama

### 🎯 Multi-Profile Management
- **Multiple Profiles**: Kelola keuangan untuk berbagai profil (pribadi, keluarga, bisnis, dll)
- **Data Isolation**: Setiap profil memiliki data yang terpisah
- **PIN Security**: Lindungi setiap profil dengan PIN untuk keamanan tambahan
- **Profile Switching**: Ganti profil dengan mudah melalui dropdown di pojok kanan atas

### 📊 Dashboard yang Komprehensif
- **Visualisasi Data**: Grafik arus kas masuk & keluar (30 hari terakhir)
- **Distribusi Pengeluaran**: Diagram pie untuk melihat pengeluaran per kategori
- **Rasio Keuangan**: Pemasukan, pengeluaran, saldo, dan rasio tabungan
- **Progress Target**: Monitor pencapaian target tabungan
- **Investment Tips**: Tips menabung & kutipan dari investor hebat
- **Flexible Filtering**: Filter data berdasarkan bulan, tahun, atau semua data

### 💵 Manajemen Kas (Pemasukan & Pengeluaran)
- **Form Input**: Input transaksi dengan mudah
- **Category Management**: Buat dan kelola kategori pemasukan/pengeluaran
- **Full CRUD**: Tambah, edit, dan hapus transaksi
- **Real-time Totals**: Total pemasukan/pengeluaran dihitung secara otomatis

### 🎯 Target Tabungan
- **Savings Goals**: Buat target tabungan dengan tujuan spesifik
- **Progress Tracking**: Monitor progress tabungan dengan visual progress bar
- **Allocation System**: Alokasikan setoran ke target tabungan
- **Investment Calculator**: Hitung potensi pertumbuhan investasi dengan bunga majemuk
- **Time-based Goals**: Atur jangka waktu pencapaian target

### 📈 Laporan & Export
- **Comprehensive Reports**: Laporan transaksi dan target tabungan
- **Flexible Filters**: Filter laporan berdasarkan tipe dan periode
- **Excel Export**: Export data ke Excel dengan 3 sheet:
  - Transaksi
  - Target Tabungan
  - Ringkasan
- **Financial Summary**: Ringkasan finansial dalam laporan

### 🎨 Desain Modern
- **Navy & White Color Scheme**: Tema profesional ala crypto exchange
- **Responsive Design**: Berfungsi sempurna di semua perangkat
- **Full Sidebar**: Navigasi dengan sidebar yang bisa di-hide/show
- **Loading Screen**: Loading screen saat aplikasi dimuat
- **Modern UI Components**: Menggunakan shadcn/ui components
- **Sticky Footer**: Footer tetap di bawah dengan nama creator

---

## 🏗️ Teknologi yang Digunakan

### Core Framework
- **Next.js 16** dengan App Router
- **TypeScript 5**
- **React 19**

### Database & ORM
- **Prisma ORM** untuk database management
- **SQLite** untuk development
- **PostgreSQL (NEON)** untuk production

### UI & Styling
- **Tailwind CSS 4**
- **shadcn/ui** components
- **Recharts** untuk visualisasi data
- **Lucide React** untuk icons
- **Framer Motion** untuk animations

### State Management
- **React Context API** untuk global state
- **Zustand** untuk client state

### Data Export
- **XLSX** untuk Excel export

---

## 📁 Struktur Project

```
my-project/
├── src/
│   ├── app/
│   │   ├── api/              # API Routes
│   │   │   ├── profiles/     # Profile API (CRUD)
│   │   │   ├── transactions/  # Transaction API
│   │   │   ├── categories/   # Category API
│   │   │   ├── savings-targets/      # Savings targets API
│   │   │   └── savings-allocations/  # Savings allocations API
│   │   ├── kas-masuk/        # Income page
│   │   ├── kas-keluar/       # Expense page
│   │   ├── target-tabungan/  # Savings targets page
│   │   ├── laporan/          # Reports page
│   │   ├── page.tsx          # Dashboard
│   │   ├── layout.tsx        # Root layout
│   │   └── globals.css       # Global styles
│   ├── components/
│   │   ├── layout/
│   │   │   └── DashboardLayout.tsx
│   │   ├── ui/               # shadcn/ui components
│   │   ├── Sidebar.tsx       # Navigation sidebar
│   │   ├── ProfileSelector.tsx  # Profile dropdown
│   │   └── LoadingScreen.tsx
│   └── contexts/
│       └── ProfileContext.tsx  # Global profile state
├── prisma/
│   └── schema.prisma         # Database schema
├── db/                       # SQLite database (dev)
├── public/                   # Static files
├── DEPLOYMENT_GUIDE.md       # Deployment instructions
└── worklog.md               # Development log
```

---

## 🚀 Cara Menjalankan Project

### Prerequisites
- Node.js (v18 or higher)
- Bun (recommended) or npm/yarn

### Development Mode

1. **Install dependencies**:
```bash
bun install
# atau
npm install
```

2. **Setup database**:
```bash
bun run db:push
# atau
npm run db:push
```

3. **Start development server**:
```bash
bun run dev
# atau
npm run dev
```

4. Buka browser di `http://localhost:3000`

### Production Build

```bash
# Build
bun run build

# Start production server
bun run start
```

---

## 📖 Panduan Penggunaan

### 1. Membuat Profil Pertama

1. Buka aplikasi di browser
2. Klik dropdown "Pilih Profil" di pojok kanan atas
3. Klik "Tambah Profil"
4. Masukkan:
   - Nama profil (misal: "Profil Pribadi")
   - PIN keamanan (4 digit, opsional, default: 1234)
5. Klik "Buat Profil"
6. Profil akan otomatis menjadi profil aktif

### 2. Menambah Kategori

1. Masuk ke halaman **Kas Masuk** atau **Kas Keluar**
2. Klik tombol "Tambah Pemasukan" atau "Tambah Pengeluaran"
3. Di field "Kategori", klik tombol "+" di sebelah dropdown
4. Masukkan nama kategori
5. Kategori akan tersimpan dan siap digunakan

### 3. Mencatat Pemasukan

1. Buka halaman **Kas Masuk**
2. Klik "Tambah Pemasukan"
3. Isi form:
   - Jumlah (Rp)
   - Kategori
   - Deskripsi (opsional)
   - Tanggal
4. Klik "Simpan"
5. Transaksi akan muncul di tabel dan dashboard

### 4. Mencatat Pengeluaran

1. Buka halaman **Kas Keluar**
2. Klik "Tambah Pengeluaran"
3. Isi form dengan cara yang sama seperti pemasukan
4. Klik "Simpan"

### 5. Membuat Target Tabungan

1. Buka halaman **Target Tabungan**
2. Klik "Target Baru"
3. Isi form:
   - Nama target (misal: "Dana Darurat")
   - Target jumlah
   - Tanggal mulai & target
   - Deskripsi (opsional)
4. Klik "Buat Target"
5. Target akan muncul di daftar

### 6. Menyetor Tabungan

1. Pilih target tabungan dari kartu
2. Klik "Tambah Alokasi"
3. Masukkan jumlah dan deskripsi (opsional)
4. Klik "Setor"
5. Progress target akan otomatis terupdate

### 7. Menggunakan Kalkulator Investasi

1. Buka halaman **Target Tabungan**
2. Klik tab "Kalkulator Investasi"
3. Masukkan:
   - Modal awal
   - Investasi bulanan
   - Bunga tahunan (%)
   - Jangka waktu (tahun)
4. Klik "Hitung Investasi"
5. Hasil perhitungan akan muncul dengan detail total nilai, setoran, dan bunga

### 8. Export Laporan ke Excel

1. Buka halaman **Laporan**
2. Filter data sesuai kebutuhan:
   - Tipe transaksi (Semua/Pemasukan/Pengeluaran)
   - Bulan
   - Tahun
3. Klik tombol "Export Excel"
4. File Excel akan otomatis terdownload dengan 3 sheet

---

## 🔐 Keamanan

### PIN Protection
- Setiap profil memiliki PIN untuk akses
- PIN digunakan saat mengganti profil yang memiliki PIN
- Default PIN: 1234 (dapat diubah)

### Data Isolation
- Data setiap profil terpisah sepenuhnya
- Profil tidak bisa mengakses data profil lain
- Saat profil dihapus, semua data terkait juga terhapus (cascade delete)

---

## 🌐 Deployment

Untuk instruksi lengkap deployment ke GitHub dan Vercel dengan NEON database, lihat file:

**[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)**

---

## 📊 Database Schema

### Profile
- Menyimpan informasi profil pengguna
- PIN untuk keamanan
- Link ke semua data terkait profil

### Transaction
- Menyimpan semua transaksi pemasukan/pengeluaran
- Link ke profil dan kategori
- Terindeks untuk query cepat

### Category
- Kategori untuk transaksi
- Dibedakan berdasarkan tipe (INCOME/EXPENSE)
- Bisa custom warna dan icon

### SavingsTarget
- Target tabungan dengan goal spesifik
- Progress tracking
- Link ke alokasi

### SavingsAllocation
- Setoran/deposit ke target tabungan
- History tabungan
- Otomatis update target current amount

---

## 🎨 Customization

### Warna
Warna utama dapat diubah di `src/app/globals.css`:
```css
:root {
  --navy-900: oklch(0.231 0.037 264.705);
  --navy-800: oklch(0.282 0.046 264.705);
  --navy-700: oklch(0.333 0.055 264.705);
  --navy-600: oklch(0.384 0.064 264.705);
  --navy-50: oklch(0.985 0.005 264.705);
}
```

### Investment Quotes
Daftar kutipan investasi dapat ditambah/diubah di:
`src/app/page.tsx` - `investmentQuotes` array

---

## 🐛 Troubleshooting

### Database connection error
- Pastikan database file ada di folder `db/`
- Run `bun run db:push` untuk sync schema

### API route not working
- Cek console browser untuk error details
- Pastikan API routes ada di `/src/app/api/`
- Verify server logs

### Charts not displaying
- Pastikan data tersedia di database
- Cek Recharts initialization
- Verify data format

---

## 📝 Catatan Penting

- **Database Provider**: Development menggunakan SQLite, production menggunakan PostgreSQL (NEON)
- **Environment Variables**: JANGAN commit `.env` file ke GitHub
- **PIN Security**: Untuk production yang lebih secure, implementasikan proper hashing (bcrypt)
- **Backup**: NEON memiliki auto-backup, tapi export data secara berkala tetap disarankan
- **Performance**: NEON free tier memiliki limit request, upgrade plan untuk production besar

---

## 🤝 Kontribusi

Project ini dikembangkan oleh:
- **Tyger Earth** | **Ahtjong Labs**

---

## 📄 License

Project ini adalah properti dari Tyger Earth | Ahtjong Labs

---

## 🙏 Terima Kasih

Terima kasih telah menggunakan Whealth Tracker! Semoga aplikasi ini membantu Anda dalam mengelola keuangan dengan lebih baik.

**Creator: Tyger Earth | Ahtjong Labs**
