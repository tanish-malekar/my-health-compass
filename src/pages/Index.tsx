import { AppProvider, useAppState } from '@/hooks/useAppState';
import TopBar from '@/components/TopBar';
import BottomTabs from '@/components/BottomTabs';
import RoutineTab from '@/components/RoutineTab';
import LogTab from '@/components/LogTab';
import SummaryTab from '@/components/SummaryTab';

function AppContent() {
  const { activeTab } = useAppState();

  return (
    <div className="flex flex-col min-h-screen max-w-lg mx-auto bg-background">
      <TopBar />
      <main className="flex-1 overflow-y-auto px-4 pt-4">
        {activeTab === 'routine' && <RoutineTab />}
        {activeTab === 'log' && <LogTab />}
        {activeTab === 'summary' && <SummaryTab />}
      </main>
      <BottomTabs />
    </div>
  );
}

const Index = () => (
  <AppProvider>
    <AppContent />
  </AppProvider>
);

export default Index;
