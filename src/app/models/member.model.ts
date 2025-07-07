import { AddressValue } from './province.model';

export interface Member {
  id?: string;
  rank?: string;
  firstname?: string;
  lastname?: string;
  phone?: string;
  birthdate?: any; // ใช้ any เพื่อรองรับ Timestamp จาก Firestore
  alive?: string;
  photoURL?: string;

  // vvv โครงสร้างที่อยู่ใหม่ที่ถูกต้อง vvv
  // เราจะเก็บข้อมูลที่อยู่ทั้งหมดไว้ใน object นี้ object เดียว
  address?: {
    line1?: string; // สำหรับเก็บที่อยู่ (เลขที่, ถนน)
    addressObject?: AddressValue | null; // สำหรับเก็บ Object จาก CustomAddressComponent
  } | null;

  // --- Metadata ---
  created?: any;
  updated?: any;
}

