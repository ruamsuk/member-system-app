export interface Province {
  id: number;
  name_th: string;
  name_en: string;
}

export interface District {
  id: number;
  name_th: string;
  name_en: string;
  province_id: number;
}

export interface Subdistrict {
  id: number;
  name_th: string;
  name_en: string;
  amphure_id: number;
  zip_code: string;
}

export interface AddressValue {
  provinceId: number | null;
  districtId: number | null;
  subdistrictId: number | null;
  zipCode: string | null;
}
