# Mesa Cerca

Individual Software Design project for discovering nearby restaurants, saving places,
and receiving recommendations based on searches and personal ratings.

[Live application](https://proyectodisenosoftware.vercel.app)

## Features

- Google or email/password sign-in through Supabase Auth.
- Spanish and English interface with Explore, My lists and My account screens.
  Navigation appears at the bottom on mobile and at the top on desktop.
- Browser location or a point selected on Google Maps.
- Cuisine and budget filters, with up to five results within three kilometres.
- Personal Want to visit and Visited lists, with ratings from 1 to 5.
- Recommendations based on previous searches and personal ratings.
- Read-only list links that the owner can revoke.
- Compact restaurant cards and individual pages with Google photos, reviews and ratings when available.

## Technology and organization

React and CSS provide the interface; Vite runs and builds the project.
i18next manages translations. Supabase provides authentication, PostgreSQL
and Deno backend functions. Google Maps and Places provide maps and restaurant
data. The frontend is deployed on Vercel.

| Directory | Responsibility |
|---|---|
| `src/components` | Interface, forms and maps |
| `src/lib` | Browser requests, sessions and validation |
| `src/locales` | Spanish and English interface text |
| `supabase/functions` | Request authentication, permissions and external queries |
| `supabase/migrations` | Tables, RLS policies, grants and usage quota |
| `backend` | Basic local server and backend tests |
| `tests` | Frontend module tests |
| `docs` | Authentication setup and test records |
| `public` | Favicon and decorative background |

Source comments and documentation use English. Comments describe decisions in
third-person sentences. Spanish translations remain in `src/locales/es.json`,
and the language selector retains the native language name. Mesa Cerca is the
application's name in both languages.

## Local development

Node.js and npm are required; Deno is required for backend checks and tests.
Dependencies are installed with:

```bash
npm install
```

The root `.env.local` is copied from `.env.example` and completed with:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLIC_KEY
VITE_USE_HOSTED_BACKEND=true
VITE_GOOGLE_MAPS_API_KEY=YOUR_BROWSER_KEY
VITE_GOOGLE_MAPS_MAP_ID=YOUR_MAP_ID
```

The frontend starts on the authorized local port with:

```bash
npm run dev -- --port 5173 --strictPort
```

The local interface uses the deployed functions. Vite requires a restart after
an environment-variable change. The final version uses live data; the old mock
mode has been removed and `VITE_REAL_SEARCH` is no longer used.

Variables with the `VITE_` prefix are public. The Maps browser key is restricted
by website and API. The private Places key is configured only on the backend.
Local `.env.local` files remain outside version control.

Email, Google and redirect settings are documented in
[authentication setup](docs/authentication.md).

## New backend setup

1. A Supabase project is created and Auth is configured.
2. Files in `supabase/migrations` are executed in filename order in SQL Editor.
   This includes the read-grant migration `202611220004_shared_list_read_access.sql`.
3. `backend/.env.local` is copied from `backend/.env.example` and receives a private
   `GOOGLE_PLACES_API_KEY` with Places API (New) enabled.
4. The secret is configured and the functions are deployed with:

```bash
npx supabase login
npx supabase secrets set --env-file backend/.env.local --project-ref YOUR_PROJECT_REF
npx supabase functions deploy restaurants --project-ref YOUR_PROJECT_REF --use-api
npx supabase functions deploy saved-restaurants --project-ref YOUR_PROJECT_REF --use-api
npx supabase functions deploy search-history --project-ref YOUR_PROJECT_REF --use-api
npx supabase functions deploy sharing --project-ref YOUR_PROJECT_REF --use-api
npx supabase functions deploy shared-list --project-ref YOUR_PROJECT_REF --use-api
npx supabase functions deploy restaurant-details --project-ref YOUR_PROJECT_REF --use-api
```

The Edge Functions environment supplies the Supabase server keys.
Vercel receives the public variables from `.env.example` for Production and deploys
from GitHub. Variable changes require a new deployment to reach the build.
Allowed origins are defined in `supabase/functions/_shared/access.ts`; a different
domain also requires changes in Supabase Auth, Google OAuth and the Maps browser key.

The `npm run backend` command retains a basic local search server for
`VITE_USE_HOSTED_BACKEND=false`. Personal features use Supabase; this local server
does not replace the deployed backend.

## Navigation

The `#restaurants`, `#saved-restaurants` and `#account` links select the three
screens without reloading the application or losing the selected language.
Browser Back and Forward navigate between these sections. Search remains mounted
and hidden when another screen is open, preserving filters, location and results.
Maps mount only while visible to avoid initialization at zero size.

Password sign-in preserves filters and the selected point while discarding guest
results. Google sign-in leaves and reloads the application: the session persists,
but filters and the selected point may reset. Logout and account changes clear
the previous account's filters and results. Sign-in and preferences live in My
account. Sharing controls, optional rating preferences and the result map open
on request. Personal stars use native radio inputs with labels and required-score
validation.

The search form separates location and filters, emphasizes Search and gives
Recommend a secondary style. Return links name their destination and save buttons
describe their actions. Empty lists link to Explore, and a signed-in account offers
an action to continue exploring.

### Restaurant pages

Cards show essential information. A restaurant name or View restaurant link opens
its page with address, price, Google Maps access, photos and reviews. Saving,
moving, removing and rating happen on that page, depending on its source section.
Returning preserves results, filters and list pagination without repeating the query.
The gallery and reviews load when the page opens; a language change requires
Refresh details to request provider content in the selected language.

Restaurant pages depend on results loaded in the current session. Reloading a
page or opening its URL directly requires another search or reopening the list.
List-sharing links provide the persistent public read-only view.

Google ratings appear as five stars with a numeric score. The gallery contains
up to five photos with arrows and touch scrolling. Credits remain visible and
photos link to their original Google Maps content. Opening or refreshing a gallery
consumes one application quota unit, but can make one details request and up to
five photo requests to Google. Scrolling through loaded photos makes no further
backend requests. Google images and content are not stored in the database or
persistent browser storage.

### Explore card photos

Each result includes a thumbnail when Google provides one. Nearby Search supplies
photo references, and the backend requests one image for each of the final five
results. Building cards does not request reviews. Missing or failed images leave
the restaurant visible with a Photo unavailable message. Credits and source access
remain available; a photo is not guaranteed to show food.

A search can make up to five additional Google photo requests while still counting
as one application quota unit. `place-photos.mjs` shares backend photo retrieval;
`PlacePhoto.jsx` shares photo rendering between cards and the gallery.

## Recommendation rules

The backend considers the latest 20 searches and up to 20 rated Visited entries,
ordered by the saved entry's creation date. Each search filter contributes one
point. Each personal rating contributes `rating - 3` to the cuisine and budget
selected by the user: 5 adds two points, 4 adds one, 3 is neutral, 2 subtracts one
and 1 subtracts two.

Cuisine and price are selected separately from the highest positive scores.
Ties favour the most recent search; when no tied search exists, saved-entry order
is preserved. Without positive preferences, nearby options appear with a notice.
The location and search radius remain unchanged when no restaurants match.

Recommendation requests do not add searches to history. Clearing searches preserves
lists and ratings. Removing a rating removes its contribution. Moving a place to
Want to visit excludes its rating while it remains there. This is a rule-based
algorithm rather than a machine-learning model.

## Data, permissions and limits

- Private functions verify the session on the server. RLS policies restrict history,
  saved restaurants, personal ratings and share-link management to their owner.
- Public list queries require a random active share token. They do not return email,
  history or personal ratings. Revocation prevents new queries; previously viewed
  information cannot be withdrawn. A localhost link works only on its own device.
- The shared application quota allows ten queries per minute and one hundred per
  UTC day per account. Searches, list pages, details and public views of that
  account's shared lists use this quota. List and rating writes and share-link
  management do not query Google.
- One application query can make multiple Google requests. The application quota
  is not a monetary cap; reviews, summaries and photos use the provider's billing.
- Searches examine up to twenty nearby candidates and filter by price before
  returning five. Other restaurants may be omitted; missing prices are excluded
  when a price filter is active.
- Browser location can be wrong. Uncertainty above one kilometre is rejected and
  the map allows manual point selection. This does not guarantee absolute accuracy.
- The database stores place identifiers and user-created data. Google names,
  addresses, photos, reviews and summaries are requested when needed.
- Google supplies up to five reviews by relevance. The rating counts describe that
  sample, not a historical trend or every review. Google/Gemini supplies review
  summaries, which include the provider disclosure and required links.
- Photos may show food or the building. Photos, reviews and summaries can be missing.
- Password signup does not verify email ownership and offers no password recovery.
  Google and Supabase manage credentials. Personal ratings are not sent to Google Maps.

## Validation

```bash
npm run lint
npm test
npm run lint:backend
npm run test:backend
npm run build
```

Automated tests use simulated responses. SQL permission tests live in
`supabase/*.test.sql`; account-specific tests require existing accounts and roll
back their data changes. The [test record](docs/testing.md) separates previously
completed checks from the final browser and Vercel checks.

## Sources and AI assistance

ChatGPT provided support for proposing and reviewing frontend and backend code,
explaining Supabase and Google Places, preparing translations, documentation and
tests, and simplifying the presentation. Service configuration, code integration,
deployment and manual checks took place during development. Google/Gemini supplies
review summaries, which are identified in the interface.

- [React](https://react.dev/learn)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [i18next](https://www.i18next.com/)
- [Google Maps JavaScript](https://developers.google.com/maps/documentation/javascript)
- [Place Details](https://developers.google.com/maps/documentation/places/web-service/place-details)
- [Place Photos](https://developers.google.com/maps/documentation/places/web-service/place-photos)
- [Review summaries](https://developers.google.com/maps/documentation/places/web-service/review-summaries/)
- [Google Places attribution](https://developers.google.com/maps/documentation/places/web-service/policies)
