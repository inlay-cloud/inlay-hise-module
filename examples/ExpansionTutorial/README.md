# ExpansionTutorial: Inlay-protected expansions

This tutorial now demonstrates how to protect individual expansions with the
Inlay unlocker that already protects the main product. The protection code is
shared by the interface processors so the example stays small and consistent.

## Behaviour

- Only expansions recognised by `inlayUnlocker.checkExpansion()` are shown.
  An expansion without an Inlay product ID is therefore hidden.
- A locked expansion remains visible, but its name is suffixed with
  `(locked)`.
- Selecting a locked expansion does not load its image, audio, MIDI, sample
  map, or user-preset content. Instead, it opens the shared unlock dialog.
- Activating the dialog calls `unlockExpansion()` for the selected expansion.
  The dialog switches to an unlocking-progress message while the request is
  in flight.
- The dialog can be closed while unlocking. Closing it calls
  `cancelExpansionUnlocking()`.
- The dialog closes and every processor refreshes its expansion list when the
  corresponding result is reported by the unlocker.

## Changed files

`Scripts/InlayIntegration.js` creates the existing main-product unlocker,
creates the standard Inlay UI, then initialises `ExpansionProtection` with the
same unlocker. It remains the one shared include file for the interface
processors.

`Scripts/ExpansionProtection.js` contains the shared expansion-specific
behaviour:

- querying expansion entitlement state;
- filtering expansions without IDs;
- generating locked display names;
- guarding expansion access before content is loaded;
- presenting and managing the shared unlock dialog; and
- refreshing registered processor UI after account or expansion status
  changes.

The following processors use this helper for their expansion selectors and
load guards:

- `Scripts/ScriptProcessors/AudioFileTest/Interface.js`
- `Scripts/ScriptProcessors/ImageTest/Interface.js`
- `Scripts/ScriptProcessors/MidiFileTest/Interface.js`
- `Scripts/ScriptProcessors/SampleMapTest/Interface.js`
- `Scripts/ScriptProcessors/UserPresetTest/Interface.js`

`XmlPresetBackups/UserPresetTestUIData/UserPresetTestDesktop.xml` disables the
built-in expansion column. `UserPresetTest` supplies its own protected
selector instead, so locked expansions follow the same rules as the other
processors.

## Integration pattern

An interface processor includes `InlayIntegration.js`, registers a refresh
function with `ExpansionProtection.setRefreshCallback()`, builds its selector
from `ExpansionProtection.getExpansionList()`, and calls
`ExpansionProtection.requestAccess(expansion)` immediately before loading
expansion content. A `false` result means the expansion is unavailable or
locked and the processor must stop loading content.

This is demonstration code. A production integration can customise the UI and
product configuration, while retaining the same access guard before each
expansion load.
