// Domain event emitter — week 1 stub.
//
// Brief Section 02 principle 6: emit domain events from day one even though
// nothing consumes them yet. Once Inngest is wired (week 3+), emit() forwards
// to inngest.send(...). Until then it logs in dev and is a no-op in prod.

export type DomainEvent =
  | { name: "property.ingested"; data: { source: string; count: number } }
  | { name: "deal.analysed"; data: { dealId: string; pass: boolean } }
  | { name: "watchlist.added"; data: { userId: string; propertyId: string } };

export async function emit<E extends DomainEvent>(
  name: E["name"],
  data: E["data"],
): Promise<void> {
  if (process.env.NODE_ENV !== "production") {
    console.log(`[event] ${name}`, data);
  }
  // TODO(week-3): forward to inngest.send({ name, data })
}
