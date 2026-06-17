# Mux Mapping Reconciliation Report
Generated: 2026-06-17T14:39:20.357Z

## Summary
| Metric | Count |
|--------|-------|
| Total Mux assets | 4472 |
| Total mapped episodes | 4146 |
| Unmapped assets | 326 |
| Series with count mismatches | 0 |
| Duplicate playback IDs | 0 |
| Orphan episodes (dead mapping) | 0 |
| Duration outliers | 9 |
| Series with sequence flags | 76 |

## HIGH CONFIDENCE PROBLEMS
These are definitely wrong and need human review.

### Orphan Episodes: NONE (all mapped playback IDs exist in Mux)

### Duplicate Playback IDs: NONE (each video maps to exactly one episode)

### Episode Count Mismatches: NONE (all series have correct episode counts)

## WORTH SPOT-CHECKING
Probably fine, but a human should eyeball these.

### Duration Outliers (>2.5x or <0.25x series median)
- **the-dumb-billionaire-heiress-in-love** EP32: 268s (median: 69s)
- **the-dumb-billionaire-heiress-in-love** EP33: 217s (median: 69s)
- **the-dumb-billionaire-heiress-in-love** EP37: 275s (median: 69s)
- **the-dumb-billionaire-heiress-in-love** EP44: 268s (median: 69s)
- **the-dumb-billionaire-heiress-in-love** EP45: 187s (median: 69s)
- **the-dumb-billionaire-heiress-in-love** EP47: 288s (median: 69s)
- **the-dumb-billionaire-heiress-in-love** EP50: 197s (median: 69s)
- **the-dumb-billionaire-heiress-in-love** EP58: 16s (median: 69s)
- **the-mistress-trap** EP47: 191s (median: 71s)

### Sequence Continuity Flags (created_at not monotonic)
- **the-dumb-billionaire-heiress-in-love**: 57 out-of-order created_at pairs
- **do-not-deceive-me**: 54 out-of-order created_at pairs
- **collateral-hearts**: 49 out-of-order created_at pairs
- **the-billionaires-betrayal**: 54 out-of-order created_at pairs
- **undercovered-heart**: 53 out-of-order created_at pairs
- **under-her-control**: 51 out-of-order created_at pairs
- **two-worlds-apart**: 55 out-of-order created_at pairs
- **the-blackthornes**: 59 out-of-order created_at pairs
- **marry-the-wrong-bride**: 54 out-of-order created_at pairs
- **destined-to-be**: 59 out-of-order created_at pairs
- **the-day-we-got-married**: 54 out-of-order created_at pairs
- **the-winter-veil**: 51 out-of-order created_at pairs
- **the-marriage-contract**: 57 out-of-order created_at pairs
- **the-haunted-sisters**: 49 out-of-order created_at pairs
- **the-missing-piece**: 53 out-of-order created_at pairs
- **mysterious-murder**: 51 out-of-order created_at pairs
- **married-to-a-stranger**: 61 out-of-order created_at pairs
- **billionaire-daughters-love-triangle**: 61 out-of-order created_at pairs
- **blood-contract**: 58 out-of-order created_at pairs
- **cleopatra**: 60 out-of-order created_at pairs
- **im-obsessed-with-my-boss**: 49 out-of-order created_at pairs
- **duty-of-desire**: 57 out-of-order created_at pairs
- **echo-of-vengeance**: 55 out-of-order created_at pairs
- **faded-threads**: 47 out-of-order created_at pairs
- **hidden-agenda**: 53 out-of-order created_at pairs
- **hollywood-stars-fake-girlfriend**: 56 out-of-order created_at pairs
- **i-think-my-wife-wants-to-kill-me**: 51 out-of-order created_at pairs
- **in-love-with-my-godfathers-daughter**: 54 out-of-order created_at pairs
- **love-lies-and-bloodline**: 55 out-of-order created_at pairs
- **loves-perfect-crime**: 53 out-of-order created_at pairs
- **mafia-lords-secret-love**: 58 out-of-order created_at pairs
- **married-to-my-brothers-ex**: 51 out-of-order created_at pairs
- **my-celebrity-boyfriend-killed-me**: 49 out-of-order created_at pairs
- **my-handsome-bodyguard**: 57 out-of-order created_at pairs
- **never-mess-with-a-badass-girl**: 54 out-of-order created_at pairs
- **sisters-have-crush-on-the-same-man**: 51 out-of-order created_at pairs
- **the-billionaires-vow**: 55 out-of-order created_at pairs
- **lost-and-found**: 47 out-of-order created_at pairs
- **help-im-falling-in-love-with-my-rude-ceo**: 64 out-of-order created_at pairs
- **an-affair-with-my-boss**: 51 out-of-order created_at pairs
- **a-love-once-betrayed**: 61 out-of-order created_at pairs
- **in-her-shadow**: 49 out-of-order created_at pairs
- **good-for-him**: 49 out-of-order created_at pairs
- **one-night-stand**: 55 out-of-order created_at pairs
- **if-only-you-were-mine**: 57 out-of-order created_at pairs
- **one-night-one-forever**: 49 out-of-order created_at pairs
- **runaway-bride**: 53 out-of-order created_at pairs
- **the-billionaires-lost-love**: 57 out-of-order created_at pairs
- **the-mistress-trap**: 47 out-of-order created_at pairs
- **camouflage**: 55 out-of-order created_at pairs
- **killer-romance**: 53 out-of-order created_at pairs
- **honey-gold**: 57 out-of-order created_at pairs
- **revenge-on-my-cheating-fiance**: 51 out-of-order created_at pairs
- **the-escort**: 54 out-of-order created_at pairs
- **school-hall**: 51 out-of-order created_at pairs
- **conflicted-hearts**: 59 out-of-order created_at pairs
- **my-sister-stole-my-man**: 45 out-of-order created_at pairs
- **the-phoenix-conspiracy**: 55 out-of-order created_at pairs
- **tangled-in-desire**: 52 out-of-order created_at pairs
- **the-escaping-mistress**: 51 out-of-order created_at pairs
- **the-chauffeur**: 49 out-of-order created_at pairs
- **twisted-fates**: 54 out-of-order created_at pairs
- **the-dumb-billionaire-heiress-pt-2**: 54 out-of-order created_at pairs
- **tied-by-fate**: 53 out-of-order created_at pairs
- **the-crown**: 51 out-of-order created_at pairs
- **rosy-psycho**: 49 out-of-order created_at pairs
- **the-unforgettable-love**: 55 out-of-order created_at pairs
- **why-i-did-it**: 45 out-of-order created_at pairs
- **the-ceo**: 54 out-of-order created_at pairs
- **twist-of-time**: 55 out-of-order created_at pairs
- **she-is-mine**: 51 out-of-order created_at pairs
- **the-pendleton-secret**: 53 out-of-order created_at pairs
- **the-perfect-husband**: 48 out-of-order created_at pairs
- **trial-marriage-to-a-billionaire-s2**: 57 out-of-order created_at pairs
- **the-inheritance-game**: 55 out-of-order created_at pairs
- **im-obsessed-with-my-boss-2**: 49 out-of-order created_at pairs

## Appendix: Unmapped Assets
326 Mux assets are NOT mapped to any episode.

| Asset ID (first 20) | Duration | Created At | Status |
|---------------------|----------|------------|--------|
| ZEhT5ft00jwm7f2P7E6y... | 51s | 2025-11-24 | ready |
| VHK4Eum17Aw00dcvqp00... | 76s | 2025-11-24 | ready |
| JDnSVUShnyxnYxSyNMXs... | 80s | 2025-11-24 | ready |
| Sk9LYgisM2fvnYIhzkv6... | 125s | 2025-11-24 | ready |
| wUZfJPfjl6BW601UPDBu... | 117s | 2025-11-24 | ready |
| LVPplK9fKhhj0063OHKY... | 80s | 2025-11-24 | ready |
| abcjibFjdVkIJFFSE64O... | 99s | 2025-11-24 | ready |
| VC7029nNVJsnjFgsplXN... | 63s | 2025-11-24 | ready |
| JezXQpIcxHeAoNUn2gQ6... | 114s | 2025-11-24 | ready |
| itjSt9ciGeU01yCjM3pr... | 93s | 2025-11-24 | ready |
| 15T6X01VH8aX01n01Ohk... | 80s | 2025-11-24 | ready |
| YyWdbA5A02TkXkqIzJjc... | 135s | 2025-11-24 | ready |
| 00XGDoqdJy3V6j02NLJB... | 99s | 2025-11-24 | ready |
| 900p2v3fhrQ5ELx772an... | 99s | 2025-11-24 | ready |
| XOAobxWzTAhDG8NYA7Yb... | 98s | 2025-11-24 | ready |
| yBESCqbgwkp1TC25l3kd... | 86s | 2025-11-24 | ready |
| KCgHNbqX9nN00M1Y4gsk... | 82s | 2025-11-24 | ready |
| KV4gw900Fd1TmefK6JF5... | 79s | 2025-11-24 | ready |
| JAAVnKvMYcRZlUon9Ihg... | 70s | 2025-11-24 | ready |
| KO774qgZcoHTNgigqyni... | 115s | 2025-11-24 | ready |
| L2xJfXhaZ4Z01007EXQ9... | 95s | 2025-11-24 | ready |
| Ue02rTBR9sLtIYAV87oX... | 91s | 2025-11-24 | ready |
| qlOeg2OMKvrHxLYaowvc... | 95s | 2025-11-24 | ready |
| Gbfowc8KvaROWBoKNIWe... | 99s | 2025-11-24 | ready |
| 1vVZzwH48KqZRGXyjprZ... | 78s | 2025-11-24 | ready |
| g01Kv902ncBN1k6o8nBn... | 81s | 2025-11-24 | ready |
| Gq6u3TRTwXxukmrPo6NK... | 82s | 2025-11-24 | ready |
| mA6UdNO7cTwDiFDOSLDq... | 82s | 2025-11-24 | ready |
| peN21zbJrlm00i023bXz... | 62s | 2025-11-24 | ready |
| EMxAalIUDyXosJXhpIp6... | 120s | 2025-11-24 | ready |
| M9fKbe00zfum4mYFHX4n... | 79s | 2025-11-24 | ready |
| r3D14XyeS02Vc8jOo5Ti... | 77s | 2025-11-24 | ready |
| f02io852iy00mMNfTEoL... | 69s | 2025-11-24 | ready |
| 9chGW6ZKsr92FE02fcE0... | 139s | 2025-11-24 | ready |
| BSjIg01hK2hfVfdsnEPw... | 63s | 2025-11-24 | ready |
| yyharLgEDUNWECL01JYS... | 71s | 2025-11-24 | ready |
| pKI8LypgSggkBoQddTUi... | 82s | 2025-11-24 | ready |
| 3mfdKr01jq7J01EhgqZu... | 75s | 2025-11-24 | ready |
| fivfkz6uxZSIfwO00BCl... | 98s | 2025-11-24 | ready |
| PvOo3WZior00Um8zYVRW... | 116s | 2025-11-24 | ready |
| IkHxtQo8pJt5J1hB1A5Y... | 95s | 2025-11-24 | ready |
| gStDB4D02otPc7Dd5l4D... | 61s | 2025-11-24 | ready |
| z8cpyaVTAqxMgU02XJiA... | 82s | 2025-11-24 | ready |
| QEFFFcEGW02lohs26KkU... | 94s | 2025-11-24 | ready |
| 00SH81ONbhE9W1oRvdvt... | 105s | 2025-11-24 | ready |
| VyB168Oax4FWMWlBsjLP... | 115s | 2025-11-24 | ready |
| 301u3i7wEHzQxMLxb00l... | 75s | 2025-11-24 | ready |
| AUp5mlDT4YpmSgDEFUd7... | 114s | 2025-11-24 | ready |
| t1OUrKgHDgIFApiL3saC... | 92s | 2025-11-24 | ready |
| 1tH6AwBrkbUZpXiIA2TV... | 90s | 2025-11-24 | ready |
| ... 276 more | | | |