# Contributing

Thanks for your interest in improving the Inlay HISE Module.

This repository contains HISE Script source, example projects, documentation,
and release tooling for integrating Inlay activation and entitlement checks
into HISE instruments and effects.

## Issues

Use GitHub issues for reproducible bugs, integration problems, and
documentation feedback. Include the module version, HISE version, operating
system, affected project or script, and concise reproduction steps where
possible.

Do not report security-sensitive issues publicly. For activation bypasses,
token validation problems, licensing weaknesses, or other vulnerabilities,
follow the process in [`SECURITY.md`](SECURITY.md).

## Pull requests

Small documentation fixes, example improvements, and clearly scoped bug fixes
are welcome. Open an issue before starting a larger change so the proposed
direction can be discussed.

Keep pull requests focused and explain:

- what changed and why,
- which HISE scripts or example projects are affected,
- how the change was checked, and
- any compatibility or migration considerations.

Avoid committing generated distribution artifacts, local HISE project state,
credentials, access tokens, or unrelated formatting changes.

## Development setup

Clone the repository and open the relevant HISE project in HISE:

```sh
git clone https://github.com/inlay-cloud/inlay-hise-module.git
cd inlay-hise-module
```

The module source is in `src/`. To use a working copy in a HISE project, link
or copy it into the project's `Scripts/Inlay` directory:

```sh
./scripts/install-as-link.sh /path/to/YourProject
```

Use a copy instead when the project must be self-contained:

```sh
./scripts/install-as-copy.sh /path/to/YourProject
```

The example project is in `examples/BasicSynth`, and the test fixture is in
`tests/TestProject`.

## HISE Script guidelines

- Follow the existing HISE Script patterns and naming conventions in `src/`
  and `examples/`.
- Keep public module behavior and integration points documented in `docs/`.
- Prefer small, focused changes to shared unlocker and UI behavior.
- Check callbacks, namespaces, includes, component identifiers, and runtime
  state carefully; HISE Script is not browser JavaScript.
- Update or add an example when a change affects module integration.

## Validation

This repository does not use a conventional build or test command. Validate
changes in HISE using the relevant example or test project, and perform a
static review of modified scripts. Do not commit generated project files or
local HISE state.

Before opening a pull request, review the diff and confirm that documentation,
examples, and release-facing changes remain consistent.

## Releases

Release and distribution branches are maintained by project maintainers. The
scripts in `scripts/` support installation and release publication; do not run
publishing commands unless you are responsible for the release.

By submitting a contribution, you confirm that you have the right to
contribute it under the terms of the [MIT License](LICENSE).
