// src/App.tsx
import { useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import RainbowRain from './components/RainbowRain';
import ThorEngine from './components/ThorEngine';
import StormFX from './components/StormFX';
import Cursor from './components/Cursor';
// Bifrost intro loader removed (Round 37) — site lands directly on the
// homepage with no overlay so visitors see the hero immediately.
// import BifrostLoader from './components/BifrostLoader';
import CrossFandomBackdrop from './components/CrossFandomBackdrop';
import CinematicOverlay from './components/CinematicOverlay';
import LuffyImageRain from './components/LuffyImageRain';
import SmoothScrollProvider from './providers/SmoothScrollProvider';
import { AuthProvider } from './hooks/useAuth';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes';
import { useModeStore } from './stores/mode';
import { initEasterEggs } from './lib/easterEggs';

/**
 * ModeBoot — runs once; subscribes to mode store and writes
 * data-mode / data-theme to <html> on every change.
 * The initial write happens synchronously in mode.ts (before React renders),
 * so this is only needed to keep attributes in sync on state changes.
 */
function ModeBoot() {
  useEffect(() => {
    // Apply initial values (belt-and-suspenders)
    const { mode, theme } = useModeStore.getState();
    document.documentElement.setAttribute('data-mode', mode);
    document.documentElement.setAttribute('data-theme', theme);

    // Subscribe to future changes
    const unsub = useModeStore.subscribe((state) => {
      document.documentElement.setAttribute('data-mode', state.mode);
      document.documentElement.setAttribute('data-theme', state.theme);
    });

    return unsub;
  }, []);

  // Easter eggs — initialized once on mount, cleaned up on unmount
  useEffect(() => {
    const cleanup = initEasterEggs();
    return cleanup;
  }, []);

  return null;
}

export default function App() {
  return (
    <SmoothScrollProvider>
      <ModeBoot />
      {/* Always-on cross-fandom backdrop — behind all content */}
      <CrossFandomBackdrop />
      {/* Mode-aware cinematic overlay — letterbox, chyron, kana SFX */}
      <CinematicOverlay />
      {/* Gear 5 only: Luffy scroll-layer + manga speed-lines */}
      <LuffyImageRain />
      {/* <BifrostLoader /> removed in Round 37 */}
      <ThorEngine />
      <StormFX />
      <RainbowRain />
      <BrowserRouter>
        <AuthProvider>
          <Header />
          <main>
            <AppRoutes />
          </main>
          <Footer />
          <Cursor />
        </AuthProvider>
      </BrowserRouter>
    </SmoothScrollProvider>
  );
}
