import { Injectable } from '@angular/core';
import dayjs from 'dayjs';


@Injectable({
  providedIn: 'root'
})
export class CountAgeService {

  constructor() {
  }

  /**
   * Calculates the precise age (years, months, days) from a given birthdate.
   * @param DayOfBirth - The birthdate can be a Firestore Timestamp or a standard Date object.
   * @returns A formatted string of the age, e.g., "30 ปี 5 เดือน 10 วัน".
   */
  getAge(DayOfBirth: any): string {
    if (!DayOfBirth) {
      return 'ไม่มีข้อมูลวันเกิด';
    }

    // Convert Firestore Timestamp to a dayjs object if necessary, otherwise use the date directly.
    const birthDate = dayjs(DayOfBirth.toDate ? DayOfBirth.toDate() : DayOfBirth);
    const today = dayjs();

    // Check if the parsed date is valid
    if (!birthDate.isValid()) {
      return 'รูปแบบวันเกิดไม่ถูกต้อง';
    }

    // Calculate the difference in years
    const years = today.diff(birthDate, 'year');

    // Calculate the difference in the past months after adding the years to the birthdate
    const months = today.diff(birthDate.add(years, 'year'), 'month');

    // Calculate the difference in days after adding years and months to the birthdate
    const days = today.diff(birthDate.add(years, 'year').add(months, 'month'), 'day');

    return `${years} ปี ${months} เดือน ${days} วัน`;
  }

}

