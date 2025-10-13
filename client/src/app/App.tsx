import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import "./App.css";

const App = () => {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route
          path="/"
          element={<div className="p-4">Welcome to SmartBin</div>}
        >
          <Route index element={<Navigate to="home" />} />
          <Route path="home" element={<div className="p-4">Home Page</div>} />
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
