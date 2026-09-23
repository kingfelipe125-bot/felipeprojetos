"use client";

import { useCallback, useEffect, useState } from "react";
import { loadJSON, saveJSON } from "@/lib/economy/storage";

export type Speed = "normal" | "fast";

export interface Settings {
  speed: Speed;
  autoDeal: boolean;
}

const KEY = "poker-virtual.settings.v1";
const DEFAULTS: Settings = { speed: "normal", autoDeal: true };

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  useEffect(() => setSettings({ ...DEFAULTS, ...loadJSON<Partial<Settings>>(KEY, {}) }), []);
  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((s) => {
      const next = { ...s, ...patch };
      saveJSON(KEY, next);
      return next;
    });
  }, []);
  return [settings, update] as const;
}
