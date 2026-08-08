import type { Metadata } from "next";
import { LegalDocument } from "@/lib/legal/legal-document";
import {
  ZOOM_TEST_PLAN_BLOCKS,
  ZOOM_TEST_PLAN_EFFECTIVE_DATE,
  ZOOM_TEST_PLAN_INTRO,
  ZOOM_TEST_PLAN_TITLE,
} from "@/lib/legal/zoom-test-plan-content";

export const metadata: Metadata = {
  title: ZOOM_TEST_PLAN_TITLE,
  description: "End-to-end test plan for Zoom Marketplace reviewers: authorization, booking flow, scopes and expected outcomes.",
  alternates: { canonical: "/zoom-test-plan" },
  // Reviewer-facing documentation, not marketing — keep it out of search results.
  robots: { index: false, follow: false },
};

export default function ZoomTestPlanPage() {
  return (
    <LegalDocument
      title={ZOOM_TEST_PLAN_TITLE}
      effectiveDate={ZOOM_TEST_PLAN_EFFECTIVE_DATE}
      intro={ZOOM_TEST_PLAN_INTRO}
      blocks={ZOOM_TEST_PLAN_BLOCKS}
      requisites={[]}
    />
  );
}
