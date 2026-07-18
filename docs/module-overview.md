# Inlay HISE Module

The Inlay HISE Module adds activation, local access validation, and optional lock-screen UI to a HISE plugin. It lets a plugin reuse valid local access offline until expiry and refresh access when needed.

The runtime module contains:

- `Unlocker.js` — required activation and access-control library.
- `Ui.js` — optional stock overlay for activation and unlocking.

## Basic Concepts

Create one unlocker for the host plugin, then start it after the plugin UI and any lock-state listeners are ready. The unlocker keeps two kinds of local data in the user's application-data directory: an identity token that lets it request access again, and an access token that authorizes this specific product on this specific device.

At startup, the module reads the saved identity and access token. Before allowing use, it validates the access token locally with the configured public key. The validation checks that the token is intact, applies to the configured product and current device, was issued in the past, and has not expired. A valid cached token therefore unlocks the plugin without a server request, which is what permits offline use until the token expires.

The identity token and access token have different roles. The identity token is a persisted sign-in identity that the module can send to Inlay when it needs current access. The signed access token is the actual local authorization for the configured HISE product on the current device. The module never treats the presence of either file as sufficient by itself: an access token must pass local validation before the plugin is unlocked, and a saved identity is used only to obtain a replacement or refreshed access token from the server.

The server is the authority for activation and entitlement decisions, but the HISE module does not trust a successful server response blindly. After activation or refresh, it saves the returned tokens, validates the access token with the company public key, and only then broadcasts `unlocked`. The local validation binds access to the configured `productId` and the device ID reported by HISE, and rejects tokens with an invalid signature, future issue time, or expired access. This is why a valid cached access token can continue to authorize the plugin offline, while changing the product ID or device invalidates that cached access.

The unlocker exposes three states through `statusBroadcaster`:

| Status | Meaning |
| --- | --- |
| `activation_required` | No usable identity is available; the user must activate in a browser. |
| `unlocking` | A saved identity exists, but current access must be obtained or refreshed. |
| `unlocked` | Local access is valid and protected functionality may run. |

### Access lifecycle

1. On `startup()`, no saved identity leads to `activation_required`; a saved identity with no valid local access leads to `unlocking`; a valid access token leads directly to `unlocked`.
2. In `activation_required`, the user initiates activation. The module asks the Inlay server to create an activation session, opens the returned browser flow, and polls the server until that flow is complete.
3. When activation succeeds, or when a saved identity needs access, the Inlay server evaluates the account's entitlement and returns current access. The module saves the returned identity and access token locally, validates the access token again, and only then broadcasts `unlocked`.
4. After unlocking, the module schedules a refresh check. The signed access token's optional `r` claim sets the refresh age in whole days; `-1` disables age-based refresh, while a missing or invalid value defaults to one day. A temporary refresh failure leaves a still-valid token in place; a rejected identity returns the plugin to `activation_required`.

Refreshing is a background maintenance operation, not a prerequisite for every protected callback. If the current access token is still valid, a temporary network or HTTP failure does not immediately lock the plugin. If access expires and cannot be renewed, the status changes away from `unlocked`, so both the UI and any protected audio or MIDI callbacks must stop relying on unlocked functionality. The refresh interval and token expiration are supplied by Inlay in the signed access token; the plugin does not configure them locally.

The server is the authority for activation and entitlement decisions. The plugin does not trust a server response blindly: it uses the company public key to validate the returned access token locally before enabling protected functionality.

Use the default `InlayUi` for a blocking activation screen, or drive a branded screen from the public broadcasters and methods. In either case, protect plugin-specific controls and code until the state is `unlocked`. Attach listeners and create the lock UI before `startup()`, because it can immediately broadcast the current state.

`statusBroadcaster` is the HISE-facing state-change mechanism; use it to show or hide UI and to refresh project state when activation, refresh, logout, or expiry changes the host status. `isLocked()` is the lightweight guard for plugin callbacks, including audio/MIDI processing. It returns locked for every state except `STATUS_UNLOCKED`, so code that accesses protected samples, presets, controls, or processing should check it rather than infer access from whether a token file or user email exists. Keep UI actions such as activation, retry, and logout in the script/UI flow, and do not use the broadcaster payload or `getCurrentUser()` as a substitute for the access check.

Expansions are separately entitled sub-products. This overview lists the related API, but implementation details belong in the [Expansion protection guide](expansions-protection-guide.md).

## Installation

### Add the distributable module as a submodule (preferred)

Add the repository's `dist` branch to the HISE project's `Scripts` directory:

```sh
git submodule add --branch dist git@github.com:inlay-cloud/inlay-hise-module.git Scripts/Inlay
```

The runtime sources will be available at `Scripts/Inlay`.

### Develop from the main branch

Add the `main` branch as a submodule, or clone it locally:

```sh
git submodule add --branch main git@github.com:inlay-cloud/inlay-hise-module.git <path/to/inlay-hise-module>
```

For linked local development, run from this repository:

```sh
scripts/install-as-link.sh <path/to/your/project>
```

To copy the sources instead:

```sh
scripts/install-as-copy.sh <path/to/your/project>
```

### Install from a GitHub release

Download the ZIP from [GitHub Releases](https://github.com/inlay-cloud/inlay-hise-module/releases) and unpack it into the project's `Scripts` directory so the files are available as `Scripts/Inlay/Unlocker.js` and, optionally, `Scripts/Inlay/Ui.js`.

## Basic Integration

Include the module at top level, build the normal plugin UI, then create and start the unlocker. `productId` and `publicKey` are available from the Inlay Console project setup guide.

```javascript
include("Inlay/Unlocker.js");
include("Inlay/Ui.js"); // Optional default overlay.

Content.makeFrontInterface(1000, 710);

// Build the normal plugin UI here.

const var unlocker = InlayUnlocker.create({
    productId: "YOUR_INLAY_PRODUCT_ID",
    publicKey: "YOUR_COMPANY_PUBLIC_KEY"
});

InlayUi.create(unlocker);
unlocker.startup();
```

Create `InlayUi` after the rest of the plugin UI so its `AlwaysOnTop` root panel covers protected controls. Call `startup()` last, after creating any custom UI and attaching listeners.

For a simple callback guard, use `isLocked()`:

```javascript
function onAudioProcess(buffer)
{
    if (unlocker.isLocked())
        return;

    // Process audio here.
}
```

Use `statusBroadcaster` rather than polling when UI or other state must react immediately:

```javascript
unlocker.statusBroadcaster.addListener(
    "project.unlockState",
    "project.unlockState",
    function(status)
    {
        local isUnlocked = status == InlayUnlocker.STATUS_UNLOCKED;
        // Enable or disable project-specific controls here.
    }
);
```

## API Reference

### Configuration and constants

`InlayUnlocker.create(config)` creates the single unlocker instance. Creating multiple unlockers in the same script is unsupported.

| Configuration field | Required | Meaning |
| --- | --- | --- |
| `productId` | Yes | Inlay product ID for the host plugin. |
| `publicKey` | Yes | Public key used to verify Inlay access tokens. |
| `apiUrl` | No | API base URL; use only for development or staging. |

Use these constants instead of hard-coded state strings:

```javascript
InlayUnlocker.STATUS_ACTIVATION_REQUIRED
InlayUnlocker.STATUS_UNLOCKING
InlayUnlocker.STATUS_UNLOCKED
```

### Broadcasters

| Broadcaster | Payload | Use |
| --- | --- | --- |
| `unlocker.statusBroadcaster` | `status` | React to host lock state. |
| `unlocker.activationErrBroadcaster` | `error` | Show browser-activation errors in custom UI. An empty string clears the error. |
| `unlocker.unlockingErrBroadcaster` | `error` | Show access-refresh errors in custom UI. An empty string clears the error. |

### Host-plugin methods

#### `unlocker.startup()`

Starts the protection flow. Call once after creating the unlocker and attaching UI/listeners. It broadcasts `activation_required`, `unlocking`, or `unlocked`; when it broadcasts `unlocking`, the module automatically requests current access.

#### `unlocker.startActivation()`

Starts browser-based activation for the host plugin. Call from an Activate button when using custom UI. The stock `InlayUi` already calls it.

#### `unlocker.retryUnlocking()`

Retries access after an unlocking error. Call from a Retry button while the status is `unlocking`. Calls in other states are ignored.

#### `unlocker.logout()`

Clears local identity and access state, then returns to `activation_required`. Use for explicit sign-out, account switching, or recovery from invalid saved identity.

```javascript
inline function onLogoutButtonControl(component, value)
{
    if (value)
        unlocker.logout();
}
```

#### `unlocker.isLocked()`

Returns `true` unless the current status is `unlocked`. Use it for lightweight guards; use `statusBroadcaster` for reactive UI.

#### `unlocker.getCurrentUser()`

Returns the validated access token's email address, or `undefined` if no validated email is available. Use it for account display only, not as an access check.

#### `unlocker.getAppUpdate()` and `unlocker.skipCurrentAppUpdateVersion()`

`getAppUpdate()` returns `undefined` or an update object with `version` and `url`. `InlayUi` checks it when the host becomes unlocked. Custom UI can display it and call `skipCurrentAppUpdateVersion()` after the user dismisses that version.

```javascript
local updateInfo = unlocker.getAppUpdate();

if (isDefined(updateInfo))
{
    // Use updateInfo.url for an Update action.
    unlocker.skipCurrentAppUpdateVersion();
}
```

### Default UI and custom UI

`InlayUi.create(unlocker)` creates the default full-plugin lock overlay. It provides activation, unlocking progress, Retry and Logout actions, and hides when the host is unlocked.

For branded UI, omit `InlayUi.create()` and use:

- `statusBroadcaster` for screen visibility and protected state;
- `activationErrBroadcaster` and `unlockingErrBroadcaster` for errors;
- `startActivation()`, `retryUnlocking()`, and `logout()` for the corresponding user actions.

Keep custom changes in project scripts rather than editing `Scripts/Inlay/Ui.js`. A wrapper can create the stock UI and then adjust its components:

```javascript
namespace ProjectInlayUi
{
    inline function create(unlocker)
    {
        InlayUi.create(unlocker);

        local label = Content.getComponent("inlayActivationLabel");
        if (isDefined(label))
            label.set("text", "This plugin needs activation.");
    }
}
```

### Expansion API

Expansion access requires the host plugin to be unlocked. Each protected expansion uses its own `InlayProductID`, never the host product ID.

| Method | Purpose |
| --- | --- |
| `unlocker.checkExpansion(expansion)` | Returns the installed expansion's access state, or `undefined` when it has no `InlayProductID`. |
| `unlocker.setExpansionUnlockingCallback(callback)` | Registers the one supported completion callback for expansion unlocking. |
| `unlocker.unlockExpansion(expansion)` | Starts an expansion access flow. Only one flow can run at a time. |
| `unlocker.cancelExpansionUnlocking()` | Cancels the active expansion unlock flow. |

See the [Expansion protection guide](expansions-protection-guide.md) for packaging, HISE expansion-handler setup, browser flow, and UI patterns.

## Integration Checklist

1. Install `Unlocker.js` and, if desired, `Ui.js` under `Scripts/Inlay`.
2. Create exactly one unlocker with the host product ID and company public key.
3. Build normal plugin UI before creating the default Inlay UI.
4. Attach project-specific listeners before `startup()`.
5. Keep protected functionality unavailable until `STATUS_UNLOCKED`.
