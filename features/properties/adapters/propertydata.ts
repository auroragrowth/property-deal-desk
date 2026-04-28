// PropertyData adapter — DEFERRED for v1 dev.
//
// Per the kickoff (section 3 override), PropertyData integration does not
// ship in v1 dev. Manual paste carries the dev/alpha period. Implement this
// adapter when the PropertyData contract is in place.
//
// When implemented:
//   - fetchBatch(since) hits PropertyData's incremental endpoint
//   - normalise() maps PropertyData's payload to NormalisedProperty
//   - register in the ingest pipeline (jobs/property-ingest.ts) alongside
//     any other batch adapters

export {};
