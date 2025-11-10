import { DashboardHeader } from './DashboardHeader';
import { MegaCategoriesMenu } from './MegaCategoriesMenu';
import { MobileBottomNavbar } from './MobileBottomNavbar';

interface SellerDashboardLayoutProps {
  children: React.ReactNode;
}

export function SellerDashboardLayout({ children }: SellerDashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <MegaCategoriesMenu />
      <MobileBottomNavbar />
      {children}
    </div>
  );
}
