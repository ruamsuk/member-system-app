import { effect, inject, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  Auth,
  authState,
  createUserWithEmailAndPassword,
  deleteUser,
  GoogleAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  User,
  UserCredential
} from '@angular/fire/auth';
import {
  collection,
  doc,
  docData,
  Firestore,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc
} from '@angular/fire/firestore';
import { getDownloadURL, ref, Storage, uploadBytes } from '@angular/fire/storage';
import { Router } from '@angular/router';
import { from, Observable, of, switchMap } from 'rxjs';
import { map } from 'rxjs/operators';
import { ToastService } from './toast.service';

// ++ สร้าง Interface สำหรับข้อมูล User ของเรา ++
export interface AppUser extends User {
  role?: 'admin' | 'member' | 'user';
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth: Auth = inject(Auth);
  private firestore = inject(Firestore); // ใช้ Firestore ในการดึงข้อมูลผู้ใช้
  private storage: Storage = inject(Storage); // ใช้ Storage สำหรับการอัปโหลดรูปภาพ
  private toastService = inject(ToastService); // ใช้สำหรับแสดงข้อความ Toast
  private router = inject(Router); // ใช้สำหรับการนำทาง
  private timeout: any;

  // 1.สร้าง Signal เพื่อเก็บสถานะผู้ใช้ปัจจุบัน
  public currentUser = toSignal<AppUser | null>(
    authState(this.auth).pipe(
      switchMap(user => {
        if (user) {
          // ถ้ามี user, ให้ "รับฟัง" การเปลี่ยนแปลงของ document ของเขาใน Firestore
          const userDocRef = doc(this.firestore, `users/${user.uid}`);
          return docData(userDocRef).pipe(
            map(firestoreData => {
              // เมื่อไหร่ก็ตามที่ข้อมูลใน Firestore เปลี่ยน, ให้สร้าง object ใหม่
              if (firestoreData) {
                return {
                  ...user,
                  role: firestoreData['role'],
                  photoURL: firestoreData['photoURL'] || user.photoURL,
                } as AppUser;
              }
              return user as AppUser; // ถ้าไม่มี doc ใน firestore
            })
          );
        } else {
          // ถ้าไม่มี user, คืนค่า null
          return of(null);
        }
      })
    )
  );

  constructor() {
    effect(() => {
      const user = this.currentUser();
      if (user) {
        this.resetTimer(); // รีเซ็ต timer เมื่อมีผู้ใช้ล็อกอิน
      } else {
        clearTimeout(this.timeout); // เคลียร์ timer ถ้าไม่มีผู้ใช้ล็อกอิน
      }
    });
  }

  startTimer() {
    this.timeout = setTimeout(
      () => {
        this.logout().then(() => {
          console.log('logout');
          this.router.navigateByUrl('/login').then();
        });
      },
      30 * 60 * 1000,
    ); // 30 นาที
  }

  resetTimer() {
    clearTimeout(this.timeout);
    this.startTimer();
  }

  /**
   * ดึงข้อมูลผู้ใช้ทั้งหมดจาก collection 'users'
   * @returns Observable ของ array ผู้ใช้ทั้งหมด
   */
  getAllUsers(): Observable<AppUser[]> {
    const usersCollection = collection(this.firestore, 'users');
    return from(getDocs(usersCollection)).pipe(
      map(querySnapshot => {
        return querySnapshot.docs.map(doc => doc.data() as AppUser);
      })
    );
  }

  /**
   * อัปเดต role ของผู้ใช้ใน Firestore
   * @param uid - User ID ของผู้ใช้ที่ต้องการอัปเดต
   * @param role - Role ใหม่ที่จะกำหนด ('admin', 'member', หรือ 'user')
   * @returns Promise<void>
   */
  updateUserRole(uid: string, role: 'admin' | 'member' | 'user'): Promise<void> {
    const userDocRef = doc(this.firestore, `users/${uid}`);
    return updateDoc(userDocRef, { role: role });
  }

  async login(credentials: { email: string, pass: string }): Promise<UserCredential> {
    return signInWithEmailAndPassword(this.auth, credentials.email, credentials.pass)
      .then((userCredential: UserCredential) => {
        // ++ ตรวจสอบสถานะการยืนยันอีเมล ++
        if (!userCredential.user.emailVerified) {
          // ถ้ายังไม่ยืนยัน, บังคับ logout และโยน error กลับไป
          signOut(this.auth);
          return Promise.reject({code: 'auth/email-not-verified'});
        }
        // ถ้าผ่าน, คืนค่า userCredential กลับไปตามปกติ
        return userCredential;
      });
  }

  /**
   * ++ เพิ่มเมธอดใหม่สำหรับ Google Sign-In ++
   */
  async signInWithGoogle(): Promise<UserCredential> {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(this.auth, provider);
    const user = userCredential.user;

    // ตรวจสอบว่าผู้ใช้นี้มีข้อมูลใน collection 'users' ของเราหรือยัง
    const userDocRef = doc(this.firestore, `users/${user.uid}`);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      // ถ้าเป็นผู้ใช้ใหม่, สร้าง document ของเขาใน Firestore
      // โดยกำหนด role เริ่มต้นเป็น 'user'
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: 'user', // กำหนด role เริ่มต้น
        createdAt: serverTimestamp()
      }, { merge: true });
    }

    return userCredential;
  }

  async register(credentials: { email: string, pass: string, displayName: string }): Promise<void> {
    let createdUser: User;

    return createUserWithEmailAndPassword(this.auth, credentials.email, credentials.pass)
      .then((userCredential: UserCredential) => {
        createdUser = userCredential.user;
        // 1. สร้าง Document ใน collection 'users'
        const userDocRef = doc(this.firestore, `users/${createdUser.uid}`);
        return setDoc(userDocRef, {
          uid: createdUser.uid,
          email: createdUser.email,
          displayName: credentials.displayName,
          role: 'user', // ++ กำหนด role เริ่มต้นเป็น 'user' ++
          createdAt: serverTimestamp()
        });
      })
      .then(() => {
        // 3. ส่งอีเมลยืนยัน
        return sendEmailVerification(createdUser);
      })
      .then(() => {
        // 4. บังคับ Logout เพื่อให้ผู้ใช้ต้องยืนยันอีเมลก่อนเข้าสู่ระบบ
        return signOut(this.auth);
      });
  }

  // ++ เพิ่มเมธอดสำหรับการยืนยันอีเมล ++
  resetPassword(email: string): Promise<void> {
    return sendPasswordResetEmail(this.auth, email);
  }

  // ++ เพิ่มเมธอดสำหรับลบบัญชี ++
  deleteAccount(): Promise<void> {
    const user = this.currentUser();
    if (!user) {
      return Promise.reject(new Error('No user to delete.'));
    }
    return deleteUser(user);
  }

  logout() {
    return signOut(this.auth);
  }

  /**
   * อัปโหลดไฟล์รูปภาพไปยัง Firebase Storage
   * @param file - ไฟล์ที่ต้องการอัปโหลด
   * @returns Promise ที่จะคืนค่าเป็น URL ของไฟล์ที่อัปโหลดแล้ว
   */
  async uploadProfileImage(file: File): Promise<string> {
    const user = this.currentUser();
    if (!user) throw new Error('Authentication Error: User not logged in.');

    // สร้าง Path ที่จะเก็บไฟล์ เช่น /profile_images/USER_UID/profile.jpg
    const filePath = `profile_images/${user.uid}/${file.name}`;
    const storageRef = ref(this.storage, filePath);

    // ทำการอัปโหลดไฟล์
    await uploadBytes(storageRef, file);

    // ดึง URL ของไฟล์ที่เพิ่งอัปโหลดไป
    return await getDownloadURL(storageRef);
  }

  /**
   * อัปเดต photoURL ของผู้ใช้ทั้งใน Auth และ Firestore
   * @param photoURL - URL ของรูปภาพใหม่
   */
  async updateProfilePicture(photoURL: string): Promise<void> {
    const user = this.auth.currentUser;

    if (!user) {
      console.error('[AuthService] Update failed: User not logged in.');
      this.toastService.show('Authentication Error: User not logged in.', 'error');
      return Promise.reject('Authentication Error: User not logged in');
    }

    // console.log(`%c[AuthService] 1. Starting profile picture update for user: ${user.uid}`, 'color: yellow; font-weight: bold;');
    // console.log(`%c[AuthService] 2. New photoURL to be saved:`, 'color: yellow; font-weight: bold;', photoURL);


    // 1. อัปเดตโปรไฟล์ใน Firebase Authentication
    return updateProfile(user, {photoURL: photoURL})
      .then(() => {
        // console.log(`%c[AuthService] 3. Successfully updated Firebase Auth profile.`, 'color: green; font-weight: bold;');

        // 2. อัปเดต URL ใน Firestore 'users' collection (เหมือนเดิม)
        const userDocRef = doc(this.firestore, `users/${user.uid}`);
        // console.log(`%c[AuthService] 4. Preparing to update Firestore document at path: ${userDocRef.path}`, 'color: blue; font-weight: bold;');

        return setDoc(userDocRef, {photoURL: photoURL}, {merge: true});
      })
      .then(() => {
        console.log(`%c[AuthService] 5. Successfully updated Firestore 'users' collection.`, 'color: green; font-weight: bold;');
       // this.toastService.show('Success B', 'Profile picture updated successfully.', 'success');
      })
      .catch(error => {
        console.error(`%c[AuthService] ERROR during profile update process:`, 'color: red; font-weight: bold;', error);
        this.toastService.show('Failed to update profile picture.', 'error');
        throw error;
      });
  }

}
