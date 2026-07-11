# InlayModule Expansion Protection Guide

This guide focuses on protecting a HISE product that has a main plugin plus optional subproducts, usually expansions. The main plugin and every protected expansion must be represented as separate Inlay products.

Use `guide.md` for the shortest host-plugin integration path. Use this document when the plugin has an expansion browser, protected expansion packages, or a custom unlock experience for expansions.

## Product Model

Create this structure in Inlay:

| Inlay product | Where it is used in HISE | Purpose |
| --- | --- | --- |
| Main product | `InlayUnlocker.create({ productId: ... })` | Unlocks the host plugin itself. |
| Expansion / subproduct | HISE expansion property `InlayProductID` | Unlocks one installed expansion. |

Do not reuse the main product ID for expansions. Each paid or protected expansion needs its own Inlay product ID so access can be granted, cached, refreshed, and revoked independently.

The company public key is shared by the main product and expansions. Put the public key in the unlocker config. Do not put the public key into expansion metadata.

## Where Product IDs Go

### Main Plugin Product ID

The main product ID belongs in the unlocker config used by the interface script:

```javascript
namespace ProjectInlay
{
    const var unlockerConfig = {
        productId: "MAIN_PLUGIN_INLAY_PRODUCT_ID",
        publicKey: "COMPANY_PUBLIC_KEY"
    };
}
```

Then create exactly one unlocker instance:

```javascript
include("InlayModule/Unlocker.js");
include("InlayModule/Ui.js");

const var unlocker = InlayUnlocker.create(ProjectInlay.unlockerConfig);
```

This ID protects the plugin shell: the normal UI, audio processing, preset browser, and expansion browser should remain blocked or disabled until the host unlocker reaches `InlayUnlocker.STATUS_UNLOCKED`.

### Expansion Product IDs

Each protected expansion must expose its own Inlay product ID through its HISE expansion properties. The preferred property is:

```text
InlayProductID=EXPANSION_INLAY_PRODUCT_ID
```

`InlayModule` reads it as:

```javascript
expansion.getProperties().InlayProductID
```

There is also a fallback for expansion metadata that can only carry tags:

```text
Tags=Factory,InlayProductID=EXPANSION_INLAY_PRODUCT_ID,Drums
```

The direct `InlayProductID` property wins if both are present. The ID must be the expansion subproduct ID from Inlay, not the main plugin product ID.

The module also uses the expansion `Name` and `Version` properties when requesting expansion access. Keep `Version` accurate. If an expansion version changes, old cached expansion access is treated as locked until access is refreshed.

## Startup Order

The important rule is: create listeners and lock UI before calling `unlocker.startup()`.

Recommended interface setup:

```javascript
Content.makeFrontInterface(1000, 710);

include("Project/config/prod.js");

// Build the regular plugin UI first.
include("RhapsodyBoilerplate/includes/Ui.js");
include("RhapsodyBoilerplate/includes/Expansions.js");

include("InlayModule/Unlocker.js");
include("InlayModule/Ui.js");

const var expHandler = Engine.createExpansionHandler();

expHandler.setAllowedExpansionTypes([
    expHandler.Intermediate,
    expHandler.Encrypted
]);

const var unlocker = InlayUnlocker.create(InlayConfig.unlocker);

unlocker.statusBroadcaster.addListener(
    "project.hostUnlock",
    "project.hostUnlock",
    onHostUnlockStatus
);

unlocker.setExpansionUnlockingCallback(onExpansionUnlockFinished);

InlayUi.create(unlocker);

unlocker.startup();
```

Call `startup()` last because it can immediately broadcast `activation_required`, `unlocking`, or `unlocked`. If the UI or project listeners are added after `startup()`, they can miss the state transition they need to react to.

## Host Plugin Lock State

Use `statusBroadcaster` as the source of truth for the main plugin.

```javascript
inline function onHostUnlockStatus(status)
{
    local unlocked = status == InlayUnlocker.STATUS_UNLOCKED;

    setMainUiEnabled(unlocked);

    if (unlocked)
        refreshExpansionAccess();
}
```

Expected reactions:

| Status | What the plugin should do |
| --- | --- |
| `InlayUnlocker.STATUS_ACTIVATION_REQUIRED` | Show activation UI. Keep protected controls and audio logic unavailable. |
| `InlayUnlocker.STATUS_UNLOCKING` | Show progress. Keep the plugin blocked. If an error arrives, show Retry and Logout actions. |
| `InlayUnlocker.STATUS_UNLOCKED` | Hide the blocking UI, enable the host plugin, then evaluate installed expansions. |

For one-off guards in callbacks, use:

```javascript
if (unlocker.isLocked())
    return;
```

Do not use expansion APIs before the host plugin is unlocked. Expansion access is checked against the currently activated user.

## Host Activation And Unlocking Errors

If you use `InlayUi.create(unlocker)`, the default overlay already listens to the host status and error broadcasters. Use the broadcasters directly only when you build custom activation UI or need to mirror state elsewhere in the plugin.

Attach these listeners before `unlocker.startup()`:

```javascript
unlocker.activationErrBroadcaster.addListener(
    "project.activationError",
    "project.activationError",
    onActivationError
);

unlocker.unlockingErrBroadcaster.addListener(
    "project.unlockingError",
    "project.unlockingError",
    onUnlockingError
);

inline function onActivationError(error)
{
    setActivationErrorText(error);
    setActivationRetryVisible(error != "");
}

inline function onUnlockingError(error)
{
    setUnlockingErrorText(error);
    setUnlockRetryVisible(error != "");
    setLogoutVisible(error != "");
}
```

Custom host UI should call only these public methods:

| User action | Method |
| --- | --- |
| Activate main plugin | `unlocker.startActivation()` |
| Retry failed host unlocking | `unlocker.retryUnlocking()` |
| Log out / switch account | `unlocker.logout()` |

## Expansion Browser State

The expansion browser should treat installed and unlocked as separate facts:

1. HISE tells you which expansions are installed.
2. InlayModule tells you which installed expansions are usable by the current user.

After the host unlocks, read the expansion list and check each expansion:

```javascript
inline function refreshExpansionAccess()
{
    for (e in expHandler.getExpansionList())
    {
        local state = unlocker.checkExpansion(e);

        if (!isDefined(state))
        {
            markExpansionUnsupported(e);
            continue;
        }

        if (state.locked)
        {
            markExpansionLocked(e);
            continue;
        }

        markExpansionAvailable(e, state.updateUrl);
    }
}
```

`checkExpansion(e)` can return:

| Result | Meaning |
| --- | --- |
| `undefined` | The expansion is not a valid Inlay-protected expansion, usually because no expansion product ID was found. |
| `{ id: ..., locked: true }` | The expansion exists, but this user/device/version has no valid cached access. |
| `{ id: ..., locked: false, updateUrl: ... }` | The expansion can be used. `updateUrl` is optional update information. |

If your product should only load Inlay-protected expansions, do not silently allow `undefined`. Show the item as unsupported, hide it, or ask the user to install the correct package.

## Prevent Loading Locked Expansions

Do not call `expHandler.setCurrentExpansion(...)`, load sample maps, load images, or reveal presets for a locked expansion. Gate those actions through a small helper:

```javascript
inline function canUseExpansion(e)
{
    if (unlocker.isLocked())
        return false;

    local state = unlocker.checkExpansion(e);

    return isDefined(state) && !state.locked;
}

inline function selectExpansion(e)
{
    if (!canUseExpansion(e))
    {
        showExpansionLocked(e);
        return;
    }

    expHandler.setCurrentExpansion(e.getProperties().Name);
}
```

If you use `expHandler.setExpansionCallback(...)`, keep it defensive too. Preset loading or a dropdown can change the current expansion through HISE, so the callback should reset or block project UI when the new expansion is not unlocked.

```javascript
inline function onHiseExpansionChanged(e)
{
    if (!isDefined(e))
    {
        showFactoryContent();
        return;
    }

    if (!canUseExpansion(e))
    {
        expHandler.setCurrentExpansion("");
        showExpansionLocked(e);
        return;
    }

    loadExpansionUi(e);
}

expHandler.setExpansionCallback(onHiseExpansionChanged);
```

## Unlocking An Expansion

Register the expansion unlock completion callback once during startup, before the user can press any expansion Unlock button:

```javascript
unlocker.setExpansionUnlockingCallback(onExpansionUnlockFinished);
```

Start unlocking from the expansion browser:

```javascript
inline function unlockExpansion(e)
{
    if (unlocker.isLocked())
        return;

    showExpansionUnlockProgress(e);
    unlocker.unlockExpansion(e);
}
```

Only one expansion unlock flow can run at a time. If a flow is active, additional `unlockExpansion(...)` calls are ignored until the callback fires or you cancel the active flow.

React to the callback result:

```javascript
inline function onExpansionUnlockFinished(result)
{
    local e = findExpansionByName(result.name);
    local name = result.name;

    if (result.canceled)
    {
        showExpansionLocked(e, name);
        return;
    }

    if (result.error != undefined && result.error != "")
    {
        showExpansionUnlockError(e, name, result.error);
        return;
    }

    if (result.locked)
    {
        showExpansionLocked(e, name);
        return;
    }

    refreshExpansionAccess();
    expHandler.setCurrentExpansion(name);
}
```

Use `unlocker.cancelExpansionUnlocking()` from a Cancel button in your expansion unlock UI. Cancellation is reported through the same callback with `canceled: true`.

Do not call internal request, polling, or token methods directly. The public expansion API is:

```javascript
unlocker.checkExpansion(e);
unlocker.unlockExpansion(e);
unlocker.cancelExpansionUnlocking();
unlocker.setExpansionUnlockingCallback(callback);
```

## HISE Expansion Packaging

InlayModule enforces runtime entitlement. HISE packaging enforces what the plugin is willing to load from disk. Use both.

During development, it is common to allow all expansion types:

```javascript
expHandler.setAllowedExpansionTypes([
    expHandler.FileBased,
    expHandler.Intermediate,
    expHandler.Encrypted
]);
```

For release builds, exclude file-based expansions unless you intentionally support them:

```javascript
expHandler.setAllowedExpansionTypes([
    expHandler.Intermediate,
    expHandler.Encrypted
]);
```

If the product ships only encrypted expansion packages, restrict release builds to encrypted expansions only:

```javascript
expHandler.setAllowedExpansionTypes([
    expHandler.Encrypted
]);
```

This prevents a user from bypassing your packaging model by loading a weaker expansion format. It does not replace Inlay checks, because a valid package can still belong to a subproduct the current user does not own.

## Account And Cache Behaviour

The host plugin access token and expansion access tokens are cached separately.

Host plugin cache:

- saved under InlayModule's app-data directory,
- validated against the main product ID and device ID,
- refreshed by the unlocker after a successful unlock.

Expansion cache:

- saved per expansion product ID,
- validated against expansion product ID, device ID, current user, and expansion version,
- invalidated if the expansion `Version` changes.

If the current user logs out with `unlocker.logout()`, the module clears host access and expansion access cache. The plugin should return to the host activation state and rebuild expansion UI after the next unlock.

## Integration Checklist

1. Create one Inlay main product for the plugin.
2. Create one Inlay subproduct for each protected expansion.
3. Use the main product ID in `InlayUnlocker.create(...)`.
4. Put each expansion product ID in the expansion's `InlayProductID` property, or in `Tags` as `InlayProductID=<id>` when a direct property is unavailable.
5. Build the normal UI before the blocking Inlay UI.
6. Register `statusBroadcaster`, error broadcasters if needed, `setExpansionUnlockingCallback(...)`, and `expHandler.setExpansionCallback(...)` before `unlocker.startup()`.
7. Call `unlocker.startup()` once, last.
8. Keep host functionality disabled until status is `InlayUnlocker.STATUS_UNLOCKED`.
9. After host unlock, call `unlocker.checkExpansion(e)` for every installed expansion.
10. Never load locked expansion content.
11. Start expansion unlocks with `unlocker.unlockExpansion(e)` and update UI only from the registered expansion callback.
12. Restrict HISE expansion types for release builds with `expHandler.setAllowedExpansionTypes(...)`.
