import { CivicCategory } from '@/lib/constants';
import { AppIconName } from '@/components/ui/AppIcon';

export interface CivicSubCategory {
  id: string;
  name: string;
  shortName: string;
  officialUrl: string;
  description: string;
  icon?: AppIconName;
}

export interface CivicCategoryDefinition {
  name: CivicCategory;
  tagline: string;
  officialUrl: string;
  icon: AppIconName;
  subCategories: CivicSubCategory[];
}

export const UIJEONGBU_TAXONOMY: CivicCategoryDefinition[] = [
  {
    name: '일자리·생활',
    tagline: '취업지원 & 생활민원',
    officialUrl: 'https://www.ui4u.go.kr/depart/contents.do?mId=0100000000',
    icon: 'file-text',
    subCategories: [
      {
        id: 'job-support',
        name: '일자리 유관기관 & 취업지원',
        shortName: '취업지원',
        officialUrl: 'https://www.ui4u.go.kr/depart/contents.do?mId=0108000000',
        description: '일자리종합지원센터, 채용행사, 장애인 및 계층별 맞춤형 취업지원',
      },
      {
        id: 'happy-dream-job',
        name: '행복드림 일자리사업 (공공근로)',
        shortName: '공공일자리',
        officialUrl: 'https://www.ui4u.go.kr/depart/contents.do?mId=0114000000',
        description: '공공근로사업, 지역공동체 일자리, 청년 인턴십',
      },
      {
        id: 'traditional-market',
        name: '전통시장 & 골목상권',
        shortName: '전통시장',
        officialUrl: 'https://www.ui4u.go.kr/depart/contents.do?mId=0103000000',
        description: '의정부제일시장, 의정부시장, 골목상권 축제 및 온누리상품권',
      },
      {
        id: 'price-good-shop',
        name: '월간물가정보 & 착한가격업소',
        shortName: '물가·착한업소',
        officialUrl: 'https://www.ui4u.go.kr/depart/contents.do?mId=0101000000',
        description: '소비자물가지수, 공공요금동향, 의정부시 착한가격업소 안내',
      },
      {
        id: 'civil-affairs-library',
        name: '시민 생활민원 & 작은도서관',
        shortName: '생활민원·도서관',
        officialUrl: 'https://www.ui4u.go.kr/depart/contents.do?mId=0100000000',
        description: '행정복지센터 무인민원발급, 여권민원, 작은도서관 및 자원봉사',
      },
    ],
  },
  {
    name: '교통·주차',
    tagline: '공영주차 & 교통정보',
    officialUrl: 'https://www.ui4u.go.kr/depart/contents.do?mId=0200000000',
    icon: 'car',
    subCategories: [
      {
        id: 'public-parking',
        name: '공영주차장 & 요금감면',
        shortName: '공영주차장',
        officialUrl: 'https://www.uiuc.or.kr/businessInfo/trafficPage/public/list.do',
        description: '공영주차장 위치, 주차요금표, 50~100% 감면 신청 안내',
      },
      {
        id: 'residential-parking',
        name: '거주자우선주차제 & 나눔주차',
        shortName: '거주자우선주차',
        officialUrl: 'https://www.ui4u.go.kr/depart/contents.do?mId=0205010000',
        description: '거주자우선주차 구획 신청, 공유주차, 내집안주차장 보조금',
      },
      {
        id: 'light-rail',
        name: '의정부 경전철',
        shortName: '경전철',
        officialUrl: 'https://www.ui4u.go.kr/depart/contents.do?mId=0203000000',
        description: '의정부 경전철 운행시간표, 역별 안내, 환승 혜택',
      },
      {
        id: 'railways-gtx',
        name: '광역·일반철도 (GTX-C & 7호선)',
        shortName: '광역철도',
        officialUrl: 'https://www.ui4u.go.kr/depart/contents.do?mId=0212000000',
        description: 'GTX-C노선 의정부역, 7호선 도봉산~옥정 광역철도, 교외선',
      },
      {
        id: 'bus-traffic',
        name: '대중교통 & 버스터미널',
        shortName: '버스·터미널',
        officialUrl: 'https://www.ui4u.go.kr/depart/contents.do?mId=0200000000',
        description: '실시간 버스정보, 시외버스터미널 노선, 불법주정차 단속',
      },
    ],
  },
  {
    name: '기업경제·농업',
    tagline: '상공인지원 & 입찰계약',
    officialUrl: 'https://www.ui4u.go.kr/depart/contents.do?mId=0400000000',
    icon: 'bank',
    subCategories: [
      {
        id: 'small-business-meter',
        name: '소상공인 지원 & 계량기검사',
        shortName: '소상공인·계량기',
        officialUrl: 'https://www.ui4u.go.kr/depart/contents.do?mId=0406000000',
        description: '소기업 운영자금, 소상공인 특례보증, 법정계량기 정기검사',
      },
      {
        id: 'public-procurement',
        name: '공공입찰 & 수의계약',
        shortName: '공공입찰·계약',
        officialUrl: 'https://www.ui4u.go.kr/depart/contents.do?mId=0403000000',
        description: '의정부시 공공발주 입찰, 소액수의계약, 지역업체 우선구매',
      },
      {
        id: 'local-currency',
        name: '의정부 지역화폐 (사랑카드)',
        shortName: '의정부사랑카드',
        officialUrl: 'https://www.ui4u.go.kr/depart/contents.do?mId=0408000000',
        description: '의정부사랑카드 인센티브 충전, 가맹점 등록 및 결제 혜택',
      },
      {
        id: 'social-economy',
        name: '사회적경제 & 미래산업',
        shortName: '사회적경제',
        officialUrl: 'https://www.ui4u.go.kr/depart/contents.do?mId=0407000000',
        description: '사회적기업, 마을기업, 협동조합 지원, 미래산업 육성펀드',
      },
      {
        id: 'urban-agriculture',
        name: '도시농업 & 주말농장',
        shortName: '도시농업',
        officialUrl: 'https://www.ui4u.go.kr/depart/contents.do?mId=0412000000',
        description: '도시농업 주말농장 분양, 의정부 특산물, 농업인 지원',
      },
    ],
  },
  {
    name: '문화·예술',
    tagline: '공연전시 & 도심축제',
    officialUrl: 'https://www.uac.or.kr',
    icon: 'sparkles',
    subCategories: [
      {
        id: 'arts-center-shows',
        name: '예술의전당 기획공연',
        shortName: '예술의전당',
        officialUrl: 'https://www.uac.or.kr/art_perfo/art_perfo_list.php',
        description: '대극장·소극장 12대 정기 라인업(마술피리, 편의점, 모던민요 등)',
      },
      {
        id: 'city-festivals',
        name: '도심 페스티벌 & 거리공연',
        shortName: '도심축제·버스킹',
        officialUrl: 'https://www.ui4u.go.kr/tour/contents.do?mId=0100000000',
        description: 'BMF 블랙뮤직페스티벌, 가을 도심축제, 거리로 나온 예술 버스킹',
      },
      {
        id: 'artcamp-booktalk',
        name: '아트캠프 & 인문학 북토크',
        shortName: '아트캠프·북토크',
        officialUrl: 'https://www.uac.or.kr',
        description: '의정부 아트캠프 블랙(75석), 음악이 흐르는 북토크 ㄱ콘서트',
      },
    ],
  },
  {
    name: '체육·공원',
    tagline: '공공체육 & 힐링공원',
    officialUrl: 'https://www.ui4u.go.kr/depart/contents.do?mId=0500000000',
    icon: 'leaf',
    subCategories: [
      {
        id: 'sports-facilities',
        name: '주요 공공체육시설',
        shortName: '체육시설',
        officialUrl: 'https://www.ui4u.go.kr/depart/contents.do?mId=0501000000',
        description: '공공체육관, 실내빙상장, 배드민턴장, 간이체육시설 예약',
      },
      {
        id: 'parks-forest',
        name: '근린공원 & 도심숲길',
        shortName: '근린공원·산책로',
        officialUrl: 'https://www.ui4u.go.kr/depart/contents.do?mId=0502000000',
        description: '직동근린공원, 추동공원, 중랑천 수변공원, 어린이 소공원',
      },
      {
        id: 'city-athletes',
        name: '직장운동경기부 & 체육대회',
        shortName: '직장운동경기부',
        officialUrl: 'https://www.ui4u.go.kr/depart/contents.do?mId=0503000000',
        description: '사이클·빙상·테니스선수단 현황, 시민 생활체육 대회',
      },
    ],
  },
  {
    name: '청소·환경',
    tagline: '폐기물배출 & 자원순환',
    officialUrl: 'https://www.ui4u.go.kr/depart/contents.do?mId=0600000000',
    icon: 'trash',
    subCategories: [
      {
        id: 'large-waste-stickers',
        name: '종량제봉투 & 대형폐기물',
        shortName: '대형폐기물·스티커',
        officialUrl: 'https://www.ui4u.go.kr/depart/contents.do?mId=0602040000',
        description: '대형폐기물 스티커 수수료, 모바일 빼기 앱 신청, 폐가전 무상수거',
      },
      {
        id: 'waste-recycling',
        name: '생활쓰레기 & 재활용 배출',
        shortName: '생활쓰레기·재활용',
        officialUrl: 'https://www.ui4u.go.kr/depart/contents.do?mId=0602010000',
        description: '요일별 쓰레기 배출시간, 분리배출 요령, 음식물쓰레기 감량',
      },
      {
        id: 'air-eco-car',
        name: '미세먼지 & 친환경차 지원',
        shortName: '미세먼지·친환경차',
        officialUrl: 'https://www.ui4u.go.kr/depart/contents.do?mId=0601120000',
        description: '전기자동차 구매 보조금, 노후경유차 조기폐차, 미세먼지 저감조치',
      },
      {
        id: 'hygiene-food-safety',
        name: '식품·공중위생업소 관리',
        shortName: '식품위생',
        officialUrl: 'https://www.ui4u.go.kr/depart/contents.do?mId=0606000000',
        description: '공중위생업소, 식품위생 검사, 식생활 문화개선 시책',
      },
    ],
  },
  {
    name: '주택·재개발',
    tagline: '주거환경 & 재개발정비',
    officialUrl: 'https://www.ui4u.go.kr/depart/contents.do?mId=0700000000',
    icon: 'home',
    subCategories: [
      {
        id: 'apartment-management',
        name: '공동주택 관리 & 아파트',
        shortName: '공동주택·아파트',
        officialUrl: 'https://www.ui4u.go.kr/depart/contents.do?mId=0701000000',
        description: '아파트 현황, 관리단 구성, 관리인 선임 및 변경신고 절차',
      },
      {
        id: 'housing-welfare-repair',
        name: '주거복지 & 취약계층 집수리',
        shortName: '취약계층 집수리',
        officialUrl: 'https://www.ui4u.go.kr/depart/contents.do?mId=0700000000',
        description: '사랑애(愛) 집고치기 사업, 도배·장판 교체 지원, 주거취약가구 상담',
      },
      {
        id: 'redevelopment-projects',
        name: '재개발 정비사업 & 구역별 현황',
        shortName: '재개발정비사업',
        officialUrl: 'https://www.ui4u.go.kr/depart/contents.do?mId=0705000000',
        description: '장암구역, 가능구역, 중앙구역 등 관내 정비사업 추진 단계',
      },
      {
        id: 'outdoor-advertisement',
        name: '옥외광고물 & 현수막 게시대',
        shortName: '옥외광고물',
        officialUrl: 'https://www.ui4u.go.kr/depart/contents.do?mId=0702000000',
        description: '현수막 지정게시대 신청, 옥외광고물 표시허가 경유제',
      },
    ],
  },
  {
    name: '재난·민방위',
    tagline: '시민안전 & 비상대응',
    officialUrl: 'https://www.ui4u.go.kr/depart/contents.do?mId=0800000000',
    icon: 'shield-alert',
    subCategories: [
      {
        id: 'citizen-safety-insurance',
        name: '시민안전보험 & 재난대비',
        shortName: '시민안전보험',
        officialUrl: 'https://www.ui4u.go.kr/depart/contents.do?mId=0808010000',
        description: '의정부시민 자동가입 시민안전보험, 보장항목 및 청구서류',
      },
      {
        id: 'safe-return-service',
        name: '안심귀가 & 생활안전',
        shortName: '안심귀가서비스',
        officialUrl: 'https://www.ui4u.go.kr/depart/contents.do?mId=0808000000',
        description: '여성·청소년 안심귀가스카우트, 안심귀갓길 비상벨, 자율방범대',
      },
      {
        id: 'civil-defense-shelter',
        name: '민방위 & 비상대피시설',
        shortName: '민방위·대피소',
        officialUrl: 'https://www.ui4u.go.kr/depart/contents.do?mId=0807000000',
        description: '민방위 대원 교육일정, 관내 비상대피시설 위치, 행동요령',
      },
      {
        id: 'natural-disaster-response',
        name: '풍수해 & 자연재해 대비',
        shortName: '자연재해대응',
        officialUrl: 'https://www.ui4u.go.kr/depart/contents.do?mId=0809000000',
        description: '태풍·호우·대설·폭염 시 행동요령, 재난문자 및 예경보 시스템',
      },
    ],
  },
  {
    name: '복지·돌봄',
    tagline: '영유아어르신 & 보건의료',
    officialUrl: 'https://www.ui4u.go.kr/depart/contents.do?mId=0910000000',
    icon: 'heart',
    subCategories: [
      {
        id: 'water-fee-discount',
        name: '생활안정 & 공공요금 감면',
        shortName: '생활안정·요금감면',
        officialUrl: 'https://www.ui4u.go.kr/depart/contents.do?mId=0910000000',
        description: '상수도요금 50% 감면, 취약계층 에너지바우처, 기초생활보장',
      },
      {
        id: 'subfertility-maternal',
        name: '여성·임신출산 & 모자보건',
        shortName: '임신출산·난임',
        officialUrl: 'https://www.ui4u.go.kr/depart/contents.do?mId=0906010000',
        description: '난임시술비 지원사업, 산후조리비 지원, 임산부 영양플러스',
      },
      {
        id: 'emergency-medical-pharmacy',
        name: '응급의료 & 심야약국',
        shortName: '응급의료·심야약국',
        officialUrl: 'https://www.ui4u.go.kr/health/main.do',
        description: '야간·휴일 권역응급의료센터, 달빛어린이병원, 당번 심야약국',
      },
      {
        id: 'health-checkup-senior',
        name: '국가건강검진 & 노인복지',
        shortName: '건강검진·어르신',
        officialUrl: 'https://www.ui4u.go.kr/depart/contents.do?mId=0904000000',
        description: '국가 무료건강검진 대상자 조회, 노인 맞춤돌봄, 기초연금 안내',
      },
      {
        id: 'childcare-youth-support',
        name: '아동·청소년 & 보육료 지원',
        shortName: '아동보육·청소년',
        officialUrl: 'https://www.ui4u.go.kr/depart/contents.do?mId=0902000000',
        description: '어린이집 보육료 지원, 방과후 아동돌봄, 청소년 방과후아카데미',
      },
    ],
  },
];

/**
 * 특정 카테고리 정의를 조회하는 헬퍼 함수
 */
export function getCategoryDefinition(categoryName: string): CivicCategoryDefinition | undefined {
  return UIJEONGBU_TAXONOMY.find((c) => c.name === categoryName);
}
