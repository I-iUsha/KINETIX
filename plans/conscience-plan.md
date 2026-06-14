# Conscience Implementation Plan (FaraDuMatin / Person B)

Drives the agent + renders Verdicts + owns the `.wdf` language and the UE5 bridge.
**Never imports `cortex/` internals** — only `contracts.py` + (until the real cortex
lands) `fixtures.py`. Every task is TDD and **runs headless**: Rerun logs to a `.rrd`
file (no GPU), the UE5 bridge talks to a mock HTTP server (no Unreal installed).

**Canonical space:** Z-up, right-handed, metres, kilograms. **UE5 space:** left-handed,
Z-up, centimetres. The adapter is the ONLY place that knows the difference.

**Environment:** branch `conscience` (worktree). Tests: `./.venv/Scripts/python.exe -m pytest -q`.
Deps installed: pydantic, numpy, rerun-sdk, httpx, lark, pytest, pytest-httpserver.
Put tests in `tests/test_<module>.py`; reuse `tests/helpers.py` (sample `.wdf` + mock UE5).
Commit on green (co-author trailer); do NOT push; do NOT switch branches.

**Dependency order (value-first):** B1 → B2 → B3 → B4 → B5 → B6 → B7.

---

## Task B1 — `conscience/ue5/adapter.py`: the coordinate adapter (the §17.5 proof)

**Spec.** The single boundary that converts between **canonical** (RH, Z-up, m) and **UE5**
(LH, Z-up, cm). Convention is fixed forever: **negate-X mirror**, scale ×100 (canon→UE5),
÷100 (UE5→canon). Implement as one signed 4×4 matrix `M_CANON_TO_UE5` and its inverse.
- `canon_to_ue5_point(p) / ue5_to_canon_point(p)` (metres↔cm + mirror).
- `canon_to_ue5_quat(q) / ue5_to_canon_quat(q)` — a basis mirror flips handedness, so the
  quaternion is NOT a pass-through: negate the components on the mirrored (X) axis correctly
  (derive it, document the derivation in a docstring).
- `reflip_winding(faces)` — reverse triangle winding so normals re-evert after the mirror.
- `canon_to_ue5_transform(Transform) / ue5_to_canon_transform(...)` working on the contract
  `Transform` (pos+quat+scale).

**Tests (the proof — these are non-negotiable).**
- `M @ M_inv == I` (numeric identity).
- **Golden round-trip:** the 8 OBB corners of a known box survive canon→UE5→canon unchanged.
- **Quaternion round-trip:** a random unit quat survives canon→UE5→canon (up to sign).
- **Winding/normal:** a face normal points OUTWARD after a full round-trip (catches the
  silent winding bug specifically).
- A known canonical point `[1,2,3] m` maps to UE5 `[-100,200,300] cm` and back. ≥7 tests.

**Done when:** green + committed. If any golden test ever fails, the demo must fall back to
commit-once/Rerun-only (per §17.1) — encode that as a `golden_roundtrip_ok()` helper.

---

## Task B2 — `conscience/rerun_viz.py`: the 3D conscience

**Spec.** `init_recording(path) -> recording` (Rerun, log to a `.rrd` file, headless — set
`rr.init(...)` + `rr.save(path)`; NEVER require the viewer). Set explicit
`rr.ViewCoordinates.RIGHT_HAND_Z_UP` on the canonical space root (catch handedness flips).
`draw_verdict(rec, pap: PAP, transform: Transform, verdict: Verdict)` logs, from the verdict
JSON alone:
- the asset bbox as `Boxes3D`, colored by status (green pass / amber soft / red hard-fail),
- the CoM as a `Points3D` marker at `pap.physical.com` (world-transformed),
- the support polygon as `LineStrips3D` on the floor,
- the gravity vector as an `Arrows3D` (−Z),
- on a stability fail: a **ghost** bbox at the toppled candidate + a **fix arrow** =
  `verdict.gates[stability].fix.translate`.
Pure consumer of the contract — no physics, no cortex import.

**Tests (headless).** Feeding `fixtures.VERDICT_TOPPLE` then `VERDICT_REPAIRED` runs without
error and writes a non-empty `.rrd` file each time. Red is logged for the failing gate, green
for the passing one (assert via the logged entity colors or a thin logging spy). The fix
arrow is present iff a gate has a `fix`. ≥5 tests.

**Done when:** green + committed.

---

## Task B3 — `conscience/wdf/`: the `.wdf` language (FULL round-trip)

**Spec.** A portable text language: `vocabulary { asset ... }` + `scene { place ...; law ... }`
+ `field`s (see KINETIX_master_spec.md §12.2 for the exact surface syntax — match it).
- `model.py` — in-memory `WdfDocument` = vocabulary (assets w/ profile/material/states/
  affordances/tags) + scene (placements w/ state, laws w/ hard|soft, fields). Reuse `contracts`
  types where natural; otherwise small dataclasses.
- `serialize.py` — `dumps(doc) -> str` producing the §12.2 grammar (stable, diffable, sorted).
- `parse.py` — `loads(str) -> WdfDocument` using a `lark` grammar (`grammar.lark`).
- **The headline guarantee:** `loads(dumps(doc)) == doc` for a non-trivial document.

**Tests.** Build a Gallery-like `WdfDocument` (bronze_figure rigid_prop + states; oak_door
articulated w/ joint+swept keep_clear; ≥3 laws incl. hard+soft; a `season: autumn` field) →
assert `loads(dumps(doc)) == doc` (round-trip identity). Parse the literal §12.2 example text →
assert the expected assets/laws are present. Malformed text raises a clear parse error. ≥6 tests.

**Done when:** green + committed. This is the "judge remembers it" artifact — round-trip is the proof it's a real language.

---

## Task B4 — `conscience/cortex_client.py` + `conscience/agent_loop.py`: the driver

**Spec.**
- `cortex_client.py` — a `CortexClient` Protocol with `sync_scene`, `validate_operation(diff)
  -> Verdict`, `suggest_transform(obj, intent) -> Transform`, `commit(diff)`. A `FakeCortex`
  implementation backed by `fixtures.py` (first proposal → `VERDICT_TOPPLE`; after a
  suggest_transform-applied diff → `VERDICT_REPAIRED`). This is the swap-point: later a
  `McpCortex` (real MCP client) implements the same Protocol with zero changes to the loop.
- `agent_loop.py` — `run_episode(client, scene) -> list[step]` implementing
  `sync → propose diff → validate_operation → if fail: read structured diagnostics
  (which gate, number, fix) → suggest_transform → re-validate → commit`. Returns a scrubbable
  list of steps (each step = proposal + verdict) for the timeline. The "agent" is swappable:
  a `ScriptedProposer` (canned topple→repair sequence) first; the real-LLM proposer is a
  later drop-in behind the same interface.

**Tests.** With `FakeCortex` + `ScriptedProposer`, `run_episode` ends with a green verdict,
records exactly the topple→repair step sequence, and never calls `commit` before a green
verdict. Reading diagnostics off `VERDICT_TOPPLE` yields the stability gate + fix vector. ≥5 tests.

**Done when:** green + committed.

---

## Task B5 — `conscience/ue5/bridge.py`: UE5 Remote Control HTTP bridge

**Spec.** `httpx`-based client for UE5's Remote Control API (no C++, no Unreal needed to test).
- `sync_scene(selector) -> list[(actor_id, Transform_canonical)]` — GET tagged actors'
  transforms + bounds, convert UE5→canonical via the B1 adapter, return canonical.
- `commit(diff, expected_hash)` — PUT the validated transform (canonical→UE5 via adapter),
  guarded by an **optimistic-concurrency hash**: re-read the scene, hash it, and REFUSE the
  commit (raise `ConcurrencyError`) if it differs from `expected_hash` (UE5 changed under us).
- `snapshot_hash(actors) -> str` — stable hash of the synced actor set.
- Commit-once discipline: no live two-way loop; one validated PUT.

**Tests (mock, no Unreal).** Use `pytest-httpserver` to stand up a fake Remote Control endpoint.
`sync_scene` parses the mock JSON and returns canonical transforms (assert the ×0.01 + mirror
happened). `commit` PUTs the correct UE5-space payload. A changed snapshot → `commit` raises
`ConcurrencyError` and does NOT PUT. ≥5 tests.

**Done when:** green + committed.

---

## Task B6 — `conscience/confirm.py`: the material-confirm loop (logic only)

**Spec.** Headless logic behind the AI-guesses-human-confirms feature (UI deferred).
`apply_confirmations(pap: PAP, guesses: list[MaterialGuess], decisions: dict[part, str|None])
-> PAP`: for each guess, a decision of `None` = accept the guess, a string = human override;
fold accepted/overridden materials into `pap.semantics.materials`, mark them `confirmed`, and
add those fields to `pap.provenance.locked` + `edited_fields`. `confirm_mode` honored:
`"prebaked"` vs `"live"` (from `contracts.CONFIRM_MODES`) only changes *when* it's called, not
the logic.

**Tests.** Accept-all → materials match guesses, all locked. Override one part → that material
replaced, locked, recorded in `edited_fields`. Re-baking respects locks (a locked field is not
overwritten). ≥4 tests.

**Done when:** green + committed.

---

## Task B7 — `conscience/demo.py`: the 4-minute beat, end to end

**Spec.** `run_demo(client=FakeCortex(), out="gallery.rrd")` ties it together: run the agent
loop over the Gallery scene, and for each step call `rerun_viz.draw_verdict` so the recording
shows the topple (red, ghost, fix arrow) → repair (green). Also `export_wdf(scene) -> str` to
print the portable `.wdf` document as the kicker. Works fully on `FakeCortex`; swapping to the
real `McpCortex` is one line.

**Tests.** `run_demo` produces a non-empty `.rrd` and a final green verdict; `export_wdf`
returns text that `wdf.loads` can parse back. ≥3 tests.

**Done when:** green + committed.

---

## After all tasks
Final whole-conscience review, then integration: swap `FakeCortex` → real `McpCortex`
(Person A's `cortex/server.py`) once both branches merge to `main` (Integration #1).
