<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Authentication
- Keep registration validation in a shared Zod schema used by the form and its public server function, so both enforce the same password rules without privileged signup.
- Keep the accepted browser-only login cooldown in localStorage, synchronized across tabs; count invalid credentials only, not service failures, and never store passwords.

## Pulse visualization
- Keep dashboard analytics derived from saved readings, and hardware controls on Monitoreo; export BPM with reception timestamps, not fabricated ECG voltage, and distinguish reception Hz from sensor sampling.
- Render BPM as a shared schematic pulse with fixed beat spacing and continuous phase-preserving cadence animation; sample history must not rescale the waveform, and BPM must never be presented as a measured ECG.

## Device connectivity
- Keep BLE sessions in the shared device store across navigation; use the standard Heart Rate GATT service with flag-aware parsing, and suspend local HTTP polling while BLE owns the source to avoid conflicting readings.
- Forward real BLE readings to the existing local sensor endpoint with bounded requests and visible synchronization failures; forwarding must never block pulse rendering or send simulated readings as hardware data.
