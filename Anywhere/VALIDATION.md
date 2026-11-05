# r3 validation

- Native entrypoints compiled with no runtime Surge globals and no TextEncoder, TextDecoder, CompressionStream, or DecompressionStream requirements.
- Differential tests run source Surge and native Anywhere scripts over identical Protobuf inputs: Player, get_watch, resolve_url, singleton Shorts shelf, Guide entry removal/retention, Shorts switch, reel ads, settings, ad-break, initplayback and videoplayback.
- Native config key capture and persistent key formats verified.
- UMP tests cover authenticated AES-CTR plaintext and gzip envelopes containing both Player and Next; HMAC independently verified, decrypted ads/Shorts absent, unknown Player field retained. Uncompressed output compared byte-for-byte with reference.
- Module CSV/regex/Base64 and native hash-refresh header-delete declaration checked separately.
- Only YouTube.mod is distributed; diagnostic trace calls and parameter removed, full protocol engines retained.
- No claim of successful iOS real-device execution. Native buffer limits, immutable response heads, suffix-only MITM, and unconditional key-refresh header deletion remain platform differences; see README.

## Native hardening validation

- Redirector-prefixed googlevideo hosts are excluded from script gates and short-circuited before native API access; ordinary CDN initplayback still matches request and response scripts.
- Missing key, bad HMAC, and malformed protobuf preserve original response bytes. Bad-key cache cleanup remains in place. Explicit request ad blocking still executes.
- Strict UTF-8 covers valid ASCII/multibyte input and malformed continuation, truncation, overlong, surrogate and out-of-range cases.
- Base64 accepts padded/unpadded and URL-safe inputs; rejects invalid characters, lengths, internal/excess padding and unexpected native output lengths.
- Transformed output over 4 MiB preserves the original response; the client's pre-script buffer cap is unchanged.
- 23 protocol/negative-case checks and module CSV/Base64/regex checks passed using native API mocks. No new diagnostic logs; existing exception logging retained. No iOS device run for this patch.

## Memory protection patch

- All 27 native mock tests pass, including original normal-input reference parity, independent HMAC/AES/gzip checks, input byte immutability, and memory guards.
- No full response snapshot allocation; compact AES removes 640 KiB of large lookup-table storage; HMAC uses the documented native API.
- Oversized UMP/API inputs return unchanged before helper/protocol setup. 20,000-field parser budget and gzip expansion preflight tested.
- Limits can bypass ad filtering for large/complex inputs. No real-device heap measurement or guarantee against pre-script/client allocation failure.
