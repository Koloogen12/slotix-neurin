import type { Metadata } from "next";
import { EmbedFrameBridge } from "./embed-frame-bridge";

// A booking widget sitting on someone else's page must not be indexed as a page of its own —
// the canonical booking URL is /<slug>/<formatId>.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/** Chrome-less shell for framed booking pages. The marker class is what globals.css keys on
 * to drop the site's aurora backdrop, so the widget inherits the host page's background
 * instead of painting Slotix artwork inside their layout. */
export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="slotix-embed-root flex flex-1 flex-col">
      {children}
      <EmbedFrameBridge />
    </div>
  );
}
