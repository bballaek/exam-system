# Migration Instructions - Add lockScreen Field

## ปัญหา
ฐานข้อมูลยังไม่มี field `lockScreen` ในตาราง `ExamSet`

## วิธีแก้ไข

### วิธีที่ 1: ใช้ Prisma Migrate (แนะนำ)
```bash
npx prisma migrate dev --name add_lock_screen
npx prisma generate
```

### วิธีที่ 2: ใช้ Prisma DB Push (สำหรับ development)
```bash
npx prisma db push
npx prisma generate
```

### วิธีที่ 3: รัน SQL โดยตรง
รัน SQL script ใน `migrate-lockscreen.sql`:
```sql
ALTER TABLE "ExamSet" 
ADD COLUMN IF NOT EXISTS "lockScreen" BOOLEAN NOT NULL DEFAULT false;
```

หลังจากรัน migration แล้ว ให้ restart development server:
```bash
npm run dev
```




