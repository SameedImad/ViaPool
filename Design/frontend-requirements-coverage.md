# Frontend Requirements Coverage (Web)

Scope: `d:\ViaPool\frontend` (React + Vite + React Router).

Legend:
- Fully = UI + state + API integration present
- Partial = UI present but mocked / local state / placeholder / TODOs
- Not = no meaningful implementation found in frontend

## Driver requirements

1. Post details (start, destination, time, seats, price)
   - Status: Partial
   - Evidence: `frontend/src/pages/PostRide.jsx`
   - Notes: Form exists; submit is `// TODO: POST /api/rides`.

2. Upload documents (License, RC & vehicle documents)
   - Status: Partial
   - Evidence: `frontend/src/pages/DriverOnboarding.jsx`
   - Notes: License upload UI exists; vehicle form exists; no RC-specific upload; no API wiring.

3. Preferences (pets, male/female passengers only)
   - Status: Partial
   - Evidence: `frontend/src/pages/PostRide.jsx`
   - Notes: `allowPets` and `genderPref` are collected; no persistence.

4. Routing to destination / Map
   - Status: Not (real map). Partial (placeholder)
   - Evidence: `frontend/src/pages/LiveRideView.jsx`
   - Notes: Placeholder SVG “map”; no map SDK usage (Google/Mapbox/Leaflet).

5. Display details of passengers who want to go same destination
   - Status: Partial
   - Evidence: `frontend/src/pages/RideManagement.jsx`
   - Notes: Passenger list is static `PASSENGERS` array.

6. Payment details (paid, mark as paid)
   - Status: Partial
   - Evidence: `frontend/src/pages/RideManagement.jsx`, `frontend/src/pages/Earnings.jsx`
   - Notes: Per-passenger paid toggle exists; earnings/history UI is static.

7. Communication channel with passengers
   - Status: Partial
   - Evidence: `frontend/src/pages/DriverChat.jsx`
   - Notes: Chat UI exists; no realtime transport (`// TODO: emit socket event`).

8. Reject/Accept passengers
   - Status: Partial
   - Evidence: `frontend/src/pages/RideManagement.jsx`
   - Notes: Accept/reject updates local state only.

9. Display trip details (avg speed, stops)
   - Status: Partial
   - Evidence: `frontend/src/pages/LiveRideView.jsx`
   - Notes: Shows simulated speed/time/distance; no “stops”; no GPS-derived stats.

## Passenger requirements

1. Book a ride (current location, destination)
   - Status: Not
   - Evidence: No passenger booking routes/pages in `frontend/src/App.jsx`
   - Notes: Only marketing “Find a ride now” widget on Home.

2. View driver details
   - Status: Partial
   - Evidence: `frontend/src/pages/PublicUserProfile.jsx`
   - Notes: UI exists; user data is mocked; `// TODO: fetch user by userId`.

3. Make payments
   - Status: Not
   - Evidence: No payment flow page/gateway integration found.

4. Cancel rides
   - Status: Not
   - Evidence: No passenger bookings/trip management pages found.

5. Real-time tracking of drivers on maps
   - Status: Not
   - Evidence: No map SDK; LiveRideView is driver-only placeholder.

6. Communication with the driver
   - Status: Partial (driver-only)
   - Evidence: `frontend/src/pages/DriverChat.jsx`
   - Notes: No passenger chat page/route.

7. Preferences (experience of driver, car types, price)
   - Status: Not (real), Partial (marketing UI)
   - Evidence: `frontend/src/pages/Home.jsx`
   - Notes: Filter chips exist but not wired to a search.

## Cross-cutting

1. Ratings & reviews
   - Status: Partial
   - Evidence: `frontend/src/pages/PublicUserProfile.jsx` (sample reviews), `frontend/src/pages/Home.jsx` (marketing)

2. Safety features
   - Status: Partial (UI only)
   - Evidence: `frontend/src/pages/LiveRideView.jsx` (SOS button with no handler), `frontend/src/pages/Home.jsx` (marketing)

3. Notifications
   - Status: Partial
   - Evidence: `frontend/src/pages/Notifications.jsx`
   - Notes: Feed + preferences are local state only.
