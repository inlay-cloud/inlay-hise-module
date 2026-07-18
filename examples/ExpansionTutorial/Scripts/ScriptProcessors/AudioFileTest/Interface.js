Content.makeFrontInterface(700, 600);

const var SlotSelectors = [Content.getComponent("FirstSlotSelector"),
                           Content.getComponent("SecondSlotSelector")];

const var AudioLoopPlayers = [Synth.getAudioSampleProcessor("Audio Loop Player1"),
                              Synth.getAudioSampleProcessor("Audio Loop Player2")]

const var PlayButtons = [Content.getComponent("PlayButton1"),
                         Content.getComponent("PlayButton2")];


const var expHandler = Engine.createExpansionHandler();
const var allList = [];
const var audioEntries = [];

// This loads all files from the project folder and returns a list of references
const var rootList = Engine.loadAudioFilesIntoPool();

inline function refreshAudioFileSelectors()
{
    allList.clear();
    audioEntries.clear();

    allList.push("no file");
    audioEntries.push({ type: "file", reference: "" });

    for (r in rootList)
    {
        allList.push(r.split("}")[1]);
        audioEntries.push({ type: "file", reference: r });
    }

    for (e in ExpansionProtection.getExpansionList())
    {
        if (ExpansionProtection.getState(e).locked)
        {
            allList.push(ExpansionProtection.getDisplayName(e));
            audioEntries.push({ type: "locked", expansion: e });
            continue;
        }

        for (af in e.getAudioFileList())
        {
            allList.push(af.split("}")[1]);
            audioEntries.push({ type: "file", reference: af });
        }
    }

    for (s in SlotSelectors)
        s.set("items", allList.join("\n"));
}



inline function onSlotSelectorControl(component, value)
{
    local index = SlotSelectors.indexOf(component);

    if (value == 0)
        return;

    if(value != 0)
    {
        local entry = audioEntries[value - 1];

        if (entry.type == "locked")
        {
            ExpansionProtection.requestAccess(entry.expansion);
            return;
        }

	    AudioLoopPlayers[index].setFile(entry.reference);
    }
};

const var numbers = [64, 48];
const var ids = [-1, -1];

inline function onPlayButtonControl(component, value)
{
    local index = PlayButtons.indexOf(component);

    if(value )
    {
        ids[index] = Synth.playNote(numbers[index], 127);
    }
    else
    {
        Synth.noteOffByEventId(ids[index]);
        ids[index] = -1;
    }
};

for(pb in PlayButtons)
    pb.setControlCallback(onPlayButtonControl);

for(s in SlotSelectors)
    s.setControlCallback(onSlotSelectorControl);

// creates and startups an InlayUnlocker instance, creates default InlayUi
include("InlayIntegration.js");
ExpansionProtection.setRefreshCallback(refreshAudioFileSelectors);


function onNoteOn()
{

}
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
