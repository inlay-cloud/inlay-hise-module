Content.makeFrontInterface(1024, 768);

// Creates and starts the shared Inlay unlocker before this processor refers
// to its expansion-protection helpers.
include("InlayIntegration.js");


// Setup the expansion list in the combobox

const var expHandler = Engine.createExpansionHandler();

const var ExpansionSelector = Content.getComponent("ExpansionSelector");
const var expansionOptions = [];

inline function refreshExpansionSelector()
{
    expansionOptions.clear();
    expansionOptions.push(undefined);

    local names = ["No Expansion"];

    for (e in ExpansionProtection.getExpansionList())
    {
        expansionOptions.push(e);
        names.push(ExpansionProtection.getDisplayName(e));
    }

    ExpansionSelector.set("items", names.join("\n"));
}

// Implement the expansion switch

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
};

Content.getComponent("ExpansionSelector").setControlCallback(onExpansionSelectorControl);


// Implement the loading callbac6k that swaps the background image

const var Image1 = Content.getComponent("Image1");

const var Panel2 = Content.getComponent("Panel2");


function refreshImage(newExpansion)
{
    var backgroundImage = "";
    var panelImage = "";

    if (isDefined(newExpansion)
        && !ExpansionProtection.requestAccess(newExpansion))
    {
        expHandler.setCurrentExpansion("");
        return;
    }

    if(isDefined(newExpansion))
    {
        backgroundImage = newExpansion.getWildcardReference("background.png");
        panelImage = newExpansion.getWildcardReference("panel_bg.png");
    }
    else
    {
        backgroundImage = "{PROJECT_FOLDER}background.png";
        panelImage = "{PROJECT_FOLDER}panel_bg.png";
    }

    Console.print(backgroundImage);

    Image1.set("fileName", backgroundImage);

    Panel2.loadImage(panelImage, "bg");
    Panel2.setImage("bg", 0, 0);
    Panel2.repaint();
}

expHandler.setExpansionCallback(refreshImage);

// Call it once with undefined so that it loads the root images
refreshImage(undefined);function onNoteOn()
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
