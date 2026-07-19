import { getInitials } from "./format-utils";

interface AvatarProps {
  name: string | null;
  avatarUrl: string | null;
  size: number;
  ringColor?: string;
  className?: string;
}

/** Plain `<img>` rather than `next/image` on purpose — `avatarUrl` comes from arbitrary
 * user-uploaded storage, so there's no fixed set of remote hosts to whitelist in
 * next.config.ts (which this page isn't allowed to touch anyway). */
export function Avatar({ name, avatarUrl, size, ringColor = "#5094F0", className }: AvatarProps) {
  return (
    <div
      className={`flex flex-none items-center justify-center overflow-hidden rounded-full bg-white/85 ${className ?? ""}`}
      style={{ width: size, height: size, boxShadow: `0 0 0 1.5px ${ringColor}` }}
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt={name ?? ""} width={size} height={size} className="h-full w-full object-cover" />
      ) : (
        <span className="font-bold text-[var(--color-link)]" style={{ fontSize: size * 0.32 }}>
          {getInitials(name)}
        </span>
      )}
    </div>
  );
}
