import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import { ErrorBoundary } from './components/ErrorBoundary'
import './index.css'
import CreateListing from './pages/CreateListing'
import ListingDetail from './pages/ListingDetail'
import Conversation from './pages/Conversation'
import ProfilePage from './pages/Profile'
import Messages from './pages/Messages'
import TurtlePoints from './pages/TurtlePoints'
import EditListing from './pages/EditListing'
import Favorites from './pages/Favorites'
import Notifications from './pages/Notifications'
import ResetPassword from './pages/ResetPassword'
import ShopkeeperDashboard from './pages/esnaf/ShopkeeperDashboard'
import ShopkeeperTransactions from './pages/esnaf/ShopkeeperTransactions'
import ShopkeeperPackages from './pages/esnaf/ShopkeeperPackages'
import ShopkeeperPayouts from './pages/esnaf/ShopkeeperPayouts'
import AdminDashboard from './pages/admin/AdminDashboard'
import MyTransactions from './pages/MyTransactions'
import MyListings from './pages/MyListings'
import ApplyPoint from './pages/ApplyPoint'
import ComingSoon from './pages/esnaf/ComingSoon'
import AdminComingSoon from './pages/admin/AdminComingSoon'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
        <Route path="/esnaf/dashboard" element={<ShopkeeperDashboard />} />
        <Route path="/esnaf/barkod" element={<ShopkeeperTransactions />} />
        <Route path="/esnaf/paketler" element={<ShopkeeperPackages />} />
        <Route path="/esnaf/odemeler" element={<ShopkeeperPayouts />} />
        <Route path="/esnaf/dogrulananlar" element={<ComingSoon />} />
        <Route path="/esnaf/ayarlar" element={<ComingSoon />} />
        <Route path="/esnaf/destek" element={<ComingSoon />} />
        <Route path="/esnaf/*" element={<Navigate to="/esnaf/dashboard" replace />} />
        
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/finans" element={<AdminComingSoon />} />
        <Route path="/admin/kullanicilar" element={<AdminComingSoon />} />
        <Route path="/admin/sikayetler" element={<AdminComingSoon />} />
        <Route path="/admin/*" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/create-listing" element={<CreateListing />} />
        <Route path="/listing/:id" element={<ListingDetail />} />
        <Route path="/conversation/:id" element={<Conversation />} />
        <Route path="/profile/:id" element={<ProfilePage />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/turtle-points" element={<TurtlePoints />} />
        <Route path="/apply-point" element={<ApplyPoint />} />
        <Route path="/edit-listing/:id" element={<EditListing />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/transactions" element={<MyTransactions />} />
        <Route path="/my-listings" element={<MyListings />} />
        
        {/* Catch-all route for non-existent paths */}
        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
)