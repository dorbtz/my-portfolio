import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/admin/Login";
import AdminRoute from "./components/AdminRoute";
import Projects from "./components/Projects";
import ProjectsPage from "./pages/Projects";

import Hero from "./components/Hero";
import About from "./components/About";
import Skills from "./components/Skills";
import Contact from "./components/Contact";
import ProjectDetail from "./pages/projects/ProjectDetail";
import SectionDivider from "./components/SectionDivider";
// Round 20: mount once at the routes level so every cross-route jump
// (admin card click, breadcrumb, sign-out redirect, etc.) starts at the
// top of the destination page instead of mid-scroll.
import ScrollToTop from "./components/ScrollToTop";

// Site-content CMS — lazy-loaded so it doesn't bloat the homepage bundle.
// Each admin page is its own chunk; Suspense fallback is a tiny inline message.
const ContentLanding       = lazy(() => import("./features/content/admin/ContentLanding"));
const HeroContentAdmin     = lazy(() => import("./features/content/admin/HeroContentAdmin"));
const AboutContentAdmin    = lazy(() => import("./features/content/admin/AboutContentAdmin"));
const SkillsContentAdmin   = lazy(() => import("./features/content/admin/SkillsContentAdmin"));
const ProjectsCopyAdmin    = lazy(() => import("./features/content/admin/ProjectsCopyAdmin"));
const ContactContentAdmin  = lazy(() => import("./features/content/admin/ContactContentAdmin"));
// Round 64 — Phase B of the hidden D-B-T admin entry: editable
// sequence + gap configuration.
const AdminContentAdmin    = lazy(() => import("./features/content/admin/AdminContentAdmin"));

// Round 14 admin hub + side panels — also lazy-loaded.
const ProjectsAdmin        = lazy(() => import("./pages/admin/ProjectsAdmin"));
const AdminDashboard       = lazy(() => import("./features/admin-dashboard/admin/AdminDashboard"));
const MessagesAdmin        = lazy(() => import("./features/admin-messages/admin/MessagesAdmin"));
const AllowlistAdmin       = lazy(() => import("./features/admin-allowlist/admin/AllowlistAdmin"));
const HealthAdmin          = lazy(() => import("./features/admin-health/admin/HealthAdmin"));
const AccountAdmin         = lazy(() => import("./features/admin-account/admin/AccountAdmin"));
// MCP page merged into HealthAdmin (Round 33) — no standalone route.

// Round 32: DEV 3D Test page deleted entirely (route + module). The
// in-page admin tooling now covers the use cases that justified it.

function AdminLazyFallback() {
  return (
    <div style={{ padding: "2rem", opacity: 0.7, fontSize: 14 }}>
      Loading admin module…
    </div>
  );
}

export default function AppRoutes() {
  return (
    <>
      <ScrollToTop />
      <Routes>
      <Route
        path="/"
        element={
          <>
            <Hero />
            <SectionDivider variant="after-hero" />
            <About />
            <SectionDivider variant="after-about" />
            <Projects />
            <SectionDivider variant="after-projects" />
            <Skills />
            <SectionDivider variant="after-skills" />
            <Contact />
          </>
        }
      />
      <Route path="/projects" element={<ProjectsPage />} />
      <Route path="/projects/:slug" element={<ProjectDetail />} />
      <Route path="/admin/login" element={<Login />} />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <Suspense fallback={<AdminLazyFallback />}>
              <AdminDashboard />
            </Suspense>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/projects"
        element={
          <AdminRoute>
            <Suspense fallback={<AdminLazyFallback />}>
              <ProjectsAdmin />
            </Suspense>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/messages"
        element={
          <AdminRoute>
            <Suspense fallback={<AdminLazyFallback />}>
              <MessagesAdmin />
            </Suspense>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/allowlist"
        element={
          <AdminRoute>
            <Suspense fallback={<AdminLazyFallback />}>
              <AllowlistAdmin />
            </Suspense>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/health"
        element={
          <AdminRoute>
            <Suspense fallback={<AdminLazyFallback />}>
              <HealthAdmin />
            </Suspense>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/account"
        element={
          <AdminRoute>
            <Suspense fallback={<AdminLazyFallback />}>
              <AccountAdmin />
            </Suspense>
          </AdminRoute>
        }
      />
      {/* /admin/mcp now redirects to /admin/health where the MCP inspector lives. */}
      <Route path="/admin/mcp" element={<Navigate to="/admin/health" replace />} />
      <Route
        path="/admin/content"
        element={
          <AdminRoute>
            <Suspense fallback={<AdminLazyFallback />}>
              <ContentLanding />
            </Suspense>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/content/hero"
        element={
          <AdminRoute>
            <Suspense fallback={<AdminLazyFallback />}>
              <HeroContentAdmin />
            </Suspense>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/content/about"
        element={
          <AdminRoute>
            <Suspense fallback={<AdminLazyFallback />}>
              <AboutContentAdmin />
            </Suspense>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/content/skills"
        element={
          <AdminRoute>
            <Suspense fallback={<AdminLazyFallback />}>
              <SkillsContentAdmin />
            </Suspense>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/content/projects-copy"
        element={
          <AdminRoute>
            <Suspense fallback={<AdminLazyFallback />}>
              <ProjectsCopyAdmin />
            </Suspense>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/content/contact"
        element={
          <AdminRoute>
            <Suspense fallback={<AdminLazyFallback />}>
              <ContactContentAdmin />
            </Suspense>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/content/admin-entry"
        element={
          <AdminRoute>
            <Suspense fallback={<AdminLazyFallback />}>
              <AdminContentAdmin />
            </Suspense>
          </AdminRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
