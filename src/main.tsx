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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
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
      </Routes>
    </BrowserRouter>
  </StrictMode>
)