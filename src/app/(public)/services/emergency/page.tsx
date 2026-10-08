import { Metadata } from 'next';
import EmergencyMapWidget from '@/components/emergency/EmergencyMapWidget';

export const metadata: Metadata = {
  title: '의정부 응급실 안내',
  description: '의정부시 응급의료기관의 위치와 전화번호를 지도에서 확인하세요. 달빛어린이병원·심야약국 등 실시간 운영 여부는 공식 사이트 링크로 확인할 수 있습니다.',
  alternates: {
    canonical: '/services/emergency',
  },
};

export default function EmergencyPage() {
  return (
    <div className="pb-8">
      <EmergencyMapWidget isWidget={false} />
    </div>
  );
}
