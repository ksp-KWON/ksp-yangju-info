/**
 * src/lib/data/emergency-places.ts
 * 의정부시 관내 응급실 마스터 데이터(공식 출처 대조 후 확장 예정)
 * (프로그래매틱 SEO 및 개별 상세페이지 SSG 렌더링용)
 */

export interface EmergencyPlace {
  slug: string;
  name: string;
  type: 'hospital' | 'pharmacy' | 'moonlight';
  typeName: string;
  address: string;
  tel: string;
  lat: number;
  lng: number;
  hours: {
    weekday: string;
    weekend: string;
    holiday: string;
  };
  features: string[];
  description: string;
  departments?: string[];
  parkingInfo?: string;
  emergencyLevel?: string;
}

export const EMERGENCY_PLACES: EmergencyPlace[] = [
  {
    slug: 'uijeongbu-st-marys-hospital',
    name: '가톨릭대학교 의정부성모병원 응급의료센터',
    type: 'hospital',
    typeName: '권역응급의료센터',
    address: '경기도 의정부시 천보로 271 (금오동)',
    tel: '031-820-3000',
    lat: 37.7584,
    lng: 127.0754,
    hours: {
      weekday: '24시간 연중무휴',
      weekend: '24시간 연중무휴',
      holiday: '24시간 연중무휴',
    },
    features: [],
    description: '가톨릭대학교 의정부성모병원 응급의료센터의 위치와 전화번호 안내입니다. 응급 상황에서는 119에 먼저 연락하시고, 진료 가능 여부는 병원에 전화로 확인하세요.',
  },
  {
    slug: 'uijeongbu-eulji-university-hospital',
    name: '의정부을지대학교병원 응급의료센터',
    type: 'hospital',
    typeName: '지역응급의료센터',
    address: '경기도 의정부시 동일로 712 (금오동)',
    tel: '1899-0001',
    lat: 37.7516,
    lng: 127.0631,
    hours: {
      weekday: '24시간 연중무휴',
      weekend: '24시간 연중무휴',
      holiday: '24시간 연중무휴',
    },
    features: [],
    description: '의정부을지대학교병원 응급의료센터의 위치와 전화번호 안내입니다. 응급 상황에서는 119에 먼저 연락하시고, 진료 가능 여부는 병원에 전화로 확인하세요.',
  },
];

export function getEmergencyPlaceBySlug(slug: string): EmergencyPlace | undefined {
  return EMERGENCY_PLACES.find((p) => p.slug === slug);
}
