#!/usr/bin/env python3
"""Bounded local-AI patch worker for HERBARIUM.

The model can propose edits only under src/ and tests/. Every proposal is
validated with git apply and the repository test suite before it can be
published as an autopilot PR by the workflow.
"""
from __future__ import annotations

import json
import os
import re
import subprocess
import sys
import urllib.request
from pathlib import Path

ROOT = Path.cwd()
SERVER = os.environ.get("HERBARIUM_LOCAL_LLM_URL", "http://127.0.0.1:8080/v1/chat/completions")
MAX_FILE_CHARS = 18000
MAX_PATCH_CHARS = 70000
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
    blocks = []
    for name in CONTEXT_FILES:
        blocks.append(f"===== {name} =====\n{read_context(name)}")

    return """You are the LOCAL, ZERO-API coding worker for HERBARIUM.

Choose exactly ONE small, concrete improvement that advances the CURRENT_MISSION
without weakening existing behavior. You are operating unattended, so be
conservative.

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
- Do not delete/weaken tests just to obtain green.
- Prefer a real reliability/recovery improvement over cosmetic churn.
- Keep the change small enough to review in one PR.
- If there is no clearly safe useful change, answer exactly: NOOP

Output rules:
- If changing code, output ONLY one fenced ```diff block containing a valid
  unified git diff that can be applied with git apply.
- No prose before or after the diff.

Repository context follows:

""" + "\n\n".join(blocks)


def call_model(prompt: str) -> str:
    payload = json.dumps(
        {
            "model": "local-herbarium-coder",
            "messages": [
                {
                    "role": "system",
                    "content": "You are a cautious senior software maintainer. Obey file boundaries exactly.",
                },
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.15,
            "top_p": 0.9,
            "max_tokens": 2600,
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


def extract_patch(output: str) -> str | None:
    if output.strip() == "NOOP":
        return None
    fenced = re.search(r"```diff\s*(.*?)\s*```", output, re.S | re.I)
    patch = fenced.group(1) if fenced else output
    start = patch.find("diff --git ")
    if start >= 0:
        patch = patch[start:]
    patch = patch.strip() + "\n"
    if not (patch.startswith("diff --git ") or (patch.startswith("--- ") and "\n+++ " in patch)):
        raise RuntimeError("Model output is not a unified diff.")
    if len(patch) > MAX_PATCH_CHARS:
        raise RuntimeError("Model patch exceeds bounded size.")
    return patch


def changed_files() -> list[str]:
    out = sh("git", "diff", "--name-only").stdout
    return [x.strip() for x in out.splitlines() if x.strip()]


def validate_paths(files: list[str]) -> None:
    if not files:
        raise RuntimeError("Patch produced no working-tree changes.")
    if len(files) > 3:
        raise RuntimeError(f"Patch touched too many files: {files}")
    bad = [f for f in files if not f.startswith(ALLOWED_PREFIXES)]
    if bad:
        raise RuntimeError(f"Patch touched protected paths: {bad}")


def main() -> int:
    if sh("git", "status", "--porcelain").stdout.strip():
        raise RuntimeError("Working tree must be clean before local autopilot.")

    prompt = build_prompt()
    output = call_model(prompt)
    Path("/tmp/herbarium-local-ai-output.txt").write_text(output, encoding="utf-8")

    patch = extract_patch(output)
    if patch is None:
        print("HERBARIUM local autopilot: NOOP")
        return 0

    patch_path = Path("/tmp/herbarium-local-ai.patch")
    patch_path.write_text(patch, encoding="utf-8")

    check = sh("git", "apply", "--check", str(patch_path), check=False)
    if check.returncode != 0:
        raise RuntimeError("Generated patch failed git apply --check:\n" + check.stdout)

    sh("git", "apply", str(patch_path))
    files = changed_files()
    validate_paths(files)

    # Fast syntax check when JS changed.
    if "src/app.js" in files:
        syntax = sh("node", "--check", "src/app.js", check=False)
        if syntax.returncode:
            raise RuntimeError("node --check failed:\n" + syntax.stdout)

    tests = sh("npm", "test", check=False)
    print(tests.stdout)
    if tests.returncode:
        sh("git", "reset", "--hard", "HEAD", check=False)
        raise RuntimeError("Generated patch failed npm test and was rolled back.")

    print("HERBARIUM local autopilot patch accepted:", ", ".join(files))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"LOCAL_AUTOPILOT_REJECTED: {exc}", file=sys.stderr)
        # A rejected AI proposal is not a product regression: leave the tree clean.
        subprocess.run(["git", "reset", "--hard", "HEAD"], cwd=ROOT)
        raise SystemExit(0)
