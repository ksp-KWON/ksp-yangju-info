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
    slug: 'yangju-yes-hospital',
    name: '양주예쓰병원 24시 당직응급실',
    type: 'hospital',
    typeName: '양주시 당직의료기관 (24시간 응급진료)',
    address: '경기도 양주시 고암길 103 (덕정동)',
    tel: '031-825-1119',
    lat: 37.8428,
    lng: 127.0601,
    hours: {
      weekday: '24시간 연중무휴',
      weekend: '24시간 연중무휴',
      holiday: '24시간 연중무휴',
    },
    features: ['24시간 야간진료', '응급실 전용 직통전화', '덕정역 인근'],
    description: '양주시와 당직 의료기관 업무협약을 체결하여 24시간 응급 진료 체계를 갖춘 관내 1차 거점 응급병원입니다. 야간 및 휴일 응급 처치가 가능합니다.',
    departments: ['응급의학과', '정형외과', '내과', '신경외과'],
    parkingInfo: '원내 전용 주차장 완비 (응급환자 무료)',
    emergencyLevel: '양주시 관내 24시 거점의료기관',
  },
  {
    slug: 'korea-armed-forces-yangju-hospital',
    name: '국군양주병원 응급실',
    type: 'hospital',
    typeName: '응급의료시설 (민간 응급진료 연계)',
    address: '경기도 양주시 은현면 평화로 1098',
    tel: '031-857-1119',
    lat: 37.8690,
    lng: 127.0250,
    hours: {
      weekday: '24시간 연중무휴',
      weekend: '24시간 연중무휴',
      holiday: '24시간 연중무휴',
    },
    features: ['24시간 응급실 운영', '중증외상 1차 응급처치', '군경·민간 긴급진료 협력'],
    description: '양주시 북부 권역의 응급의료시설로, 국군 장병 및 긴급 민간 환자 응급 처치 협력 진료를 제공합니다.',
    departments: ['응급의학과', '외과', '정형외과'],
    emergencyLevel: '응급의료시설',
  },
  {
    slug: 'yangju-night-pharmacy-okjeong',
    name: '양주시 옥정 공공심야약국',
    type: 'pharmacy',
    typeName: '양주시 지정 공공심야약국 (새벽 1시까지)',
    address: '경기도 양주시 옥정로 218 (옥정동 중심상가)',
    tel: '031-868-8275',
    lat: 37.8185,
    lng: 127.0910,
    hours: {
      weekday: '09:00 ~ 익일 01:00 (새벽 1시)',
      weekend: '09:00 ~ 익일 01:00 (새벽 1시)',
      holiday: '09:00 ~ 익일 01:00 (연중무휴)',
    },
    features: ['연중무휴 새벽 1시 운영', '처방 조제 및 일반의약품 복약지도', '소아 해열제 상시 구비'],
    description: '양주시와 경기도가 지원하는 공공심야약국으로, 야간 및 공휴일 심야 시간(22:00~01:00)에도 전문 약사가 상주하여 의약품 조제와 복약지도를 제공합니다.',
    departments: ['처방조제', '일반의약품', '동물의약품'],
    emergencyLevel: '공공심야약국',
  },
  {
    slug: 'uijeongbu-st-marys-hospital',
    name: '가톨릭대학교 의정부성모병원 응급의료센터 (인근 3차 권역센터)',
    type: 'hospital',
    typeName: '경기동북부 권역응급의료센터 (인근 3차 대학병원)',
    address: '경기도 의정부시 천보로 271 (금오동)',
    tel: '031-820-3000',
    lat: 37.7584,
    lng: 127.0754,
    hours: {
      weekday: '24시간 연중무휴',
      weekend: '24시간 연중무휴',
      holiday: '24시간 연중무휴',
    },
    features: ['보건복지부 지정 권역응급의료센터', '중증외상·심혈관·뇌혈관 최종 치료', '헬기 이송 패드'],
    description: '양주시민 중 중증 응급 질환(심근경색, 뇌졸중, 중증외상) 발생 시 119 구급대를 통해 우선 이송되는 최상위 3차 권역응급의료센터입니다.',
    departments: ['응급의학과', '심장내과', '신경외과', '소아청소년과', '외과'],
    emergencyLevel: '인근 3차 권역응급의료센터',
  },
  {
    slug: 'uijeongbu-eulji-university-hospital',
    name: '의정부을지대학교병원 응급의료센터 (인근 3차 지역센터)',
    type: 'hospital',
    typeName: '지역응급의료센터 (인근 3차 대학병원)',
    address: '경기도 의정부시 동일로 712 (금오동)',
    tel: '1899-0001',
    lat: 37.7516,
    lng: 127.0631,
    hours: {
      weekday: '24시간 연중무휴',
      weekend: '24시간 연중무휴',
      holiday: '24시간 연중무휴',
    },
    features: ['지역응급의료센터', '최신 스마트 중환자 진료 시스템', '소아응급진료'],
    description: '양주 옥정·회천에서 차량 15~20분 거리로 연결되는 최신 시설의 3차 응급의료센터로 양주시민의 긴급 응급진료를 분담합니다.',
    departments: ['응급의학과', '신경과', '정형외과', '소아청소년과'],
    emergencyLevel: '인근 3차 지역응급의료센터',
  },
];

export function getEmergencyPlaceBySlug(slug: string): EmergencyPlace | undefined {
  return EMERGENCY_PLACES.find((p) => p.slug === slug);
}
