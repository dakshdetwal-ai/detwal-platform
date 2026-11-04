# DETwal Copier Network Relay — demo milestone

This relay is a small Cloudflare Worker + Durable Object service for the **demo-only** copier. It replaces the same-machine Common Files handoff with HTTPS between a master MT5 terminal on a laptop and a follower MT5 terminal on a Windows VPS.

## Security model
- Separate Worker secrets: `MASTER_TOKEN` for publishing and `FOLLOWER_TOKEN` for reading.
- Use a random channel ID (8–64 letters, numbers, underscore or hyphen). Keep it private.
- Never put broker passwords, MT5 investor/master passwords, Supabase service-role keys, or other account credentials in the relay.
- Tokens entered into EA inputs are visible to anyone with access to that terminal's configuration. Use this only with your own demo accounts and rotate tokens after testing.
- This is not production-hardened: no per-user account system, rate limiting, audit log, signed event sequence, replay protection, or multi-tenant isolation review.

## Deploy
1. Create a Cloudflare Worker project and add the Durable Object binding from `wrangler.toml`.
2. Set secrets using Wrangler (never commit the values):
   - `wrangler secret put MASTER_TOKEN`
   - `wrangler secret put FOLLOWER_TOKEN`
3. Deploy with `wrangler deploy`.
4. Generate a private channel ID and configure the same channel on the master and follower EAs.
5. Add the deployed Worker URL to MT5: Tools → Options → Expert Advisors → Allow WebRequest for listed URL.

## Data format
The master posts plain-text snapshots beginning with `DETWAL2;<unix-seconds>;<count>`, followed by one semicolon-separated row per position:
`position-id;symbol;type;volume;open-price;sl;tp`

The Worker validates size, timestamp and row count. The follower receives only snapshots updated in the last 30 seconds. The EA must independently reject stale or malformed data.

## Current status
This service component is a starting demo relay. It does not by itself complete the copier: the Master and Follower EAs must be updated to use HTTPS WebRequest and tested in MetaEditor and on two demo terminals. Do not purchase VPS or use live accounts until those EA changes and end-to-end tests are complete.
