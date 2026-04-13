import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import PatientDashboard from './pages/PatientDashboard';
import MedicalRecords from './pages/MedicalRecords';
import DoctorRecords from './pages/DoctorRecords';
import HealthVitals from './pages/HealthVitals';
import NewRecord from './pages/NewRecord';
import Profile from './pages/Profile';

const AppContent: React.FC = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            {/* Role: Admin */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/doctors" element={<AdminDashboard />} />
              <Route path="/admin/patients" element={<AdminDashboard />} />
            </Route>

            {/* Role: Doctor */}
            <Route element={<ProtectedRoute allowedRoles={['doctor']} />}>
              <Route path="/doctor" element={<DoctorDashboard />} />
              <Route path="/doctor/patients" element={<DoctorDashboard />} />
              <Route path="/doctor/records" element={<DoctorRecords />} />
              <Route path="/doctor/records/new" element={<NewRecord />} />
            </Route>

            {/* Role: Patient */}
            <Route element={<ProtectedRoute allowedRoles={['patient', 'doctor', 'admin']} />}>
              <Route path="/patient" element={<PatientDashboard />} />
              <Route path="/patient/records" element={<MedicalRecords />} />
              <Route path="/patient/vitals" element={<HealthVitals />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
};

export default App;
