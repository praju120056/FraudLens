import { useState } from "react";
import LandingPage from "./components/LandingPage.jsx";
import Dashboard from "./components/Dashboard.jsx";

export default function App() {
  const [mode, setMode] = useState("landing"); // "landing" | "console"
  const [view, setView] = useState("feed");    // "feed" | "workbench" | "metrics"

  const handleLaunchConsole = (targetView = "feed") => {
    setView(targetView);
    setMode("console");
    window.scrollTo(0, 0);
  };

  const handleReturnLanding = () => {
    setMode("landing");
    window.scrollTo(0, 0);
  };

  if (mode === "landing") {
    return <LandingPage onLaunchConsole={handleLaunchConsole} />;
  }

  return (
    <Dashboard
      view={view}
      onViewChange={setView}
      onNavigateLanding={handleReturnLanding}
    />
  );
}
