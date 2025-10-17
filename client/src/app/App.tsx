import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import "./App.css";
import { AdminLayout, CollectorLayout, UserLayout } from "../layouts";
import TrackerPage from "../modules/collector/pages/TrackerPage";
import ScannerPage from "../modules/collector/pages/ScannerPage";
import SmartBin from "../modules/smart-bin/pages/SmartBin";

const App = () => {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        {/* Admin App Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="home" />} />
          <Route path="home" element={<div className="p-4">Home Page</div>} />
          <Route
            path="leads"
            element={<div className="p-4">SmartBin Leads Page</div>}
          />
        </Route>

        {/* User App Routes */}
        <Route path="/" element={<UserLayout />}>
          <Route index element={<Navigate to="home" />} />
          <Route path="home" element={<div className="p-4">Home Page</div>} />
          <Route
            path="leads"
            element={<div className="p-4">SmartBin Leads Page</div>}
          />
        </Route>

        {/* Collector App Routes */}
        <Route path="/collector" element={<CollectorLayout />}>
          <Route index element={<Navigate to="tracker" />} />
          <Route path="tracker" element={<TrackerPage />} />
          <Route path="scanner" element={<ScannerPage />} />
        </Route>

        <Route path="/smart-bin" element={<SmartBin />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
