import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./components/Dashboard.jsx";
import PositionDetail from "./components/PositionDetail.jsx";
import AddPositionForm from "./components/AddPositionForm.jsx";
import { useWebSocket } from "./hooks/useWebSocket.js";

function AppInner() {
  useWebSocket();
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/position/:id" element={<PositionDetail />} />
      <Route path="/add" element={<AddPositionForm />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}
