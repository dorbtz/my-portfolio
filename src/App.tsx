// src/App.tsx
import Header from "./components/Header";
import Footer from "./components/Footer";
import RainbowRain from "./components/RainbowRain";
import ThorEngine from "./components/ThorEngine";
import StormFX from "./components/StormFX";
import HammerHover from "./components/HammerHover";
import { ThorProvider } from "./state/thor";
import { AuthProvider } from "./hooks/useAuth";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes";

export default function App() {
  return (
    <ThorProvider>
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
          <HammerHover />
        </AuthProvider>
      </BrowserRouter>
    </ThorProvider>
  );
}
