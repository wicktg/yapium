import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import HopeHome from "./components/HopeHome";
import UserDashboard from "./pages/UserDashboard";
import ProjectIrys from "./pages/ProjectIrys";
import ProjectUnion from "./pages/ProjectUnion";
import ProjectMonad from "./pages/ProjectMonad";
import ProjectBillions from "./pages/ProjectBillions";
import ProjectBoundless from "./pages/ProjectBoundless";
import ProjectPortalBTC from "./pages/ProjectPortalBTC";
import ProjectHana from "./pages/ProjectHana";
import ProjectCysic from "./pages/ProjectCysic";
import reportWebVitals from "./reportWebVitals";

const router = createBrowserRouter([
  { path: "/", element: <HopeHome /> },
  { path: "/u/:username", element: <UserDashboard /> },
  { path: "/p/irys/:username", element: <ProjectIrys /> },
  { path: "/p/union/:username", element: <ProjectUnion /> },
  { path: "/p/monad/:username", element: <ProjectMonad /> },
  { path: "/p/boundless/:username", element: <ProjectBoundless /> },
  { path: "/p/billions/:username", element: <ProjectBillions /> },
  { path: "/p/portaltobtc/:username", element: <ProjectPortalBTC /> },
  { path: "/p/cysic/:username", element: <ProjectCysic /> },
  { path: "/p/hana/:username", element: <ProjectHana /> },
]);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);

reportWebVitals();
