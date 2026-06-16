# Nari Bot - Railway Deployment Guide

## 🔧 Yapılan Değişiklikler

### 1. Package Dependencies Updated
**Dosya:** [package.json](package.json)
- ❌ `sqlite3@6.0.1` kaldırıldı (GLIBC binary compile sorunu)
- ✅ `sql.js@1.10.2` eklendi (pure JavaScript, no native compilation)

### 2. Database Module Refactored
**Dosya:** [src/database/sqlite.js](src/database/sqlite.js)
- sql.js API'ye uyarlanmıştır
- `initializeDatabase()` async fonksiyonu ile başlatılır
- Otomatik 30 saniyede bir diskte kaydedilir
- Tüm tablolar compatibility korunmuştur

### 3. DB Wrapper Updated
**Dosya:** [src/utils/db.js](src/utils/db.js)
- sql.js prepare/bind/step pattern implementasyonu
- Mevcut async/await code uyumluluğu korunmuştur
- `get()`, `all()`, `run()` fonksiyonları güncellendi

### 4. Main Entry Point Updated
**Dosya:** [index.js](index.js)
- `initializeDatabase()` async initialization
- Veritabanı başlatıldıktan sonra bot başlatılır
- `autoSave()` etkinleştirildi

### 5. Docker Configuration
**Dosya:** [Dockerfile](Dockerfile)
- Node:20-alpine (sql.js pure JS olduğu için minimal)
- Build tools gerekli değil
- npm ci --omit=dev ile production dependencies

**Dosya:** [railway.json](railway.json)
- Railway platform configuration

**Dosya:** [.dockerignore](.dockerignore)
- Disk space optimization

## ✅ Railway Deployment Checklist

- [x] sqlite3 modülü kaldırıldı
- [x] sql.js (pure JavaScript) entegre edildi
- [x] Database layer refactored
- [x] Docker Alpine uyumlu
- [x] .env configuration preserved
- [x] Tüm tabloları oluşturuldu
- [x] Auto-save functionality
- [x] Discord.js v14 uyumluluğu korundu

## 🚀 Railway Deploy Adımları

1. **Git Push**
   ```bash
   git add .
   git commit -m "SQLite3 to sql.js migration for Railway compatibility"
   git push -u origin main
   ```

2. **Railway Console'de**
   - New Project → GitHub
   - Repository seçin
   - Environment variables (.env) ekleyin:
     ```
     TOKEN=your-bot-token
     CLIENT_ID=your-client-id
     DATABASE_PATH=./src/database/database.sqlite
     ```

3. **Deploy**
   - Railway otomatik olarak Dockerfile'ı kullanacak
   - Bot başlayacak ve veritabanını oluşturacak

## 🧪 Local Test (Optional)
```bash
npm install
npm start
```

**Beklenen çıktı:**
```
SQLite veritabanına bağlandı: ./src/database/database.sqlite
Tüm tablolar başarıyla oluşturuldu veya mevcut.
Nari olarak giriş yapıldı
```

## 📋 API Compatibility

Mevcut tüm kod uyumlu:
- `db.get()` - async wrapper
- `db.all()` - async wrapper
- `db.run()` - async wrapper
- `settingsManager.js` - değişiklik yok
- Tüm command ve event handlers - değişiklik yok

## 🔒 Data Persistence

- Veritabanı dosyası: `src/database/database.sqlite`
- Auto-save: 30 saniye
- Uyumlu SQLite format (sql.js export)
- Railway volume'da persist edilir

## ⚠️ Önemli Notlar

1. sql.js in-memory database kullanıyor, ama dosya diskette kaydediliyor
2. Her 30 saniyede bir otomatik kayıt yapılıyor
3. Tüm SQLite3 komutları uyumlu
4. Veritabanı migrasyonu otomatik
5. Discord.js v14 full uyumluluk

---

**Status:** ✅ Railway Deploy Ready
**Last Updated:** 2026-06-16
