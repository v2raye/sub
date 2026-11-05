# r3 validation

- Native entrypoints compiled with no runtime Surge globals and no TextEncoder, TextDecoder, CompressionStream, or DecompressionStream requirements.
- Differential tests run source Surge and native Anywhere scripts over identical Protobuf inputs: Player, get_watch, resolve_url, singleton Shorts shelf, Guide entry removal/retention, Shorts switch, reel ads, settings, ad-break, initplayback and videoplayback.
- Native config key capture and persistent key formats verified.
- UMP tests cover authenticated AES-CTR plaintext and gzip envelopes containing both Player and Next; HMAC independently verified, decrypted ads/Shorts absent, unknown Player field retained. Uncompressed output compared byte-for-byte with reference.
- Module CSV/regex/Base64 and native hash-refresh header-delete declaration checked separately.
- Main and legacy UMP files now both contain the full UMP engine. NoUMP is separately labelled incomplete.
- No claim of successful iOS real-device execution. Native buffer limits, immutable response heads, suffix-only MITM, and unconditional key-refresh header deletion remain platform differences; see README.
