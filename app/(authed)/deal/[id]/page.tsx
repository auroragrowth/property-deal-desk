export default async function DealPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main className="p-8">
      <h1 className="text-3xl font-light">Deal · {id}</h1>
      <p className="mt-3 text-neutral-600">Deal analyzer lands in week 9.</p>
    </main>
  );
}
