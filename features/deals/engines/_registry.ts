import { btlEngine } from "./btl";
import type { StrategyEngine } from "./_interface";

export const engines: Record<string, StrategyEngine> = {
  btl: btlEngine,
  // brrr: brrrEngine,    // bolts on later — no other code changes
  // hmo:  hmoEngine,
};

export function getEngine(strategy: string): StrategyEngine {
  const engine = engines[strategy];
  if (!engine) throw new Error(`Unknown strategy: ${strategy}`);
  return engine;
}
