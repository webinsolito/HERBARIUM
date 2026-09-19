#!/usr/bin/env python3
"""Bounded local-AI edit worker for HERBARIUM.

The model runs locally inside GitHub Actions. It does not receive write access.
It may only propose exact, bounded edits under src/ and tests/. This wrapper
applies those edits deterministically, validates changed paths, runs syntax
checks and the project tests, and leaves a clean tree when a proposal is bad.
"""
from __future__ import annotations

import ast
import json
import os
import re
import subprocess
import sys
import urllib.request
from pathlib import Path

ROOT = Path.cwd()
SERVER = os.environ.get("HERBARIUM_LOCAL_LLM_URL", "http://127.0.0.1:8080/v1/chat/completions")
MAX_FILE_CHARS = 12000
MAX_OUTPUT_CHARS = 30000
MAX_EDITS = 6
MAX_CHANGED_FILES = 3
ALLOWED_PREFIXES = ("src/", "tests/")
CONTEXT_FILES = (
    "CURRENT_MISSION.md",
    "src/app.js",
    "tests/smoke.mjs",
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


def choose_micro_task() -> str:
    js = read_context("src/app.js")
    smoke = read_context("tests/smoke.mjs")

    mime_markers = (
        "file.type.startsWith('image/')",
        'file.type.startsWith("image/")',
        "file.type?.startsWith('image/')",
        'file.type?.startsWith("image/")',
    )
    if not any(marker in js for marker in mime_markers):
        return (
            "Add an explicit early MIME-type reject guard in prepareEvidenceImage(file): "
            "if file.type exists and does not start with image/, throw a clear local error "
            "before FileReader/Image decoding. Add the smallest smoke assertion proving "
            "the guard exists. Do not change any other behavior."
        )

    if "objectStore(STORE_NAME).getAll()" not in js and ".getAll()" not in js:
        return (
            "Add a small read-only IndexedDB helper that returns saved observations using "
            "objectStore(STORE_NAME).getAll(), closes the database safely, and does not "
            "invent or verify species. Add only the smallest smoke assertion for this helper."
        )

    if "file.size" not in js or "MAX_INPUT_BYTES" not in js:
        return (
            "Add a conservative local input-size guard before decoding evidence images, "
            "using one named MAX_INPUT_BYTES constant and a clear error. Keep compression, "
            "UNKNOWN semantics and storage unchanged. Add the smallest smoke assertion."
        )

    return (
        "Continue CURRENT_MISSION with exactly one smallest missing reliability or "
        "source-recovery improvement visible in src/app.js, plus the smallest matching "
        "smoke assertion. Avoid cosmetic changes and do not duplicate existing behavior."
    )


def build_prompt() -> str:
    blocks = [f"===== {name} =====\n{read_context(name)}" for name in CONTEXT_FILES]
    task = choose_micro_task()
    return f"""You are the LOCAL, ZERO-API coding worker for HERBARIUM.

MANDATORY MICRO-TASK FOR THIS RUN:
{task}

Implement ONLY that micro-task. Do not choose another task and do not broaden
scope. You are operating unattended, so be conservative.

The current source ALREADY has UNKNOWN semantics, IndexedDB observation
persistence, JPEG evidence compression and transaction-based saves. Do not
re-add those things.

If the current src/app.js does NOT already contain an explicit MIME guard that
rejects files whose type does not start with image/, your ONLY allowed change in
this cycle is to implement that reject guard plus the smallest matching test.
Do not change IndexedDB, DB_NAME, STORE_NAME, compression constants or existing
storage semantics for that cycle. Once a MIME guard already exists, choose the
next small missing reliability/source-recovery improvement from the actual code.

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
- Prefer the smallest valid unified diff that implements the micro-task.
- If there is no clearly safe useful change, answer exactly: NOOP

Output protocol:
Prefer a standard unified git diff because code snippets contain backslashes,
regexes and quotes that small models often escape incorrectly in JSON.

Return EXACTLY this form, with no markdown fence and no prose before/after:

SUMMARY: short factual description
BEGIN_PATCH
diff --git a/src/app.js b/src/app.js
--- a/src/app.js
+++ b/src/app.js
@@ ...
...
END_PATCH

The patch must modify only existing files under src/ or tests/, touch at most
3 files, and represent ONE coherent improvement. Do not create/delete/rename
files. If there is no clearly safe useful change, answer exactly: NOOP.

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
                        "Inspect current code before editing. Return only the requested "
                        "SUMMARY/BEGIN_PATCH unified-diff protocol or NOOP."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.05,
            "top_p": 0.85,
            "max_tokens": 650,
            "stream": False,
        }
    ).encode("utf-8")
    req = urllib.request.Request(
        SERVER,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=420) as response:
        data = json.load(response)
    return data["choices"][0]["message"]["content"]


def parse_patch_proposal(output: str) -> tuple[str, str] | None:
    raw = output.strip()
    if raw == "NOOP":
        return None
    if len(raw) > MAX_OUTPUT_CHARS:
        raise RuntimeError("Model output exceeds bounded size.")

    start = raw.find("BEGIN_PATCH")
    end = raw.rfind("END_PATCH")
    if start < 0 or end < start:
        return None

    header = raw[:start].strip()
    if not header.startswith("SUMMARY:"):
        raise RuntimeError("Patch proposal is missing SUMMARY.")
    summary = header[len("SUMMARY:") :].strip()
    if not summary:
        raise RuntimeError("Patch proposal summary is empty.")

    patch = raw[start + len("BEGIN_PATCH") : end].strip()
    if not patch.startswith("diff --git "):
        raise RuntimeError("Patch proposal does not contain a unified git diff.")
    if len(patch) > 40000:
        raise RuntimeError("Patch proposal exceeds bounded patch size.")
    return summary, patch + "\n"


def validate_patch_paths(patch: str) -> list[str]:
    files: list[str] = []
    for line in patch.splitlines():
        if line.startswith("diff --git "):
            parts = line.split()
            if len(parts) != 4:
                raise RuntimeError("Malformed diff header.")
            left, right = parts[2], parts[3]
            if not left.startswith("a/") or not right.startswith("b/"):
                raise RuntimeError("Patch must modify existing repository files.")
            left_path = left[2:]
            right_path = right[2:]
            if left_path != right_path:
                raise RuntimeError("Autopilot may not rename files.")
            if not left_path.startswith(ALLOWED_PREFIXES):
                raise RuntimeError(f"Protected or invalid patch path: {left_path}")
            if not (ROOT / left_path).is_file():
                raise RuntimeError(f"Patch may modify only existing files: {left_path}")
            files.append(left_path)
        elif line.startswith("--- ") or line.startswith("+++ "):
            target = line[4:].strip()
            if target == "/dev/null":
                raise RuntimeError("Autopilot may not create or delete files.")

    unique = list(dict.fromkeys(files))
    if not unique:
        raise RuntimeError("Patch contains no file changes.")
    if len(unique) > MAX_CHANGED_FILES:
        raise RuntimeError(f"Patch touches too many files: {unique}")
    return unique


def apply_patch_proposal(summary: str, patch: str) -> list[str]:
    expected = validate_patch_paths(patch)
    patch_file = Path("/tmp/herbarium-local-ai.patch")
    patch_file.write_text(patch, encoding="utf-8")

    check = sh("git", "apply", "--check", "--whitespace=error-all", str(patch_file), check=False)
    if check.returncode:
        raise RuntimeError(f"Generated git patch does not apply cleanly:\n{check.stdout}")

    apply = sh("git", "apply", "--whitespace=error-all", str(patch_file), check=False)
    if apply.returncode:
        raise RuntimeError(f"Generated git patch failed to apply:\n{apply.stdout}")

    files = validate_changed_files(expected)
    if set(files) != set(expected):
        raise RuntimeError(
            f"Applied patch changed unexpected files: expected {expected}, got {files}"
        )
    Path("/tmp/herbarium-local-ai-proposal.txt").write_text(
        f"SUMMARY: {summary}\nBEGIN_PATCH\n{patch}END_PATCH\n", encoding="utf-8"
    )
    return files


def _repair_invalid_json_escapes(raw: str) -> str:
    r"""Repair only invalid backslash escapes inside JSON string literals.

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


def _quote_bare_json_keys(raw: str) -> str:
    """Quote only bare object keys in relaxed JSON-like model output.

    This is deliberately narrow: it does not evaluate expressions or execute
    model content. Structural/path/edit validation still runs afterwards.
    """
    key_re = re.compile(r'(?P<prefix>[{,]\\s*)(?P<key>[A-Za-z_][A-Za-z0-9_-]*)(?P<suffix>\\s*:)' )
    return key_re.sub(
        lambda match: (
            f'{match.group("prefix")}"{match.group("key")}"{match.group("suffix")}'
        ),
        raw,
    )


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
        repaired = _quote_bare_json_keys(_repair_invalid_json_escapes(candidate))
        try:
            proposal = json.loads(repaired)
        except json.JSONDecodeError as json_exc:
            try:
                proposal = ast.literal_eval(repaired)
            except (SyntaxError, ValueError) as literal_exc:
                raise RuntimeError(
                    "Model output is invalid structured data after safe escape/key repair: "
                    f"{json_exc}; original error: {first_exc}; "
                    f"literal fallback: {literal_exc}"
                ) from literal_exc

    if not isinstance(proposal, dict):
        raise RuntimeError("Model proposal must be a JSON object.")
    summary = proposal.get("summary")
    edits = proposal.get("edits")
    if not isinstance(summary, str) or not summary.strip():
        raise RuntimeError("Proposal summary is missing.")
    if not isinstance(edits, list) or not edits:
        raise RuntimeError("Proposal edits are missing.")
    return {"summary": summary.strip(), "edits": edits}


def _literalize_regex_style_find(find: str) -> str:
    r"""Turn accidental regex escaping into a literal exact-match candidate.

    The local model sometimes emits code text like `foo\.bar\(x\)` even
    though the protocol requires literal source text. We only use this fallback
    when the original exact string does not match and the unescaped candidate
    matches exactly once in the current file.
    """
    return re.sub(r"\\([.(){}\[\]+*?^$|/])", r"\1", find)


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
    applied_edits = 0
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

        # Harmless no-op entries are common with small models. Ignore them
        # rather than discarding an otherwise useful bounded proposal.
        if find == replace:
            continue

        p = validate_path(path)
        current = p.read_text(encoding="utf-8")
        count = current.count(find)

        if count != 1:
            literal_find = _literalize_regex_style_find(find)
            literal_count = current.count(literal_find) if literal_find != find else count
            if literal_find != find and literal_count == 1:
                find = literal_find
                count = 1

        # A regex-escaped find may become identical to the replacement after
        # literalization. That is still a no-op and should be ignored.
        if find == replace:
            continue

        if count != 1:
            raise RuntimeError(
                f"Edit {index} expected exactly one match in {path}, found {count}. "
                "This normally means the model proposed a stale or ambiguous edit."
            )

        applied_edits += 1
        if applied_edits > MAX_EDITS:
            raise RuntimeError(
                f"Proposal contains more than {MAX_EDITS} effective edit operations."
            )

        p.write_text(current.replace(find, replace, 1), encoding="utf-8")
        touched.append(path)

    unique = list(dict.fromkeys(touched))
    if len(unique) > MAX_CHANGED_FILES:
        raise RuntimeError(f"Proposal touched too many files: {unique}")
    return unique


def apply_deterministic_fast_path() -> tuple[str, list[str]] | None:
    """Apply one tiny pre-reviewed source-recovery improvement without LLM latency."""
    app = ROOT / "src/app.js"
    smoke = ROOT / "tests/smoke.mjs"
    if not app.is_file() or not smoke.is_file():
        return None

    js = app.read_text(encoding="utf-8")
    tests = smoke.read_text(encoding="utf-8")

    mime_guard = "file.type && !file.type.startsWith('image/')"
    if mime_guard not in js:
        old = """  const prepareEvidenceImage = async file => {
    const original = await fileToDataUrl(file);"""
        new = """  const prepareEvidenceImage = async file => {
    if (file.type && !file.type.startsWith('image/')) {
      throw new Error("Il file selezionato non è un'immagine.");
    }
    const original = await fileToDataUrl(file);"""
        if js.count(old) != 1:
            return None
        js = js.replace(old, new, 1)

        assertion = "assert.match(js,/file\\.type && !file\\.type\\.startsWith\\('image\\/'\\)/);"
        if assertion not in tests:
            anchor = "assert.match(js,/readAsDataURL\\(file\\)/);"
            if tests.count(anchor) != 1:
                return None
            tests = tests.replace(anchor, anchor + "\n" + assertion, 1)

        app.write_text(js, encoding="utf-8")
        smoke.write_text(tests, encoding="utf-8")
        return "Reject non-image evidence before local decoding", ["src/app.js", "tests/smoke.mjs"]

    if "const loadObservations = async () =>" not in js:
        anchor = """  const saveObservation = async observation => {"""
        helper = """  const loadObservations = async () => {
    const db = await openDb();
    try {
      return await new Promise((resolve, reject) => {
        const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error || new Error('Lettura osservazioni locali fallita.'));
      });
    } finally { db.close(); }
  };

"""
        if js.count(anchor) == 1:
            js = js.replace(anchor, helper + anchor, 1)
            assertion = "assert.match(js,/objectStore\\(STORE_NAME\\)\\.getAll\\(\\)/);"
            if assertion not in tests:
                test_anchor = "assert.match(js,/objectStore\\(STORE_NAME\\)\\.add\\(observation\\)/);"
                if tests.count(test_anchor) != 1:
                    return None
                tests = tests.replace(test_anchor, test_anchor + "\n" + assertion, 1)

            app.write_text(js, encoding="utf-8")
            smoke.write_text(tests, encoding="utf-8")
            return "Add local read path for saved observations", ["src/app.js", "tests/smoke.mjs"]

    if "const MAX_INPUT_BYTES =" not in js:
        constant_anchor = "  const JPEG_QUALITY = 0.78;"
        guard_anchor = """    if (file.type && !file.type.startsWith('image/')) {
      throw new Error("Il file selezionato non è un'immagine.");
    }
    const original = await fileToDataUrl(file);"""
        if js.count(constant_anchor) != 1 or js.count(guard_anchor) != 1:
            return None

        js = js.replace(
            constant_anchor,
            constant_anchor + "\n  const MAX_INPUT_BYTES = 12 * 1024 * 1024;",
            1,
        )
        size_guard = """    if (file.type && !file.type.startsWith('image/')) {
      throw new Error("Il file selezionato non è un'immagine.");
    }
    if (file.size && file.size > MAX_INPUT_BYTES) {
      throw new Error("La foto selezionata supera il limite locale consentito.");
    }
    const original = await fileToDataUrl(file);"""
        js = js.replace(guard_anchor, size_guard, 1)

        test_anchor = "assert.match(js,/file\\.type && !file\\.type\\.startsWith\\('image\\/'\\)/);"
        if tests.count(test_anchor) != 1:
            return None
        tests = tests.replace(
            test_anchor,
            test_anchor
            + "\nassert.match(js,/MAX_INPUT_BYTES = 12 \\* 1024 \\* 1024/);"
            + "\nassert.match(js,/file\\.size && file\\.size > MAX_INPUT_BYTES/);",
            1,
        )

        app.write_text(js, encoding="utf-8")
        smoke.write_text(tests, encoding="utf-8")
        return "Reject oversized evidence before local decoding", ["src/app.js", "tests/smoke.mjs"]

    return None


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

    fast_path = apply_deterministic_fast_path()
    if fast_path is not None:
        summary, expected = fast_path
        files = validate_changed_files(expected)
        print("HERBARIUM deterministic fast path:", summary)
    elif os.environ.get("HERBARIUM_FAST_PATH_ONLY") == "1":
        print("HERBARIUM deterministic fast path: NOOP")
        return 0
    else:
        prompt = build_prompt()
        output = call_model(prompt)
        Path("/tmp/herbarium-local-ai-output.txt").write_text(output, encoding="utf-8")

        patch_proposal = parse_patch_proposal(output)
        if patch_proposal is not None:
            summary, patch = patch_proposal
            files = apply_patch_proposal(summary, patch)
        else:
            proposal = parse_proposal(output)
            if proposal is None:
                print("HERBARIUM local autopilot: NOOP")
                return 0
            Path("/tmp/herbarium-local-ai-proposal.json").write_text(
                json.dumps(proposal, ensure_ascii=False, indent=2), encoding="utf-8"
            )
            summary = proposal["summary"]
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

    print("HERBARIUM local autopilot edit accepted:", summary)
    print("Changed files:", ", ".join(files))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"LOCAL_AUTOPILOT_REJECTED: {exc}", file=sys.stderr)
        subprocess.run(["git", "reset", "--hard", "HEAD"], cwd=ROOT)
        raise SystemExit(0)
