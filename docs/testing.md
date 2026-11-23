# Test record

## Completed before the final interface changes

This record consolidates manual checks performed during development.
Simulated responses in automated tests do not replace these checks.

- [x] Email/password signup, Google sign-in, session persistence and logout.
- [x] Form validation, incorrect credentials, Google cancellation and connection failures.
- [x] Searches with a selected location, cuisine and budget, at most five results and numbered map markers.
- [x] Lists: saving without duplicates, reloading, moving, removing, pagination and account isolation.
- [x] Recommendations: empty history, frequencies, ties, personal ratings and cleared searches.
- [x] Personal ratings: saving, changing, clearing, persistence and privacy between accounts.
- [x] Shared links: access without a session, current content, pagination, revocation and regeneration.
- [x] Photos and reviews: availability, authors, sources, available summaries and missing provider data.
- [x] Language switching and small-screen use across implemented features.
- [x] SQL checks for lists, history, ratings and shared links completed without errors.

## Final checks after the interface changes

A box is marked only after the current version has been checked.

- [x] Explore, My lists and My account: Back/Forward navigation, language and preserved filters, location and results.
- [x] Two different accounts: email/password, Google and logout; previous account results and data clear on logout.
- [x] Search and recommendation with a selected point, changed filters and the result map opened and closed.
- [x] Visited ratings: mouse and keyboard selection, saving, reloading, changing, clearing and submission without a score.
- [x] Optional rating preferences: saved cuisine and budget influence recommendations.
- [x] The second account cannot see the first account's data; clearing searches preserves lists and ratings.
- [x] Restaurant pages open from Explore and both lists; return links and Back/Forward preserve results and pagination. Saving, moving, removing and rating work on the page. A reloaded detail URL offers a route back to search or lists.
- [x] Google stars and carousel: arrows, touch scrolling, keyboard and at most five photos. Scrolling does not repeat backend requests. Checks cover few photos, failed images, credits and original content links.
- [x] Photos and reviews: language changes, refreshed details, missing photos or summaries and attribution links.
- [x] Production list sharing: a Vercel link opens privately without a session; revocation prevents further access.
- [x] Spanish and English, keyboard focus, stars and forms at 320 px and on desktop without horizontal overflow.
- [x] An offline request displays a retryable error without losing previously saved data.

- [x] Explore searches and recommendations show one photo per card with credits,
  original-content access, complete mobile images and Photo unavailable where needed.
  The restaurant page carousel still works.

- [x] The grouped location and filters, Search and Recommend, filter reset, both
  save actions, contextual return links and Explore action from My account work.
  Empty lists and the active list are checked in both languages.

The local checks are `npm run lint`, `npm test`, `npm run lint:backend`,
`npm run test:backend` and `npm run build`.
The Vercel check applies to the deployment of the latest commit.
