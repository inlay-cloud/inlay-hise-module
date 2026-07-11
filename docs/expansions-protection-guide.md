# Expansion Protection Guide

This guide explains how to protect HISE expansions with Inlay. It builds on the host-plugin activation, local token validation, and lock-state concepts in the [module overview](module-overview.md#basic-concepts); integrate and unlock the main plugin first.

## Protection Model

Inlay treats the plugin and each protected expansion as separate products:

| Inlay product | HISE location | What it protects |
| --- | --- | --- |
| Main product | `InlayUnlocker.create({ productId: ... })` | The host plugin and its base experience. |
| Subproduct | Expansion `InlayProductID` property | One installed expansion. |

The host plugin must be unlocked before expansion access can be checked or requested. An expansion being installed only means HISE can find it on disk; it becomes usable only when the active user's valid expansion access is available.

Create one Inlay subproduct for every paid or protected expansion. Do not reuse the host plugin's product ID. Separate subproducts let Inlay grant and maintain access independently per expansion.

## How Expansion Access Is Protected

### Local access check

After the host reaches `STATUS_UNLOCKED`, call `unlocker.checkExpansion(e)` for every installed expansion shown by the expansionHandler. This is a local check: it does not call the Inlay server and never opens a browser.

The module reads the expansion's cached access entry and accepts it only when all of the following hold:

- the expansion has a valid Inlay product ID;
- its cached version matches the expansion's current `Version` property;
- the cached token validates with the company public key for that expansion product and the current device;
- the token belongs to the same user as the unlocked host plugin.

If any check fails, the expansion is reported as locked. Treat that as an access decision, not an installation error: show an Unlock action and do not load the expansion's samples, presets, UI, or other protected content.

### Requesting expansion access

Call `unlocker.unlockExpansion(e)` after the user chooses to unlock a locked expansion. The module sends the current host identity and expansion metadata to the Inlay server. Inlay is the authority that determines whether that user currently has access to the requested subproduct.

There are two possible outcomes:

| Server response | Module behaviour | Browser |
| --- | --- | --- |
| Current access can be issued immediately | Stores and locally validates the returned expansion token, then calls the completion callback. | Not opened. |
| Further user action is required | Opens the activation URL returned by Inlay and polls until the server reports completion. | Opened. |

In other words, pressing an expansion Unlock button always makes a server request, but it launches a browser only when Inlay returns an activation flow. A successful browser flow returns current expansion access, which the module stores and validates before reporting the expansion as unlocked.

Only one expansion unlock flow may be active at a time. Additional `unlockExpansion(...)` calls are ignored until the active flow finishes or is cancelled.

### Cache and server responsibilities

Inlay issues the identity and expansion access used by the module, and decides whether activation or other user action is needed. The module stores expansion access separately for each subproduct and performs the local checks above before allowing use. If an expansion's `Version` changes, its previous cached access is treated as locked until access is obtained again.

Logging out of the host plugin clears the host and expansion access cache. The next user must unlock the host again before expansion access can be evaluated.

## Configure Products and Expansion Metadata

Use the main product ID and company public key only in the host unlocker configuration:

```javascript
include("Inlay/Unlocker.js");

const var unlocker = InlayUnlocker.create({
    productId: "MAIN_PLUGIN_INLAY_PRODUCT_ID",
    publicKey: "COMPANY_PUBLIC_KEY"
});
```

Each protected expansion must declare its own Inlay subproduct ID. Prefer a direct expansion property:

```text
InlayProductID=EXPANSION_INLAY_PRODUCT_ID
```

The module reads this value from:

```javascript
expansion.getProperties().InlayProductID
```

If an expansion format can only supply tags, use this tag instead:

```text
Tags=Factory,InlayProductID=EXPANSION_INLAY_PRODUCT_ID,Drums
```

When both are present, the direct property takes precedence. Keep the expansion's `Name` and `Version` properties accurate: Inlay includes them in access requests, and a version change invalidates the previous local expansion access.

## Integrate the Expansion Browser

Create the HISE expansion handler and register project listeners before `startup()`. The main-plugin setup and host UI behaviour are covered in the [module overview](module-overview.md#basic-integration).

```javascript
const var expHandler = Engine.createExpansionHandler();

const var unlocker = InlayUnlocker.create(InlayConfig.unlocker);

unlocker.statusBroadcaster.addListener(
    "project.hostUnlock",
    "project.hostUnlock",
    onHostUnlockStatus
);

unlocker.setExpansionUnlockingCallback(onExpansionUnlockFinished);

unlocker.startup();
```

Call `startup()` last. It can immediately publish the host status, and `checkExpansion()` is only valid after that status becomes `STATUS_UNLOCKED`.

When the host unlocks, classify each installed expansion:

```javascript
inline function onHostUnlockStatus(status)
{
    if (status == InlayUnlocker.STATUS_UNLOCKED)
        refreshExpansionAccess();
}

inline function refreshExpansionAccess()
{
    for (e in expHandler.getExpansionList())
    {
        local state = unlocker.checkExpansion(e);

        if (!isDefined(state))
            markExpansionUnsupported(e);
        else if (state.locked)
            markExpansionLocked(e);
        else
            markExpansionAvailable(e, state.updateUrl);
    }
}
```

`checkExpansion(e)` returns:

| Result | Meaning |
| --- | --- |
| `undefined` | The expansion does not expose a valid Inlay product ID, or the host is still locked. |
| `{ id: ..., locked: true }` | No valid local access exists for this expansion, user, device, and version. |
| `{ id: ..., locked: false, updateUrl: ... }` | The expansion is available. `updateUrl` is optional. |

Choose an explicit policy for expansions without an Inlay ID: mark them unsupported, hide them, or allow them as unprotected content. Do not silently treat an unknown protected expansion as unlocked.

## Prevent Loading Locked Content

Gate selection and content loading on the host lock state and `checkExpansion()` result:

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

Apply the same guard in an expansion callback or any alternate selection path. A preset browser, dropdown, or HISE callback must not bypass the UI's initial lock check.

## Unlock an Expansion

Register one completion callback before a user can press an Unlock button:

```javascript
unlocker.setExpansionUnlockingCallback(onExpansionUnlockFinished);
```

Start the flow from the expansion browser:

```javascript
inline function unlockExpansion(e)
{
    if (unlocker.isLocked())
        return;

    showExpansionUnlockProgress(e);
    unlocker.unlockExpansion(e);
}
```

Update the UI only from the completion callback:

```javascript
inline function onExpansionUnlockFinished(result)
{
    local e = findExpansionByName(result.name);

    if (result.canceled)
    {
        showExpansionLocked(e);
        return;
    }

    if (result.error != undefined && result.error != "")
    {
        showExpansionUnlockError(e, result.error);
        return;
    }

    if (result.locked)
    {
        showExpansionLocked(e);
        return;
    }

    refreshExpansionAccess();
    expHandler.setCurrentExpansion(result.name);
}
```

Use `unlocker.cancelExpansionUnlocking()` for a Cancel button. It ends the active flow and reports `result.canceled` through the same callback. Do not call the module's internal request, polling, or token functions.

## HISE Packaging

Inlay enforces runtime entitlement; HISE packaging controls which expansion formats the plugin accepts from disk. Use both layers. For release builds, allow only the protected formats you ship:

```javascript
expHandler.setAllowedExpansionTypes([
    expHandler.Intermediate,
    expHandler.Encrypted
]);
```

During development, you may also allow `expHandler.FileBased`. If you ship only encrypted packages, restrict release builds to `expHandler.Encrypted`.

## Checklist

1. Create one Inlay main product and one subproduct for each protected expansion.
2. Configure the host unlocker with the main product ID and company public key.
3. Add each expansion's own `InlayProductID` and maintain its `Version`.
4. Wait for host `STATUS_UNLOCKED`, then use `checkExpansion()` to classify installed expansions.
5. Never load content from a locked expansion.
6. Call `unlockExpansion()` only from an explicit user action and handle results through `setExpansionUnlockingCallback()`.
7. Use `cancelExpansionUnlocking()` only to cancel the active expansion flow.
8. Restrict HISE expansion types in release builds.
