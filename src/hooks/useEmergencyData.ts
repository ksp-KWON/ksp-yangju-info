import { useState } from 'react';
import { EmergencyItem, TabType, getEmergencyItems } from '@/lib/api/emergency';

export function useEmergencyData(initialTab: TabType = 'er') {
  const [activeTab, setActiveTabState] = useState<TabType>(initialTab);
  const [selectedItem, setSelectedItem] = useState<EmergencyItem | null>(null);

  const setActiveTab = (tab: TabType) => {
    setActiveTabState(tab);
    setSelectedItem(null);
  };

  const currentData = getEmergencyItems(activeTab);

  return {
    activeTab,
    setActiveTab,
    selectedItem,
    setSelectedItem,
    currentData,
  };
}
