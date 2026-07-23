import { Routes, Route } from 'react-router-dom';
import { ClientHome } from '../pages/client/ClientHome';
import { ClientRequest } from '../pages/client/ClientRequest';
import { ClientTrips } from '../pages/client/ClientTrips';
import { ClientOffers } from '../pages/client/ClientOffers';
import ClientTrack from '../pages/client/ClientTrack';
import ClientRatings from '../pages/client/ClientRatings';
import ClientProfile from '../pages/client/ClientProfile';
import ClientHelp from '../pages/client/ClientHelp';

export const ClientRoutes = () => {
  return (
    <Routes>
      <Route path="/home" element={<ClientHome />} />
      <Route path="/request" element={<ClientRequest />} />
      <Route path="/trips" element={<ClientTrips />} />
      <Route path="/offers" element={<ClientOffers />} />
      <Route path="/track" element={<ClientTrack />} />
      <Route path="/ratings" element={<ClientRatings />} />
      <Route path="/profile" element={<ClientProfile />} />
      <Route path="/help" element={<ClientHelp />} />
    </Routes>
  );
};