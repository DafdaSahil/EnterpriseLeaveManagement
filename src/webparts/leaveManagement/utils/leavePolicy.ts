// ────────────────────────────────────────────────────────────
// Leave Policy Content
//
// Kept as data rather than JSX so the wording can be reviewed and
// edited without touching the component. The allowance figures are
// intentionally NOT repeated here - they come from LEAVE_TYPES in
// constants.ts so there is a single source of truth.
// ────────────────────────────────────────────────────────────

export interface IPolicyHighlight {
  label: string;
  value: string;
}

export const POLICY_HIGHLIGHTS: IPolicyHighlight[] = [
  { label: "Casual Leave", value: "10 days / year" },
  { label: "Sick Leave", value: "8 days / year" },
  { label: "Earned Leave", value: "20 days / year" },
  { label: "Half Days", value: "Allowed" },
];

export interface IPolicySection {
  id: string;
  title: string;
  summary: string;
  points: string[];
}

export const POLICY_SECTIONS: IPolicySection[] = [
  {
    id: "types",
    title: "Leave types",
    summary:
      "Four leave categories are available. Each carries a separate annual allowance, and balances are tracked independently.",
    points: [
      "Casual Leave - 10 days per year, for personal errands, family events, or short breaks that cannot be planned far ahead.",
      "Sick Leave - 8 days per year, for your own illness or to care for an immediate family member.",
      "Earned Leave - 20 days per year, for planned holidays and extended travel.",
      "Unpaid Leave - granted only with prior written approval. It does not reduce any paid balance but must be cleared by your manager before you apply.",
    ],
  },
  {
    id: "accrual",
    title: "Accrual and resets",
    summary:
      "Allowances are granted per calendar year and are consumed in the order you apply for them.",
    points: [
      "All allowances are granted in full on 1 January each year.",
      "Unused days do not carry forward into the following year.",
      "Days are deducted only once a request reaches Approved status. A pending request does not reduce your balance.",
      "Rejected requests have no effect on your balance.",
    ],
  },
  {
    id: "half-days",
    title: "Half-day leave",
    summary:
      "Single-day requests may be split into a half day for appointments and personal errands.",
    points: [
      "Half days are only available when the start and end date are the same day.",
      "Choose First Half (AM) or Second Half (PM) when you submit a single-day request.",
      "A half day is recorded as 0.5 against your balance, so you can take two half days in place of one full day.",
      "Half days cannot be combined across a multi-day range - split those into separate requests if needed.",
    ],
  },
  {
    id: "business-days",
    title: "How days are counted",
    summary:
      "Only working days are deducted, so weekends and public holidays cost you nothing.",
    points: [
      "Saturdays and Sundays are excluded automatically.",
      "Company holidays are excluded automatically - see the Holiday Calendar for the current list.",
      "A request running from Monday to Friday counts as 5 days, even if it spans a weekend at either end.",
      "The adjusted count is shown on the form before you submit, so there are no surprises.",
    ],
  },
  {
    id: "applying",
    title: "Applying for leave",
    summary:
      "Requests are submitted in the portal and routed to your manager automatically.",
    points: [
      "Submit the request from the Apply Leave page, choosing your leave type, dates, and a reason.",
      "A reason of at least 5 characters is required so your manager has context.",
      "Start dates cannot be in the past.",
      "You will see the exact day count and remaining balance before submitting.",
    ],
  },
  {
    id: "approval",
    title: "Approval and turnaround",
    summary:
      "Your manager reviews each request. Overlapping requests for the same dates are flagged for them.",
    points: [
      "Requests are routed to the manager recorded on your employee profile.",
      "A rejection always includes a written reason - check the note on your leave history.",
      "Managers should respond within 3 working days of submission.",
      "If a request is rejected and you believe it is incorrect, reply to your manager directly rather than resubmitting the same dates.",
    ],
  },
  {
    id: "cancellation",
    title: "Cancelling a request",
    summary:
      "You can withdraw your own leave while it is still cancellable.",
    points: [
      "Pending requests can be cancelled at any time from your leave history.",
      "Approved leave can be cancelled only while the start date is still in the future.",
      "A leave that has already begun cannot be cancelled - contact your manager if you need to return early.",
      "Cancelling restores the days to your balance.",
    ],
  },
  {
    id: "exceptions",
    title: "Excess and exceptions",
    summary:
      "Going beyond your balance is possible but needs approval, and unpaid leave is treated separately.",
    points: [
      "Applying for more days than your balance allows will be blocked at the point of submission.",
      "If you need more days than your balance, ask your manager to record the excess as Unpaid Leave.",
      "Unpaid Leave requires prior written approval and is not deducted from any paid allowance.",
      "Extended medical leave should be raised with HR directly as it sits outside this policy.",
    ],
  },
];

export const POLICY_FOOTER =
  "This policy applies to all employees of LMS Portal. Where local labour law requires something more favourable than what is written here, the law takes precedence. For anything not covered here, contact HR.";