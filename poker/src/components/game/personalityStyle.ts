import { Flame, Scale, Shield, Shuffle, User, Zap, type LucideIcon } from "lucide-react";
import type { PersonalityId } from "@/lib/poker/types";

export const PERSONALITY_STYLE: Record<PersonalityId | "human", { icon: LucideIcon; gradient: string; tag: string }> = {
  human: { icon: User, gradient: "from-gold-300 to-gold-600", tag: "text-gold-300" },
  conservative: { icon: Shield, gradient: "from-sky-400 to-sky-700", tag: "text-sky-300" },
  aggressive: { icon: Flame, gradient: "from-orange-400 to-rose-600", tag: "text-orange-300" },
  balanced: { icon: Scale, gradient: "from-emerald-400 to-teal-700", tag: "text-emerald-300" },
  unpredictable: { icon: Shuffle, gradient: "from-fuchsia-400 to-violet-700", tag: "text-fuchsia-300" },
  maniac: { icon: Zap, gradient: "from-red-500 to-red-800", tag: "text-red-300" },
};
