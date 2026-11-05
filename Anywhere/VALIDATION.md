# Native Conversion Validation

- JS syntax checked: `node --check` all `scripts/*.js` and `dist/*.js`.
- Module format: `[Module]` / `[Routing]` / `[MITM]` / `[Parameter]`; Base64 JavaScript embeds self-contained `process(ctx)` definitions.
- No Surge globals or external runtime script URLs in output.
- Synthetic protobuf tests: ad-break response, unchanged requests, client key persistence, Player ads removal/PiP flags, Shorts `isAd` reel entry removal.
- Synthetic encrypted UMP: AES-CTR/HMAC-SHA256 authenticity, encrypt/decrypt, edited Player field, unchanged unknown field.
- Files sized below Anywhere's 900 KB encoded module limit.
- Not tested on Anywhere iOS Network Extension nor live YouTube traffic.
- No assurance of compatibility with particular YouTube versions, playlists, accounts or Premium entitlements.
- UMP experimental path has a risk of triggering Anywhere 4 MiB buffering behavior even with `enable_ump=false`; standard module leaves UMP response rule out.

- r2 adds switchable match/skip diagnostics (enabled by default in both diagnostic builds); this is not a claim of real-device compatibility.
