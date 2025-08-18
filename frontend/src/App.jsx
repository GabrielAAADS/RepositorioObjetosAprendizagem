import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Login from './pages/Login';
import Register from './pages/Register';

import Home from './pages/Home';    
import About from './pages/About';
import Help from './pages/Help';
import Contact from './pages/Contact';

import Dashboard from './pages/Dashboard';
import CreateObject from './pages/CreateObject';
import SearchObjects from './pages/SearchObjects';

import PrivateRoute from './components/PrivateRoute';
import SiteLayout from './layouts/SiteLayout';
import ObjectDetails from './pages/ObjectDetails';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<SiteLayout />}>
          <Route index element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/help" element={<Help />} />
          <Route path="/contact" element={<Contact />} />

          <Route element={<PrivateRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/objects/new" element={<CreateObject />} />
            <Route path="/objects/:id" element={<ObjectDetails />} />
            <Route path="/search" element={<SearchObjects />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
