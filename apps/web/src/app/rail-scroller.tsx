"use client";

import { ConnectListing } from "./feed/connect-listing";
import { RespondRequest } from "./requests/respond-request";
import { ConnectButton, type Relationship } from "./directory/connect-button";

export type RailItem = {
  key: string;
  kind: "offer" | "ask" | "matrimony";
  line: string;
  listingId?: string;
  requestId?: string;
  recipientId?: string;
  openlyContactable?: boolean;
  relationship?: Relationship;
};

const KIND_LABEL: Record<RailItem["kind"], string> = {
  offer: "Offering",
  ask: "Looking for",
  matrimony: "Matrimony",
};

export function RailCard({ item }: { item: RailItem }) {
  return (
    <div className="rounded-xl border border-brand-border bg-white p-4 shadow-sm">
      <span
        className={`text-xs font-semibold tracking-wide uppercase ${
          item.kind === "offer" ? "text-brand-primary" : "text-brand-accent"
        }`}
      >
        {KIND_LABEL[item.kind]}
      </span>
      <p className="mt-1 text-sm leading-relaxed text-brand-text">{item.line}</p>
      <div className="mt-3">
        {item.listingId ? <ConnectListing listingId={item.listingId} /> : null}
        {item.requestId ? <RespondRequest requestId={item.requestId} /> : null}
        {item.recipientId ? (
          <ConnectButton
            recipientId={item.recipientId}
            openlyContactable={item.openlyContactable ?? false}
            relationship={item.relationship ?? "none"}
            context="Matrimony"
          />
        ) : null}
      </div>
    </div>
  );
}

// Desktop ambient column. Items are rendered twice so the CSS marquee loops
// seamlessly (the track translates -50%). Pause-on-hover + reduced-motion are
// handled by the `.rail-track` class in globals.css.
export function RailScroller({ items }: { items: RailItem[] }) {
  return (
    <div className="h-[calc(100vh-7rem)] overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_5%,black_95%,transparent)]">
      <div className="rail-track space-y-3">
        {items.map((it) => (
          <RailCard key={it.key} item={it} />
        ))}
        {items.map((it) => (
          <RailCard key={`${it.key}-dup`} item={it} />
        ))}
      </div>
    </div>
  );
}
