# Submission checklist

Tick what you completed and add notes. This helps us review fairly — especially if you made
deliberate scope cuts (which we respect). Be honest; "didn't get to X" is fine.

## Required scope

### Backend — contacts
- [x] `POST /contacts` creates a contact, validated (bad input → 400)
- [x] `GET /contacts` is paginated (`page`, `limit`)
- [x] `GET /contacts` supports `search` (name + company)
- [x] `GET /contacts` supports `sort` (name, createdAt)
- [x] Pagination is **stable** (no dupes / skips as records are added) — note your approach:
  - _approach:_ Used deterministic sorting by relying on `createdAt: -1` and breaking ties natively via the unique `_id` field.
- [x] Schema has a justified index — _which, and why:_
  - `ContactSchema.index({ userId: 1, createdAt: 1, _id: 1 })`. This compound index perfectly covers the exact query pattern for listing contacts for a user (`userId` filtering), sorting by creation date (`createdAt`), and stable tie-breaking (`_id`).
- [x] At least one meaningful service `.spec.ts`

### Backend — campaigns + LLM
- [x] `POST /campaigns` (name + promptTemplate), validated
- [x] `POST /campaigns/:id/contacts` attaches contacts
- [x] `POST /campaigns/:id/contacts/:contactId/generate` interpolates + calls the LLM
- [x] Generation persists a **status** (pending → finished / failed)
- [x] Provider error / timeout / bad template handled (no unhandled 500) — note how:
  - _approach:_ Wrapped the LLM provider call inside a strict `try-catch` block. Proactively validated missing placeholders against the Contact data. If the provider timed out or failed, caught the exception, extracted the message, saved it to the Contact's `error` field, and transitioned the status to `failed` rather than crashing the request.

### Auth
- [x] Contacts + campaigns are scoped to the `x-user-id` user (A can't touch B's data)

### Frontend
- [x] Contacts page: paginated, searchable table
- [x] Contacts page: create form
- [x] Data access via service + hook (no `fetch` in components)
- [x] Campaign detail page: lists attached contacts
- [x] Generate button per contact with idle → generating → result + error states

## Stretch (optional)
- [x] Implemented **Optimistic UI** for the generation button.
- [x] Implemented **Debounce/Timestamp Lock** to prevent rapid rage-clicks on the generate button.
- [x] Added **History Tracking / Template Tweaking**: Ability to click "Edit & Regenerate" for a specific contact to override the template, while viewing the previous generated emails in a collapsible history dropdown.
- [x] Added a **Progress Indicator** (`X / Y Generated` status bar) to the Campaign Details and Campaigns List pages.
- [x] Added **Edit Campaign** functionality to modify the campaign's global name and prompt template.
- [x] Implemented `@tanstack/react-query` for data fetching, caching, and state management.

## How to run
- LLM provider I used: `Ollama Local (qwen2.5-coder:14b)` (Configured strictly for local execution. I needed to do this because I realized my Google AI Pro subscription doesn't include API usage).
- Anything reviewers should know to run it:
  - Ensure the backend environment variables are correctly pointing to a valid provider instance.

## Scope cuts & notes
_What you deliberately didn't do, and what you'd do next:_
- **Full OAuth/Auth UI**: Skipped a complex authentication UI; the system relies strictly on the `x-user-id` header passed seamlessly by the `api.ts` interceptor.
- **Dynamic Frontend Sorting UI**: While the backend handles sorting robustly, I cut the scope of adding complex clicking/sorting table headers on the frontend to focus strictly on paginated, searched data and the LLM generation workflows.
- **Architecture Improvement**: I would implement the Strategy pattern and Factory method pattern for `LlmService`. Instead of building each LLM implementation on a single class, I'd build a universal interface for the LLM call flow, and implementation classes for each provider that match the contract of the interface. This will make it adhere to the Open-Closed Principle.
- **Message Queue for LLM**: I would use a message queue tool like BullMQ to asynchronously generate the email draft. We can use polling or WebSockets so that the FE can get real-time updates of the generation process.
- **API Contracts**: I would implement Zod and a Swagger API contract to get a clean and always up-to-date API contract.
