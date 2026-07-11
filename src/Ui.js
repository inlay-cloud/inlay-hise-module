namespace InlayUi {
    reg _unlocker = undefined;
    
    reg _rootPanel = undefined;
    reg _activationPanel = undefined;
    reg _unlockingPanel = undefined;
    reg _updatePanel = undefined;
    reg _currentAppUpdate = undefined;
    
    const var _textButtonLookAndFeel = Content.createLocalLookAndFeel();
    _textButtonLookAndFeel.registerFunction("drawToggleButton", function(g, obj)
    {
        drawTextButton(g, obj, obj.text, obj.area);
    });

    // ----------- UI Constructs ------------

    // Creates the default unlocker overlay UI.
    // It blocks the plugin UI while locked and controls activation and unlocking.
    // To stay on top, this UI must be created after the plugin UI.
    inline function create(unlocker) {
        _unlocker = unlocker;
        createPanels();

        unlocker.statusBroadcaster.addListener("inlayUIStatusListener", "inlayUIStatusListener", onUnlockerStatusChanged);
        unlocker.activationErrBroadcaster.addListener("inlayUIActivationErrListener", "inlayUIActivationErrListener", onActivationErrChanged);
        unlocker.unlockingErrBroadcaster.addListener("inlayUIUnlockingErrListener", "inlayUIUnlockingErrListener", onUnlockingErrChanged);

        onUnlockerStatusChanged(unlocker.statusBroadcaster.status);
    }

    inline function createActivationPanel(rootPanel) {
        local panelWidth = rootPanel.getWidth();
        local panelHeight = rootPanel.getHeight();
        local panel = Content.addPanel("inlayActivationPanel", 0, 0);

        panel.set("parentComponent", rootPanel.getId());
        panel.set("x", 0);
        panel.set("y", 0);
        panel.set("width", panelWidth);
        panel.set("height", panelHeight);
        panel.set("saveInPreset", false);
        panel.set("itemColour", 0xFF1D1D21);
        panel.set("itemColour2", 0xFF1D1D21);
        panel.set("visible", true);

        local padding = 20;
        local labelHeight = 50;

        local infoLabel = createChildLabel(panel, "inlayActivationLabel", padding, padding);
        infoLabel.set("width", panelWidth - padding * 2);
        infoLabel.set("height", labelHeight);
        infoLabel.set("multiline", true);
        infoLabel.set("editable", false);
        infoLabel.set("saveInPreset", false);
        infoLabel.set("text", "This app needs activation. Click Activate, finish the process in your browser, and then the app will be ready to use.");

        local buttonY = padding + labelHeight + 20;
        local buttonWidth = 120;
        local buttonHeight = 36;
        local buttonGap = 20;
        local buttonsStartX = Math.floor((panelWidth - buttonWidth) / 2);

        local activateButton = createChildButton(panel, "inlayActivateButton", buttonsStartX, buttonY);

        activateButton.set("width", buttonWidth);
        activateButton.set("height", buttonHeight);
        activateButton.set("text", "Activate");
        activateButton.set("saveInPreset", false);
        activateButton.set("isMomentary", true);
        activateButton.set("enableMidiLearn", false);
        activateButton.set("enabled", true);
        activateButton.set("bgColour", 0xff2a2d34);
        activateButton.set("textColour", 0xffffffff);
        activateButton.setLocalLookAndFeel(_textButtonLookAndFeel);
        activateButton.setControlCallback(onActivateButtonClicked);

        local errLabelY = buttonY + buttonHeight;
        local errLabelX = padding;
        local errLabel = createChildLabel(panel, "inlayActivationErrLabel", errLabelX, errLabelY);
        errLabel.set("width", panelWidth - padding * 2);
        errLabel.set("height", labelHeight);
        errLabel.set("multiline", true);
        errLabel.set("editable", false);
        errLabel.set("saveInPreset", false);
        errLabel.set("textColour", 0xFFED5D5D);
        onActivationErrChanged(_unlocker.activationErrBroadcaster.error);

        return panel
    }

    inline function createUnlockingPanel(rootPanel) {
        local panelWidth = rootPanel.getWidth();
        local panelHeight = rootPanel.getHeight();
        local panel = Content.addPanel("inlayUnlockingPanel", 0, 0);

        panel.set("parentComponent", rootPanel.getId());
        panel.set("width", panelWidth);
        panel.set("height", panelHeight);
        panel.set("saveInPreset", false);
        panel.set("itemColour", 0xFF1D1D21);
        panel.set("itemColour2", 0xFF1D1D21);
        panel.set("visible", false);

        local padding = 20;
        local labelHeight = 50;
        local labelWidth = panelWidth - padding * 2;

        local y = padding;

        local label = createChildLabel(panel, "inlayUnlockingLabel", padding, y);
        label.set("width", labelWidth);
        label.set("height", labelHeight);
        label.set("multiline", true);
        label.set("editable", false);
        label.set("saveInPreset", false);
        label.set("text", "Unlocking");

        y += labelHeight;
        local errLabel = createChildLabel(panel, "inlayUnlockingErrLabel", padding, y);
        errLabel.set("width", labelWidth);
        errLabel.set("height", labelHeight-20);
        errLabel.set("multiline", true);
        errLabel.set("editable", false);
        errLabel.set("saveInPreset", false);
        errLabel.set("textColour", 0xFFED5D5D);

        y += labelHeight;
        local buttonWidth = 120;
        local buttonHeight = 36;

        local retryButtonsStartX = Math.floor((panelWidth - 2 * buttonWidth - padding) / 2);

        local retryButton = createChildButton(panel, "inlayRetryUnlockingButton", retryButtonsStartX, y);
        retryButton.set("width", buttonWidth);
        retryButton.set("height", buttonHeight);
        retryButton.set("text", "Retry");
        retryButton.set("saveInPreset", false);
        retryButton.set("isMomentary", true);
        retryButton.set("enableMidiLearn", false);
        retryButton.set("enabled", true);
        retryButton.set("bgColour", 0xff2a2d34);
        retryButton.set("textColour", 0xffffffff);
        retryButton.setLocalLookAndFeel(_textButtonLookAndFeel);
        retryButton.setControlCallback(onRetryUnlockingButtonClicked);

        local logoutButtonsStartX = retryButtonsStartX + buttonWidth + padding;
        local logoutButton = createChildButton(panel, "inlayLogoutOnUnlockingButton", logoutButtonsStartX, y);
        logoutButton.set("width", buttonWidth);
        logoutButton.set("height", buttonHeight);
        logoutButton.set("text", "Logout");
        logoutButton.set("saveInPreset", false);
        logoutButton.set("isMomentary", true);
        logoutButton.set("enableMidiLearn", false);
        logoutButton.set("enabled", true);
        logoutButton.set("bgColour", 0xff2a2d34);
        logoutButton.set("textColour", 0xffffffff);
        logoutButton.setLocalLookAndFeel(_textButtonLookAndFeel);
        logoutButton.setControlCallback(onLogoutUnlockingButtonClicked);

        onUnlockingErrChanged(_unlocker.unlockingErrBroadcaster.error);


        return panel;
    }

    inline function createUpdatePanel(rootPanel) {
        local panelWidth = rootPanel.getWidth();
        local panelHeight = rootPanel.getHeight();
        local panel = Content.addPanel("inlayAppUpdatePanel", 0, 0);

        panel.set("parentComponent", rootPanel.getId());
        panel.set("width", panelWidth);
        panel.set("height", panelHeight);
        panel.set("saveInPreset", false);
        panel.set("visible", false);

        local modalWidth = panelWidth < 520 ? panelWidth - 40 : 480;
        local modalHeight = 210;
        local modalX = Math.floor((panelWidth - modalWidth) / 2);
        local modalY = Math.floor((panelHeight - modalHeight) / 2);
        panel.data.modalArea = [modalX, modalY, modalWidth, modalHeight];

        panel.setPaintRoutine(function(g) {
            var modalArea = this.data.modalArea;

            g.fillAll(0x99000000);
            g.setColour(0xFF1D1D21);
            g.fillRoundedRectangle(modalArea, 6);
            g.setColour(0x33FFFFFF);
            g.drawRoundedRectangle([modalArea[0] + 0.5, modalArea[1] + 0.5, modalArea[2] - 1, modalArea[3] - 1], 6, 1);
        });

        local padding = 24;
        local titleLabel = createChildLabel(panel, "inlayAppUpdateTitleLabel", modalX + padding, modalY + padding);
        titleLabel.set("width", modalWidth - padding * 2);
        titleLabel.set("height", 32);
        titleLabel.set("editable", false);
        titleLabel.set("saveInPreset", false);
        titleLabel.set("textColour", 0xFFFFFFFF);
        titleLabel.set("text", "Update Available");

        local closeButtonSize = 26;
        local closeButton = createChildButton(panel, "inlayCloseAppUpdateButton", modalX + modalWidth - padding - closeButtonSize, modalY + padding);
        closeButton.set("width", closeButtonSize);
        closeButton.set("height", closeButtonSize);
        closeButton.set("text", "X");
        closeButton.set("saveInPreset", false);
        closeButton.set("isMomentary", true);
        closeButton.set("enableMidiLearn", false);
        closeButton.set("enabled", true);
        closeButton.set("bgColour", 0xff2a2d34);
        closeButton.set("textColour", 0xffffffff);
        closeButton.setLocalLookAndFeel(_textButtonLookAndFeel);
        closeButton.setControlCallback(onCloseAppUpdateButtonClicked);

        local messageLabel = createChildLabel(panel, "inlayAppUpdateMessageLabel", modalX + padding, modalY + 66);
        messageLabel.set("width", modalWidth - padding * 2);
        messageLabel.set("height", 60);
        messageLabel.set("multiline", true);
        messageLabel.set("editable", false);
        messageLabel.set("saveInPreset", false);
        messageLabel.set("textColour", 0xFFE1E1E6);

        local buttonWidth = 140;
        local skipButtonWidth = 96;
        local buttonHeight = 36;
        local buttonGap = 16;
        local buttonsWidth = buttonWidth + skipButtonWidth + buttonGap;
        local buttonsStartX = modalX + Math.floor((modalWidth - buttonsWidth) / 2);
        local buttonsY = modalY + modalHeight - padding - buttonHeight;

        local updateButton = createChildButton(panel, "inlayGoToAppUpdateButton", buttonsStartX, buttonsY);
        updateButton.set("width", buttonWidth);
        updateButton.set("height", buttonHeight);
        updateButton.set("text", "Go To Update");
        updateButton.set("saveInPreset", false);
        updateButton.set("isMomentary", true);
        updateButton.set("enableMidiLearn", false);
        updateButton.set("enabled", true);
        updateButton.set("bgColour", 0xff2a2d34);
        updateButton.set("textColour", 0xffffffff);
        updateButton.setLocalLookAndFeel(_textButtonLookAndFeel);
        updateButton.setControlCallback(onGoToAppUpdateButtonClicked);

        local skipButton = createChildButton(panel, "inlaySkipAppUpdateButton", buttonsStartX + buttonWidth + buttonGap, buttonsY);
        skipButton.set("width", skipButtonWidth);
        skipButton.set("height", buttonHeight);
        skipButton.set("text", "Skip");
        skipButton.set("saveInPreset", false);
        skipButton.set("isMomentary", true);
        skipButton.set("enableMidiLearn", false);
        skipButton.set("enabled", true);
        skipButton.set("bgColour", 0xff2a2d34);
        skipButton.set("textColour", 0xffffffff);
        skipButton.setLocalLookAndFeel(_textButtonLookAndFeel);
        skipButton.setControlCallback(onSkipAppUpdateButtonClicked);

        return panel;
    }

    inline function createChildLabel(parentPanel, id, x, y) {
        local label = Content.addLabel(id, x, y);
        label.set("parentComponent", parentPanel.getId());
        return label;
    }

    inline function createChildButton(parentPanel, id, x, y) {
        local button = Content.addButton(id, x, y);
        button.set("parentComponent", parentPanel.getId());

        return button;
    }

    inline function createPanels() {
        log("createPanels");

        _rootPanel = createRootPanel();
        _activationPanel = createActivationPanel(_rootPanel);
        _unlockingPanel = createUnlockingPanel(_rootPanel);
        _updatePanel = createUpdatePanel(_rootPanel);
    }

    inline function createRootPanel() {
        local uiSize = Content.getInterfaceSize();

        local rootPanel = Content.addPanel("inlayRootPanel", 0, 0);
        rootPanel.set("x", 0);
        rootPanel.set("y", 0);
        rootPanel.set("width", uiSize[0]);
        rootPanel.set("height", uiSize[1]);
        rootPanel.set("saveInPreset", false);
        rootPanel.set("borderSize", 0);
        rootPanel.set("borderRadius", 0);
        rootPanel.set("opaque", false);
        rootPanel.setZLevel("AlwaysOnTop");
        rootPanel.set("visible", true);
        rootPanel.setPaintRoutine(function(g) {});

        return rootPanel;
    }

    inline function drawTextButton(g, obj, text, area) {
        local alignment = "centred";
        local down = obj.down || obj.value;

        g.setColour(Colours.withAlpha(obj.bgColour, obj.over && obj.enabled ? 0.7 + 0.3 * down: 0.9 - (0.3 * !obj.enabled)));
        g.fillRoundedRectangle(area, 5);

        g.setColour(Colours.withAlpha(obj.textColour, obj.over && obj.enabled ? 0.8 + 0.2 * down: 0.9 - (0.3 * !obj.enabled)));
        g.setFont("semibold", 16);
        g.drawAlignedText(text, [area[0], area[1], area[2], area[3]], alignment);
    }


    // --------- Unlocker Callbacks ---------

    inline function onUnlockerStatusChanged(status) {
        if (status == undefined) {
            return;
        }
        
        if (status == "unlocked") {
            local upd = _unlocker.getAppUpdate();
            if (shouldShowAppUpdateDialog(upd)) {
                showAppUpdateDialog(upd);
                return;
            }

            _rootPanel.fadeComponent(false, 150);
            return;
        }

        if (status == "activation_required") {
            showOnlyChild(_rootPanel, _activationPanel);
            _rootPanel.fadeComponent(true, 150);
            return;
        }

        if (status == "unlocking") {
            showOnlyChild(_rootPanel, _unlockingPanel);
            _rootPanel.fadeComponent(true, 150);
            return;
        }
        
        log("unexpected unlocker status");
    }

    inline function onUnlockingErrChanged(error) {
        local hasErr = error != undefined && error != "";

        Content.getComponent("inlayRetryUnlockingButton").set("visible", hasErr);
        Content.getComponent("inlayLogoutOnUnlockingButton").set("visible", hasErr);

        local labelText = hasErr ? error : "";
        Content.getComponent("inlayUnlockingErrLabel").set("text", labelText);
    }

    inline function onActivationErrChanged(error) {
        Content.getComponent("inlayActivationErrLabel").set("text", error != undefined ? error : "");
    }

    // ------------- UI Callbacks -----------

    inline function onActivateButtonClicked(component, value) {
        if (!value) return;
        _unlocker.startActivation();
    }

    inline function onRetryUnlockingButtonClicked(component, value) {
        if (!value) return;
        _unlocker.retryUnlocking();
    }
    
    inline function onLogoutUnlockingButtonClicked(component, value) {
        if (!value) return;
        _unlocker.logout();
    }

    inline function onGoToAppUpdateButtonClicked(component, value) {
        if (!value) return;
        if (!isDefined(_currentAppUpdate)) return;

        _unlocker.openWebsite(_currentAppUpdate.url);
    }

    inline function onCloseAppUpdateButtonClicked(component, value) {
        if (!value) return;
        _rootPanel.fadeComponent(false, 150);
    }

    inline function onSkipAppUpdateButtonClicked(component, value) {
        if (!value) return;
        if (!isDefined(_currentAppUpdate)) return;

        _unlocker.skipCurrentAppUpdateVersion();
        _rootPanel.fadeComponent(false, 150);
    }
    
    // --------------- Helpers --------------

    inline function showOnlyChild(parentPanel, child){
        for(c in parentPanel.getChildComponents()) {
            if (c.get("parentComponent") != parentPanel.getId()) {
                continue;
            }
            c.set("visible", c.getId() == child.getId());
        }
    }

    inline function shouldShowAppUpdateDialog(appUpdate) {
        if (!isDefined(appUpdate)) {
            log("upd undefined");
            return false;
        }

        if (appUpdate.version == undefined || appUpdate.version == "") {
            log("upd missing version");
            return false;
        }

        if (appUpdate.url == undefined || appUpdate.url == "") {
            log("upd missing url");
            return false;
        }

        return true;
    }

    inline function showAppUpdateDialog(appUpdate) {
        log("showAppUpdateDialog");
        _currentAppUpdate = appUpdate;

        Content.getComponent("inlayAppUpdateMessageLabel").set("text", "Version " + appUpdate.version + " is available. Update the current app now?");
        showOnlyChild(_rootPanel, _updatePanel);
        _rootPanel.fadeComponent(true, 150);
    }
    
    inline function log(msg) {
        Console.print("InlayUi: " + msg);
    }
}
