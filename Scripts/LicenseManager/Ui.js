namespace LicenseManagerUi {
    const _uiSize = Content.getInterfaceSize();
    const var _visibleRootComponents = getVisibleRootComponents();

    {
        Console.print("UI info:");
        Console.print("- size: " + _uiSize[0] + "x" + _uiSize[1]);
        for (c in _visibleRootComponents) {
            Console.print("- visible root: " + c.getId());
            c.getId();
        }
    }

    const _activationScreen = {
        panelId: "pnlLicenseAuth",
        infoLabelId: "lblLicenseAuthInfo",
        activateButtonId: "btnLicenseActivate",
        completeButtonId: "btnLicenseComplete",
    };
    inline function showActivationScreen(startActivation, completeActivation) {
        _activationScreen.startActivation = startActivation;
        _activationScreen.completeActivation = completeActivation;

        setPluginUIVisible(false);
        local panel = Content.addPanel(_activationScreen.panelId, 0, 0);
        panel.set("x", 0);
        panel.set("y", 0);
        panel.set("width", _uiSize[0]);
        panel.set("height", _uiSize[1]);
        panel.set("saveInPreset", false);
        panel.setZLevel("AlwaysOnTop");

        local padding = 20;
        local labelHeight = 96;

        local infoLabel = Content.addLabel(_activationScreen.infoLabelId, 0, 0);

        infoLabel.set("parentComponent", panel.getId());
        infoLabel.set("x", padding);
        infoLabel.set("y", padding);
        infoLabel.set("width", _uiSize[0] - padding * 2);
        infoLabel.set("height", labelHeight);
        infoLabel.set("multiline", true);
        infoLabel.set("editable", false);
        infoLabel.set("saveInPreset", false);
        infoLabel.set("text", "This plug-in requires activation. Click Activate, and once you finish in the browser, press Complete.");

        local buttonY = padding + labelHeight + 20;

        local activateButton = Content.addButton(_activationScreen.activateButtonId, 0, 0);
        activateButton.set("parentComponent", panel.getId());
        activateButton.set("x", padding);
        activateButton.set("y", buttonY);
        activateButton.set("width", 120);
        activateButton.set("height", 36);
        activateButton.set("text", "Activate");
        activateButton.set("saveInPreset", false);
        activateButton.set("isMomentary", true);
        activateButton.set("enableMidiLearn", false);
        activateButton.set("enabled", true);
        activateButton.setControlCallback(onActivateButtonClicked);

        local completeButton = Content.addButton(_activationScreen.completeButtonId, 0, 0);
        completeButton.set("parentComponent", panel.getId());
        completeButton.set("x", padding + 140);
        completeButton.set("y", buttonY);
        completeButton.set("width", 120);
        completeButton.set("height", 36);
        completeButton.set("text", "Complete");
        completeButton.set("saveInPreset", false);
        completeButton.set("isMomentary", true);
        completeButton.set("enableMidiLearn", false);
        completeButton.set("enabled", false); // Keep Complete disabled until activation starts
        completeButton.setControlCallback(onCompleteButtonClicked);
    }

    inline function onActivateButtonClicked(component, value) {
        if (!value) return;

        Content.getComponent(_activationScreen.completeButtonId).set("enabled", true);
        _activationScreen.startActivation();
    }

    inline function onCompleteButtonClicked(component, value) {
         if (!value) return;

        _activationScreen.completeActivation();
    }

    inline function hideActivationScreen() {
        local panel = Content.getComponent(_activationScreen.panelId);
        setPluginUIVisible(true);
        panel.fadeComponent(false, 150);
    }

    const _authInProgressScreen = {
        panelId: "pnlInProgress",
        labelId: "lblInProgress"
    };
    inline function showAuthInProgressScreen() {
        setPluginUIVisible(false);
        local panel = Content.addPanel(_authInProgressScreen.panelId, 0, 0);
        panel.set("x", 0);
        panel.set("y", 0);
        panel.set("width", _uiSize[0]);
        panel.set("height", _uiSize[1]);
        panel.set("saveInPreset", false);
        panel.setZLevel("AlwaysOnTop");

        local padding = 20;
        local labelHeight = 96;

        local label = Content.addLabel(_authInProgressScreen.labelId, 0, 0);

        label.set("parentComponent", panel.getId());
        label.set("x", padding);
        label.set("y", padding);
        label.set("width", _uiSize[0] - padding * 2);
        label.set("height", labelHeight);
        label.set("multiline", true);
        label.set("editable", false);
        label.set("saveInPreset", false);
        label.set("text", "Authorization in progress...");
    }

    inline function hideAuthInProgressScreen() {
        local panel = Content.getComponent(_authInProgressScreen.panelId);
        setPluginUIVisible(true);
        panel.fadeComponent(false, 150);
    }

    inline function getVisibleRootComponents() {
        Console.print("getVisibleRootComponents");
        local comps = Content.getAllComponents(".*");
        local roots = [];
        for (c in comps) {
            local p = c.get("parentComponent");
            if (p == "" && c.get("visible") && c.getId() != _activationScreen.panelId) {
                roots.push(c);
            }
        }
        return roots;
    }

    inline function setPluginUIVisible(visible) {
        for (c in _visibleRootComponents) {
            c.set("visible", visible);
        }
    }

    inline function setAuthProgressAborted() {
        local label = Content.getComponent(_authInProgressScreen.labelId);
        label.set("text", "Authentication aborted. Try again later");
    }

    inline function showInternalErrDialog(errCode) {
        local msg = "Error code: " + errCode; // todo: add support contact
        Engine.showErrorMessage(msg, true);
    }

    const _httpRetryDialog = {};
    inline function showHttpErrDialog(status, retry, cancel) {
        _httpRetryDialog.retry = retry;
        _httpRetryDialog.cancel = cancel;
        local cb = function(result){
            if (result) _httpRetryDialog.retry();
            else _httpRetryDialog.cancel();
        };
        local dlgMsg = "Failed HTTP request. Status: " + status + ". Would you like to retry?";
        Engine.showYesNoWindow("HTTP Error", dlgMsg, cb);
    }
}
