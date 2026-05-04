# Firebase → Self-hosted Cutover Runbook

The legacy React + Firebase web app under `/src`, `/public`, `/functions`,
`/firestore.rules`, `/storage.rules`, `/firebase.json`, `/.firebaserc`, and
`/deploy.sh` is **intentionally preserved on this branch** so the rollback
window stays open.

The new self-hosted stack (`apps/api`, `apps/mobile`, `infra/`) is ready and
covered by tests; SECURITY.md describes its threat model.

Run the steps below only after the new stack is verified end-to-end on
staging and you're ready to retire Firebase.

## 0. Pre-flight

- [ ] `apps/api/.env` is filled in on the production VPS with strong secrets.
- [ ] `infra/coturn/turnserver.conf` `static-auth-secret` matches `apps/api/.env` `TURN_SHARED_SECRET`.
- [ ] `your.domain` and `turn.your.domain` point at the VPS.
- [ ] `docker compose up -d` is healthy: `curl https://your.domain/health` → 200.
- [ ] Migrations applied: `npm --prefix apps/api run db:migrate`.
- [ ] At least one viewer + one camera paired and verified end-to-end (live video, motion record, push).
- [ ] Backup any data still in Firestore / Cloud Storage that you want to keep.

## 1. Migrate user data (optional)

If existing Firebase users need to keep their accounts, export them via the
Firebase Admin SDK and write a one-shot importer that:
- creates corresponding rows in `users` (forcing a password reset email since
  Firebase Auth password hashes are not portable),
- copies `users/{uid}/savedVideos/*` documents into `saved_videos` and uploads
  the corresponding objects into MinIO at the new key layout
  `users/{uid}/cameras/{deviceId}/{videoId}.mp4`.

If you're treating this as a clean break, skip this step.

## 2. Disable the legacy web app

```sh
# Stop serving the SPA from CloudFront / S3.
aws cloudfront update-distribution --id E13Z16GQRD7R2Z \
  --distribution-config '{ "Enabled": false, ... }'  # (use your existing config)

# Or, if you prefer to leave the bucket but redirect users:
aws s3 cp s3://dalkong-cam/index.html s3://dalkong-cam/index.html \
  --metadata-directive REPLACE --website-redirect "https://your.domain"
```

## 3. Lock down Firebase

After the SPA is no longer in use, but **before** deleting the project:

```sh
# Rules already restrict to per-user access (see firestore.rules / storage.rules
# in this commit). To go further:
firebase deploy --only firestore:rules,storage:rules

# Then disable email/password sign-in in the Firebase Console so no new
# accounts can be created on the legacy backend.
```

Wait at least one billing cycle in this state to confirm there is no traffic
hitting Firebase that you didn't anticipate.

## 4. Delete the Firebase project

After the soak period:

```sh
firebase projects:delete dalkong-cam
```

## 5. Remove legacy code from the repo

```sh
git rm -r src/ public/ functions/
git rm firestore.rules firestore.indexes.json storage.rules firebase.json \
       .firebaserc deploy.sh start.json .env.sample
git rm package.json package-lock.json tsconfig.json .eslintrc.json
git mv apps/api/.env.example .env.example  # optional: lift to root
git commit -m "chore: remove legacy Firebase web app post-cutover"
```

(Equivalent files live at `apps/api/package.json`, `apps/api/tsconfig.json`,
etc., so nothing is lost.)

## 6. Update README

Replace the existing `README.md` with a pointer to:
- `apps/api/README.md` (backend)
- `apps/mobile/README.md` (mobile app)
- `infra/README.md` (deployment runbook)
- `SECURITY.md` (threat model)

## Rollback

The cutover is reversible up to step 4 (Firebase project deletion) by:
1. Re-deploying the legacy SPA from `src/` to S3/CloudFront.
2. Reverting `firestore.rules`/`storage.rules` to a less restrictive set if needed.
3. Pointing client traffic back at the old domain.

After step 4, rollback requires recreating the Firebase project and re-importing data — plan accordingly.
