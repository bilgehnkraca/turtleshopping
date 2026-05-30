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
      </Routes>
    </BrowserRouter>
  </StrictMode>
)