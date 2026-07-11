[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

# Inlay HISE Module

Inlay HISE Module is a lightweight HISE Script integration for protecting a plugin with Inlay activation and local access validation. It provides a runtime unlocker that manages browser-based activation, offline access-token validation and refresh, plugin lock-state broadcasts, protected expansion entitlements, and optional default UI for blocking access until the product is unlocked.

## Installation

### 1. Add the distributable module as a submodule (preferred)

Add this repository's `dist` branch as a Git submodule in your HISE project's `Scripts` folder, naming it `Inlay`:

```sh
git submodule add --branch dist git@github.com:inlay-cloud/inlay-hise-module.git Scripts/Inlay
```

The module sources will then be available at `Scripts/Inlay` in your HISE project.

### 2. Develop from the main branch

Add the `main` branch of this repository as a Git submodule in your project, or clone it locally:

```sh
git submodule add --branch main git@github.com:inlay-cloud/inlay-hise-module.git <path/to/inlay-hise-module>
```

From the module repository, run one of the installation scripts and pass the path to your HISE project:

```sh
scripts/install-as-link.sh <path/to/your/project>
```

This creates a symlink to the module, which is useful while developing it. Alternatively, copy the module sources into the project:

```sh
scripts/install-as-copy.sh <path/to/your/project>
```

### 3. Install from a GitHub release

Download the ZIP archive from the repository's [GitHub Releases](https://github.com/inlay-cloud/inlay-hise-module/releases) page. Unpack its contents into your HISE project's `Scripts` folder so the module is available at `Scripts/Inlay`.


## Repository structure

```text
src/
  Unlocker.js                 Core activation, access-validation, and entitlement logic
  Ui.js                       Optional default activation and unlock UI
examples/
  BasicSynth/                 Example HISE project integration
tests/
  TestProject/                HISE editor test project
docs/
  README.md                   Module API reference
  guide.md                    Host-plugin integration guide
  expansions-protection-guide.md
scripts/
  install-as-copy.sh          Installs the module by copying files
  install-as-link.sh          Installs the module using a link
  publish-dist.sh             Prepares the distributable module files
LICENSE                       MIT license text
```

## License

This project is licensed under the [MIT License](LICENSE).
