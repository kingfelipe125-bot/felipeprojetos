import type { PersonalityId } from "./types";

export interface Personality {
  id: PersonalityId;
  label: string;
  description: string;
  /** Pontuação de Chen mínima para entrar num pote não aumentado. */
  enter: number;
  /** 0..1: tendência a apostar/aumentar em vez de pagar. */
  aggression: number;
  /** Probabilidade de blefar quando a situação permite. */
  bluff: number;
  /** Ruído aplicado à leitura de força (imprevisibilidade). */
  noise: number;
  /** 0..1: disposição para pagar apostas com mãos marginais. */
  looseness: number;
}

export const PERSONALITIES: Record<PersonalityId, Personality> = {
  conservative: {
    id: "conservative", label: "Conservador", description: "Joga poucas mãos e só aposta forte com jogo feito.",
    enter: 8, aggression: 0.25, bluff: 0.02, noise: 0.03, looseness: 0,
  },
  aggressive: {
    id: "aggressive", label: "Agressivo", description: "Entra em muitas mãos e gosta de tomar a iniciativa.",
    enter: 6.5, aggression: 0.65, bluff: 0.12, noise: 0.06, looseness: 0.3,
  },
  balanced: {
    id: "balanced", label: "Equilibrado", description: "Seleciona bem as mãos e respeita as odds do pote.",
    enter: 7, aggression: 0.45, bluff: 0.06, noise: 0.05, looseness: 0.15,
  },
  unpredictable: {
    id: "unpredictable", label: "Imprevisível", description: "Muda de estilo sem aviso: difícil de ler.",
    enter: 6, aggression: 0.5, bluff: 0.18, noise: 0.18, looseness: 0.35,
  },
  maniac: {
    id: "maniac", label: "Muito agressivo", description: "Aposta e aumenta sem parar. Blefa muito.",
    enter: 4.5, aggression: 0.85, bluff: 0.28, noise: 0.08, looseness: 0.55,
  },
};

export const BOT_ROSTER: { name: string; personality: PersonalityId }[] = [
  { name: "Helena", personality: "conservative" },
  { name: "Diego", personality: "aggressive" },
  { name: "Marina", personality: "balanced" },
  { name: "Caio", personality: "unpredictable" },
  { name: "Vitor", personality: "maniac" },
];
