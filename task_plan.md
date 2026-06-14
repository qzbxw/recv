# Task Plan: Legal Audit and Document Alignment

## Goal
Perform a comprehensive technical legal audit updates of the terms of service, privacy policy, analytics consent, DPA, clickwrap flow, and other legal files in the repository, making them accurate and aligning code implementation (analytics tracking, user registration, bootstrap agent, pricing plans) with the legal requirements.

## Current Phase
Phase 3: Legal Document Updates

## Phases

### Phase 1: Requirements & Discovery
- [x] Locate all legal documents, templates, translations, and associated components in both frontend repositories (`frontend` and `frontend-public`).
- [x] Audit the analytics/GTM/Yandex Metrica integration in `frontend-public` to identify how consent is handled.
- [x] Inspect plans in the backend (`backend/internal/store/plans.go`), webhook validation logic, and account creation/bootstrap script logic.
- [x] Gather information on user deletion/retention mechanisms in the backend database schemas.
- **Status:** complete

### Phase 2: Design & Alignment Discussions
- [x] Discuss legal entity constraints with the user (since they don't have a registered legal entity yet).
- [x] Formulate templates for placeholders for Governing Law / Dispute Resolution and the missing documents.
- [x] Define frontend and backend changes needed to support proper legal acceptance tracking.
- **Status:** complete

### Phase 3: Legal Document Updates
- [ ] Update English terms and privacy files in `frontend-public` and `frontend`.
- [ ] Create the new Data Processing Addendum (DPA) and list of Subprocessors.
- [ ] Translate/update the Russian translations of all documents.
- [ ] Address security statement inaccuracies (JWT signatures, hashed API keys, plaintext webhook secrets).
- **Status:** in_progress

### Phase 4: Code & Verification Updates
- [ ] Implement analytics consent logic (preventing load of optional trackers without consent).
- [ ] Implement UI acceptance notice/clickwrap verification at registration/auth portals.
- [ ] Add `terms_accepted` configuration/parameter to the bootstrap agent workspace flow.
- [ ] Verify cleanups or document retention details to align backend with stated retention policies.
- **Status:** pending

### Phase 5: Verification & Delivery
- [ ] Review all modified files.
- [ ] Ensure formatting, links, and text look high quality and professional.
- **Status:** pending

## Key Questions
1. How should we represent the Service Provider/Data Controller details given that there is no registered legal entity yet? (For now, we can use clean placeholders/draft language, but let's discuss options such as using a default placeholder structure, or drafting for "the operators of recv.money", or using standard placeholders that clearly stand out).
2. What country/state should be used as the default for governing law and dispute resolution placeholders?
3. Where are GTM and Yandex Metrica configured and loaded in `frontend-public`?

## Decisions Made
| Decision | Rationale |
|----------|-----------|
|          |           |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
|       |         |            |
