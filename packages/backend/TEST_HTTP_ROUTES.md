# HTTP Routes Test Client

This test client validates all the Convex HTTP routes for match management.

## Prerequisites

1. A running Convex deployment with the HTTP routes deployed
2. Environment variables in `.env.local` file:
   - `CONVEX_URL` - Your Convex deployment URL (e.g., `https://your-deployment.convex.cloud`)
   - `CONVEX_SITE_URL` - Your Convex site URL for HTTP routes (e.g., `https://your-deployment.convex.site`)

   If `CONVEX_SITE_URL` is not set, it will be automatically derived from `CONVEX_URL` by replacing `.convex.cloud` with `.convex.site`.

## Running the Tests

The test script automatically loads environment variables from `.env.local` in the current directory.

### Using npm script (recommended)

```bash
cd packages/backend
npm run test:http
```

### Using tsx directly

```bash
cd packages/backend
npx tsx test-http-routes.ts
```

### Override environment variables (optional)

If you want to override the `.env.local` values, you can still set them in your shell:

```bash
cd packages/backend
CONVEX_URL=https://other-deployment.convex.cloud \
CONVEX_SITE_URL=https://other-deployment.convex.site \
npm run test:http
```

## What the Tests Cover

The test suite validates:

1. **POST /matches/new**
   - ✅ Creating matches with "Queuing" status
   - ✅ Creating matches with `match_state` JSON blob
   - ✅ Error handling for missing required fields

2. **GET /matches/{\_id}**
   - ✅ Retrieving match by ID
   - ✅ Error handling for non-existent matches

3. **POST /matches/{\_id}**
   - ✅ Updating `match_status` (Queuing → Waiting → Playing → Finished)
   - ✅ Updating `match_state` independently
   - ✅ Updating both `match_status` and `match_state` together
   - ✅ Status transition validation (prevents invalid transitions)
   - ✅ Error handling for missing fields

4. **GET /matches**
   - ✅ Listing all matches
   - ✅ Filtering matches by status (`?status=Queuing`, `?status=Playing`, etc.)

## Test Output

The test suite provides:

- ✅/❌ Pass/fail indicators for each test
- Detailed error messages for failures
- JSON output of successful operations
- Summary statistics at the end

Example output:

```
🚀 Starting HTTP Routes Test Suite
📡 Convex URL: https://your-deployment.convex.cloud
🌐 Convex Site URL: https://your-deployment.convex.site

🧪 Testing: Create game teams for testing
✅ PASSED: Create game teams for testing

🧪 Testing: POST /matches/new - Create match with Queuing status
✅ PASSED: POST /matches/new - Create match with Queuing status

...

📊 Test Summary
============================================================
✅ Passed: 15
❌ Failed: 0
📝 Total: 15

🎉 All tests passed!
```

## Notes

- The test creates temporary game teams and matches for testing
- All test data is created in your actual Convex deployment
- Tests are designed to clean up after themselves (no explicit cleanup needed for read-only tests)
- The test suite exits with code 0 on success, code 1 on failure
