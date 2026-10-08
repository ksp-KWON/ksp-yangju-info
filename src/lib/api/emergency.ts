import { EMERGENCY_PLACES } from '@/lib/data/emergency-places';

export interface EmergencyItem {
  id: string;
  name: string;
  address: string;
  tel: string;
  lat: number;
  lng: number;
}

export type TabType = 'er' | 'pharmacy';

export function getEmergencyItems(tab: TabType): EmergencyItem[] {
  const places = EMERGENCY_PLACES.filter((p) =>
    tab === 'er' ? p.type === 'hospital' || p.type === 'moonlight' : p.type === 'pharmacy'
  );

  return places.map((p) => ({
    id: p.slug,
    name: p.name,
    address: p.address,
    tel: p.tel,
    lat: p.lat,
    lng: p.lng,
  }));
}
