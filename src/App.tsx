import { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from './lib/auth.tsx';
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
import Favorites from "./pages/Favorites";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <ScrollToTopButton />
        <BrowserRouter>
          <ScrollToTop />
          <SearchProvider>
            <ProjectSearchProvider>
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
                <Route path="/services/searched" element={<AllServicesPage />} />
                <Route path="/recent-activity" element={<RecentActivityPage />} />
                <Route path="/user-profile" element={<UserProfile />} />
                <Route path="/account-settings" element={<AccountSettings />} />
                <Route path="/payment-methods" element={<PaymentMethods />} />
                <Route path="/favorites" element={<Favorites />} />
                <Route path="/seller/earnings" element={<SellerEarnings />} />
                <Route path="/seller/manage-orders" element={<SellerManageOrders />} />
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
                <Route path="/messages" element={<MessagesPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
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
            </ProjectSearchProvider>
          </SearchProvider>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
