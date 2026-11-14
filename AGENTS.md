# FORMA — public site / Codex Cloud

This repository contains ONLY the public static GitHub Pages website. It is not the source of the private local order database or admin server. Never invent backend features or publish secrets, SQLite data, passwords, customer information or unpublished local files.
For significant design changes, compare the user-supplied references and preserve mobile and desktop functionality. Use ui_auditor for visual evidence, qa_auditor for regressions, and release_auditor for static publication readiness; wait for their results. One primary implementer edits code, not multiple competing writers.
Preserve the existing design direction and honest editable-vs-image PPTX descriptions. Only report tests that actually ran. Do not merge, publish or introduce backend/client data collection without explicit user permission. A separate automated job can update the published branch, so check for concurrent changes before merges.
