import { Routes, Route } from 'react-router-dom';
import DriverHome from '../pages/DriverHome';
import { DriverTrips } from '../pages/DriverTrips';
import { AvailableShipments } from '../pages/driver/AvailableShipments';
import { DriverHistory } from '../pages/DriverHistory';
import DriverRatings from '../pages/driver/DriverRatings';
import DriverEarnings from '../pages/driver/DriverEarnings';
import DriverProfile from '../pages/driver/DriverProfile';
import DriverHelp from '../pages/driver/DriverHelp';

export const DriverRoutes = () => {
  return (
    <Routes>
      <Route path="/home" element={<DriverHome />} />
      <Route path="/trips" element={<DriverTrips />} />
      <Route path="/available" element={<AvailableShipments />} />
      <Route path="/history" element={<DriverHistory />} />
      <Route path="/ratings" element={<DriverRatings />} />
      <Route path="/earnings" element={<DriverEarnings />} />
      <Route path="/profile" element={<DriverProfile />} />
      <Route path="/help" element={<DriverHelp />} />
    </Routes>
  );
};