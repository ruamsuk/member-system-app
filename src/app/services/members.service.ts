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
  orderBy,
  query,
  updateDoc,
  where
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Member } from '../models/member.model';

@Injectable({
  providedIn: 'root'
})
export class MembersService {
  private readonly firestore: Firestore = inject(Firestore);

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

    return collectionData(userQuery, {idField: 'id'}) as Observable<Member[]>;
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
  addMember(member: Member): Promise<DocumentReference> {
    const docRef = collection(this.firestore, 'members');
    return addDoc(docRef, {...member, created: new Date()});
  }

  // checkDuplicate สามารถคืนเป็น Promise ได้เช่นกันเพื่อความสอดคล้อง
  async checkDuplicate(firstname: string, lastname: string): Promise<boolean> {
    const dbInstance = collection(this.firestore, 'members');
    const q = query(
      dbInstance,
      where('firstname', '==', firstname),
      where('lastname', '==', lastname),
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.size > 0;
  }

  /*deleteMember(id: string | undefined) {
    const docInstance = doc(this.firestore, 'members', `${id}`);
    return from(deleteDoc(docInstance));
  }

  updateMember(member: any): Observable<any> {
    const docInstance = doc(this.firestore, `members/${member.id}`);

    return from(updateDoc(docInstance, {...member, updated: new Date()}));
  }

  checkDuplicate(firstname: string, lastname: string): Observable<boolean> {
    const dbInstance = collection(this.firestore, 'members');
    const q = query(
      dbInstance,
      where('firstname', '==', firstname),
      where('lastname', '==', lastname),
    );
    return from(getDocs(q)).pipe(
      map((querySnapshot) => querySnapshot.size > 0),
      catchError(() => of(false)),
    );
  }

  addMember(member: Member): Observable<any> {
    const docRef = collection(this.firestore, 'members');
    return from(addDoc(docRef, {...member, created: new Date()}));
  }*/
}
