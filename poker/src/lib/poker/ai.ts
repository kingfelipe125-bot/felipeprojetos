import { defaultRng, type Rng } from "./deck";
import { getLegalActions, potTotal } from "./engine";
import { chenScore, estimateEquity } from "./equity";
import { PERSONALITIES, type Personality } from "./personalities";
import type { GameState, LegalActions, PlayerAction } from "./types";

interface Context {
  state: GameState;
  seat: number;
  legal: LegalActions;
  profile: Personality;
  rng: Rng;
  pot: number;
  bb: number;
  /** 0 = age cedo (small blind) … 1 = botão (age por último). */
  position: number;
  opponents: number;
}

/** Arredonda para múltiplos do small blind e respeita os limites legais. */
function sizeRaise(ctx: Context, target: number): PlayerAction {
  const { legal, state } = ctx;
  if (!legal.canRaise) return legal.canCall ? { type: "call" } : { type: "check" };
  const step = state.config.smallBlind;
  let to = Math.round(target / step) * step;
  to = Math.max(legal.minRaiseTo, Math.min(legal.maxRaiseTo, to));
  // Se sobraria pouco no stack, vai de all-in.
  if (to >= legal.maxRaiseTo * 0.8) return { type: "allin" };
  return { type: "raise", to };
}

function passive(ctx: Context): PlayerAction {
  return ctx.legal.canCheck ? { type: "check" } : { type: "fold" };
}

function preflop(ctx: Context): PlayerAction {
  const { state, seat, legal, profile, rng, bb } = ctx;
  const p = state.players[seat];
  const chen = chenScore(p.hole) + (rng() - 0.5) * profile.noise * 10;
  const posBonus = ctx.position * 1.5;
  const raised = state.currentBet > bb;
  const betInBB = state.currentBet / bb;
  const stackCommit = legal.callAmount / Math.max(1, p.stack + p.bet);

  let callNeed = profile.enter - posBonus;
  if (raised) callNeed += 1.5 + Math.min(4, (betInBB - 2) * 0.35) - profile.looseness * 2;
  if (stackCommit > 0.35) callNeed = Math.max(callNeed, 10 - profile.looseness * 4);
  const raiseNeed = callNeed + 4 - profile.aggression * 3;

  if (chen >= raiseNeed || (!raised && rng() < profile.bluff * ctx.position)) {
    const limpers = state.players.filter((o) => o.inHand && !o.folded && o.bet === bb && o !== p).length;
    const target = raised
      ? state.currentBet * (2.6 + rng() * 0.8)
      : bb * (2.5 + rng() * 1 + limpers);
    // Mãos premium de vez em quando vão direto de all-in.
    if (chen >= 16 && rng() < profile.aggression * 0.25) return legal.canAllIn ? { type: "allin" } : sizeRaise(ctx, target);
    return sizeRaise(ctx, target);
  }
  if (legal.canCheck) return { type: "check" };
  if (chen >= callNeed) return { type: "call" };
  // Small blind completa barato de vez em quando.
  if (!raised && legal.callAmount <= bb / 2 && chen >= callNeed - 2) return { type: "call" };
  return { type: "fold" };
}

function postflop(ctx: Context): PlayerAction {
  const { state, seat, legal, profile, rng, pot } = ctx;
  const p = state.players[seat];
  const iterations = 250;
  const equity = estimateEquity(p.hole, state.community, ctx.opponents, iterations, rng);
  // Força "por oponente": compara mãos de forma parecida em potes com 1 ou 5 adversários.
  const perOpp = Math.pow(equity, 1 / Math.max(1, ctx.opponents));
  const toCall = legal.callAmount;
  // Apostas grandes indicam mãos fortes do outro lado; jogadores soltos ligam menos pra isso.
  const pressure = toCall > 0 ? Math.min(0.15, (toCall / Math.max(pot, 1)) * 0.12) * (1 - profile.looseness) : 0;
  const strength = perOpp - pressure + (rng() - 0.5) * profile.noise * 2 + ctx.position * 0.03;
  const potOdds = toCall / (pot + toCall);
  const bluffing = rng() < profile.bluff * (ctx.opponents <= 2 ? 1 : 0.4);

  if (toCall === 0) {
    const betNeed = 0.72 - profile.aggression * 0.2;
    if (strength >= betNeed || bluffing) {
      // Slowplay ocasional de mão muito forte por jogadores passivos.
      if (strength > 0.92 && rng() < (1 - profile.aggression) * 0.35) return { type: "check" };
      const frac = bluffing && strength < betNeed ? 0.5 + rng() * 0.3 : 0.45 + (strength - 0.5) * 0.9 + rng() * 0.2;
      return sizeRaise(ctx, Math.max(ctx.bb, pot * frac));
    }
    return { type: "check" };
  }

  const raiseNeed = 0.86 - profile.aggression * 0.14;
  if (strength >= raiseNeed && legal.canRaise) {
    return sizeRaise(ctx, state.currentBet * 2.5 + pot * (0.3 + rng() * 0.4));
  }
  const margin = 0.04 - profile.looseness * 0.1;
  if (equity >= potOdds + margin || strength >= 0.7) return { type: "call" };
  if (bluffing && legal.canRaise && ctx.opponents === 1 && rng() < 0.4) {
    return sizeRaise(ctx, state.currentBet * 2.5 + pot * 0.5);
  }
  return passive(ctx);
}

/** Decide a ação do bot sentado em `seat`. Sempre retorna uma ação legal. */
export function decideBotAction(state: GameState, seat: number, rng: Rng = defaultRng): PlayerAction {
  const p = state.players[seat];
  const legal = getLegalActions(state, seat);
  const profile = PERSONALITIES[p.personality ?? "balanced"];
  const inHand = state.players.map((o, i) => ({ o, i })).filter(({ o }) => o.inHand);
  const order = inHand.findIndex(({ i }) => i === seat);
  const dealerOrder = inHand.findIndex(({ i }) => i === state.dealer);
  const count = inHand.length;
  const rel = (order - dealerOrder - 1 + count) % count;

  const ctx: Context = {
    state, seat, legal, profile, rng,
    pot: potTotal(state),
    bb: state.config.bigBlind,
    position: count > 1 ? rel / (count - 1) : 1,
    opponents: state.players.filter((o, i) => i !== seat && o.inHand && !o.folded).length,
  };

  const action = state.street === "preflop" ? preflop(ctx) : postflop(ctx);
  return ensureLegal(action, legal);
}

function ensureLegal(action: PlayerAction, legal: LegalActions): PlayerAction {
  switch (action.type) {
    case "check": return legal.canCheck ? action : legal.canCall ? { type: "call" } : { type: "fold" };
    case "call": return legal.canCall ? action : legal.canCheck ? { type: "check" } : { type: "fold" };
    case "raise":
      if (!legal.canRaise) return legal.canCall ? { type: "call" } : { type: "check" };
      return { type: "raise", to: Math.max(legal.minRaiseTo, Math.min(legal.maxRaiseTo, action.to)) };
    case "allin":
      if (legal.canAllIn) return action;
      return legal.canCall ? { type: "call" } : { type: "check" };
    default:
      return legal.canCheck ? { type: "check" } : action;
  }
}
