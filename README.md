# Home Locator — ClientFirst-style CRM demo

Independent working prototype with fictional data. No ClientFirst or Home Locator production connection. Open Home-Locator-Demo.html, or run `node serve.mjs` from the source package and visit http://127.0.0.1:4173. Changes reset on refresh. No dependencies required.

## Coverage

- Leads: 13 reference status counters, intake, full edit form, grouped filters, assignment, calls, four-attempt RNR, follow-ups, visits, transfers, booking and other closure dispositions.
- Sellers / Data: owner and property records, status editing, linked conversion to leads and inventory.
- Process: RNR, Transferred, SVS, SVD, Not Interested and Lost.
- Admin: Assets, Allotment, Office. Marketing: Campaigns. Channel Partners and Notice Board.
- HR: Leaves, Attendance List, Candidate. Sales: Sales History, Incentives, CRM, Reimbursement.
- Digital: Calendar, Tasks, Digital Spends.
- Settings: users, projects, project knowledge, assigned projects, inventory, notices, CSV bulk upload, bulk lead updates, bulk data transfers, buyer/seller cost sheet.
- Tools: D1–D4 dashboards, knowledge, inventory, reports and drilldowns, follow-ups, search, notifications, profile and theme.

Forms save actual session records. New users and projects appear in related options. Bulk actions validate before committing. Approvals are simulated using View as. WhatsApp creates local drafts; builder registration creates local records only.

## Audit

Reviewed the project-related conversation, ten-page CRM deck, mind map and 45 sampled video frames across the approximately 24-minute supplied reference. This was screen inspection, not full audio transcription or exhaustive replay.

The user's latest report of Anjali's call asks for workflows and code. Earlier advice that a presentation alone would suffice was speculative. This deliverable includes both.

Observed evidence includes lead editing around 8:30, RNR around 14:05, authorized transfers around 14:15, Not Interested and Lost around 14:25–14:30, intake around 18:40, and Settings around 19:45 onward. Visible menu areas are represented in the demo.

Confirmed statuses: Initial, RNR, Verified, Site Visit Scheduled, Site Visit Done, Not Interested, Booked, EOI, Hold, Re-Sale, Duplicate, Project Mismatch, Cancelled. RNR retains the current status for attempts 1–3 and changes on attempt 4. D1–D4 are dashboard shortcuts, not four days.

Dashboard contents, detailed supporting-module forms/rules, SVS/SVD details, round-robin assignment, one open follow-up task, duplicate guards, atomic imports, role simulation and asset-allocation safeguards are reconstructed demo choices, not verified ClientFirst parity. Retry dates are entered manually; there is no scheduler enforcing the reference's day/telephone-number rotation. Cost-sheet rates are user-entered arithmetic.

## Demonstration

1. Add a fictional lead, then edit requirements, project, budget, purpose, tags and next follow-up; set Verified.
2. Schedule a visit, advance the demo clock, complete the visit and record the next follow-up.
3. Transfer as Manager and Book. Inspect history, closed follow-up and Sales History.
4. Separately demonstrate four RNR calls and Not Interested / Lost Lead with a reason.
5. Convert Seller/Data records to leads and inventory, retaining their links.
6. Preview CSV imports and bulk updates before committing. Add supporting-module records and inspect reports.
7. Open Workflow Logic to inspect executable code and the embedded audit.

## Source and validation

`dist/workflow.js` is the core engine; `dist/crm.js` extends actions and module schemas. `dist/crm-ui.js` renders forms/navigation, `dist/crm.css` styles them, and `dist/audit.html` embeds coverage notes. `applyCRM(state, action, now, actor)` returns a new state; rejected actions leave the input unchanged. Leads link to tasks, visits, events, sources and sales.

Run `node --test tests/*.test.js`. The 23 automated tests cover core transitions, RNR, imports, atomic rejection, bulk ownership, saves across every module schema, approvals, users, allocation, registration and linked sales. Browser checks verified the expanded lead edit and booking flow; earlier core checks covered visits, overdue handling and source conversion. Standalone JavaScript is syntax-checked; direct file-browser verification was unavailable in this environment.

## Limits

Session-only frontend: no database, authentication, production permissions, live CRM integration, external messages, payments or actual builder submissions. Role guards are prototype behavior, not server-side security. Fictional records are not offers.

Local preview and downloadables are delivered. Hosted publication remains unavailable because the environment blocked Git index writes and lacked its HTTPS helper; no hosted release is claimed.

