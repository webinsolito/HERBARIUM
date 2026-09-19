#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
import subprocess
import tempfile
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location("local_autopilot", HERE / "local_autopilot.py")
assert SPEC and SPEC.loader
autopilot = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(autopilot)


class ParserTests(unittest.TestCase):
    def test_repairs_invalid_regex_escape_in_json_string(self) -> None:
        raw = r'''{
  "summary": "add MIME guard",
  "edits": [{
    "path": "src/app.js",
    "find": "const ok = /\s+/.test(value);",
    "replace": "const ok = /\s+/.test(value.trim());"
  }]
}'''
        # Simulate the small model emitting invalid JSON with single regex
        # backslashes rather than the double escaping JSON requires.
        raw = raw.replace(r"/\\s+/", r"/\s+/")
        proposal = autopilot.parse_proposal(raw)
        self.assertEqual(proposal["edits"][0]["path"], "src/app.js")
        self.assertIn(r"\s+", proposal["edits"][0]["find"])

    def test_allows_harmless_extra_edit_metadata(self) -> None:
        proposal = autopilot.parse_proposal(
            """{
              "summary": "small safe edit",
              "edits": [{
                "path": "src/app.js",
                "find": "OLD",
                "replace": "NEW",
                "reason": "explanation only"
              }]
            }"""
        )
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "src").mkdir()
            (root / "src/app.js").write_text("OLD", encoding="utf-8")
            previous_root = autopilot.ROOT
            autopilot.ROOT = root
            try:
                touched = autopilot.apply_exact_edits(proposal)
            finally:
                autopilot.ROOT = previous_root
            self.assertEqual(touched, ["src/app.js"])
            self.assertEqual((root / "src/app.js").read_text(encoding="utf-8"), "NEW")


    def test_regex_style_find_is_literalized_and_noop_is_ignored(self) -> None:
        proposal = {
            "summary": "small safe edit",
            "edits": [
                {
                    "path": "src/app.js",
                    "find": r"speciesCount\.textContent = '0'",
                    "replace": "speciesCount.textContent = '0'",
                },
                {
                    "path": "src/app.js",
                    "find": "OLD",
                    "replace": "NEW",
                },
            ],
        }
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "src").mkdir()
            (root / "src/app.js").write_text(
                "speciesCount.textContent = '0';\nOLD", encoding="utf-8"
            )
            previous_root = autopilot.ROOT
            autopilot.ROOT = root
            try:
                touched = autopilot.apply_exact_edits(proposal)
            finally:
                autopilot.ROOT = previous_root
            self.assertEqual(touched, ["src/app.js"])
            self.assertEqual(
                (root / "src/app.js").read_text(encoding="utf-8"),
                "speciesCount.textContent = '0';\nNEW",
            )

    def test_real_old_model_shape_parses_after_escape_repair(self) -> None:
        raw = r'''{
          "summary": "Add IndexedDB object storage.",
          "edits": [
            {"path":"src/app.js","find":"indexedDB.open\(DB_NAME, 1\)","replace":"indexedDB.open('herbarium.local.v1', 1)"},
            {"path":"src/app.js","find":"createObjectStore\(STORE_NAME, \{ keyPath: 'id' \}\)","replace":"createObjectStore('observations', { keyPath: 'id' })"},
            {"path":"src/app.js","find":"speciesCount\.textContent = '0'","replace":"speciesCount.textContent = '0'"},
            {"path":"src/app.js","find":"status:\s*['\"]VERIFIED['\"]/","replace":"status:\s*['\"]VERIFIED['\"]/"} 
          ]
        }'''
        proposal = autopilot.parse_proposal(raw)
        self.assertEqual(proposal["summary"], "Add IndexedDB object storage.")
        self.assertEqual(len(proposal["edits"]), 4)


    def test_unified_diff_protocol_applies_end_to_end(self) -> None:
        output = """SUMMARY: replace one bounded line
BEGIN_PATCH
diff --git a/src/app.js b/src/app.js
--- a/src/app.js
+++ b/src/app.js
@@ -1 +1 @@
-OLD
+NEW
END_PATCH
"""
        parsed = autopilot.parse_patch_proposal(output)
        self.assertIsNotNone(parsed)
        summary, patch = parsed
        self.assertEqual(summary, "replace one bounded line")

        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "src").mkdir()
            (root / "src/app.js").write_text("OLD\n", encoding="utf-8")
            subprocess.run(["git", "init", "-q"], cwd=root, check=True)
            subprocess.run(["git", "config", "user.email", "test@example.invalid"], cwd=root, check=True)
            subprocess.run(["git", "config", "user.name", "Test"], cwd=root, check=True)
            subprocess.run(["git", "add", "."], cwd=root, check=True)
            subprocess.run(["git", "commit", "-qm", "baseline"], cwd=root, check=True)

            previous_root = autopilot.ROOT
            autopilot.ROOT = root
            try:
                touched = autopilot.apply_patch_proposal(summary, patch)
            finally:
                autopilot.ROOT = previous_root

            self.assertEqual(touched, ["src/app.js"])
            self.assertEqual((root / "src/app.js").read_text(encoding="utf-8"), "NEW\n")

    def test_unified_diff_rejects_protected_path(self) -> None:
        output = """SUMMARY: forbidden
BEGIN_PATCH
diff --git a/README.md b/README.md
--- a/README.md
+++ b/README.md
@@ -1 +1 @@
-old
+new
END_PATCH
"""
        summary, patch = autopilot.parse_patch_proposal(output)
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "README.md").write_text("old\n", encoding="utf-8")
            previous_root = autopilot.ROOT
            autopilot.ROOT = root
            try:
                with self.assertRaisesRegex(RuntimeError, "Protected or invalid patch path"):
                    autopilot.validate_patch_paths(patch)
            finally:
                autopilot.ROOT = previous_root

    def test_missing_required_edit_field_still_rejected(self) -> None:
        proposal = {
            "summary": "bad edit",
            "edits": [{"path": "src/app.js", "find": "OLD"}],
        }
        with self.assertRaisesRegex(RuntimeError, "missing required fields"):
            autopilot.apply_exact_edits(proposal)

    def test_noop_still_supported(self) -> None:
        self.assertIsNone(autopilot.parse_proposal("NOOP"))


if __name__ == "__main__":
    unittest.main()
