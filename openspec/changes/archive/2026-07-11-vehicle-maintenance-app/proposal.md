# Proposal: Vehicle Maintenance App

## Problem

The user needs a private family application to manage the maintenance history, failures, costs, and upcoming maintenance obligations for multiple vehicles.

The project also serves as a learning vehicle for good software engineering practices, so the implementation should favor clear domain modeling, small reviewable PRs, tests, and explicit architectural decisions.

## Users

- Family administrators
- Family editors

Initial roles:

- `admin`
- `editor`

Detailed permissions will be defined later.

## Initial Fleet

The app starts with:

- 2 cars
- 2 motorcycles

The system must support adding new vehicles and deactivating vehicles that are no longer owned.

Vehicles must not be physically deleted because historical records must remain available.

## Vehicle Data

Each vehicle should support at least:

- brand
- model
- year
- fuel type
- license plate
- current mileage
- status
- purchase date
- created/registration date in the app

Current mileage can be updated manually by a user or automatically when a maintenance/failure event is recorded with a newer mileage.

## Maintenance and Failure Records

The MVP must support entering vehicle events such as:

- maintenance
- failures/breakdowns

Each event should support at least:

- vehicle
- type: maintenance or failure
- description
- mileage
- date
- workshop/provider
- cost
- notes
- optional next due mileage
- optional next due date

Example maintenance event:

- Oil + oil filter + air filter change
- 120000 km
- Workshop X
- 300 EUR
- Next due: 130000 km or 1 year

Example failure event:

- Rear light bulb replacement
- 120005 km
- Workshop X
- 50 EUR

## Recurrence and Alerts

Recurring maintenance should be considered due when either the mileage threshold or date threshold arrives first.

The app should also support a future per-vehicle reminder when mileage has not been updated for a configurable number of days.

## Attachments, OCR, and AI Roadmap

The data model should leave room for future attachments such as invoice photos or documents.

Future capabilities may include:

- attaching invoice photos to events
- OCR-based invoice data extraction
- uploading vehicle maintenance manuals as PDFs
- AI-assisted extraction of upcoming maintenance requirements from manuals
- chat-style consultation over uploaded manuals

These AI/document features are explicitly out of scope for the first MVP implementation, but early modeling should avoid blocking them.

## Access and Deployment

The app must be usable from desktop and mobile.

Authentication is required because the app will be used by the family.

Deployment target:

- VPS managed with Dokploy
- shared self-hosted Supabase service

Because self-hosted Supabase supports a single shared project in this environment, database tables for this app must use an application-specific prefix or namespace.

## MVP / First PR Scope

The first useful slice should include:

1. Vehicle registration/listing with active/inactive lifecycle.
2. Manual entry of maintenance and failure records.
3. Mileage update behavior when adding events.
4. Basic authenticated family access foundation, depending on selected stack.

Out of scope for the first PR:

- OCR
- AI manual ingestion
- chat over manuals
- push/email notifications
- detailed role permission matrix
- advanced dashboarding

## Open Questions

1. What stack should be used for the web app?
2. What exact table prefix should this app use in shared Supabase?
3. Should the first PR include authentication end-to-end or only prepare the structure?
4. What languages should the user-facing UI support initially?
5. Should mileage be allowed to decrease manually, and if so should that require admin privileges?
