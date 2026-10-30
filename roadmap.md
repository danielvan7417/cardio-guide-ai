# Requested access security
- [x] Enforce signup password requirements in the form and registration handler.
- [x] Add the accepted persistent browser-only failed-login cooldown.
- [x] Test password rules and cooldown, and check the login screen.

# Simulation waveform fix
- [x] Replace sample-count-dependent pulse geometry with a stable continuous waveform.
- [x] Verify simulation startup, changing BPM, navigation and desktop/mobile rendering.

# Empty entry fields
- [x] Replace preset questions and numeric entry values with placeholders; preserve actual saved profile data and live sensor values.
- [x] Check entering, clearing and submitting manual fields and assistant questions.

# ESP32 Bluetooth
- [ ] Add BLE pairing, live readings, disconnect handling and shared connection controls.
- [ ] Forward BLE readings to the local Flask sensor endpoint without interrupting live monitoring.
- [ ] Test parsing, source priority and the connected interface; distinguish mocked checks from physical hardware checks.