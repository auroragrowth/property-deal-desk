# v2 spike — Floor plan re-modeller

**Status:** scoping, not built. Demand signal received from early users (May 2026).
**Owner:** Paul.
**Decision needed before build:** which vendor combo, pricing tier, where it sits in the product.

## Problem

Users want to take an existing property's floor plan (the JPG/PDF on the Rightmove or Zoopla listing) and re-model it — knock walls down, add an en-suite, split a reception into two bedrooms — to test refurb ideas before offering on the property. This is a **BRRR / refurb** workflow, not pure BTL.

## Recommended approach

Two-vendor split. Don't build either piece in-house.

1. **Ingest — [CubiCasa](https://www.cubicasa.com/) Conversion API**
   Upload the existing floor plan image, get back editable JSON (walls, rooms, dimensions, doors, windows). UK-based usage is common; estate agents already use them.
2. **Edit — [Floorplanner](https://floorplanner.com/) JS SDK**
   Drop their editor into a React page (iframe or component). 2D + 3D view, snapping, units in metric, mature product (since 2007). Used by Rightmove/Zoopla for their own plans.

DealDesk wires these together: CubiCasa output → Floorplanner project → user edits → save back to a `floor_plans` table tied to the property.

## Alternatives considered

- **RoomSketcher** — does both ingest and edit. Single vendor = simpler but UI is more consumer-facing.
- **Magicplan** — mobile-first, requires the user to walk the property with a phone. Wrong workflow for armchair investors.
- **Roll our own (Konva/Three.js)** — 6–12 months of work to match what Floorplanner ships today. Not justified for a side feature.
- **Vision LLM (Claude/GPT-4o) → JSON** — promising but not production-ready for accurate dimensions. Revisit in 12 months.

## Rough cost (sanity check before sales calls)

- CubiCasa: ~£0.50–£2 per converted plan. Likely a minimum monthly commitment (£500+/mo enterprise tier — needs sales call).
- Floorplanner: ~$0.50/plan + monthly platform fee, or self-serve tiers from ~$30/mo.
- Total: assume **£100–£200/month fixed + per-plan fees** until volume justifies a bigger contract.

Charge it as a **paid add-on** or **Elite-tier-only** feature — do not bundle into Starter/Pro.

## Build estimate

2–4 weeks once vendors are picked:
- 3 days — CubiCasa API integration + storage
- 5 days — Floorplanner embed + auth + save/load
- 3 days — `floor_plans` schema, RLS, link to `properties`
- 3 days — entitlements gate (Elite-only or add-on)
- 2 days — events (`floorplan.imported`, `floorplan.edited`), audit log
- 2 days — tests, polish

## Open questions

1. Is this Elite-tier-only, or a paid add-on across all tiers?
2. Do we store the edited plan as our data, or leave it in Floorplanner's project space?
3. Does this trigger BRRR engine work (currently deferred)? Floor plans are most useful when paired with refurb cost modelling.
4. Legal: are we allowed to ingest a third-party floor plan from a Rightmove listing? (Likely fine for the user's own use; check.)

## Trigger to start

**Met.** Multiple early users have asked. Next step: 30-min sales calls with CubiCasa and Floorplanner to confirm pricing, then decide go/no-go.

## Not in this spike

- 3D walk-throughs (Matterport-style)
- Furniture placement / staging
- AI-generated layout suggestions
- Sharing plans with contractors
