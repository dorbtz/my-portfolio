import { Routes, Route, Navigate } from "react-router-dom";
import ProjectsAdmin from "./pages/admin/ProjectsAdmin";
import Login from "./pages/admin/Login";
import AdminRoute from "./components/AdminRoute";
import Projects from "./components/Projects";
import ProjectsPage from "./pages/Projects";

import Hero from "./components/Hero";
import About from "./components/About";
import Skills from "./components/Skills";
import Contact from "./components/Contact";
import ProjectDetail from "./pages/projects/ProjectDetail";

export default function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <>
            <Hero />
            <About />
            <Projects />
            <Skills />
            <Contact />
          </>
        }
      />
      <Route path="/projects" element={<ProjectsPage />} />
      <Route path="/projects/:slug" element={<ProjectDetail />} />
      <Route path="/admin/login" element={<Login />} />
      <Route
        path="/admin/projects"
        element={
          <AdminRoute>
            <ProjectsAdmin />
          </AdminRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
