type CampusLifeCardProps = {
  imageUrl: string | null;
  campusLifeNote: string | null;
  city: string;
};

/**
 * SPEC.md §10: a campus/city photo (stock photography — README discloses
 * this per §9's honesty rule, it never claims to be the university's own
 * image) plus a short note on student life. Both fields are frequently
 * `null` in the current dataset (research still in progress per PLAN.md) —
 * this renders a plain placeholder rather than a broken image or dead space.
 */
export function CampusLifeCard({ imageUrl, campusLifeNote, city }: CampusLifeCardProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- stock photo URLs from arbitrary hosts; not worth Next/Image's remote-pattern config for a mock-data field that's null in most rows today.
        <img src={imageUrl} alt={`${city} — иллюстративное фото`} className="h-48 w-full object-cover" />
      ) : (
        <div className="flex h-48 w-full items-center justify-center bg-muted">
          <span className="text-sm text-muted-foreground">Фото пока не добавлено</span>
        </div>
      )}
      {campusLifeNote ? (
        <p className="p-4 text-[0.9375rem] leading-relaxed text-pretty">{campusLifeNote}</p>
      ) : null}
    </div>
  );
}
