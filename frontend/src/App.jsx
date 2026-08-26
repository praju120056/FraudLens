import { useState } from "react";
import Dashboard from "./components/Dashboard.jsx";

export default function App() {
  const [view, setView] = useState("analyzer");
  return <Dashboard view={view} onViewChange={setView} />;
}
