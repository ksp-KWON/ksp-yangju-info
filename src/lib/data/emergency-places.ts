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
    name: '양주예쓰병원 당직응급실',
    type: 'hospital',
    typeName: '양주시 당직의료기관 (24시 응급)',
    address: '경기도 양주시 회정로 103 (덕정동)',
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
    emergencyLevel: '양주시 지정 당직응급의료기관',
  },
  {
    slug: 'korea-armed-forces-yangju-hospital',
    name: '국군양주병원 응급실',
    type: 'hospital',
    typeName: '응급의료시설 (민간 응급진료 연계)',
    address: '경기도 양주시 은현면 화합로 1098',
    tel: '031-857-1119',
    lat: 37.8690,
    lng: 127.0250,
    hours: {
      weekday: '24시간 연중무휴',
      weekend: '24시간 연중무휴',
      holiday: '24시간 연중무휴',
    },
    features: ['24시간 응급실 운영', '중증외상 응급처치'],
    description: '양주시 북부 권역의 응급의료시설로, 군 장병 및 긴급 민간 환자 응급 처치 협력 진료를 제공합니다.',
    departments: ['응급의학과', '외과', '정형외과'],
    emergencyLevel: '응급의료시설',
  },
  {
    slug: 'uijeongbu-st-marys-hospital',
    name: '가톨릭대학교 의정부성모병원 응급의료센터',
    type: 'hospital',
    typeName: '경기동북부 권역응급의료센터 (3차 대학병원)',
    address: '경기도 의정부시 천보로 271 (금오동)',
    tel: '031-820-3000',
    lat: 37.7584,
    lng: 127.0754,
    hours: {
      weekday: '24시간 연중무휴',
      weekend: '24시간 연중무휴',
      holiday: '24시간 연중무휴',
    },
    features: ['보건복지부 지정 권역응급의료센터', '중증외상·뇌혈관·심혈관 최종 치료', '헬기 이송 패드'],
    description: '양주시민의 중증 응급 질환(심근경색, 뇌졸중, 중증외상) 발생 시 119 구급대를 통해 우선 이송되는 최상위 3차 권역응급의료센터입니다.',
    departments: ['응급의학과', '심장내과', '신경외과', '소아청소년과', '외과'],
    emergencyLevel: '권역응급의료센터',
  },
  {
    slug: 'uijeongbu-eulji-university-hospital',
    name: '의정부을지대학교병원 응급의료센터',
    type: 'hospital',
    typeName: '지역응급의료센터 (3차 대학병원)',
    address: '경기도 의정부시 동일로 712 (금오동)',
    tel: '1899-0001',
    lat: 37.7516,
    lng: 127.0631,
    hours: {
      weekday: '24시간 연중무휴',
      weekend: '24시간 연중무휴',
      holiday: '24시간 연중무휴',
    },
    features: ['지역응급의료센터', '최신 스마트 중환자 진료 시스템'],
    description: '양주 옥정·회천에서 차량 15~20분 거리로 연결되는 최신 시설의 3차 응급의료센터로 양주시민의 긴급 응급진료를 분담합니다.',
    departments: ['응급의학과', '신경과', '정형외과', '소아청소년과'],
    emergencyLevel: '지역응급의료센터',
  },
];

export function getEmergencyPlaceBySlug(slug: string): EmergencyPlace | undefined {
  return EMERGENCY_PLACES.find((p) => p.slug === slug);
}
