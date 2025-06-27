import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { District, Province, Subdistrict } from '../models/province.model';

@Injectable({
  providedIn: 'root'
})
export class AddressService {

  constructor(private http: HttpClient) {
  }

  getProvinces() {
    return this.http.get<Province[]>('/assets/th_provinces.json');
  }

  getDistricts() {
    return this.http.get<District[]>('/assets/th_amphures.json');
  }

  getSubdistricts() {
    return this.http.get<Subdistrict[]>('/assets/th_tambons.json');
  }
}
