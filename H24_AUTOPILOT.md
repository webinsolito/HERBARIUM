# H24 AUTOPILOT STATUS

HERBARIUM now has a GitHub-native continuous controller scheduled every 5 minutes, the shortest supported GitHub Actions schedule interval.

## Always active
- checkout candidate only;
- install dependencies;
- run baseline tests;
- keep main untouched;
- use concurrency protection.

## AI evolution gate
Real AI code generation is executed only when the repository secret `COPILOT_GITHUB_TOKEN` exists.

This is deliberate:
- the repository is personal, so GitHub requires a Copilot personal token or another AI engine credential;
- an AI cycle may consume Copilot/AI credits;
- without the credential the workflow remains a continuous guard, not a fake self-programmer.

## Safety
AI is instructed to make one coherent change only, not touch workflow files, run tests, and leave the candidate unpushed if tests fail. The workflow commits only after regression tests pass.

Stable `main` remains protected.
