# Requested access security
# Screen responsibilities
- [ ] Separate clinical dashboard KPIs, weekly trends, assistant and recent alerts from live hardware monitoring.
- [ ] Add predominant live pulse, freeze, technical status, simulation and save/export actions without inventing ECG or hardware telemetry.
- [ ] Verify authenticated dashboard and monitoring flows and run relevant tests.

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
- [x] Add BLE pairing, live readings, disconnect handling and shared connection controls.
- [x] Forward BLE readings to the local Flask sensor endpoint without interrupting live monitoring.
- [x] Test parsing, source priority and the authenticated connected interface with a mocked BLE device; physical ESP32 and local Flask connectivity require the user's equipment.