// Shared expansion entitlement UI for the ExpansionTutorial interface processors.
// Product IDs belong in each expansion's expansion_info.xml (or Tags), not here.

const var ExpansionProtection = {
    unlocker: undefined,
    expHandler: Engine.createExpansionHandler(),
    states: [],
    refreshCallback: undefined,
    pendingExpansion: undefined,
    modalRoot: undefined,
    messageLabel: undefined,
    activateButton: undefined,
    cancelButton: undefined,

    create: function(unlocker)
    {
        this.unlocker = unlocker;
        this.createModal();
        unlocker.statusBroadcaster.addListener("expansionProtectionHostStatus", "expansionProtectionHostStatus", function[this](status) { this.onHostStatus(status); });
        unlocker.setExpansionUnlockingCallback(function[this](result) { this.onExpansionUnlockingFinished(result); });
        this.onHostStatus(unlocker.statusBroadcaster.status);
    },

    setRefreshCallback: function(callback)
    {
        this.refreshCallback = callback;
        this.refresh();
    },

    refresh: function()
    {
        this.states.clear();
        if (this.unlocker.isLocked())
        {
            this.notifyRefresh();
            return;
        }

        for (e in this.expHandler.getExpansionList())
        {
            var state = this.unlocker.checkExpansion(e);
            if (isDefined(state))
                this.states.push({ name: e.getProperties().Name, state: state });
        }

        this.notifyRefresh();
    },

    getExpansionList: function()
    {
        var protectedExpansions = [];
        for (e in this.expHandler.getExpansionList())
        {
            if (isDefined(this.getState(e)))
                protectedExpansions.push(e);
        }
        return protectedExpansions;
    },

    getDisplayName: function(e)
    {
        var name = e.getProperties().Name;
        var state = this.getState(e);
        return isDefined(state) && state.locked ? name + " (locked)" : name;
    },

    requestAccess: function(e)
    {
        var state = this.getState(e);
        if (!isDefined(state))
            return false;
        if (!state.locked)
            return true;
        this.showUnlockMessage(e);
        return false;
    },

    getState: function(e)
    {
        if (!isDefined(e))
            return undefined;

        var name = e.getProperties().Name;
        for (entry in this.states)
        {
            if (entry.name == name)
                return entry.state;
        }
        return undefined;
    },

    onHostStatus: function(status)
    {
        if (status == InlayUnlocker.STATUS_UNLOCKED)
            this.refresh();
        else
        {
            this.states.clear();
            this.notifyRefresh();
        }
    },

    notifyRefresh: function()
    {
        if (isDefined(this.refreshCallback))
            this.refreshCallback();
    },

    showUnlockMessage: function(e)
    {
        this.pendingExpansion = e;
        this.messageLabel.set("text", "Unlock " + e.getProperties().Name + "?");
        this.activateButton.set("visible", true);
        this.cancelButton.set("visible", true);
        this.modalRoot.set("visible", true);
    },

    showUnlockingProgress: function()
    {
        this.messageLabel.set("text", "Unlocking " + this.pendingExpansion.getProperties().Name + "...");
        this.activateButton.set("visible", false);
        this.cancelButton.set("visible", true);
    },

    closeUnlockMessage: function()
    {
        this.modalRoot.set("visible", false);
        this.pendingExpansion = undefined;
    },

    onActivateUnlockControl: function(component, value)
    {
        if (!value || !isDefined(this.pendingExpansion))
            return;
        this.showUnlockingProgress();
        this.unlocker.unlockExpansion(this.pendingExpansion);
    },

    onCancelUnlockControl: function(component, value)
    {
        if (!value)
            return;
        this.unlocker.cancelExpansionUnlocking();
        this.closeUnlockMessage();
    },

    onExpansionUnlockingFinished: function(result)
    {
        if (isDefined(this.pendingExpansion) && this.pendingExpansion.getProperties().Name == result.name)
            this.closeUnlockMessage();
        this.refresh();
    },

    createModal: function()
    {
        var size = Content.getInterfaceSize();
        var width = size[0];
        var height = size[1];
        var modalWidth = width < 440 ? width - 40 : 400;
        var modalHeight = 150;

        this.modalRoot = Content.addPanel("inlayExpansionUnlockMessage", 0, 0);
        this.modalRoot.set("width", width);
        this.modalRoot.set("height", height);
        this.modalRoot.set("saveInPreset", false);
        this.modalRoot.set("visible", false);
        this.modalRoot.setZLevel("AlwaysOnTop");
        this.modalRoot.setPaintRoutine(function(g) { g.fillAll(0x99000000); });

        var modalPanel = Content.addPanel("inlayExpansionUnlockDialog", 0, 0);
        modalPanel.set("parentComponent", this.modalRoot.getId());
        modalPanel.set("x", Math.floor((width - modalWidth) / 2));
        modalPanel.set("y", Math.floor((height - modalHeight) / 2));
        modalPanel.set("width", modalWidth);
        modalPanel.set("height", modalHeight);
        modalPanel.set("saveInPreset", false);
        modalPanel.set("itemColour", 0xff1d1d21);
        modalPanel.setPaintRoutine(function(g) { g.fillAll(0xff1d1d21); });

        this.messageLabel = Content.addLabel("inlayExpansionUnlockMessageLabel", 20, 20);
        this.messageLabel.set("parentComponent", modalPanel.getId());
        this.messageLabel.set("width", modalWidth - 40);
        this.messageLabel.set("height", 56);
        this.messageLabel.set("multiline", true);
        this.messageLabel.set("editable", false);
        this.messageLabel.set("saveInPreset", false);
        this.messageLabel.set("textColour", 0xffffffff);

        this.activateButton = Content.addButton("inlayExpansionUnlockActivate", 0, 92);
        this.activateButton.set("parentComponent", modalPanel.getId());
        this.activateButton.set("x", modalWidth / 2 - 130);
        this.activateButton.set("width", 120);
        this.activateButton.set("height", 36);
        this.activateButton.set("text", "Activate");
        this.activateButton.set("isMomentary", true);
        this.activateButton.set("saveInPreset", false);
        this.activateButton.setControlCallback(onExpansionProtectionActivateControl);

        this.cancelButton = Content.addButton("inlayExpansionUnlockCancel", 0, 92);
        this.cancelButton.set("parentComponent", modalPanel.getId());
        this.cancelButton.set("x", modalWidth / 2 + 10);
        this.cancelButton.set("width", 120);
        this.cancelButton.set("height", 36);
        this.cancelButton.set("text", "Cancel");
        this.cancelButton.set("isMomentary", true);
        this.cancelButton.set("saveInPreset", false);
        this.cancelButton.setControlCallback(onExpansionProtectionCancelControl);
    }
};

inline function onExpansionProtectionActivateControl(component, value)
{
    ExpansionProtection.onActivateUnlockControl(component, value);
}

inline function onExpansionProtectionCancelControl(component, value)
{
    ExpansionProtection.onCancelUnlockControl(component, value);
}
