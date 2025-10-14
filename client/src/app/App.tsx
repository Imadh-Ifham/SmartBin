import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import "./App.css";
import { AdminLayout, UserLayout } from "../layouts";
import CollectorHome from "../modules/collector/pages/CollectorHome";

const App = () => {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="home" />} />
          <Route path="home" element={<div className="p-4">Home Page</div>} />
          <Route
            path="leads"
            element={<div className="p-4">SmartBin Leads Page</div>}
          />
        </Route>
        <Route path="/" element={<UserLayout />}>
          <Route index element={<Navigate to="home" />} />
          <Route path="home" element={<div className="p-4">Home Page</div>} />
          <Route
            path="leads"
            element={<div className="p-4">SmartBin Leads Page</div>}
          />
        </Route>
        <Route path="/collector" element={<UserLayout />}>
          <Route index element={<Navigate to="home" />} />
          <Route path="home" element={<CollectorHome />} />
          <Route
            path="leads"
            element={<div className="p-4">SmartBin Leads Page</div>}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
