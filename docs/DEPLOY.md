# Deploy BuffDad to Fly.io

Assumes you're already logged in (`fly auth login`). Run from the repo root.

### PowerShell (Windows)

```powershell
fly launch --no-deploy --copy-config --name buffdad   # accept existing fly.toml; if prompted to tweak settings, say no
# app names are global — if "buffdad" is taken, pick another (e.g. buffdad-connelly), update `app` in fly.toml and the URLs below
fly volumes create buffdad_data --size 1 --region ewr   # single volume is intentional; answer "y" to the pinned-host warning

$DAD   = node -e "console.log(crypto.randomUUID().replace(/-/g,''))"
$COACH = node -e "console.log(crypto.randomUUID().replace(/-/g,''))"
# generate a VAPID keypair once (npx web-push generate-vapid-keys) and paste both values here
$pub   = "<VAPID_PUBLIC_KEY>"
$priv  = "<VAPID_PRIVATE_KEY>"

# secrets set restarts the machine with the new values (run AFTER the first deploy if the app already exists)
fly secrets set --app buffdad DAD_TOKEN=$DAD COACH_TOKEN=$COACH VAPID_PUBLIC_KEY=$pub VAPID_PRIVATE_KEY=$priv

fly deploy

Write-Output "Dad URL:   https://buffdad.fly.dev/d/$DAD"
Write-Output "Coach URL: https://buffdad.fly.dev/coach/$COACH"
```

> Do NOT use bash syntax (`DAD=$(...)`, `echo`) in PowerShell — `$DAD`/`$COACH` come out empty and both tokens end up blank/identical, which breaks the coach console.

### bash / macOS / Linux

```bash
fly launch --no-deploy --copy-config --name buffdad
fly volumes create buffdad_data --size 1 --region ewr
DAD=$(node -e "console.log(crypto.randomUUID().replaceAll('-',''))")
COACH=$(node -e "console.log(crypto.randomUUID().replaceAll('-',''))")
fly secrets set --stage DAD_TOKEN=$DAD COACH_TOKEN=$COACH VAPID_PUBLIC_KEY=<pub> VAPID_PRIVATE_KEY=<priv>
fly deploy
echo "Dad URL:   https://buffdad.fly.dev/d/$DAD"
echo "Coach URL: https://buffdad.fly.dev/coach/$COACH"
```

## Notes

- **Region**: `ewr` (Newark) in `fly.toml` is a placeholder — swap it and the `fly volumes create --region` flag for whatever's nearest your user.
- **VAPID keys**: generate a keypair with `npx web-push generate-vapid-keys` and paste the public/private values into the `fly secrets set` command above. Regenerating later invalidates every existing push subscription (everyone has to re-opt-in) — fine before the first install, annoying after. Optionally set `VAPID_SUBJECT` (e.g. `mailto:you@example.com`) as a secret too; it defaults to a placeholder.
- **DAD_TOKEN / COACH_TOKEN**: the URLs above are the only way in — no login screen, no account recovery. Save them somewhere (password manager) before you close the terminal.
- **Volume backups**: the SQLite DB lives on the `buffdad_data` volume, not in the container. Fly snapshots it automatically; list them with `fly volumes snapshots list buffdad_data`. Restore by creating a new volume from a snapshot ID and pointing a fresh machine at it — worth a dry run before you actually need it.
- **Health checks**: `/api/health` requires the token header, so it's not wired up as an `[[http_service.http_checks]]` — the default Fly TCP check (does the port accept connections) is what's actually configured.
