"use client";

import { useCallback, useState, useTransition } from "react";
import {
  addRoom,
  deleteRoom,
  updateRoom,
  updateViewingHeader,
} from "./actions";
import { useDebouncedSave } from "./use-debounced-save";
import { PhotoUploader } from "./photo-uploader";
import { PhotoThumb } from "./photo-thumb";

type RoomInput = {
  id: string;
  name: string;
  notes: string | null;
  position: number;
  photos: { id: string; storagePath: string; caption: string | null }[];
};

const ROOM_SUGGESTIONS = [
  "Living room",
  "Kitchen",
  "Master bedroom",
  "Bedroom 2",
  "Bedroom 3",
  "Bathroom",
  "En-suite",
  "Hallway",
  "Garden",
  "Front",
  "Loft",
  "Garage",
];

function StatusBadge({ status }: { status: "idle" | "saving" | "saved" }) {
  if (status === "saving")
    return (
      <span className="text-text-tertiary text-[10px]">Saving…</span>
    );
  if (status === "saved")
    return <span className="text-pass-fg text-[10px]">Saved ✓</span>;
  return null;
}

function RoomCard({
  viewingId,
  room,
  signedPhotoUrls,
}: {
  viewingId: string;
  room: RoomInput;
  signedPhotoUrls: Record<string, string>;
}) {
  const [name, setName] = useState(room.name);
  const [notes, setNotes] = useState(room.notes ?? "");
  const [removed, setRemoved] = useState(false);

  const saveName = useCallback(
    async (value: string) => {
      await updateRoom(viewingId, room.id, { name: value });
    },
    [viewingId, room.id],
  );
  const saveNotes = useCallback(
    async (value: string) => {
      await updateRoom(viewingId, room.id, { notes: value });
    },
    [viewingId, room.id],
  );

  const nameStatus = useDebouncedSave(name, room.name, saveName);
  const notesStatus = useDebouncedSave(notes, room.notes ?? "", saveNotes);

  if (removed) return null;

  async function onDelete() {
    if (!confirm(`Delete "${room.name}"?`)) return;
    const res = await deleteRoom(viewingId, room.id);
    if ("error" in res) alert(res.error);
    else setRemoved(true);
  }

  return (
    <article className="border-border bg-bg-surface space-y-3 rounded-lg border-[0.5px] p-4">
      <header className="flex items-baseline justify-between gap-2">
        <input
          aria-label="Room name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border-border bg-bg-page focus:ring-accent-soft h-11 flex-1 rounded-md border-[0.5px] px-3 text-base font-medium focus:ring-[3px] focus:outline-none"
        />
        <StatusBadge status={nameStatus} />
        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete room"
          className="text-text-tertiary hover:text-fail-fg inline-flex h-9 w-9 items-center justify-center text-lg"
        >
          ×
        </button>
      </header>

      <label className="block">
        <span className="text-text-secondary mb-1 flex items-center justify-between text-xs">
          <span>Notes</span>
          <StatusBadge status={notesStatus} />
        </span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Condition, measurements, vibe…"
          className="border-border bg-bg-page focus:ring-accent-soft w-full rounded-md border-[0.5px] px-3 py-2 text-sm focus:ring-[3px] focus:outline-none"
        />
      </label>

      {room.photos.length > 0 && (
        <ul className="grid grid-cols-3 gap-2">
          {room.photos.map((p) => (
            <li key={p.id}>
              <PhotoThumb
                viewingId={viewingId}
                photoId={p.id}
                url={signedPhotoUrls[p.storagePath] ?? ""}
                alt={room.name}
              />
            </li>
          ))}
        </ul>
      )}

      <PhotoUploader viewingId={viewingId} roomId={room.id} />
    </article>
  );
}

export function CaptureForm({
  viewingId,
  initialOverallNotes,
  rooms,
  signedPhotoUrls,
}: {
  viewingId: string;
  initialOverallNotes: string | null;
  rooms: RoomInput[];
  signedPhotoUrls: Record<string, string>;
}) {
  const [adding, startTransition] = useTransition();
  const [newName, setNewName] = useState("");
  const [overall, setOverall] = useState(initialOverallNotes ?? "");

  const saveOverall = useCallback(
    async (value: string) => {
      await updateViewingHeader(viewingId, { overallNotes: value });
    },
    [viewingId],
  );
  const overallStatus = useDebouncedSave(
    overall,
    initialOverallNotes ?? "",
    saveOverall,
  );

  function addOne(name: string) {
    if (!name.trim()) return;
    startTransition(async () => {
      await addRoom(viewingId, name);
      setNewName("");
    });
  }

  return (
    <section
      aria-labelledby="viewing-rooms"
      className="space-y-4"
    >
      <h2
        id="viewing-rooms"
        className="text-text-primary font-serif text-lg"
      >
        2. Rooms
      </h2>

      {rooms.length === 0 && (
        <p className="text-text-tertiary text-sm">
          Add your first room — kitchen, master bedroom, garden — whatever you
          start with.
        </p>
      )}

      {rooms.map((r) => (
        <RoomCard
          key={r.id}
          viewingId={viewingId}
          room={r}
          signedPhotoUrls={signedPhotoUrls}
        />
      ))}

      <div className="border-border bg-bg-surface-2 space-y-3 rounded-lg border-[0.5px] p-4">
        <label className="block">
          <span className="text-text-secondary mb-1 block text-xs">
            Add a room
          </span>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Kitchen"
            className="border-border bg-bg-page focus:ring-accent-soft h-11 w-full rounded-md border-[0.5px] px-3 text-base focus:ring-[3px] focus:outline-none"
          />
        </label>
        <div className="flex flex-wrap gap-1">
          {ROOM_SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addOne(s)}
              disabled={adding}
              className="border-border-strong text-text-primary hover:bg-bg-surface inline-flex h-8 items-center rounded-full border-[0.5px] bg-transparent px-3 text-xs disabled:opacity-50"
            >
              + {s}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => addOne(newName)}
          disabled={adding || !newName.trim()}
          className="bg-bg-strong text-text-on-strong h-11 w-full rounded-md px-4 text-sm font-medium disabled:opacity-50"
        >
          {adding ? "Adding…" : "Add room"}
        </button>
      </div>

      <h2
        id="viewing-overall"
        className="text-text-primary mt-8 font-serif text-lg"
      >
        3. Overall impressions
      </h2>
      <div className="border-border bg-bg-surface space-y-2 rounded-lg border-[0.5px] p-4">
        <label className="block">
          <span className="text-text-secondary mb-1 flex items-center justify-between text-xs">
            <span>How did the property feel?</span>
            <StatusBadge status={overallStatus} />
          </span>
          <textarea
            value={overall}
            onChange={(e) => setOverall(e.target.value)}
            rows={5}
            placeholder="Light, neighbours, smell, would-buy / would-walk…"
            className="border-border bg-bg-page focus:ring-accent-soft w-full rounded-md border-[0.5px] px-3 py-2 text-sm focus:ring-[3px] focus:outline-none"
          />
        </label>
      </div>
    </section>
  );
}
