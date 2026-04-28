import type {
  AssumptionProfile,
  CriteriaProfile,
  EngineProperty,
  EngineRunResult,
  StrategyEngine,
} from "./_interface";

// BTL engine — week 8 stub.
//
// Full implementation lives in week 8 of the brief (Section 09). The interface
// and registry must exist from week 1 so the analyzer page (week 9) compiles
// against them.

export const btlEngine: StrategyEngine = {
  id: "btl",
  version: "btl-v1",

  run(
    _property: EngineProperty,
    _assumptions: AssumptionProfile,
    _criteria: CriteriaProfile,
  ): EngineRunResult {
    throw new Error("btl engine: not implemented (week 8)");
  },
};
