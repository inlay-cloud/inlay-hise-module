Content.makeFrontInterface(1024, 768);

// Creates and starts the shared Inlay unlocker before this processor refers
// to its expansion-protection helpers.
include("InlayIntegration.js");

const var expHandler = Engine.createExpansionHandler();
const var background = Content.getComponent("background");
const var ExpansionSelector = Content.addComboBox("ProtectedExpansionSelector", 40, 120);
const var expansionOptions = [];

// The built-in preset browser changes the expansion before its callback runs,
// so its expansion column is disabled in the UI data backup.

ExpansionSelector.set("parentComponent", background.getId());
ExpansionSelector.set("width", 360);
ExpansionSelector.set("height", 32);
ExpansionSelector.set("saveInPreset", false);

inline function refreshExpansionSelector()
{
    expansionOptions.clear();
    expansionOptions.push(undefined);

    local items = ["No Expansion"];

    for (e in ExpansionProtection.getExpansionList())
    {
        expansionOptions.push(e);
        items.push(ExpansionProtection.getDisplayName(e));
    }

    ExpansionSelector.set("items", items.join("\n"));
}

inline function onExpansionSelectorControl(component, value)
{
    if (value == 0)
        return;

    local expansion = expansionOptions[value - 1];

    if (!isDefined(expansion))
    {
        expHandler.setCurrentExpansion("");
        return;
    }

    if (ExpansionProtection.requestAccess(expansion))
        expHandler.setCurrentExpansion(expansion.getProperties().Name);
}

ExpansionSelector.setControlCallback(onExpansionSelectorControl);


inline function refreshExpansion(e)
{
    // Guard alternate paths such as a restored expansion selection. The
    // protected selector above prevents this path during normal interaction.
    if (isDefined(e) && !ExpansionProtection.requestAccess(e))
    {
        expHandler.setCurrentExpansion("");
        return;
    }

    if(!isDefined(e))
    {
        background.set("fileName", "{PROJECT_FOLDER}background.png");
    }
    else
    {
        background.set("fileName", e.getImageList()[0]);
    }
}

refreshExpansion(undefined);

expHandler.setExpansionCallback(refreshExpansion);function onNoteOn()
{

}

ExpansionProtection.setRefreshCallback(refreshExpansionSelector);

 function onNoteOff()
{

}
 function onController()
{

}
 function onTimer()
{

}
 function onControl(number, value)
{

}
