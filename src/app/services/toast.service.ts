import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ToastMessage {
  id: number;
  summary?: string;
  text: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private messages = new BehaviorSubject<ToastMessage[]>([]);

  getMessages() {
    return this.messages.asObservable();
  }

  show(summary: string, text: string, type: ToastMessage['type'] = 'info') {
    const id = Date.now();
    const newMessage: ToastMessage = {id, summary, text, type};

    // ห่อการอัปเดตค่าไว้ใน setTimeout เพื่อให้ทำงานในรอบถัดไป
    setTimeout(() => {
      const current = this.messages.getValue();
      this.messages.next([...current, newMessage]);
    }, 0);


    // ลบหลังจากผ่านไป 4 วินาที
    setTimeout(() => {
      this.remove(id);
    }, 4000);
  }

  remove(id: number) {
    const current = this.messages.getValue();
    this.messages.next(current.filter(msg => msg.id !== id));
  }
}
