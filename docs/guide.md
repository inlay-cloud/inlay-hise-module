# Integrating InlayModule

This guide shows the minimal host-plugin integration for `InlayModule` in a HISE project. The module handles activation, local access validation, lock-state broadcasts, and the optional blocking activation UI.

## Files To Add

Copy the runtime module files into your project's `Scripts/InlayModule` folder:

```text
Scripts/InlayModule/Unlocker.js
Scripts/InlayModule/Ui.js
```

`Unlocker.js` is required. `Ui.js` is optional, but it gives you a ready-made overlay that blocks the plugin while activation or unlocking is required.

Do not include `Test.js` in a production interface script.

## Interface Script Setup

Pass the Inlay product configuration to `InlayUnlocker.create(...)`. The example below keeps the values inline, but they can also come from another include as long as they are available before the unlocker is created.

```javascript
const var unlocker = InlayUnlocker.create({
    productId: "YOUR_INLAY_PRODUCT_ID",
    publicKey: "YOUR_COMPANY_PUBLIC_KEY"
});
```

Create the unlocker once during script initialization. Copy `productId` and `publicKey` from the Project setup guide in the Inlay Console.

Build the normal plugin UI first, then create and start the unlocker. HISE includes should stay at top level, not inside another namespace.

```javascript
Content.makeFrontInterface(1000, 710);

// Include and create your normal plugin UI here.

include("InlayModule/Unlocker.js");
include("InlayModule/Ui.js");

const var unlocker = InlayUnlocker.create({
    productId: "YOUR_INLAY_PRODUCT_ID",
    publicKey: "YOUR_COMPANY_PUBLIC_KEY"
});

InlayUi.create(unlocker);
unlocker.startup();
```

Create `InlayUi` after your plugin UI so its root panel can stay above the plugin controls. Call `startup()` last, after any listeners and UI have been attached.

## Customising The Default UI

The default unlocker UI can be customised, but keep those changes outside `Scripts/InlayModule`. Treat `InlayModule/Ui.js` as the stock implementation and add project-specific styling or layout changes in your own project script.

A typical pattern is to create a wrapper that calls `InlayUi.create(...)` first, then adjusts the generated UI components:

```javascript
include("InlayModule/Ui.js");

namespace ProjectInlayUi
{
    inline function create(unlocker)
    {
        InlayUi.create(unlocker);

        local activationLabel = Content.getComponent("inlayActivationLabel");
        if (isDefined(activationLabel))
            activationLabel.set("text", "This plugin needs activation.");
    }
}
```

Then call the wrapper instead of `InlayUi.create(...)` from the interface script:

```javascript
ProjectInlayUi.create(unlocker);
unlocker.startup();
```

See `hise-experiments/KawaiiIchika/Scripts/InlayCustom` for a project-level example of this approach.

## Reacting To Lock State

The default UI is enough for a basic integration. If your project needs to pause custom behaviour while locked, listen to `statusBroadcaster`.

```javascript
unlocker.statusBroadcaster.addListener(
    "project.unlockState",
    "project.unlockState",
    onUnlockerStatusChanged
);

inline function onUnlockerStatusChanged(status)
{
    local isUnlocked = status == InlayUnlocker.STATUS_UNLOCKED;
    // Enable or disable project-specific controls here.
}
```

Use `InlayUnlocker.STATUS_UNLOCKED`, `InlayUnlocker.STATUS_UNLOCKING`, and `InlayUnlocker.STATUS_ACTIVATION_REQUIRED` instead of hard-coded status strings in project code.

For simple guards in callbacks, query the unlocker directly:

```javascript
if (unlocker.isLocked())
    return;
```

## Disabling Audio Processing While Locked

If your script uses `onAudioProcess`, return immediately while the plugin is locked. This prevents project-specific audio logic from running until access is valid.

```javascript
function onAudioProcess(buffer)
{
    if (unlocker.isLocked())
        return;

    // Process audio here.
}
```

## Custom Activation UI

If you do not use `InlayUi.create(unlocker)`, your UI needs to call the public unlocker methods itself:

```javascript
unlocker.startActivation();
unlocker.retryUnlocking();
unlocker.logout();
```

Use these broadcasters to display state and errors:

```javascript
unlocker.statusBroadcaster;
unlocker.activationErrBroadcaster;
unlocker.unlockingErrBroadcaster;
```

The expected flow is:

1. `startup()` broadcasts `activation_required`, `unlocking`, or `unlocked`.
2. In `activation_required`, call `startActivation()` from the user's Activate button.
3. In `unlocking`, show progress. If an error is broadcast, offer Retry and Logout actions.
4. In `unlocked`, hide the blocking UI and enable the plugin experience.

## Logout

If needed, add a Logout action to the plugin UI. Call `unlocker.logout()` from that action.

`logout()` clears the saved local identity and access state, then returns the plugin to `activation_required`.

```javascript
const var LogoutButton = Content.getComponent("LogoutButton");

inline function onLogoutButtonControl(component, value)
{
    if (!value)
        return;

    unlocker.logout();
}

LogoutButton.setControlCallback(onLogoutButtonControl);
```

## App Update Prompt

`InlayUi` already checks `unlocker.getAppUpdate()` when the host becomes unlocked. If you build custom UI, you can do the same:

```javascript
local updateInfo = unlocker.getAppUpdate();

if (isDefined(updateInfo))
    // Show update notification.
```

Use `updateInfo.url` as the target for the notification's Update button or link.

After the user dismisses a shown update version, call:

```javascript
unlocker.skipCurrentAppUpdateVersion();
```

## Integration Checklist

1. Add `Unlocker.js` and, if using the default overlay, `Ui.js`.
2. Provide `productId` and `publicKey` before creating the unlocker.
3. Create your plugin UI before creating the default Inlay UI.
4. Create exactly one unlocker instance.
5. Attach any project-specific listeners before calling `startup()`.
