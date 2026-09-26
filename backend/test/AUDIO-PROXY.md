# Audio delivery

Daily challenge responses expose `/games/daily/:id/audio`, never `previewUrl` or
`externalId`. The frontend resolves playback against its configured API origin.
The API reads R2 using the existing credentials and `externalId`; object names
and database records remain unchanged. Single byte ranges (including suffix and
open-ended ranges) are supported. Invalid ranges return 416 with object size.

## Verification

Run `npm run build`, then `node test/audio-proxy.smoke.cjs` from `backend`.
The smoke test uses real Nest HTTP handling with simulated R2 responses and does
not load `.env` or access the real bucket. It also avoids the existing Jest/ESM
compatibility issue under Node 22.

## Deployment

1. Publish the backend and frontend together; check playback and seeking.
2. In R2 bucket Settings, disable Public Development URL and any custom domain
   exposing these objects. Do this after deployment, since older clients use the
   public URL. The backend credentials need permission to read the bucket.
3. Verify the old public URLs no longer serve files.

`R2_PUBLIC_URL` is still used by the upload's existing database field and must
remain configured; it is no longer used to retrieve audio for daily challenges.

This change conceals storage names and addresses, not the bytes inside an audio
file. Existing embedded metadata (ID3, WAV INFO, artwork) is not rewritten.
Remove such metadata from audio assets separately. The complete audio is still
delivered; enforcing progressive disclosure requires server-side game sessions
and separate audio excerpts. The existing result endpoint is also unchanged.
