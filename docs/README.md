# InlayModule

InlayModule is a HISE Script module that adds Inlay activation, local access validation, and expansion entitlement checks to a HISE plugin.

The module is intentionally small from the plugin script's point of view:

- `InlayUnlocker.create(config)` creates the runtime unlocker.
- `unlocker.startup()` decides whether the plugin is activated, unlocking, or unlocked.
- `InlayUi.create(unlocker)` can create the default blocking activation UI.
- Expansion scripts call `unlocker.checkExpansion(expansion)` and `unlocker.unlockExpansion(expansion)` to enforce expansion access.

The code lives in:

- `Scripts/InlayModule/Unlocker.js`
- `Scripts/InlayModule/Ui.js`
- `Scripts/InlayModule/Test.js`

`Unlocker.js` is the core library. `Ui.js` is optional default UI. `Test.js` is an editor test harness.

## Running Tests

Run the HISE editor tests from a separate Script Processor that only imports the test harness:

```javascript
include("InlayModule/Test.js");
```

The import executes the test suite and prints the results to the HISE console. Keep this test Script Processor separate from the plugin's normal interface script so the test harness is not included in production builds.

## Core Concept

InlayModule protects a plugin by requiring a valid local access token before the plugin becomes usable. The access token is bound to the current product and device, can be reused offline until expiry, and is refreshed periodically after a successful unlock.

The plugin has three runtime states:

| Status | Meaning |
| --- | --- |
| `activation_required` | No usable identity is available. The user must activate in the browser. |
| `unlocking` | A previous identity exists, but access must be requested or refreshed before use. |
| `unlocked` | Local access is valid and the plugin can be used. |

The unlocker exposes these states through `statusBroadcaster`. The default UI listens to that broadcaster and overlays the plugin while it is locked.

Expansion protection is an additional layer. Each expansion is treated as a sub-product with its own Inlay product ID. The expansion can be physically installed on disk, but the plugin should only expose it as usable after `checkExpansion()` returns `locked: false`, or after `unlockExpansion()` successfully obtains expansion access.

This is a runtime access-control layer. It should be combined with HISE's protected expansion packaging. For release builds, use HISE's `ExpansionHandler.setAllowedExpansionTypes()` to reject weaker expansion formats that should not be loadable in production.

## Installation In A HISE Script

Include the module after your base UI/framework code:

```javascript
include("InlayModule/Unlocker.js");
include("InlayModule/Ui.js");
```

Create the unlocker once during script initialisation:

```javascript
var unlocker = InlayUnlocker.create({
    productId: "YOUR_INLAY_PRODUCT_ID",
    publicKey: "YOUR_COMPANY_PUBLIC_KEY"
});
```

Create the default Inlay UI after the rest of the plugin UI so it can stay above the plugin controls:

```javascript
InlayUi.create(unlocker);
```

Start the protection flow after listeners and UI are attached:

```javascript
unlocker.startup();
```

Minimal expected order:

```javascript
include("InlayModule/Unlocker.js");
include("InlayModule/Ui.js");

// Build the normal plugin UI first.

var unlocker = InlayUnlocker.create({
    productId: "YOUR_INLAY_PRODUCT_ID",
    publicKey: "YOUR_COMPANY_PUBLIC_KEY"
});

InlayUi.create(unlocker);
unlocker.startup();
```

## Configuration

`InlayUnlocker.create(config)` accepts:

| Field | Required | Meaning |
| --- | --- | --- |
| `productId` | Yes | Inlay product ID for the host plugin. |
| `publicKey` | Yes | Public key used to verify Inlay access tokens. |
| `apiUrl` | No | API base URL. Defaults to production. Use only for development or staging. |
| `test` | No | Test flag reserved for editor/test usage. Defaults to false. |

Do not reuse a plugin `productId` for expansions. Each protected expansion should have its own Inlay product ID and be linked to the host product in Inlay.

## Public Constants

The `InlayUnlocker` namespace defines status constants:

```javascript
InlayUnlocker.STATUS_ACTIVATION_REQUIRED
InlayUnlocker.STATUS_UNLOCKING
InlayUnlocker.STATUS_UNLOCKED
```

Use these constants instead of hard-coded strings when possible.

## Public Broadcasters

The unlocker object returned by `InlayUnlocker.create()` exposes three broadcasters.

### `unlocker.statusBroadcaster`

Broadcasts plugin protection status changes.

Arguments:

| Argument | Type | Meaning |
| --- | --- | --- |
| `status` | string | One of `activation_required`, `unlocking`, or `unlocked`. |

Use it to block/unblock custom UI, pause protected behaviours, or update status indicators.

```javascript
unlocker.statusBroadcaster.addListener(
    "myStatusListener",
    "myStatusListener",
    function(status)
    {
        local locked = status != InlayUnlocker.STATUS_UNLOCKED;
        // Hide or disable protected controls here.
    }
);
```

### `unlocker.activationErrBroadcaster`

Broadcasts activation errors from the browser activation flow.

Arguments:

| Argument | Type | Meaning |
| --- | --- | --- |
| `error` | string | Empty string when cleared, otherwise user-displayable error text. |

Use it if you build a custom activation screen instead of `InlayUi.create()`.

### `unlocker.unlockingErrBroadcaster`

Broadcasts errors while exchanging an existing identity for current plugin access.

Arguments:

| Argument | Type | Meaning |
| --- | --- | --- |
| `error` | string | Empty string when cleared, otherwise user-displayable error text. |

Use it to show Retry / Logout controls in a custom unlocking screen.

## Public Unlocker Methods

### `InlayUnlocker.create(config)`

Creates the unlocker object.

Call once during script initialisation. The module stores one active unlocker instance internally, so creating multiple unlockers in the same script is unsupported.

Returns the unlocker object documented below.

### `unlocker.startup()`

Starts the plugin protection flow.

Call once after:

1. the unlocker has been created,
2. status/error listeners have been attached,
3. the default or custom lock UI has been created.

`startup()` loads the local identity/access state and broadcasts one of:

- `activation_required` if the user must activate,
- `unlocking` if the module must request access using a saved identity,
- `unlocked` if local access is already valid.

When `unlocking` is broadcast, the unlocker automatically requests current access. You do not need to call a separate method.

### `unlocker.startActivation()`

Starts the browser-based activation flow for the host plugin.

Call this from an Activate button if you build custom UI. The default `InlayUi` already calls it.

The method:

1. clears the previous activation error,
2. asks Inlay to start activation for the current product/device,
3. opens the user's browser,
4. polls until activation completes or fails.

When activation completes successfully, the unlocker validates the returned access and broadcasts `unlocked`.

### `unlocker.retryUnlocking()`

Retries host-plugin unlocking after an unlocking error.

Call this from a Retry button while the status is `unlocking` and `unlockingErrBroadcaster` has a non-empty error. The default `InlayUi` already wires this button.

Calls outside that state are ignored.

### `unlocker.logout()`

Clears local identity/access state and returns the plugin to `activation_required`.

Call this when the user explicitly wants to sign out, switch account, or recover from an invalid saved identity. It removes local token contents used by the unlocker and broadcasts `activation_required`.

### `unlocker.isLocked()`

Returns `true` unless the current status is `unlocked`.

Use this for simple guards in code paths that should not run while the plugin is locked. Prefer `statusBroadcaster` for UI state because it reacts immediately to changes.

```javascript
if (unlocker.isLocked())
    return;
```

### `unlocker.getCurrentUser()`

Returns the email address for the currently validated access token.

Returns `undefined` when the plugin has not validated local access yet, or when the access token does not contain a user email.

Use this for account labels, support links, or sign-out/account-switch UI. Do not treat it as an unlock guard; use `isLocked()` or `statusBroadcaster` for access state.

```javascript
local currentUser = unlocker.getCurrentUser();

if (isDefined(currentUser))
    Console.print("Activated as " + currentUser);
```

### `unlocker.getAppUpdate()`

Returns host-plugin update information.

The unlocker loads cached update information from local storage during `startup()`.
Successful activation and access refresh responses can replace that cached value when Inlay returns newer update information.

Returns `undefined` when:

- no update information is available,
- the available update version was skipped with `skipCurrentAppUpdateVersion()`.

Otherwise returns:

| Field | Type | Meaning |
| --- | --- | --- |
| `version` | string | Available host-plugin version reported by Inlay. |
| `url` | string | Download URL for the available host-plugin update. |

```javascript
local appUpdate = unlocker.getAppUpdate();

if (isDefined(appUpdate))
    Console.print("Update available: " + appUpdate.version + " - " + appUpdate.url);
```

### `unlocker.skipCurrentAppUpdateVersion()`

Persists the currently available host-plugin update version as skipped.

Call this after the user dismisses or chooses to ignore an update prompt. After this method stores the version, `getAppUpdate()` returns `undefined` for that same available update version. If Inlay later reports a different update version, `getAppUpdate()` can return that newer update.

Calling this method when `getAppUpdate()` is already `undefined` does nothing.

```javascript
local appUpdate = unlocker.getAppUpdate();

if (isDefined(appUpdate))
    unlocker.skipCurrentAppUpdateVersion();
```

### `unlocker.checkExpansion(expansion)`

Checks whether an installed expansion is currently unlocked. 
Can be called only after the host is unlocked itself.

Parameter:

| Parameter | Type | Meaning |
| --- | --- | --- |
| `expansion` | HISE Expansion object | Expansion returned by HISE's `ExpansionHandler`. |

Returns:

| Return field | Type | Meaning |
| --- | --- | --- |
| `id` | string | Inlay product ID for this expansion. |
| `locked` | boolean | `true` when no valid cached access exists for this expansion. |
| `updateUrl` | string | Non-empty when update information is available. |

Returns `undefined` if the expansion does not expose an Inlay product ID.

The expansion product ID is read from:

```javascript
expansion.getProperties().InlayProductID
```

Call this when building an expansion browser, after refreshing HISE expansions, and before allowing a user to select/load protected expansion content.

Example:

```javascript
const var expHandler = Engine.createExpansionHandler();

for (e in expHandler.getExpansionList())
{
    local state = unlocker.checkExpansion(e);

    if (state == undefined)
        continue; // Not an Inlay-protected expansion.

    if (state.locked)
    {
        // Show as locked and offer an Unlock button.
    }
    else
    {
        // Show as available.
    }
}
```

### `unlocker.setExpansionUnlockingCallback(callback)`

Registers the callback used by `unlocker.unlockExpansion()`.

Call once before the user can start unlocking expansions.

Callback payload:

| Field | Type | Meaning |
| --- | --- | --- |
| `id` | string | Inlay product ID of the expansion that was being unlocked. |
| `name` | string | Display name of the expansion that was being unlocked. |
| `locked` | boolean | `false` when the expansion is now usable. |
| `updateUrl` | string | Optional update URL returned with expansion access. |
| `error` | string | Optional user-displayable error. |
| `canceled` | boolean | `true` if `cancelExpansionUnlocking()` canceled the flow. |

Example:

```javascript
unlocker.setExpansionUnlockingCallback(function(result)
{
    if (result.canceled)
        return;

    if (result.error != undefined && result.error != "")
    {
        // Show error.
        return;
    }

    if (!result.locked)
    {
        // Mark expansion available and refresh your expansion UI.
    }
});
```

### `unlocker.unlockExpansion(expansion)`

Starts the unlock flow for one expansion.

Parameter:

| Parameter | Type | Meaning |
| --- | --- | --- |
| `expansion` | HISE Expansion object | Expansion to unlock. Must expose `InlayProductID`. |

If another expansion is already being unlocked, the method logs and returns without starting a second flow.

The method first checks whether the current activated user already has access to the expansion. If access is available, the expansion token is cached and the expansion callback is called. If additional activation/purchase/account confirmation is required, the browser is opened and the module polls until the flow completes.

Only call this after the host plugin itself is unlocked. Expansion access depends on the host plugin identity.

### `unlocker.cancelExpansionUnlocking()`

Requests cancellation of the current expansion unlock attempt.

Call this from a Cancel button in custom expansion unlock UI. Cancellation is observed by the polling flow and the registered expansion callback receives:

```javascript
{
    id: "...",
    name: "...",
    locked: true,
    canceled: true
}
```

If no expansion is currently being unlocked, the method does nothing.

## Public UI Method

### `InlayUi.create(unlocker)`

Creates the default full-plugin lock overlay.

Call this after the normal plugin UI has been created. The root panel is placed at `AlwaysOnTop`, so creating it late ensures it covers the plugin controls while locked.

The default UI:

- shows an Activate button while status is `activation_required`,
- shows an Unlocking panel while status is `unlocking`,
- exposes Retry and Logout buttons after unlocking errors,
- fades away when status becomes `unlocked`.

Use this for a quick integration. Build custom UI if you need branded activation screens, custom placement, or expansion-specific unlock screens.

## HISE Expansion Protection Flow

Use InlayModule together with HISE's expansion APIs.

HISE integration points:

- `Engine.createExpansionHandler()` creates the expansion handler.
- `ExpansionHandler.getExpansionList()` returns installed/available expansions.
- `ExpansionHandler.refreshExpansions()` rescans expansions after installation.
- `ExpansionHandler.setAllowedExpansionTypes([...])` restricts what expansion formats can load.
- `ExpansionHandler.setCredentials(...)`, `encodeWithCredentials(...)`, and `installExpansionFromPackage(...)` are useful if you adopt HISE encrypted expansions with user credentials.

Recommended release policy:

```javascript
const var expHandler = Engine.createExpansionHandler();

expHandler.setAllowedExpansionTypes([
    expHandler.Intermediate,
    expHandler.Encrypted
]);
```

During development you may allow file-based expansions for convenience. In production, only allow the protected formats you actually ship.

Each Inlay-protected expansion must include an `InlayProductID` property in its HISE expansion properties. That ID is the Inlay product ID for the expansion/sub-product, not the host plugin product ID.

Typical expansion browser flow:

1. Create `expHandler` and `unlocker` during plugin startup.
2. Restrict allowed expansion types for the build.
3. After `unlocker` reaches `unlocked`, call `expHandler.getExpansionList()`.
4. For each expansion, call `unlocker.checkExpansion(e)`.
5. If `checkExpansion(e)` returns `undefined`, decide whether your product allows non-Inlay expansions.
6. If it returns `{ locked: false }`, show the expansion as available.
7. If it returns `{ locked: true }`, show the expansion as installed but locked.
8. On Unlock, call `unlocker.unlockExpansion(e)`.
9. In the expansion callback, refresh the expansion UI and allow the expansion if `locked` is false.

Example:

```javascript
const var expHandler = Engine.createExpansionHandler();

unlocker.setExpansionUnlockingCallback(function(result)
{
    if (result.canceled)
        return;

    if (result.error != undefined && result.error != "")
    {
        // Show result.error.
        return;
    }

    if (!result.locked)
    {
        expHandler.refreshExpansions();
        // Rebuild expansion browser state.
    }
});

inline function onExpansionUnlockButton(expansion)
{
    if (unlocker.isLocked())
        return;

    unlocker.unlockExpansion(expansion);
}
```

## Host Plugin Protection Flow

Use this sequence for the host plugin:

1. Build normal plugin UI.
2. Include `Unlocker.js` and optional `Ui.js`.
3. Create the unlocker with host `productId` and company `publicKey`.
4. Attach listeners to `statusBroadcaster`, `activationErrBroadcaster`, and `unlockingErrBroadcaster` if you use custom UI.
5. Create `InlayUi` or your custom lock UI.
6. Call `unlocker.startup()`.
7. Keep protected UI/functionality disabled unless status is `unlocked`.

The default UI handles activation, retry, and logout for the host plugin. If you build custom UI:

- Activate button calls `unlocker.startActivation()`.
- Retry button calls `unlocker.retryUnlocking()`.
- Logout button calls `unlocker.logout()`.
- UI visibility follows `unlocker.statusBroadcaster`.

Do not call lower-level request or polling methods directly. They are implementation details of the unlocker state machine.

## Expansion Unlocking Flow

Expansion unlocking requires the host plugin to already be unlocked.

Use this sequence:

1. User installs or reveals an expansion.
2. HISE detects it through `ExpansionHandler`.
3. Your expansion browser calls `unlocker.checkExpansion(expansion)`.
4. If locked, show an Unlock action.
5. Unlock action calls `unlocker.unlockExpansion(expansion)`.
6. If the user's account already has access, the callback returns unlocked.
7. If further activation is required, the browser flow opens.
8. If the flow succeeds, the callback returns unlocked.
9. If the user cancels, call `unlocker.cancelExpansionUnlocking()`.

The callback registered with `setExpansionUnlockingCallback()` is the only supported completion signal for expansion unlocking.

## Custom UI Guidance

The module does not force you to use `InlayUi`. For branded UI:

- Use `statusBroadcaster` as the source of truth for host plugin lock state.
- Use `activationErrBroadcaster` for activation-screen errors.
- Use `unlockingErrBroadcaster` for unlocking-screen errors.
- Keep an overlay or disabled state active while `unlocker.isLocked()` is true.
- Keep expansion unlock UI separate from host activation UI.

Avoid storing your own copy of lock state unless it is updated from the broadcasters.

## Offline And Refresh Behaviour

After successful activation, local access is reused while valid. The unlocker schedules a refresh check after reaching `unlocked`. If local access is fresh enough, the plugin stays unlocked without network interaction. If the local access is old enough to refresh, the unlocker asks Inlay for current access in the background.

If refresh fails due to temporary network/server problems, the current valid local access remains the practical fallback until expiry. If the saved identity is invalid or no longer accepted, the unlocker logs out and returns to activation.

Expansion access is cached separately per expansion product ID. `checkExpansion()` validates that cached expansion access against the current device and expansion product ID.
