import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getUserIdOrNull } from "@/lib/auth/server";
import {
  getViewing,
  signPhotoUrls,
} from "@/features/viewings/queries";
import { UrlPaste } from "@/features/viewings/url-paste";
import { PropertyHeaderForm } from "@/features/viewings/property-header-form";
import { CaptureForm } from "@/features/viewings/capture-form";
import { Comparables } from "@/features/viewings/comparables";
import { DeleteViewingButton } from "@/features/viewings/delete-button";

export const metadata = { title: "Capture viewing · DealDesk" };

// Photos are served via short-lived signed URLs — re-render every
// visit so they never go stale.
export const dynamic = "force-dynamic";

export default async function EditViewingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const userId = await getUserIdOrNull();
  if (!userId) redirect("/sign-in");
  const { id } = await params;

  const viewing = await getViewing(userId, id);
  if (!viewing) notFound();

  const allPaths = viewing.rooms.flatMap((r) =>
    r.photos.map((p) => p.storagePath),
  );
  const signed = await signPhotoUrls(allPaths);

  return (
    <main
      id="main"
      className="bg-bg-page mx-auto max-w-2xl space-y-5 p-4 sm:p-6"
    >
      <header className="flex items-baseline justify-between gap-3">
        <div>
          <p className="text-accent font-mono text-xs tracking-[0.18em] uppercase">
            New viewing
          </p>
          <h1 className="text-text-primary mt-1 font-serif text-2xl">
            {viewing.propertyAddress ?? "Capture in progress"}
          </h1>
        </div>
        <Link
          href={`/viewings/${id}`}
          className="border-border-strong text-text-primary hover:bg-bg-surface-2 inline-flex h-10 items-center rounded-md border-[0.5px] bg-transparent px-3 text-xs font-medium"
        >
          Done
        </Link>
      </header>

      <UrlPaste viewingId={viewing.id} initialUrl={viewing.propertyUrl} />

      <PropertyHeaderForm
        viewingId={viewing.id}
        initialAddress={viewing.propertyAddress}
        initialPostcode={viewing.propertyPostcode}
        initialPricePence={viewing.propertyPricePence}
        initialBedrooms={viewing.propertyBedrooms}
        initialRentPcmPence={viewing.propertyRentPcmPence}
      />

      <Comparables
        postcode={viewing.propertyPostcode}
        bedrooms={viewing.propertyBedrooms}
      />

      <CaptureForm
        viewingId={viewing.id}
        initialOverallNotes={viewing.overallNotes}
        rooms={viewing.rooms}
        signedPhotoUrls={signed}
      />

      <footer className="border-border flex justify-end border-t-[0.5px] pt-4">
        <DeleteViewingButton viewingId={viewing.id} />
      </footer>
    </main>
  );
}
