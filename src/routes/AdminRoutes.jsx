import { Routes, Route } from 'react-router-dom';
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { AdminShipments } from '../pages/admin/AdminShipments';
import { AdminDrivers } from '../pages/admin/AdminDrivers';
import { AdminClients } from '../pages/admin/AdminClients';

export const AdminRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<AdminDashboard />} />
      <Route path="/shipments" element={<AdminShipments />} />
      <Route path="/drivers" element={<AdminDrivers />} />
      <Route path="/clients" element={<AdminClients />} />
    </Routes>
  );
};