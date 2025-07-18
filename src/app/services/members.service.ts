import { inject, Injectable } from '@angular/core';
import {
  addDoc,
  collection,
  collectionData,
  deleteDoc,
  doc,
  DocumentReference,
  Firestore,
  getDocs,
  limit,
  orderBy,
  query,
  updateDoc,
  where
} from '@angular/fire/firestore';
import { getDownloadURL, ref, Storage, uploadBytes } from '@angular/fire/storage';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Member } from '../models/member.model';

@Injectable({
  providedIn: 'root'
})
export class MembersService {
  private readonly firestore: Firestore = inject(Firestore);
  private readonly storage: Storage = inject(Storage);

  constructor() {
  }

  /**
   * Returns an observable of members from the Firestore collection.
   * This method is used to fetch member data and can be used with toSignal() for reactive programming.
   *
   * @returns {Observable<Member[]>} An observable that emits an array of Member objects.
   */
  getMembers(): Observable<Member[]> {
    const memberCollection = collection(this.firestore, 'members');
    const userQuery = query(memberCollection, orderBy('firstname', 'asc'));

    //return collectionData(userQuery, {idField: 'id'}) as Observable<Member[]>;
    return (collectionData(userQuery, { idField: 'id' }) as Observable<Member[]>).pipe(
      // เพิ่ม map operator เพื่อกรองข้อมูลที่ยังไม่มี id ออกไปจาก stream
      // ซึ่งเป็นข้อมูลชั่วคราวที่เกิดจาก Optimistic Updates
      map(members => members.filter(member => !!member.id))
    );
  }

  /**
   *  Uploads a member's image to Firebase Storage.
   *  @param {File} file - The image file to be uploaded.
   *  @param {string} memberId - The ID of the member to whom the image belongs.
   *
   *  @returns {Promise<string>} A promise that resolves to the download URL of the uploaded image.
   * */
  async uploadMemberImage(file: File, memberId: string): Promise<string> {
    // สร้าง Path ที่จะเก็บไฟล์ เช่น /member_images/MEMBER_ID/avatar.jpg
    const filePath = `member_images/${memberId}/${file.name}`;
    const storageRef = ref(this.storage, filePath);

    // ทำการอัปโหลดไฟล์
    await uploadBytes(storageRef, file);

    // ดึง URL ของไฟล์ที่เพิ่งอัปโหลดไป
    return await getDownloadURL(storageRef);
  }

  // vvv แก้ไขให้คืนค่าเป็น Promise<void> vvv
  deleteMember(id: string | undefined): Promise<void> {
    const docInstance = doc(this.firestore, 'members', `${id}`);
    return deleteDoc(docInstance); // deleteDoc คืนค่า Promise อยู่แล้ว
  }

  // vvv แก้ไขให้คืนค่าเป็น Promise<void> vvv
  updateMember(member: any): Promise<void> {
    const docInstance = doc(this.firestore, `members/${member.id}`);
    return updateDoc(docInstance, {...member, updated: new Date()});
  }

  // vvv แก้ไขให้คืนค่าเป็น Promise<DocumentReference> vvv
  async addMember(member: Member): Promise<DocumentReference> {
    const docRef = collection(this.firestore, 'members');
    return addDoc(docRef, {...member, created: new Date()});
  }

  // checkDuplicate สามารถคืนเป็น Promise ได้เช่นกันเพื่อความสอดคล้อง
  async checkDuplicate(firstname: string, lastname: string, currentMemberId?: string): Promise<boolean> {
    const dbInstance = collection(this.firestore, 'members');
    const q = query(
      dbInstance,
      where('firstname', '==', firstname),
      where('lastname', '==', lastname),
      limit(1) // จำกัดผลลัพธ์เพียง 1 รายการ
    );
    const querySnapshot = await getDocs(q);

    if(querySnapshot.empty)
    {
      return false; // ไม่เจอข้อมูลซ้ำ
    }

    // ถ้าเจอข้อมูล, ตรวจสอบว่าเป็นข้อมูลของคนเดียวกับที่กำลังแก้ไขหรือไม่
    const duplicateDocId = querySnapshot.docs[0].id;
    return duplicateDocId !== currentMemberId;
  }

}
