# PLAN.md

> Fill this in before / alongside coding. Keep it short — half a page to a page.
> This is graded: it shows us how you think about scope, data, and failure.

## 1. Data model

_Schemas you'll create, key fields, and the index(es) you chose + why._

- Contact: userId (String), name (String), email (String), company (String, optional), title (String, optional).
- Campaign: userId (String), name (String), promptTemplate (String).
- CampaignContact (Mapping collection): userId (String), campaignId (ObjectId), contactId (ObjectId), status ('pending' | 'finished' | 'failed'), message (String), error (String).

Contact and Campaign collections are used to manage the lists of contacts and campaigns. CampaignContact serves as a 'junction collection' that links contacts and campaigns, storing the generation status per contact.

**Modeling Justification (CampaignContact):**
I chose to keep `CampaignContact` embedded within the `Campaign` document as a sub-document array rather than breaking it out into a standalone collection. 
- *Why:* In a 1%-scale outreach tool, a campaign typically targets hundreds or a few thousand contacts. Since MongoDB documents can hold up to 16MB of data, embedding thousands of contact states easily fits within a single document. This makes fetching a campaign and all its generation statuses incredibly fast (a single read operation) instead of requiring expensive `$lookup` aggregations across collections. If the app scales to millions of contacts per campaign, this array would cause the document to grow out of bounds and we would normalize it into a separate collection, but for this slice, embedding is the most performant and simplest approach.

**Index Justification:**
- `Contact`: Compound indexes on `{ userId: 1, name: 1, _id: 1 }` and `{ userId: 1, createdAt: 1, _id: 1 }`. 
  - *Why*: Following the ESR (Equality, Sort, Range) rule. Everything is scoped to a user, so `userId` comes first (Equality). `name` and `createdAt` are used for sorting (Sort). Finally, because names and timestamps are non-unique, sorting on them isn't guaranteed to be stable across pagination requests. Appending `_id` creates an absolute tie-breaker, guaranteeing deterministic pagination so no records are skipped or duplicated.
- `CampaignContact`: An index on `{ userId: 1, campaignId: 1, contactId: 1 }` to quickly fetch attached contacts and prevent attaching the same contact twice.


## 2. API surface

_Endpoints, and which DTO validates each. Note anything you're deliberately keeping thin._

- **Contacts**:
  - `POST /contacts` — Validated by `CreateContactDto` (uses `class-validator` for `IsEmail`, `IsNotEmpty`).
  - `GET /contacts` — Validated by `ListContactsDto` for page/limit, sort, and search query params.
- **Campaigns**:
  - `POST /campaigns` — Validated by `CreateCampaignDto`.
  - `POST /campaigns/:id/contacts` — Attaches array of contact IDs via `AttachContactsDto`.
  - `GET /campaigns/:id` — Fetches campaign + populates the embedded contacts.
  - `POST /campaigns/:id/contacts/:contactId/generate` — Core LLM endpoint.

**Thin layers:** Controllers are strictly pass-through, delegating immediately to Services.

## 3. LLM generation: failure handling

_How does the generate endpoint behave on provider error / timeout / bad template?_
_What status transitions does a contact's message go through?_

- **Flow**:
  1. Set `CampaignContact` status to `pending`.
  2. Parse `promptTemplate` by replacing `{{variables}}` with contact fields.
  3. Attempt `LlmService.complete()`.
  4. On success: Update status to `finished` and save the `message`.
  5. On failure (Timeout/Provider Error): The `catch` block intercepts the exception, updates status to `failed`, and records the sanitized error message.
  6. **Return**: The endpoint returns a `200 OK` (containing the updated object with its `failed` state) rather than throwing an unhandled `500` exception to the client.

## 4. Auth / scoping

_How do you ensure user A can't touch user B's data?_

- Scoping is enforced by the provided `user.guard.ts` ensuring `x-user-id` is present.
- A custom `@CurrentUser()` decorator extracts `userId` in controllers.
- **Enforcement**: Every Mongoose query (find, update, create) in the services rigidly includes `{ userId }` as part of its filter. This guarantees User A can never query or mutate User B's documents.

## 5. Scope decisions

_What did you choose NOT to build, and why? What would you do next with more time?_

- **Cut:** Authentication UI / Backend JWTs. We use the hardcoded `x-user-id` header.
- **Cut:** Background job queues (like BullMQ). The LLM generation is synchronously awaited. While not ideal for massive scale, it's appropriate for this 1% slice assessment.

## 6. AI tooling

_Which AI tools did you use, for what? Where did you accept its output, and where did you_
_override or distrust it?_

- I used Antigravity as my primary autonomous coding agent to help bootstrap and implement the NestJS backend and Next.js frontend scaffolding.
- I specifically chose Antigravity as the primary coding agent because it automatically presents a clear, easy-to-read implementation plan before writing any code. This transparent workflow makes it much easier to analyze, review, and modify architectural decisions upfront before a single line of code is committed.
- I also utilized Goggle AI Studio as my LLM key provider for the actual app's generation endpoints since I happen to have a Google One AI Premium subscription, giving me access to Gemini 1.5 Pro.

- The AI tried to use npm to install and manage npm packages. Nothing is inherently wrong with that at all. However, I choose to use bun as the JavaScript runtime and package manager for this project because of its superior speed and performance ([https://techsy.io/en/blog/bun-vs-pnpm-vs-yarn-vs-npm](https://techsy.io/en/blog/bun-vs-pnpm-vs-yarn-vs-npm)).
- The AI wants to immediately jump to frontend code even before we finishes with the backend side. While I understand its intention to deliver a complete product quickly, I believe it's critical to fully build out the backend first and make sure it works as intended before moving on to the frontend.
- I noticed that the AI sometimes is using 'any' type in the code. While I understand it makes it easier to write code at first, maintaining in the long term will be utter hell (speaking from experience). I believe it's better to use proper types to ensure type safety.
- For the frontend, I choose to use TanStack Query (React Query) for state management and data fetching instead of the default API client since it handles caching, invalidation, and synchronization automatically. This approach treats the frontend as a remote cache for the backend database, which is highly effective for applications that primarily display and manipulate stored data.
- The AI hallucinate and claims that, for the frontend app, we don't have to provide the UI for "build campaign" and "generate campaign for contact" feature since it's not explicitly asked by the TASK.md. After I pushed back, it realizes its mistake and went ahead to implement them. 
- The AI has done various UI/UX implementation quirkness on "Create Campaign" page. I needed to iterate back and forth with it to finally get the right UI/UX implementation. 
- 

