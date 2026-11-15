# OPERATION PROTOCOL — Tactical Three.js First-Person Shooter

**OPERATION PROTOCOL** is a round-based tactical first-person shooter in the style of Counter-Strike, built completely in Three.js (0.187.0) and modern vanilla JavaScript ES modules. It runs fully offline in any modern desktop browser with zero build step, no external network requests, and zero external asset dependencies.

---

## Game Overview & Tactical Loop

- **Teams**: Two competing factions:
  - **Vanguard (Defenders)**: Guards Bomb Sites A and B, prevents hostile infiltration, defuses planted EMP Spikes, and secures the sector.
  - **Syndicate (Attackers)**: Autonomous tactical bots executing coordinated pushes through map lanes, seeking to infiltrate a bomb site, plant the EMP Spike, and defend it until detonation.
- **Round-Based Match Flow**:
  - Rounds last 105 seconds (1:45).
  - **Attacker Win Conditions**: Detonate the EMP Spike (45s fuse) or eliminate all Defenders before the spike is planted.
  - **Defender Win Conditions**: Defuse the planted EMP Spike, eliminate all Attackers before planting, or prevent planting until round timer expires.
- **In-Game Economy**:
  - Starting capital: **$800**.
  - Earnings: **+$3,250** round victory reward, **+$1,400** base loss compensation (+ loss streak bonus), **+$300** per confirmed kill, and **+$300** for successful plant/defusal.
  - Requisition menu accessible via `[B]` key during round starts.

---

## Tactical Arsenal & Equipment

| Item | Cost | Type | Mag / Reserve | Characteristics |
| :--- | :--- | :--- | :--- | :--- |
| **Phantom AR-4** | $2,700 | Primary Rifle | 30 / 90 | Full-auto (600 RPM), high damage, vertical recoil climb, 1-tap lethal headshot. |
| **Spectre SMG** | $1,500 | Primary SMG | 30 / 120 | High rate-of-fire (800 RPM), low recoil, lower spread penalty on the move. |
| **Operator Sniper**| $3,800 | Primary Sniper | 5 / 15 | High-caliber bolt action, lethal torso/head shot, severe spread penalty when moving. |
| **P250 Sidearm** | $300 | Secondary Pistol | 13 / 52 | Semi-automatic sidearm with fast draw and low recoil. |
| **Frag Grenade** | $300 | Utility | 1 (max 2) | High-explosive grenade with bounce physics dealing up to 85 AOE damage. |
| **Smoke Grenade**| $300 | Utility | 1 (max 1) | Deploys a dense 14-second volumetric smoke screen blocking line of sight. |
| **Kevlar Vest** | $650 | Defense | 100 Armor | Ballistic body armor absorbing 50% of incoming bullet damage. |
| **Defusal Kit** | $400 | Utility | Passive | Advanced toolkit that cuts EMP Spike defusal time from 7.0s down to 3.5s. |

---

## Gunplay, Movement & Ballistics

1. **Multi-Part Hitbox Detection**:
   - **Head**: 3.5× lethal damage multiplier (instant elimination with AR-4 or Sniper), triggers red skull hitmarker.
   - **Torso / Chest**: 1.0× baseline damage.
   - **Limbs / Legs**: 0.75× reduced damage.
2. **Spread & Movement Penalty**:
   - First-shot accuracy is laser-precise when stationary and crouching (`[Ctrl]` or `[C]`).
   - Movement velocity substantially widens spread bloom (up to 6×–25× multiplier on running/jumping). Stopping or counter-strafing to aim is essential.
3. **Recoil Recovery**:
   - Predictable spray pattern kickback with smooth angular spring recovery.
4. **Procedural Viewmodel**:
   - 3D weapon viewmodels attached directly to camera with dynamic sway, walk bobbing, firing kickback, and animated reload sequences.
5. **Procedural Audio Engine**:
   - Built entirely with Web Audio API synthesis: realistic gunshot cracks, mechanical reload clicks, footstep thuds, grenade detonations, bomb beep cadences, and defuse tones generated in code with no external sound files.

---

## The Map: "SECTOR 9"

A tactical 3-lane compound engineered for authentic tactical shooter sightlines and cover:
- **A-Long Corridor**: Extended lane with waist-high concrete barriers and crates for sniper and rifle duels leading into Bomb Site A.
- **Mid Courtyard & Arches**: Central transit zone connecting both flanks with industrial pillars and sightlines.
- **B-Site Warehouse**: Enclosed close-quarters warehouse featuring stacked cargo containers and tight angles.
- **Bomb Sites A & B**: Marked platforms with holographic circular perimeter beacons and tactical planting zones.

---

## Autonomous Bot AI

- Multi-state **Finite State Machine (FSM)**:
  - `ADVANCE`: Navigates waypoint routes toward Bomb Sites A or B.
  - `HOLD_COVER`: Peeks corners, takes cover behind crates when taking fire.
  - `ENGAGE`: Casts line-of-sight raycasts, tracks enemies with reaction delay (250–400ms), and executes burst fire based on target range.
  - `PLANT`: Attacker equipped with the Spike conducts 3.5-second plant sequence upon reaching site.
  - `DEFEND_SPIKE`: Holds defensive perimeters around the planted core.

---

## Controls

- `[W] [A] [S] [D]` — Tactical movement (acceleration & friction)
- `[Mouse]` — Look around
- `[Left Click]` — Fire weapon
- `[R]` — Reload magazine
- `[Ctrl]` or `[C]` — Crouch (dramatically tightens weapon spread)
- `[Space]` — Jump
- `[E]` — Defuse planted EMP Spike (Hold within range)
- `[1] - [4]` — Switch weapon / sidearm
- `[G]` — Throw Frag Grenade
- `[X]` — Throw Smoke Grenade
- `[B]` — Open / Close Buy Menu

---

## Deterministic Screenshot Generation

The game includes a deterministic capture controller enabling automated, high-fidelity capture for competition dossiers:
- `?shot=start&seed=1` — Spawn inspection with drawn weapon and full tactical HUD (`1-start.jpg`).
- `?shot=tactical&seed=1` — Mid-lane tactical gunfight with active hitmarker and killfeed (`2-tactical.jpg`).
- `?shot=objective&seed=1` — Site A with planted glowing EMP Spike and defuse progress (`3-objective.jpg`).
- `?shot=victory&seed=1` — Round won celebration banner over secured site (`4-victory.jpg`).

---

## Running Locally

1. **Serve game locally**:
   ```bash
   node serve.ts --port 8080
   ```
   Open `http://localhost:8080` in desktop Google Chrome or any WebGL 2 browser.

2. **Build submission output & dossier**:
   ```bash
   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
   ```

3. **Verify Dossier**:
   Inspect `out/dossier.json` to verify that all source files and screenshots match gate criteria and fit within the 160 KiB judge window.

---

## License

This project is licensed under the [MIT License](LICENSE).
