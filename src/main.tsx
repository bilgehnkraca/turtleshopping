import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import './index.css'
import CreateListing from './pages/CreateListing'
import ListingDetail from './pages/ListingDetail'
import Conversation from './pages/Conversation'
import ProfilePage from './pages/Profile'
import Messages from './pages/Messages'
import TurtlePoints from './pages/TurtlePoints'
import ApplyPoint from './pages/ApplyPoint'
import Admin from './pages/Admin'
import EditListing from './pages/EditListing'
import PointPanel from './pages/PointPanel'
import ListingSubmitted from './pages/ListingSubmitted'
import Favorites from './pages/Favorites'
import Notifications from './pages/Notifications'
import ResetPassword from './pages/ResetPassword'
import ShopkeeperDashboard from './pages/esnaf/ShopkeeperDashboard'
import ShopkeeperTransactions from './pages/esnaf/ShopkeeperTransactions'
import ShopkeeperPackages from './pages/esnaf/ShopkeeperPackages'
import ShopkeeperPayouts from './pages/esnaf/ShopkeeperPayouts'
import AdminDashboard from './pages/admin/AdminDashboard'
import MyTransactions from './pages/MyTransactions'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/esnaf/dashboard" element={<ShopkeeperDashboard />} />
        <Route path="/esnaf/barkod" element={<ShopkeeperTransactions />} />
        <Route path="/esnaf/paketler" element={<ShopkeeperPackages />} />
        <Route path="/esnaf/odemeler" element={<ShopkeeperPayouts />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
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
        <Route path="/admin" element={<Admin />} />
        <Route path="/edit-listing/:id" element={<EditListing />} />
        <Route path="/point-panel" element={<PointPanel />} />
        <Route path="/listing-submitted" element={<ListingSubmitted />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/transactions" element={<MyTransactions />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
)