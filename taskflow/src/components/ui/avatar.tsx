import { cn, initials } from "@/lib/utils";

/**
 * TaskFlow — Avatar : initiales colorées dérivées de l'email (stable), ou image si fournie.
 * Tailles xs/sm/md/lg pour listes de membres, header, commentaires.
 */
type AvatarProps = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  /** Rend l'avatar empilable (bordure blanche pour groupes). */
  ring?: boolean;
};

const sizes: Record<string, string> = {
  xs: "size-5 text-[10px]",
  sm: "size-7 text-xs",
  md: "size-9 text-sm",
  lg: "size-12 text-base",
};

// Palette déterministe (hash simple de l'email → teinte constante par utilisateur).
const PALETTE = [
  "bg-indigo-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-sky-500",
  "bg-violet-500",
  "bg-teal-500",
];

function paletteFor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export function Avatar({ name, email, image, size = "md", className, ring }: AvatarProps) {
  const label = name ?? email ?? "?";
  const seed = email ?? name ?? "?";

  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- avatars externes (gravatar…), non maîtrisés par next/image
      <img
        src={image}
        alt={label}
        title={label}
        className={cn(
          "shrink-0 rounded-full object-cover",
          sizes[size],
          ring && "ring-2 ring-white dark:ring-zinc-950",
          className,
        )}
      />
    );
  }

  return (
    <span
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold text-white",
        sizes[size],
        paletteFor(seed),
        ring && "ring-2 ring-white dark:ring-zinc-950",
        className,
      )}
    >
      {initials(label)}
    </span>
  );
}

/** Groupe d'avatars empilés (membres d'un board). */
export function AvatarGroup({
  users,
  max = 4,
  size = "sm",
}: {
  users: Array<{ name?: string | null; email?: string | null; image?: string | null }>;
  max?: number;
  size?: AvatarProps["size"];
}) {
  const shown = users.slice(0, max);
  const rest = users.length - shown.length;
  return (
    <div className="flex -space-x-1.5">
      {shown.map((u, i) => (
        <Avatar key={i} {...u} size={size} ring />
      ))}
      {rest > 0 && (
        <span
          className={cn(
            "inline-flex items-center justify-center rounded-full bg-zinc-200 font-semibold text-zinc-600 ring-2 ring-white dark:bg-zinc-700 dark:text-zinc-200 dark:ring-zinc-950",
            sizes[size],
          )}
        >
          +{rest}
        </span>
      )}
    </div>
  );
}
