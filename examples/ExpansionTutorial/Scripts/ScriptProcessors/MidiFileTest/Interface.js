Content.makeFrontInterface(600, 500);

const var MIDIPlayer1 = Synth.getMidiPlayer("MIDI Player1");

inline function onPlayButtonControl(component, value)
{
	if(value)
	    MIDIPlayer1.play(0);
	else
	    MIDIPlayer1.stop(0);
};


const var MidiFileSelector = Content.getComponent("MidiFileSelector");

const var expHandler = Engine.createExpansionHandler();
const var midiEntries = [];

inline function refreshMidiFileSelector()
{
    midiEntries.clear();
    midiEntries.push({ type: "file", reference: "" });

    local items = ["Nothing"];

    for (f in MIDIPlayer1.getMidiFileList())
    {
        midiEntries.push({ type: "file", reference: f });
        items.push(f);
    }

    for (e in ExpansionProtection.getExpansionList())
    {
        if (ExpansionProtection.getState(e).locked)
        {
            midiEntries.push({ type: "locked", expansion: e });
            items.push(ExpansionProtection.getDisplayName(e));
            continue;
        }

        for (f in e.getMidiFileList())
        {
            midiEntries.push({ type: "file", reference: f });
            items.push(f);
        }
    }

    MidiFileSelector.set("items", items.join("\n"));
}



inline function onMidiFileSelectorControl(component, value)
{
    if (value == 0)
        return;

    local entry = midiEntries[value - 1];

    if (entry.type == "locked")
    {
        ExpansionProtection.requestAccess(entry.expansion);
        return;
    }

    MIDIPlayer1.setFile(entry.reference, true, true);
};

Content.getComponent("MidiFileSelector").setControlCallback(onMidiFileSelectorControl);


Content.getComponent("PlayButton").setControlCallback(onPlayButtonControl);

// creates and startups an InlayUnlocker instance, creates default InlayUi
include("InlayIntegration.js");
ExpansionProtection.setRefreshCallback(refreshMidiFileSelector);

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

