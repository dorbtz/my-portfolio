// src/App.tsx
import { Component, Suspense, useEffect, useState } from "react";
import { ThorProvider } from "./state/thor";

import Header from "./components/Header";
import Hero from "./components/Hero";
import About from "./components/About";
import Projects from "./components/Projects";
import Skills from "./components/Skills";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import ResumeSection from "./components/ResumeSection";

import RainbowRain from "./components/RainbowRain";
import ThorEngine from "./components/ThorEngine";
import StormFX from "./components/StormFX";

import HammerHover from "./components/HammerHover";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes";
import { AuthProvider } from "./hooks/useAuth";

/** Detect whether current location points to a demo route.
 *  Supports:
 *   - /demos/<slug>
 *   - #/<slug> (hash fallback)
 */
function useIsDemoRoute() {
  const [loc, setLoc] = useState(() => ({
    path: window.location.pathname,
    hash: window.location.hash || "",
  }));

  useEffect(() => {
    const onChange = () =>
      setLoc({ path: window.location.pathname, hash: window.location.hash || "" });
    window.addEventListener("hashchange", onChange);
    window.addEventListener("popstate", onChange);
    return () => {
      window.removeEventListener("hashchange", onChange);
      window.removeEventListener("popstate", onChange);
    };
  }, []);

  const isPathDemo = loc.path.startsWith("/demos/");
  const isHashDemo = /^#\/[^/]+$/.test(loc.hash); // e.g., #/helixops
  return isPathDemo || isHashDemo;
}

// Error boundary to keep portfolio shell stable if a demo fails to load
class ErrorBoundary extends Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <main className="wrap my-10">
          <h2 className="mb-2 text-2xl font-semibold">Demo failed to load</h2>
          <p className="mb-4 opacity-80">{this.state.error.message}</p>
          <pre className="overflow-auto rounded-lg border border-white/10 bg-black/40 p-3">
            {this.state.error.stack}
          </pre>
          <button
            className="btn btn-outline mt-4"
            onClick={() => (window.location.href = "/")}
          >
            ← Back to portfolio
          </button>
        </main>
      );
    }
    return this.props.children;
  }
}

export default function App() {

  return (
    <ThorProvider>
      {/* Global FX (everywhere) */}
      <ThorEngine />
      <StormFX />
      

      {/* Keep rain off inside demos for visual clarity */}
      <RainbowRain />
      <BrowserRouter>
        <AuthProvider>
        <Header />

        <>
          <main>
            {/* <Hero />
            <About />
            <Projects />
            <Skills />
            <Contact />
            <ResumeSection /> */}
            <AppRoutes />
          </main>
          <Footer />
          <HammerHover />
        </>
        </AuthProvider>
      </BrowserRouter>
    </ThorProvider>
  );
}
