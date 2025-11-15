import { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from './lib/auth.tsx';
import { SearchProvider } from './contexts/SearchContext';
import { ProjectSearchProvider } from './contexts/ProjectSearchContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminProtectedRoute } from './components/AdminProtectedRoute';
import { ScrollToTop } from './components/ScrollToTop';
import { ScrollToTopButton } from './components/ScrollToTopButton';
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";
import SignupFreelancer from "./pages/SignupFreelancer";
import SearchResults from "./pages/SearchResults";
import ProjectSearchResults from "./pages/ProjectSearchResults";
import PostProject from "./pages/PostProject";
import CreateService from "./pages/CreateService";
import MyOrders from "./pages/MyOrders";
import SavedServices from "./pages/SavedServices";
import SellerEarnings from './pages/SellerEarnings';
import SellerManageOrders from './pages/SellerManageOrders';
import SellerUpdateProfile from './pages/SellerUpdateProfile';
import SellerServices from './pages/SellerServices';
import AddPortfolio from './pages/AddPortfolio';
import ManagePortfolio from './pages/ManagePortfolio';
import SellerPaymentMethods from './pages/SellerPaymentMethods';
import PaymentHistory from "./pages/PaymentHistory";
import AllServicesPage from "./pages/AllServicesPage";
import RecentActivityPage from "./pages/RecentActivityPage";
import UserProfile from "./pages/UserProfile";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import BidProject from "./pages/BidProject";
import MyProjectsPage from "./pages/MyProjectsPage";
import AccountSettings from "./pages/AccountSettings";
import PaymentMethods from "./pages/PaymentMethods";
import Dashboard from "./pages/Dashboard";
import SellerProfile from "./pages/SellerProfile";
import MessagesPage from "./pages/Messages";
import NotificationsPage from "./pages/Notifications";
import SellerDashboard from "./pages/SellerDashboard";
import AdminPanel from "./pages/AdminPanel";
import AuthCallback from "./pages/AuthCallback";
import VerificationSuccess from "./pages/VerificationSuccess";
import AdminSignup from "./pages/AdminSignup";
import ServiceDetail from "./pages/ServiceDetail";
import Home from "./pages/Home";
import TokenPurchasePage from "./pages/TokenPurchasePage";
import SellerWallet from "./pages/SellerWallet";
import SellerMyBids from "./pages/SellerMyBids";
import Plans from "./pages/Plans";
import OrderDeliveryPage from "./pages/OrderDeliveryPage";
import BidDetailPage from "./pages/BidDetailPage";
import KYCVerification from "./pages/KYCVerification";
import AdminKYC from "./pages/AdminKYC";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import CodeOfConductPage from "./pages/CodeOfConductPage";
import InfoPage from "./pages/InfoPage";
import { MobileBottomNavbar } from "./components/MobileBottomNavbar";
import { SellerMobileBottomNavbar } from "./components/SellerMobileBottomNavbar";
import { supabase } from './lib/supabase';

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <BrowserRouter>
      <ScrollToTop />
      <SearchProvider>
        <ProjectSearchProvider>
          <>
            <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/auth/verification-success" element={<VerificationSuccess />} />
                <Route path="/admin/signup" element={<AdminSignup />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup/freelancer" element={<SignupFreelancer />} />
                <Route path="/searchresults" element={<SearchResults />} />
                <Route path="/project-search" element={<ProjectSearchResults />} />
                <Route path="/post-project" element={<PostProject />} />
                <Route
                  path="/my-projects"
                  element={
                    <ProtectedRoute>
                      <MyProjectsPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="/create-service" element={<CreateService />} />
                <Route path="/my-orders" element={<MyOrders />} />
                <Route path="/saved-services" element={<SavedServices />} />
                <Route path="/payment-history" element={<PaymentHistory />} />
                <Route path="/services/just-for-you" element={<AllServicesPage />} />
                <Route path="/services/featured" element={<AllServicesPage />} />
                <Route path="/plans" element={<Plans />} />
                <Route path="/services/searched" element={<AllServicesPage />} />
                <Route path="/recent-activity" element={<RecentActivityPage />} />
                <Route path="/user-profile" element={<UserProfile />} />
                <Route path="/account-settings" element={<AccountSettings />} />
                <Route path="/payment-methods" element={<PaymentMethods />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/code-of-conduct" element={<CodeOfConductPage />} />
                <Route path="/info/:slug" element={<InfoPage />} />
                <Route path="/seller/earnings" element={<SellerEarnings />} />
                <Route path="/seller/manage-orders" element={<SellerManageOrders />} />
                <Route 
                  path="/seller/tokens" 
                  element={
                    <ProtectedRoute>
                      <TokenPurchasePage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/seller/wallet" 
                  element={
                    <ProtectedRoute>
                      <SellerWallet />
                    </ProtectedRoute>
                  }
                />
                <Route 
                  path="/seller/my-bids" 
                  element={
                    <ProtectedRoute>
                      <SellerMyBids />
                    </ProtectedRoute>
                  }
                />
                <Route path="/seller/update-profile" element={<SellerUpdateProfile />} />
                <Route path="/seller/services" element={<SellerServices />} />
                <Route path="/seller/add-portfolio" element={<AddPortfolio />} />
                <Route path="/seller/portfolio" element={<ManagePortfolio />} />
                <Route path="/seller/payment-methods" element={<SellerPaymentMethods />} />
                <Route
                  path="/home/:userid"
                  element={
                    <ProtectedRoute>
                      <Home />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/home/sellers/:userid"
                  element={
                    <ProtectedRoute>
                      <SellerDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route path="/seller/:id" element={<SellerProfile />} />
                <Route path="/service/:id" element={<ServiceDetail />} />
                <Route
                  path="/order/:id/delivery"
                  element={
                    <ProtectedRoute>
                      <OrderDeliveryPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/project/:id"
                  element={
                    <ProtectedRoute>
                      <ProjectDetailPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/project/:id/bid"
                  element={
                    <ProtectedRoute>
                      <BidProject />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/project/:projectId/bid/:bidId"
                  element={
                    <ProtectedRoute>
                      <BidDetailPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="/messages" element={<MessagesPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route
                  path="/kyc-verification"
                  element={
                    <ProtectedRoute>
                      <KYCVerification />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/kyc"
                  element={
                    <AdminProtectedRoute>
                      <AdminKYC />
                    </AdminProtectedRoute>
                  }
                />
                <Route path="/admin/protectedroute/providershub/login" element={<AdminLogin />} />
                <Route
                  path="/admin/protectedroute/providershub"
                  element={
                    <AdminProtectedRoute>
                      <AdminPanel />
                    </AdminProtectedRoute>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            {user && (
              user.role === 'provider' ? <SellerMobileBottomNavbar /> : <MobileBottomNavbar />
            )}
          </>
        </ProjectSearchProvider>
      </SearchProvider>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <AnalyticsInjector />
        <Toaster />
        <Sonner />
        <ScrollToTopButton />
        <AppRoutes />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

// Inject analytics tags once on initial load
const AnalyticsInjector = () => {
  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.from('platform_settings').select('*').order('updated_at', { ascending: false }).limit(1);
        const row: any = data && data[0];
        if (!row) return;

        // Facebook Pixel
        if (row.fb_pixel_id && !document.getElementById('fb-pixel')) {
          (function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
            if (f.fbq) return; n = f.fbq = function () { (n as any).callMethod ? (n as any).callMethod.apply(n, arguments) : (n as any).queue.push(arguments); };
            if (!(f as any)._fbq) (f as any)._fbq = n; (n as any).push = (n as any); (n as any).loaded = !0; (n as any).version = '2.0'; (n as any).queue = [];
            t = b.createElement(e); t.async = !0; t.src = 'https://connect.facebook.net/en_US/fbevents.js'; t.id = 'fb-pixel';
            s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
          })(window, document, 'script', 0);
          (window as any).fbq('init', row.fb_pixel_id);
          (window as any).fbq('track', 'PageView');
        }

        // Google Tag Manager
        if (row.gtm_id && !document.getElementById('gtm-script')) {
          const s = document.createElement('script'); s.id = 'gtm-script'; s.innerHTML = ` (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${row.gtm_id}');`;
          document.head.appendChild(s);
          const nos = document.createElement('noscript'); nos.id = 'gtm-noscript'; nos.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${row.gtm_id}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
          document.body.appendChild(nos);
        }

        // Google Analytics (GA4)
        if (row.ga_measurement_id && !document.getElementById('ga4-script')) {
          const s1 = document.createElement('script'); s1.async = true; s1.src = `https://www.googletagmanager.com/gtag/js?id=${row.ga_measurement_id}`; s1.id = 'ga4-script';
          const s2 = document.createElement('script'); s2.innerHTML = `window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${row.ga_measurement_id}');`;
          document.head.appendChild(s1); document.head.appendChild(s2);
        }
      } catch {}
    })();
  }, []);
  return null;
};

// end analytics injector
