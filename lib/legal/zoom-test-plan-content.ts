import type { LegalBlock } from "./legal-document";

/** English test plan for Zoom Marketplace reviewers. Published as a public page because the
 * review thread's comment fields have a length limit that a full plan doesn't fit into — the
 * reply there links here instead. */
export const ZOOM_TEST_PLAN_TITLE = "Zoom Marketplace — Test Plan";
export const ZOOM_TEST_PLAN_EFFECTIVE_DATE = "22.07.2026";
export const ZOOM_TEST_PLAN_INTRO =
  "Slotix is an online scheduling service. This plan lets a Zoom reviewer validate the integration end to end on production, using the production Client ID.";

export const ZOOM_TEST_PLAN_BLOCKS: LegalBlock[] = [
  { type: "h2", text: "1. Integration summary" },
  {
    type: "ul",
    items: [
      "Purpose: when a client books a slot and selects Zoom, Slotix creates a scheduled Zoom meeting on behalf of the connected account owner and shares the join link with both sides.",
      "Zoom REST endpoints called: POST /v2/users/me/meetings — the only one.",
      "OAuth: https://zoom.us/oauth/authorize and /oauth/token (authorization_code, refresh_token).",
      "Production Client ID: J59bE_wGS8qbyLsoqxGo0A",
      "Redirect URI: https://slotix.neurin.tech/api/integrations/zoom/callback",
      "Required scope: meeting:write:meeting. Optional scopes: none.",
      "No webhooks, no Realtime Media Streams, no in-client (Surface) experience.",
      "Access and refresh tokens are stored encrypted (AES-256-GCM) and deleted when the user disconnects Zoom.",
    ],
  },

  { type: "h2", text: "2. Roles and test credentials" },
  {
    type: "p",
    text: "The integration has a two-user flow, but only the calendar owner needs an account — the person booking uses a public page and never signs in.",
  },
  {
    type: "ul",
    items: [
      "Owner — connects Zoom, defines meeting types, receives bookings. Email: zoom.reviewer@slotix.neurin.tech · Password: SlotixZoom2026-Review",
      "How to sign in: open https://slotix.neurin.tech/ and click «Вход» (Sign in) in the top-right corner, then enter the credentials above. There is no separate /login URL — sign-in is a dialog on the home page.",
      "Client — no account needed. Public booking page: https://slotix.neurin.tech/zoom-reviewer",
    ],
  },
  {
    type: "p",
    text: "The demo account is pre-seeded with availability 08:00–22:00 UTC every day (so slots exist whatever time you test), two live meeting types, and one past booking so the Meetings screen is not empty. Zoom is intentionally NOT pre-connected — connecting it is Test A.",
  },
  {
    type: "ul",
    items: [
      "Product consultation (Zoom) — 30 min, confirmed instantly.",
      "Strategy session (Zoom, manual confirmation) — 45 min, requires the owner to approve.",
      "Both offer Zoom and a phone call. Platforms the owner has not connected are hidden from clients, so Zoom appears in the client's list only after Test A is complete.",
    ],
  },

  { type: "h2", text: "3. Test A — Connect a Zoom account (OAuth)" },
  {
    type: "ul",
    items: [
      "Sign in as the Owner (see section 2).",
      "Open Кабинет → Интеграции (Cabinet → Integrations): https://slotix.neurin.tech/cabinet/integrations",
      "In the Zoom row click «Подключить» (Connect).",
      "Approve access on Zoom's consent screen.",
      "Expected: you are returned to the integrations screen and the Zoom row shows «Подключено» (connected), with no error banner.",
    ],
  },
  {
    type: "p",
    text: "Please start this flow from inside the app rather than by opening the Authorization URL directly: the OAuth callback attaches the Zoom account to the signed-in Slotix user and therefore requires an active session. Clicking «Подключить» produces exactly the same authorization request, against the production Client ID and redirect URI listed in section 1.",
  },

  { type: "h2", text: "4. Test B — Booking creates a Zoom meeting (main flow)" },
  {
    type: "ul",
    items: [
      "Open the public booking page in a private window (this is the real client experience, no login): https://slotix.neurin.tech/zoom-reviewer",
      "Choose «Product consultation (Zoom)» and pick any available date and time.",
      "Under «Где встречаемся» (Where we meet) choose Zoom.",
      "Enter a name and an email address you can read, then submit.",
      "Expected: the confirmation screen shows a Zoom join link; the confirmation email contains the same link next to the label Zoom plus an .ics attachment; the owner's cabinet (Кабинет → Встречи) lists the booking with the same link; the meeting appears in the connected Zoom account under Meetings → Upcoming with the booked time and duration.",
    ],
  },

  { type: "h2", text: "5. Test C — Manual confirmation (link created on approval)" },
  {
    type: "ul",
    items: [
      "On the public page book «Strategy session (Zoom, manual confirmation)», choosing Zoom.",
      "Expected: the client sees «Запрос отправлен» (request sent) and no Zoom link yet.",
      "Sign in as the Owner, open Кабинет → Встречи, find the pending booking and confirm it.",
      "Expected: the Zoom meeting is created on approval; the join link appears in the cabinet and in the client's confirmation email.",
    ],
  },

  { type: "h2", text: "6. Test D — Disconnect (least-privilege behaviour)" },
  {
    type: "ul",
    items: [
      "As the Owner, open Кабинет → Интеграции and click «Отключить» (Disconnect) on the Zoom row.",
      "Open the public booking page again.",
      "Expected: Zoom is no longer offered under «Где встречаемся» — only the phone option remains. Booking still succeeds, with a phone call instead of a video link, and no error is shown.",
      "Reconnecting Zoom (Test A) restores it for subsequent bookings.",
    ],
  },
  {
    type: "p",
    text: "This is the least-privilege experience: the app never blocks the core booking flow on Zoom access, and never offers a platform it cannot deliver a link for.",
  },

  { type: "h2", text: "7. Optional scopes" },
  {
    type: "p",
    text: "The app requests no optional scopes. meeting:write:meeting is the minimum needed to create a meeting on behalf of the connected user, so there is one authorization state to test (granted), plus the disconnected state covered by Test D.",
  },

  { type: "h2", text: "8. Notes for reviewers" },
  {
    type: "ul",
    items: [
      "The interface language is Russian; the steps above give both the Russian label and the URL.",
      "No paid plan tier, 2FA or access control gates any part of this flow.",
      "The app has no interface inside the Zoom client, no webhooks and no use of Realtime Media Streams.",
      "If the demo data ever looks stale, the seed can be re-run and the account restored to the state described in section 2.",
    ],
  },
];
