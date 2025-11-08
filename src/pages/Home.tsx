import { useAuth } from '../lib/auth.tsx';
import Dashboard from './Dashboard';
import SellerDashboard from './SellerDashboard';

export default function Home() {
  console.log('🏠 HOME COMPONENT RENDERED');
  const { user } = useAuth();
  console.log('🏠 Home user object:', user);
  console.log('🏠 Home user?.role:', user?.role);
  console.log('🏠 Home user?.id:', user?.id);

  if (user?.role === 'provider') {
    console.log('🏠 USER IS PROVIDER - RENDERING SellerDashboard');
    return <SellerDashboard />;
  }

  console.log('🏠 USER IS CLIENT (or no role) - RENDERING Dashboard');
  console.log('🏠 About to render Dashboard component...');
  return <Dashboard />;
}
