#!/usr/bin/env python3
"""Bounded local-AI edit worker for HERBARIUM.

The model runs locally inside GitHub Actions. It does not receive write access.
It may only propose exact, bounded edits under src/ and tests/. This wrapper
applies those edits deterministically, validates changed paths, runs syntax
checks and the project tests, and leaves a clean tree when a proposal is bad.
"""
from __future__ import annotations

import json
import os
import subprocess
import sys
import urllib.request
from pathlib import Path

ROOT = Path.cwd()
SERVER = os.environ.get("HERBARIUM_LOCAL_LLM_URL", "http://127.0.0.1:8080/v1/chat/completions")
MAX_FILE_CHARS = 18000
MAX_OUTPUT_CHARS = 70000
MAX_EDITS = 6
MAX_CHANGED_FILES = 3
ALLOWED_PREFIXES = ("src/", "tests/")
CONTEXT_FILES = (
    "CURRENT_MISSION.md",
    "DIRECTOR_LOG.md",
    "src/index.html",
    "src/app.js",
    "src/styles.css",
    "tests/smoke.mjs",
    "package.json",
)


def sh(*args: str, check: bool = True) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        args,
        cwd=ROOT,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        check=check,
    )


def read_context(path: str) -> str:
    p = ROOT / path
    if not p.is_file():
        return f"[MISSING: {path}]"
    text = p.read_text(encoding="utf-8", errors="replace")
    if len(text) > MAX_FILE_CHARS:
        text = text[:MAX_FILE_CHARS] + "\n...[truncated]"
    return text


def build_prompt() -> str:
    blocks = [f"===== {name} =====\n{read_context(name)}" for name in CONTEXT_FILES]
    return """You are the LOCAL, ZERO-API coding worker for HERBARIUM.

Read the CURRENT repository context carefully. Choose exactly ONE small,
concrete improvement that advances CURRENT_MISSION without duplicating behavior
that is already present. You are operating unattended, so be conservative.

The current source ALREADY has UNKNOWN semantics, IndexedDB observation
persistence, JPEG evidence compression and transaction-based saves. Do not
re-add those things.

If several improvements are possible, prefer a small missing reliability gate
that is objectively testable. For example, rejecting a selected file whose MIME
type is not image/* before image decoding is a valid kind of improvement if it
is not already present. This is only a fallback hint, not permission to ignore
the actual current source.

Permanent product rules:
- mobile-first iPhone;
- camera + photo library;
- privacy local and offline-first;
- no mandatory paid API/cloud for the core;
- UNKNOWN/REJECT when evidence is uncertain;
- never invent a species;
- anti-false-positive for objects, animals, printed images and tablecloths;
- no invented accuracy percentages and no fake product data;
- do not claim real iPhone/Core ML/browser/offline tests unless actually run;
- no TinyFish;
- do not add dependencies.

Editing rules:
- You MAY edit only files under src/ and tests/.
- Touch at most 3 files.
- Do not edit package.json, lockfiles, workflows, documentation, mission files,
  repository policy files, or dependencies.
- Do not delete or weaken tests just to obtain green.
- Prefer reliability/source-recovery work over cosmetics.
- Keep the change small enough to review in one PR.
- Every "find" string MUST be copied EXACTLY from the current repository context.
- Use the smallest unique find string that is sufficient for the edit.
- If there is no clearly safe useful change, answer exactly: NOOP

Output protocol:
Return ONLY valid JSON with this exact shape, no markdown fences and no prose:
{
  "summary": "short factual description",
  "edits": [
    {
      "path": "src/app.js",
      "find": "exact existing UTF-8 text copied from context",
      "replace": "replacement UTF-8 text"
    }
  ]
}

You may use multiple edit objects for the same file or for tests, but all edits
together must represent ONE coherent improvement. Never use placeholders,
ellipsis or line numbers in find/replace.

Repository context follows:

""" + "\n\n".join(blocks)


def call_model(prompt: str) -> str:
    payload = json.dumps(
        {
            "model": "local-herbarium-coder",
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are a cautious senior software maintainer. "
                        "Inspect current code before editing. Return only exact JSON."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.05,
            "top_p": 0.85,
            "max_tokens": 3000,
            "stream": False,
        }
    ).encode("utf-8")
    req = urllib.request.Request(
        SERVER,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=900) as response:
        data = json.load(response)
    return data["choices"][0]["message"]["content"]


def _repair_invalid_json_escapes(raw: str) -> str:
    """Repair only invalid backslash escapes inside JSON string literals.

    Small local models often emit JavaScript/regex snippets such as \d, \s or
    \/ with one backslash instead of the double escaping required by JSON.
    We preserve valid JSON escapes and duplicate only a backslash whose next
    character cannot begin a valid JSON escape. All later exact-edit and path
    guards still apply, so this does not broaden write permissions.
    """
    out: list[str] = []
    in_string = False
    escaped = False
    valid_simple = {'"', "\\", "/", "b", "f", "n", "r", "t"}

    i = 0
    while i < len(raw):
        ch = raw[i]
        if not in_string:
            out.append(ch)
            if ch == '"':
                in_string = True
            i += 1
            continue

        if escaped:
            out.append(ch)
            escaped = False
            i += 1
            continue

        if ch == '"':
            out.append(ch)
            in_string = False
            i += 1
            continue

        if ch != "\\":
            out.append(ch)
            i += 1
            continue

        nxt = raw[i + 1] if i + 1 < len(raw) else ""
        if nxt in valid_simple:
            out.append(ch)
            escaped = True
        elif nxt == "u" and i + 5 < len(raw) and all(
            c in "0123456789abcdefABCDEF" for c in raw[i + 2 : i + 6]
        ):
            out.append(ch)
            escaped = True
        else:
            # Preserve the literal backslash by JSON-escaping it.
            out.append("\\\\")
        i += 1

    return "".join(out)


def parse_proposal(output: str) -> dict | None:
    raw = output.strip()
    if raw == "NOOP":
        return None
    if len(raw) > MAX_OUTPUT_CHARS:
        raise RuntimeError("Model output exceeds bounded size.")

    # Small local models occasionally wrap JSON in a code fence despite being
    # told not to. Strip that harmless wrapper.
    if raw.startswith("```"):
        lines = raw.splitlines()
        if len(lines) >= 3 and lines[-1].strip() == "```":
            raw = "\n".join(lines[1:-1])
            if raw.lstrip().lower().startswith("json\n"):
                raw = raw.lstrip()[5:]

    start = raw.find("{")
    end = raw.rfind("}")
    if start < 0 or end < start:
        raise RuntimeError("Model output contains no JSON object.")

    candidate = raw[start : end + 1]
    try:
        proposal = json.loads(candidate)
    except json.JSONDecodeError as first_exc:
        repaired = _repair_invalid_json_escapes(candidate)
        try:
            proposal = json.loads(repaired)
        except json.JSONDecodeError as exc:
            raise RuntimeError(
                f"Model output is invalid JSON after safe escape repair: {exc}; "
                f"original error: {first_exc}"
            ) from exc

    if not isinstance(proposal, dict):
        raise RuntimeError("Model proposal must be a JSON object.")
    summary = proposal.get("summary")
    edits = proposal.get("edits")
    if not isinstance(summary, str) or not summary.strip():
        raise RuntimeError("Proposal summary is missing.")
    if not isinstance(edits, list) or not edits:
        raise RuntimeError("Proposal edits are missing.")
    if len(edits) > MAX_EDITS:
        raise RuntimeError("Proposal contains too many edit operations.")
    return {"summary": summary.strip(), "edits": edits}


def validate_path(path: str) -> Path:
    if not isinstance(path, str) or not path.startswith(ALLOWED_PREFIXES):
        raise RuntimeError(f"Protected or invalid path: {path!r}")
    p = ROOT / path
    try:
        p.resolve().relative_to(ROOT.resolve())
    except ValueError as exc:
        raise RuntimeError(f"Path escapes repository: {path!r}") from exc
    if not p.is_file():
        raise RuntimeError(f"Exact-edit protocol only permits existing files: {path}")
    return p


def apply_exact_edits(proposal: dict) -> list[str]:
    touched: list[str] = []
    for index, edit in enumerate(proposal["edits"], start=1):
        if not isinstance(edit, dict):
            raise RuntimeError(f"Edit {index} has invalid shape.")
        required = {"path", "find", "replace"}
        missing = required - set(edit)
        if missing:
            raise RuntimeError(
                f"Edit {index} is missing required fields: {sorted(missing)}"
            )

        # Extra explanatory metadata from the small model is harmless and is
        # ignored. The actual mutation still uses only path/find/replace.
        path = edit["path"]
        find = edit["find"]
        replace = edit["replace"]
        if not isinstance(find, str) or not find:
            raise RuntimeError(f"Edit {index} has empty find text.")
        if not isinstance(replace, str):
            raise RuntimeError(f"Edit {index} replacement is not text.")
        if find == replace:
            raise RuntimeError(f"Edit {index} is a no-op.")

        p = validate_path(path)
        current = p.read_text(encoding="utf-8")
        count = current.count(find)
        if count != 1:
            raise RuntimeError(
                f"Edit {index} expected exactly one match in {path}, found {count}. "
                "This normally means the model proposed a stale or ambiguous edit."
            )
        p.write_text(current.replace(find, replace, 1), encoding="utf-8")
        touched.append(path)

    unique = list(dict.fromkeys(touched))
    if len(unique) > MAX_CHANGED_FILES:
        raise RuntimeError(f"Proposal touched too many files: {unique}")
    return unique


def changed_files() -> list[str]:
    out = sh("git", "diff", "--name-only").stdout
    return [x.strip() for x in out.splitlines() if x.strip()]


def validate_changed_files(expected: list[str]) -> list[str]:
    actual = changed_files()
    if not actual:
        raise RuntimeError("Proposal produced no working-tree changes.")
    if len(actual) > MAX_CHANGED_FILES:
        raise RuntimeError(f"Proposal touched too many files: {actual}")
    unexpected = [f for f in actual if f not in expected or not f.startswith(ALLOWED_PREFIXES)]
    if unexpected:
        raise RuntimeError(f"Unexpected/protected changed paths: {unexpected}")
    return actual


def main() -> int:
    if sh("git", "status", "--porcelain").stdout.strip():
        raise RuntimeError("Working tree must be clean before local autopilot.")

    prompt = build_prompt()
    output = call_model(prompt)
    Path("/tmp/herbarium-local-ai-output.txt").write_text(output, encoding="utf-8")

    proposal = parse_proposal(output)
    if proposal is None:
        print("HERBARIUM local autopilot: NOOP")
        return 0

    Path("/tmp/herbarium-local-ai-proposal.json").write_text(
        json.dumps(proposal, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    expected = apply_exact_edits(proposal)
    files = validate_changed_files(expected)

    for js_file in [f for f in files if f.endswith(".js")]:
        syntax = sh("node", "--check", js_file, check=False)
        if syntax.returncode:
            raise RuntimeError(f"node --check failed for {js_file}:\n{syntax.stdout}")

    tests = sh("npm", "test", check=False)
    print(tests.stdout)
    if tests.returncode:
        raise RuntimeError("Generated edit failed npm test.")

    print("HERBARIUM local autopilot edit accepted:", proposal["summary"])
    print("Changed files:", ", ".join(files))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"LOCAL_AUTOPILOT_REJECTED: {exc}", file=sys.stderr)
        subprocess.run(["git", "reset", "--hard", "HEAD"], cwd=ROOT)
        raise SystemExit(0)
