import { CivicCategory } from '@/lib/constants';
import { AppIconName } from '@/components/ui/AppIcon';

export interface CivicSubCategory {
  id: string;
  name: string;
  shortName: string;
  officialUrl: string;
  description: string;
}

export interface CivicCategoryDefinition {
  name: CivicCategory;
  tagline: string;
  officialUrl: string;
  subCategories: CivicSubCategory[];
}

export const YANGJU_TAXONOMY: CivicCategoryDefinition[] = [
  {
    name: '일자리·생활',
    tagline: '취업지원 & 생활민원',
    officialUrl: 'https://www.yangju.go.kr/www/selectBbsNttList.do?key=233&bbsNo=63',
    subCategories: [
      {
        id: 'job-center',
        name: '양주일자리센터 & 취업박람회',
        shortName: '일자리센터',
        officialUrl: 'https://www.yangju.go.kr/www/contents.do?key=265',
        description: '일자리종합지원센터, 맞춤형 채용행사, 청년·어르신 취업지원',
      },
      {
        id: 'women-job',
        name: '양주시 여성일·생활균형지원센터',
        shortName: '여성취업',
        officialUrl: 'https://www.yangju.go.kr/woman/index.do',
        description: '경력단절 여성 국비지원 교육, 취업상담, 가사지원',
      },
      {
        id: 'traditional-market',
        name: '덕정·덕계 전통시장 & 골목상권',
        shortName: '전통시장',
        officialUrl: 'https://www.yangju.go.kr/www/contents.do?key=259',
        description: '덕정오일장, 골목형 상점가, 온누리상품권 가맹점',
      },
      {
        id: 'local-currency',
        name: '양주사랑카드(지역화폐) & 착한가격',
        shortName: '지역화폐',
        officialUrl: 'https://www.yangju.go.kr/www/contents.do?key=261',
        description: '양주사랑카드 인센티브, 가맹점 조회, 착한가격업소',
      },
      {
        id: 'civil-library',
        name: '무인민원발급기 & 옥정호수도서관',
        shortName: '민원·도서관',
        officialUrl: 'https://www.libyj.go.kr',
        description: '행정복지센터 무인발급기, 시립도서관 도서대출 및 열람실',
      },
    ],
  },
  {
    name: '교통·주차',
    tagline: '공영주차 & 교통정보',
    officialUrl: 'https://www.yangju.go.kr/www/contents.do?key=288',
    subCategories: [
      {
        id: 'public-parking',
        name: '양주도시공사 공영주차장 & 요금감면',
        shortName: '공영주차장',
        officialUrl: 'https://www.yjuc.or.kr',
        description: '옥정·덕정 공영주차장 위치, 정기권 추첨, 감면 혜택',
      },
      {
        id: 'ddok-bus',
        name: '양주 똑버스(DRT) & 스마트교통',
        shortName: '똑버스(DRT)',
        officialUrl: 'https://www.gtrans.or.kr',
        description: '옥정·삼숭 신도시 수요응답형 똑타 버스 이용 가이드',
      },
      {
        id: 'gtx-c-bus',
        name: '덕정역 GTX-C & 광역급행버스',
        shortName: '전철·광역버스',
        officialUrl: 'https://www.yangju.go.kr/www/contents.do?key=290',
        description: '1호선 덕정역 열차 시간표, G1300번 잠실 직행버스',
      },
      {
        id: 'parking-alarm',
        name: '주정차단속 사전알림 & 유예안내',
        shortName: '주정차알림',
        officialUrl: 'https://www.yangju.go.kr/www/contents.do?key=292',
        description: '불법주정차 단속문자 알림 신청, 점심시간 단속 유예',
      },
      {
        id: 'safe-road',
        name: '어린이보호구역 & 안심통학로',
        shortName: '안심통학로',
        officialUrl: 'https://www.yangju.go.kr/www/contents.do?key=294',
        description: '초등학교 주변 안심 귀갓길, 속도제한 구역 안내',
      },
    ],
  },
  {
    name: '기업경제·농업',
    tagline: '산단지원 & 영농혜택',
    officialUrl: 'https://www.yangju.go.kr/www/contents.do?key=270',
    subCategories: [
      {
        id: 'techno-valley',
        name: '양주테크노밸리 & 은남산단',
        shortName: '테크노밸리',
        officialUrl: 'https://www.yangju.go.kr/www/contents.do?key=272',
        description: '첨단산업단지 입주 분양, 기업 지원 혜택',
      },
      {
        id: 'sme-support',
        name: '소상공인 특례보증 & 창업지원금',
        shortName: '소상공인',
        officialUrl: 'https://www.yangju.go.kr/www/contents.do?key=274',
        description: '경영안정자금 융자, 특례보증 이자차액 보전',
      },
      {
        id: 'farm-machine',
        name: '양주 농기계 대여은행 (임대)',
        shortName: '농기계대여',
        officialUrl: 'https://www.yangju.go.kr/atc/index.do',
        description: '농업기술센터 농기계 임대 신청, 사용료 감면',
      },
      {
        id: 'local-food',
        name: '로컬푸드 직매장 & 영농정착지원',
        shortName: '로컬푸드',
        officialUrl: 'https://www.yangju.go.kr/atc/index.do',
        description: '양주 농특산물 직매장 위치, 청년농업인 영농정착금',
      },
      {
        id: 'corporate-fund',
        name: '중소기업 육성자금 & 수출지원',
        shortName: '기업육성',
        officialUrl: 'https://www.yangju.go.kr/www/contents.do?key=276',
        description: '관내 제조업 기술개발 및 국내외 판로개척 지원',
      },
    ],
  },
  {
    name: '문화·예술',
    tagline: '축제명소 & 시립미술관',
    officialUrl: 'https://www.yangju.go.kr/tour',
    subCategories: [
      {
        id: 'nari-farm',
        name: '양주 나리농원 (천일홍 축제)',
        shortName: '나리농원',
        officialUrl: 'https://www.yangju.go.kr/tour',
        description: '가을 대표 천일홍 축제 개장, 주차장 및 온라인 예매',
      },
      {
        id: 'hoeamsa-site',
        name: '회암사지 & 유네스코 등재',
        shortName: '회암사지',
        officialUrl: 'https://www.yangju.go.kr/museum/index.do',
        description: '회암사지 박물관, 왕실 사찰 역사 체험, 문화재 야행',
      },
      {
        id: 'art-museum',
        name: '장흥관광지 & 시립장욱진·민복진미술관',
        shortName: '시립미술관',
        officialUrl: 'https://www.yangju.go.kr/changucchin/index.do',
        description: '장흥 조각공원, 시립미술관 기획전시 및 도슨트',
      },
    ],
  },
  {
    name: '체육·공원',
    tagline: '체육시설 & 수변공원',
    officialUrl: 'https://www.yangju.go.kr/www/contents.do?key=300',
    subCategories: [
      {
        id: 'sports-center',
        name: '양주 국민체육센터 & 공공체육공원',
        shortName: '체육센터',
        officialUrl: 'https://www.yjuc.or.kr',
        description: '옥정체육공원, 백석체육시설 테니스·축구장 대관',
      },
      {
        id: 'okjeong-park',
        name: '옥정중앙공원 & 독바위공원',
        shortName: '옥정수변공원',
        officialUrl: 'https://www.yangju.go.kr/tour',
        description: '옥정호수 음악분수 운영 일정, 맨발 황톳길 산책로',
      },
      {
        id: 'mountain-trail',
        name: '불곡산 & 감악산 명품 숲길',
        shortName: '불곡산등산로',
        officialUrl: 'https://www.yangju.go.kr/tour',
        description: '양주 진산 불곡산 등산코스 및 유아숲체험원',
      },
    ],
  },
  {
    name: '청소·환경',
    tagline: '폐기물배출 & 친환경',
    officialUrl: 'https://www.yangju.go.kr/www/contents.do?key=310',
    subCategories: [
      {
        id: 'waste-sticker',
        name: '종량제봉투 & 대형폐기물 인터넷배출',
        shortName: '폐기물배출',
        officialUrl: 'https://www.yjuc.or.kr',
        description: '양주도시공사 대형폐기물 스티커 간편 인터넷 배출',
      },
      {
        id: 'recycling-day',
        name: '재활용품 분리배출 요일제',
        shortName: '분리배출',
        officialUrl: 'https://www.yangju.go.kr/www/contents.do?key=312',
        description: '읍면동별 쓰레기 배출 요일, 투명 페트병 무인수거',
      },
      {
        id: 'ev-charging',
        name: '친환경 전기차·수소차 보조금',
        shortName: '전기차보조금',
        officialUrl: 'https://www.yangju.go.kr/www/contents.do?key=314',
        description: '전기차 충전소 위치 안내, 친환경차 구매 보조금',
      },
      {
        id: 'air-quality',
        name: '미세먼지 알리미 & 보건소 방역',
        shortName: '미세먼지·방역',
        officialUrl: 'https://health.yangju.go.kr',
        description: '실시간 양주시 대기질 정보 및 야외 방역소독 신청',
      },
    ],
  },
  {
    name: '주택·재개발',
    tagline: '신도시청약 & 주거복지',
    officialUrl: 'https://www.yangju.go.kr/www/contents.do?key=320',
    subCategories: [
      {
        id: 'okjeong-housing',
        name: '옥정·회천지구 분양 & 청약정보',
        shortName: '신도시청약',
        officialUrl: 'https://apply.lh.or.kr',
        description: 'LH 공공분양, 국민임대, 신혼희망타운 입주자 모집',
      },
      {
        id: 'urban-renewal',
        name: '덕정역세권 도시재생 뉴딜사업',
        shortName: '도시재생',
        officialUrl: 'https://www.yangju.go.kr/www/contents.do?key=322',
        description: '덕정 구도심 상권 활성화 및 주거환경 개선사업',
      },
      {
        id: 'apt-support',
        name: '공동주택 관리지원금 보조',
        shortName: '아파트지원금',
        officialUrl: 'https://www.yangju.go.kr/www/contents.do?key=324',
        description: '노후 아파트 공용시설 유지보수 비용 보조금 지원',
      },
      {
        id: 'rural-housing',
        name: '농어촌 빈집정비 & 슬레이트철거',
        shortName: '노후주택개량',
        officialUrl: 'https://www.yangju.go.kr/www/contents.do?key=326',
        description: '슬레이트 지붕 철거 보조금 및 빈집 철거 지원',
      },
    ],
  },
  {
    name: '재난·민방위',
    tagline: '시민안전 & 비상대피',
    officialUrl: 'https://www.yangju.go.kr/www/contents.do?key=330',
    subCategories: [
      {
        id: 'citizen-insurance',
        name: '양주시민안전보험 (무료 자동가입)',
        shortName: '시민안전보험',
        officialUrl: 'https://www.yangju.go.kr/www/contents.do?key=332',
        description: '양주시민 누구나 자동 가입, 상해·재난 시 최대 2천만원',
      },
      {
        id: 'shelter-heat',
        name: '지진·풍수해 대피소 & 무더위쉼터',
        shortName: '대피소·쉼터',
        officialUrl: 'https://www.yangju.go.kr/www/contents.do?key=334',
        description: '관내 비상대피시설 위치, 어르신 경로당 한파·무더위쉼터',
      },
      {
        id: 'civil-defense',
        name: '민방위 사이버교육 & 훈련일정',
        shortName: '민방위교육',
        officialUrl: 'https://www.yangju.go.kr/www/contents.do?key=336',
        description: '연차별 민방위 교육 일정, 사이버 전자통지서 수령',
      },
      {
        id: 'storm-emergency',
        name: '풍수해·대설 긴급 재난연락망',
        shortName: '재난대책본부',
        officialUrl: 'https://www.yangju.go.kr/www/contents.do?key=338',
        description: '호우·폭설 시 취약도로 통제 현황, 긴급 연락망',
      },
    ],
  },
  {
    name: '복지·돌봄',
    tagline: '영유아·청년·어르신 복지',
    officialUrl: 'https://www.yangju.go.kr/www/contents.do?key=340',
    subCategories: [
      {
        id: 'childcare',
        name: '양주시육아종합지원센터 & 아이사랑',
        shortName: '육아지원센터',
        officialUrl: 'https://www.yjkids.or.kr',
        description: '무료 장난감도서관 대여, 실내놀이터 예약, 부모상담',
      },
      {
        id: 'youth-support',
        name: '양주 청년기본소득 & 월세지원',
        shortName: '청년복지',
        officialUrl: 'https://www.jobaba.net',
        description: '만 24세 청년 분기별 25만원, 무주택 청년 월세 20만원',
      },
      {
        id: 'senior-care',
        name: '어르신 기초연금 & 시니어일자리',
        shortName: '어르신복지',
        officialUrl: 'https://www.yjsenior.or.kr',
        description: '기초연금 자격 안내, 시니어클럽 공익형 일자리 신청',
      },
      {
        id: 'disabled-support',
        name: '장애인 자립지원 & 바우처서비스',
        shortName: '장애인복지',
        officialUrl: 'https://www.yangju.go.kr/www/contents.do?key=344',
        description: '활동지원 서비스, 장애인 휠체어 수리비 지원',
      },
      {
        id: 'crisis-family',
        name: '위기가구 긴급복지 & 무한돌봄',
        shortName: '긴급복지지원',
        officialUrl: 'https://www.yangju.go.kr/www/contents.do?key=346',
        description: '생계·의료 위기 시 신속 지원 제도, 복지사각지대 발굴',
      },
    ],
  },
];
