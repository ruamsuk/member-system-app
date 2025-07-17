# ระบบจัดการข้อมูลสมาชิก (member-system-app)

ระบบสำหรับจัดการข้อมูลสมาชิกนักเรียนอบรมหลักสูตร "พนักงานสอบสวน 25" พัฒนาด้วยเทคโนโลยีล่าสุดของ Angular เพื่อประสิทธิภาพและความเร็วสูงสุด

## ✨ คุณสมบัติหลัก (Key Features)

- **จัดการข้อมูลสมาชิก:** รองรับการทำงานพื้นฐานครบถ้วน (เพิ่ม, ลบ, แก้ไข, ค้นหา)
- **สถาปัตยกรรมสมัยใหม่:** พัฒนาด้วย Angular Standalone Components ทำให้โปรเจกต์มีขนาดเล็กและไม่ซับซ้อน
- **ประสิทธิภาพสูง:** ใช้ Zoneless Change Detection เพื่อลดการทำงานที่ไม่จำเป็นและเพิ่มความเร็วในการตอบสนองของแอปพลิเคชัน
- **ดีไซน์เรียบง่าย:** ออกแบบด้วย Tailwind CSS v4 โดยไม่ใช้ไลบรารี UI ภายนอก เพื่อให้สามารถปรับแต่งได้อย่างอิสระและมีขนาดเล็กที่สุด

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

- **Framework:** Angular v20 (Standalone, Zoneless)
- **Styling:** Tailwind CSS v4
- **Hosting:** Firebase Hosting

## 🚀 การติดตั้งและตั้งค่า (Setup & Installation)

### 1. สิ่งที่ต้องมี (Prerequisites)

- [Node.js](https://nodejs.org/) (เวอร์ชัน 18 หรือสูงกว่า)
- [Angular CLI](https://angular.io/cli)
- [Firebase CLI](https://firebase.google.com/docs/cli)

### 2. การติดตั้ง (Installation)

```bash
# 1. Clone a repository
git clone <your-repository-url>

# 2. เข้าไปที่โฟลเดอร์โปรเจกต์
cd member-system-app

# 3. ติดตั้ง Dependencies
npm install
```

### 3. การตั้งค่า Firebase Hosting (Multisite)

โปรเจกต์นี้เป็นส่วนหนึ่งของการตั้งค่า Firebase Hosting แบบหลายไซต์ (Multisite) ซึ่งจำเป็นต้องมีไฟล์คอนฟิก 2 ไฟล์นี้

**ไฟล์ที่ 1: `.firebaserc`**
ไฟล์นี้ทำหน้าที่ "แมป" ชื่อเล่นของโปรเจกต์กับ Site จริงบน Firebase ไฟล์นี้จะต้องมีข้อมูลของทุกไซต์ในโปรเจกต์ (และควรจะเหมือนกับไฟล์ในโปรเจกต์ `print-receipt`)

```.firebaserc
{
  "projects": {
    "default": "print-receipt"
  },
  "targets": {
    "print-receipt": {
      "hosting": {
        "print-receipt": [
          "print-receipt-6fdc9"
        ],
        "member-system": [
          "member-system-app"
        ]
      }
    }
  }
}
```

**ไฟล์ที่ 2: `firebase.json`**
ไฟล์นี้เป็น "พิมพ์เขียว" สำหรับ deploy โปรเจกต์นี้โดยเฉพาะ

```json
{
  "hosting": {
    "target": "member-system",
    "public": "dist/member-system-app/browser",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```
> **สำคัญ:** ตรวจสอบให้แน่ใจว่าค่า `"public"` ตรงกับ path ของโฟลเดอร์ build ของคุณ (สำหรับ Angular v17+ มักจะเป็น `dist/ชื่อโปรเจกต์/browser`)

### 4. การ Deploy ขึ้น Firebase Hosting

เมื่อตั้งค่าและ build โปรเจกต์เรียบร้อยแล้ว ใช้คำสั่งนี้เพื่อ deploy:

```bash
# Build โปรเจกต์ให้เป็นเวอร์ชัน production
ng build --configuration production or ng build -c prod

# Deploy ไปยัง Firebase Hosting โดยระบุ target
firebase deploy --only hosting:member-system
```
