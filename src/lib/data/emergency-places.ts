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
    typeName: '양주시 관내 응급의료시설 (민간 응급진료 연계)',
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
    emergencyLevel: '양주시 관내 응급의료시설',
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
    slug: 'yangju-baekseok-night-clinic',
    name: '양주시 백석 365 야간진료의원',
    type: 'hospital',
    typeName: '양주시 서부권역 야간·휴일 진료기관',
    address: '경기도 양주시 백석읍 중앙로 185',
    tel: '031-879-8275',
    lat: 37.8090,
    lng: 126.9670,
    hours: {
      weekday: '08:30 ~ 21:00 (야간진료)',
      weekend: '09:00 ~ 18:00 (토·일 진료)',
      holiday: '09:00 ~ 13:00 (공휴일 진료)',
    },
    features: ['평일 야간 9시까지 진료', '수액치료 및 급성 통증 처치', '소아·내과 진료'],
    description: '백석읍, 광적면 등 양주시 서부 권역 주민들을 위한 야간·공휴일 1차 의료기관으로 퇴근 후 진료 및 휴일 응급 처치를 지원합니다.',
    departments: ['내과', '이비인후과', '소아청소년과'],
    emergencyLevel: '야간·휴일 진료기관',
  },
  {
    slug: 'yangju-deokjeong-night-pharmacy',
    name: '양주시 덕정 온누리 심야연장약국',
    type: 'pharmacy',
    typeName: '양주시 지정 심야연장약국',
    address: '경기도 양주시 화합로 1420 (덕정역 앞)',
    tel: '031-858-3321',
    lat: 37.8425,
    lng: 127.0610,
    hours: {
      weekday: '08:30 ~ 23:00 (밤 11시)',
      weekend: '09:00 ~ 22:00 (밤 10시)',
      holiday: '09:00 ~ 22:00 (연중무휴)',
    },
    features: ['덕정역 도보 1분', '연중무휴 밤 11시 운영', '응급 상비의약품 구비'],
    description: '덕정역 인근에 위치하여 퇴근길 및 심야 시간대 양주시민들의 안전한 의약품 구입을 돕는 심야 연장 운영 약국입니다.',
    departments: ['일반의약품', '처방조제', '의약외품'],
    emergencyLevel: '심야연장약국',
  },
];

export function getEmergencyPlaceBySlug(slug: string): EmergencyPlace | undefined {
  return EMERGENCY_PLACES.find((p) => p.slug === slug);
}
