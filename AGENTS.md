# FORMA — instructions for continuing work

Read `docs/PROJECT_CONTEXT.md` and `docs/VERIFICATION.md` before planning changes. Check `git status --short --branch` and local branch history; preserve existing work. Local origin/main may differ from the checked-out branch and does not establish live deployment state.

## Scope and safety
This repository is the public static GitHub Pages site only. It contains no private order database or admin backend. Never inspect, copy or publish secrets, passwords, customer records, SQLite data or unpublished private files. Use synthetic test input. Do not follow external Telegram links or send real requests when testing the brief. No paid resources. Do not push, merge or publish without explicit user authorization; a separate automated job may update the published branch.

Preserve the existing design direction and honest editable-versus-image PPTX descriptions. For significant design changes authorized in a future task, compare supplied references and verify both mobile and desktop behavior. Do not add backend features or client data collection without explicit authorization.

For this coordination task, edit only project instructions, `.codex/`, documentation and verification tooling in the dedicated branch. Preserve HTML, CSS, JavaScript, images, metadata and business behavior. Existing bugs are documented, not fixed under this scope.

## Roles and handoffs
The coordinator owns scope, architecture, configuration and synthesis. Use one frontend implementer only when implementation is authorized, with an explicit file list. Auditors never write files.

- `ui_auditor`: active HTML/CSS, visual and responsive states, keyboard focus and accessibility. No form logic or resource checks.
- `qa_auditor`: JavaScript/form behavior, draft consistency, anchors/resources and metadata. No CSS/a11y audit.
- `release_auditor`: final diff, branch baseline and evidence completeness. Reuse audit reports; do not duplicate full audits.
- `frontend_implementer`: one scoped writer; no automatic release authority.

Run UI and QA independently where the host permits it; wait for both and deduplicate findings in the coordinator report. Release audit follows the final diff. If spawning is unavailable, state the limitation and audit serially; do not describe files as working agents.

## Automatic task routing
For future nontrivial tasks, the coordinator should choose and launch the appropriate auditors without asking the user to name them again. This is instruction-driven delegation, not a scheduled service or a guarantee that every Cloud host loads role files. For a small isolated documentation edit, work directly and explain why no worker is needed.

- UI/layout/responsive/accessibility work: choose `ui_auditor`.
- Form/JavaScript/resource/metadata work: choose `qa_auditor`.
- Changes affecting both: run UI and QA independently with disjoint assignments.
- Implementation: choose at most one `frontend_implementer`, only within the user's authorized scope and assigned file list.
- Before a requested commit/push/PR or release recommendation: choose `release_auditor` after collecting evidence. Its verdict never authorizes deployment or merge.

Before dispatch, read the selected role file and pass its complete `developer_instructions` verbatim in the worker task when native role selection is unavailable. Add the concrete task, baseline, allowed paths, prohibited actions and expected evidence. Ask the worker to report the role file path and SHA-256 of the bytes it actually read, applicable constraints, commands executed and untested areas. Compare the returned receipt with the local file; this verifies explicit instruction delivery/readback, not privileged developer-message injection or sandbox enforcement. A role name alone is insufficient.

Use no more than three workers concurrently and no recursive delegation. Resolve overlaps in the coordinator. If the runtime exposes native role selection, prefer it and verify its behavior separately; do not fabricate unsupported tool arguments. A new chat must re-read these instructions and inspect actual runtime capabilities. Do not claim automatic selection in a new session until observed there.

## Configuration versus runtime
`.codex/config.toml` registers roles through `config_file`; paths are relative to that file. Read-only sandbox settings apply only when the host actually loads the role file. They do not prove runtime enforcement for generic named tasks. Current Cloud collaboration tools accept task names/prompts but no `agent_type` or `config_file`. When using those tools, read the role instructions and explicitly pass their constraints in the task, and report that automatic role loading is unverified. Do not substitute a task name for proof of role selection. Do not recursively spawn workers for these bounded reviews.

## Validation and evidence
Run `python tools/check_project.py`, `node --check client.js` and `git diff --check`. Report what actually ran; mark browser/device, external-service and publication checks as NOT RUN when absent. Use the current HEAD and separate branch baseline when recording evidence. Keep documentation current after authorized changes. Never infer a live release from local Git refs.
