import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import useReducedMotion from "../hooks/useReducedMotion";
import { playSfx } from "../../public/sounds/sfx";

// Change this path if your sound lives elsewhere:
const THUNDER_SRC = "/sounds/thunder-1.mp3";

type ThorState = {
  on: boolean;
  toggle: (v?: boolean) => void;
  soundOn: boolean;
  setSoundOn: (v: boolean) => void;
};

const Ctx = createContext<ThorState | null>(null);

const LS_THOR = "thor:on";
const LS_SOUND = "thor:soundOn";

export function ThorProvider({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();
  const [on, setOn] = useState<boolean>(() => localStorage.getItem(LS_THOR) === "1");
  const [soundOn, setSoundOn] = useState<boolean>(() => {
    const v = localStorage.getItem(LS_SOUND);
    return v === null ? true : v === "1";
  });

  useEffect(() => localStorage.setItem(LS_THOR, on ? "1" : "0"), [on]);
  useEffect(() => localStorage.setItem(LS_SOUND, soundOn ? "1" : "0"), [soundOn]);

  // play a subtle burst when enabling Thor (if allowed)
  const prevOn = useRef(on);
  useEffect(() => {
    if (on && !prevOn.current && soundOn && !reduced) {
      playSfx(THUNDER_SRC, 0.18);
    }
    prevOn.current = on;
  }, [on, soundOn, reduced]);

  const value = useMemo<ThorState>(() => ({
    on,
    toggle: (v?: boolean) => setOn((cur) => (typeof v === "boolean" ? v : !cur)),
    soundOn,
    setSoundOn,
  }), [on, soundOn]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useThor() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useThor must be used inside ThorProvider");
  return ctx;
}
