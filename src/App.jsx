import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import RoleGuard from "./components/RoleGuard";
import Home from "./pages/Home";
import Farmer from "./pages/Farmer";
import Collector from "./pages/Collector";
import Broker from "./pages/Broker";
import Manufacturer from "./pages/Manufacturer";
import Lab from "./pages/Lab";
import "./styles/global.css";

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/"             element={<Home />} />
        <Route path="/farmer"       element={<Farmer />} />
        <Route path="/collector"    element={<RoleGuard role="collector"><Collector /></RoleGuard>} />
        <Route path="/broker"       element={<RoleGuard role="broker"><Broker /></RoleGuard>} />
        <Route path="/manufacturer" element={<RoleGuard role="manufacturer"><Manufacturer /></RoleGuard>} />
        <Route path="/lab"          element={<RoleGuard role="lab"><Lab /></RoleGuard>} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}