
import { ReactNode } from 'react';
import Navbar from './Navbar';
import { MobileNavigation } from '@/components/mobile/MobileNavigation';
import { useResponsive } from '@/hooks/useResponsive';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const { isMobile } = useResponsive();

  return (
    <div className="min-h-screen flex flex-col w-full bg-fantasy-gradient bg-fantasy-dark">
      <Navbar />
      <div className="flex flex-1 w-full pt-14">
        <main className={`flex-1 p-4 ${isMobile ? 'pb-20 overflow-y-auto' : 'pb-8'}`}>
          {children}
        </main>
      </div>
      {isMobile && <MobileNavigation />}
    </div>
  );
};

export default MainLayout;
