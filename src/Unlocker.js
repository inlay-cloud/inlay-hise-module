namespace InlayUnlocker {
    // The plugin must be activated before it can be unlocked.
    const var STATUS_ACTIVATION_REQUIRED = "activation_required";
    // The plugin is being unlocked and remains locked until the process finishes.
    const var STATUS_UNLOCKING = "unlocking";
    // The plugin is unlocked.
    const var STATUS_UNLOCKED = "unlocked";
    
    const var moduleVersion = "HISE-3.0.4";
    const var oneDay = 24 * 60 * 60 * 1000;
    const var ulidLength = 26;
    const var inlayProductIDProp = "InlayProductID";
    const var inlayProductIDTagLength = ulidLength + inlayProductIDProp.length + 1; // InlayProductID=01KQEN95FVR6CQCF6DSGA04QYJ
    
    // Creates an InlayUnlocker instance. Only one instance is allowed.
    // The config object supports the following properties:
    // - productId (string) - ID of the current product.
    // - publicKey (string) - Company public key used for access verification.
    // - test (bool, optional) - Enables unlocking tests in the HISE editor (default: false).
    // - apiUrl (string, optional) - Inlay server API URL (default: production URL).
    inline function create(cfg) {
        log("create");
        local inlayDir = FileSystem.getFolder(FileSystem.AppData).createDirectory(".inlay");

        local deviceID = FileSystem.getSystemId();
        local accessTokenFile = inlayDir.getChildFile("access-token");
        local apiUrl = str(cfg.apiUrl) == "" ?  "https://api.inlay.cloud" : cfg.apiUrl;
        local instanceID = Math.randInt(1, 2147483647);
        
        log("Inlay dir: " + inlayDir.toString(0));

        local unlocker = {
            inlayDir: inlayDir,
            idTokenFile: inlayDir.getChildFile("id-token"),
            accessTokenFile: accessTokenFile,
            updateFile: inlayDir.getChildFile("update.json"),
            skippedUpdateFile: inlayDir.getChildFile("skipped-update.json"),
            expansionsDir: inlayDir.createDirectory("expansions"),
            syncLockFile: inlayDir.getChildFile("sync-lock.json"),
            activationEventFile: inlayDir.getChildFile("activation-event.json"),

            completeActivationPollTimer: Engine.createTimerObject(),
            activationEventWatchTimer: Engine.createTimerObject(),
            completeExpansionActivationPollTimer: Engine.createTimerObject(),
            oneTimeTimer: Engine.createTimerObject(),

            accessRefreshAge: oneDay,
            instanceID: instanceID,

            apiUrl: apiUrl,
            deviceID: deviceID,
            tokenValidator: createTokenValidator(cfg.publicKey, cfg.productId, deviceID),
            serverAPI: createServerAPI(apiUrl, cfg.productId, moduleVersion, instanceID),
            cfg: cfg,
            locked: true,
            
            activationToken: undefined,
            idToken: undefined,
            accessClaims: undefined,
            appUpdate: undefined,
            skippedAppUpdate: undefined,
            
            // ----------- Public API -------------
            
            // Broadcasts unlocker status changes.
            statusBroadcaster: Engine.createBroadcaster({
                "id": "InlayUnlockerStatus",
                "args": ["status"]
            }),
            // Broadcasts activation error changes.
            activationErrBroadcaster: Engine.createBroadcaster({
                "id": "InlayActivationError",
                "args": ["error"]
            }),
            // Broadcasts unlocking error changes.
            unlockingErrBroadcaster: Engine.createBroadcaster({
                "id": "InlayUnlockingError",
                "args": ["error"]
            }),
            
            // Starts the browser-based activation flow.
            startActivation: function() {
                log("startActivation");
                this.broadcastActivationError("");

                var reqBody = {
                    productId: this.cfg.productId,
                    deviceId: this.deviceID,
                };

                var cb = function[this](status, resp){
                    if (status != 200) {
                        this.broadcastActivationError(httpErrText(status, resp));
                        return;
                    }

                    this.activationToken = resp.activationToken;
                    var continueUrl = this.apiUrl + "/appweb/auth/continue?activationToken=" + this.activationToken;
                    this.openWebsite(continueUrl);

                    this.completeActivationPollTimer.stopTimer();
                    this.completeActivationPollTimer.startTimer(2000);
                };

                this.serverAPI.apiPost("app/auth/start", reqBody, cb);
            },

            // Retries unlocking after a previous unlock attempt failed.
            retryUnlocking: function() {
                log("retryUnlocking");
                
                if (this.statusBroadcaster.status != STATUS_UNLOCKING || str(this.unlockingErrBroadcaster.error) == "") {
                    log("! unexpected call of retryUnlocking");
                    return;
                }

                this.broadcastUnlockingError("");
                this.requestAccessToUnlock();
            },

            // Clears the current user and returns to the activation-required state.
            logout: function() {
                log("logout");
                
                this.idToken = undefined;
                this.accessClaims = undefined;
                this.oneTimeTimer.stopTimer();
                this.idTokenFile.deleteFileOrDirectory();
                this.accessTokenFile.deleteFileOrDirectory();
                this.expansionsDir.deleteFileOrDirectory();
                this.broadcastStatus(STATUS_ACTIVATION_REQUIRED);
            },

            // Starts all startup checks. Call this during plugin initialization.
            startup: function() {
                log("startup");

                this.expansionsDir = this.inlayDir.createDirectory("expansions");

                this.appUpdate = this.updateFile.loadAsObject();
                this.skippedAppUpdate = this.skippedUpdateFile.loadAsObject();
                
                this.idToken = this.idTokenFile.loadAsString();
                if (str(this.idToken) == "") {
                    this.broadcastStatus(STATUS_ACTIVATION_REQUIRED);
                    return;
                }

                this.accessClaims = this.tokenValidator.loadAndValidateAccessToken(this.accessTokenFile);
                if (this.accessClaims == undefined) {
                    this.broadcastStatus(STATUS_UNLOCKING);
                    return;
                }
                
                this.broadcastStatus(STATUS_UNLOCKED);
            },

            // Returns the current lock state as a boolean.
            isLocked: function() {
                return this.locked;
            },
            
            // Returns the host plugin update information most recently received
            // from Inlay, or loaded from the local update cache during startup().
            // The result is undefined when no update information is available.
            // When defined, the result object has:
            // - version (string) - Available app version reported by Inlay.
            // - url (string) - Download URL for the available app update.
            getAppUpdate: function() {
                if (!isDefined(this.appUpdate)) {
                    return undefined;
                }

                if (str(this.appUpdate.version) == "" || str(this.appUpdate.url) == "") {
                    return undefined;
                }

                if (isDefined(this.skippedAppUpdate) && this.skippedAppUpdate.version == this.appUpdate.version) {
                    return undefined;
                }

                return this.appUpdate;
            },

            // Persists the currently available host plugin update version as skipped.
            skipCurrentAppUpdateVersion: function() {
                var appUpdate = this.getAppUpdate();
                if (!isDefined(appUpdate)) {
                    return;
                }

                this.skippedAppUpdate = {
                    version: appUpdate.version,
                };

                this.skippedUpdateFile.writeObject(this.skippedAppUpdate);
            },
            
            // Returns the email address from the currently validated access claims.
            // The result is undefined until the plugin has valid local access claims,
            // or when the validated access token does not include a user email.
            getCurrentUser: function() {
                if (!isDefined(this.accessClaims)) {
                    return undefined;
                }
                
                if (str(this.accessClaims.userEmail) == "") {
                    return undefined;
                }
                
                return this.accessClaims.userEmail;
            },
            
            // Checks an expansion's lock state. Can be called only after the host is unlocked itself.
            // Accepts an Expansion object.
            // Returns undefined for invalid expansions.
            // For valid expansions, returns an object with:
            // - locked (boolean) - Whether the expansion is locked.
            // - updateUrl (string) - Non-empty when an update is available for the current expansion version.
            checkExpansion: function(e) {
                log("checkExpansion: " + e.getProperties().Name);
                
                if (!isDefined(this.accessClaims)) {
                    log("! checkExpansion is called while the host is locked");
                    return undefined;
                }
                
                var productId = getExpansionProductId(e);
                if (str(productId) == "") {
                    return undefined;
                }

                var file = this.expansionsDir.getChildFile(productId);
                if (!isDefined(file)) {
                    return {
                        id: productId,
                        locked: true,
                    };
                }
                var data = file.loadAsObject();
                if (!isDefined(data)) {
                    return {
                        id: productId,
                        locked: true,
                    };
                }
                
                var expVersion = getExpansionVersion(e);
                var expVersionFromFile = data.version;
                if (str(expVersion) != str(expVersionFromFile)) {
                    return {
                        id: productId,
                        locked: true,
                    };
                }

                var validator = createTokenValidator(this.cfg.publicKey, productId, this.deviceID);
                var claims = validator.validateAccessToken(data.accessToken);
                
                var locked = true;
                if (isDefined(claims)) {
                    locked = claims.userEmail != this.accessClaims.userEmail;
                }

                return {
                    id: productId,
                    locked: locked,
                    updateUrl: data.updateUrl,
                };
            },
            
            // Sets the callback called when expansion unlocking finishes.
            // The callback receives an object with:
            // - id (string) - The Inlay product ID of the expansion being unlocked.
            // - name (string) - The display name of the expansion being unlocked.
            // - locked (boolean) - Whether the expansion is locked.
            // - error (string/undefined) - Error text, if one occurred.
            // - canceled (boolean/undefined) - True if cancelExpansionUnlocking was called.
            setExpansionUnlockingCallback: function(cb){
                this.expansionUnlockingCallback = cb;
            },
            
            // Starts unlocking an expansion.
            // Accepts an Expansion object.
            // Calls the callback set by setExpansionUnlockingCallback.
            unlockExpansion: function(e) {
                log("unlockExpansion");
                
                if (isDefined(this.unlockingExpansion)) {
                    log("Another expansion is currently being unlocked. Wait callback ot cancel first");
                    return;
                }
                
                var productId = getExpansionProductId(e);
                if (str(productId) == "") {
                    log("Trying to unlock invalid expansion");
                    return;
                }
                
                var expMD = {};
                this.setExpMetaData(expMD, e);
                
                this.unlockingExpansion = {
                    id: productId,
                    md: expMD,
                };
                
                var body = {
                    idToken: this.idToken,
                    subproductId: productId,
                };
                copyObjFields(body, expMD);
                
                var cb = function [this](status, resp) {
                    if (status != 200) {
                        this.finishExpansionUnlocking({
                            locked: true,
                            error: httpErrText(status, resp),
                        });
                        return;
                    }
                    
                    if (isDefined(resp.access)) {
                        this.handleExpansionOkAccessResp(resp.access);
                        return;
                    }
                    
                    if (isDefined(resp.activation)) {
                        this.unlockingExpansion.activationToken = resp.activation.activationToken;
                        var continueUrl = this.apiUrl + "/appweb/auth/continue?activationToken=" + resp.activation.activationToken;
                        this.openWebsite(continueUrl);
                        this.completeExpansionActivationPollTimer.startTimer(2000);
                        return;
                    }

                    this.finishExpansionUnlocking({
                        locked: true,
                        error: "internal error",
                    });
                };
                
                this.serverAPI.apiPost("app/sub-auth/access", body, cb);
                return true;
            },
            
            // Cancels the current expansion unlock attempt.
            cancelExpansionUnlocking: function () {
                log("cancelExpansionUnlocking");
                
                if (this.unlockingExpansion == undefined) {
                    return;
                }
                this.unlockingExpansion.cancel = true;
            },
            
            // ------------------------------------
            
            finishExpansionUnlocking: function(cbData) {
                cbData.id = this.unlockingExpansion.id;
                cbData.name = this.unlockingExpansion.md.productName;
                
                this.completeExpansionActivationPollTimer.stopTimer();
                this.unlockingExpansion = undefined;
                if (isDefined(this.expansionUnlockingCallback)) {
                    this.expansionUnlockingCallback(cbData);
                }
            },
            
            scheduleRefreshCheck: function() {
                log("scheduleRefreshCheck");
                
                var checkRefreshIn = Math.randInt(100, 120000);
                this.callWithDelay(checkRefreshIn, function [this] (){
                    this.checkRefresh();
                });
                log("refresh check scheduled in: " + checkRefreshIn + "ms");
            },

            requestAccessToRefresh: function() {
                log("requestAccessToRefresh");

                var cb = function [this](status, respBody) {
                    if (status == 422) {
                        this.logout();
                        return;
                    }

                    if (status != 200) {
                        log("HTTP error on refreshing token: " + httpErrText(status, respBody));
                        return;
                    }

                    this.saveOkAuthResponse(respBody);
                };

                this.requestAccess(this.idToken, cb);
            },

            requestAccessToUnlock: function(){
                log("requestAccessToUnlock");

                if (!this.syncLock()) {
                    this.callWithDelay(2000, function [this](){
                        this.startup();
                    });
                    return;
                }

                var cb = function [this] (status, resp) {
                    if (status == 422) {
                        this.logout();
                        return;
                    }

                    if (status != 200 && status != 201) {
                        this.broadcastUnlockingError(httpErrText(status, resp));
                        return;
                    }

                    this.saveOkAuthResponse(resp);
                    if (!this.accessClaims) {
                        log("VFASAZ: validation failed after successful authorization");
                        this.broadcastUnlockingError("Internal error. Code: VFASAZ");
                        return;
                    }
                    
                    this.broadcastStatus(STATUS_UNLOCKED);
                };

                this.requestAccess(this.idToken, cb);
            },

            requestAccess: function(idToken, cb) {
                var body = {
                    idToken: idToken,
                };
                body = this.setMetaData(body);
                this.serverAPI.apiPost("app/auth/access", body, cb);
            },

            tryCompleteActivationProcess: function() {
                log("tryCompleteActivationProcess");

                var reqBody = {
                    activationToken: this.activationToken,
                };
                reqBody = this.setMetaData(reqBody);

                var cb = function [this](status, resp) {
                    if (status == 202) {
                        return;
                    }

                    if (status >= 500) {
                        log("tryCompleteActivationProcess. server error: " + httpErrText(status, resp));
                        return;
                    }

                    if (status >= 400) {
                        this.completeActivationPollTimer.stopTimer();
                        this.broadcastActivationError(httpErrText(status, resp));
                        return;
                    }

                    if (status != 200) {
                        log("tryCompleteActivationProcess. unexpected status: " + status + ", " + httpErrText(status, resp));
                        return;
                    }

                    this.completeActivationPollTimer.stopTimer();
                    this.saveOkAuthResponse(resp);
                    if (!this.accessClaims) {
                        log("VFASAN: validation failed after successful authentication");
                        this.broadcastActivationError("Internal error. Code: VFASAN");
                        return;
                    }

                    this.broadcastStatus(STATUS_UNLOCKED);
                };

                this.serverAPI.apiPost("app/auth/complete", reqBody, cb);
            },
            
            tryCompleteExpansionActivation: function() {
                log("tryCompleteExpansionActivation");

                if (this.unlockingExpansion.cancel) {
                    this.finishExpansionUnlocking({
                        locked: true,
                        canceled: true,
                    });
                    return;
                }

                var reqBody = {
                    activationToken: this.unlockingExpansion.activationToken,
                };
                copyObjFields(reqBody, this.unlockingExpansion.md);

                var cb = function [this](status, resp) {
                    if (status == 202) {
                        return;
                    }

                    if (status >= 500) {
                        log("tryCompleteExpansionActivation. server error, status: " + httpErrText(status, resp));
                        return;
                    }

                    if (status != 200) {
                        this.finishExpansionUnlocking({
                            locked: true,
                            error: httpErrText(status, resp),
                        });
                        return;
                    }

                    this.handleExpansionOkAccessResp(resp);
                };

                this.serverAPI.apiPost("app/auth/complete", reqBody, cb);
            },
            
            handleExpansionOkAccessResp: function(accessData){
                accessData.version = this.unlockingExpansion.md.productVersion;
                    
                var file = this.expansionsDir.getChildFile(this.unlockingExpansion.id);
                file.writeObject(accessData);

                var validator = createTokenValidator(this.cfg.publicKey, this.unlockingExpansion.id, this.deviceID);
                var claims = validator.validateAccessToken(accessData.accessToken);
                
                var error = undefined;
                if (claims == undefined) {
                    error = "Internal error. Code: VFASEA";
                    log("VFASEA: validation failed after successful expansion authorization");
                }
                
                this.finishExpansionUnlocking({
                    locked: claims == undefined,
                    updateUrl: accessData.updateUrl,
                    error: error,
                });
            },
            
            saveOkAuthResponse: function(resp) {
                var accessToken = str(resp.accessToken);
                
                if (accessToken != "") {
                    this.accessTokenFile.writeString(accessToken);
                    this.accessClaims = this.tokenValidator.validateAccessToken(accessToken);    
                }

                this.idToken = str(resp.idToken);
                if (this.idToken != "") {
                    this.idTokenFile.writeString(this.idToken);
                }
                
                this.appUpdate = resp.appUpdate;
                if (isDefined(this.appUpdate)) {
                    this.updateFile.writeObject(this.appUpdate);
                } else {
                    this.updateFile.deleteFileOrDirectory();
                }
                
                
                if (isDefined(resp.subproducts)) {
                    for (id in resp.subproducts) {
                        var data = resp.subproducts[id];
                        this.expansionsDir.getChildFile(id).writeObject(data);
                    }
                }
            },

            setMetaData: function(obj) {
                var sys = Engine.getSystemStats();

                obj.moduleVersion = moduleVersion;
                obj.deviceId = this.deviceID;
                obj.os = sys.OperatingSystemName;
                obj.systemStats = JSON.stringify(sys);
                obj.productId = this.cfg.productId;
                obj.productVersion = Engine.getVersion();
                obj.productName = Engine.getName();
                obj.isPlugin = Engine.isPlugin();
                obj.inlayDir = this.inlayDir.toString(0);
                obj.instanceID = this.instanceID;
                
                var subproducts = [];
                var expansionFiles = this.getExpansionFiles();
                if (isDefined(expansionFiles) && expansionFiles.length > 0) {
                    subproducts.reserve(expansionFiles.length);
                    for (eFile in expansionFiles) {
                        if (!eFile.isFile()) continue;

                        var name = eFile.toString(eFile.NoExtension);
                        if (name.length != ulidLength) continue;
                        
                        var data = eFile.loadAsObject();
                        if (!isDefined(data)) continue;
                        
                        var version = str(data.version);
                        if (version == "") continue; 

                        subproducts.push({
                            id: name,
                            version: version,
                        });
                    }
                    
                    if (subproducts.length > 0) {
                        obj.subproducts = subproducts;
                    }
                }
                
                return obj;
            },
            
            getExpansionFiles: function() {
                return FileSystem.findFiles(this.expansionsDir, "*", false);
            },

            setExpMetaData: function(obj, exp) {
                var sys = Engine.getSystemStats();

                obj.moduleVersion = moduleVersion;
                obj.deviceId = this.deviceID;
                obj.os = sys.OperatingSystemName;
                obj.systemStats = JSON.stringify(sys);
                obj.productId = getExpansionProductId(exp);
                obj.productVersion = getExpansionVersion(exp);
                obj.productName = getExpansionName(exp);
                obj.isPlugin = Engine.isPlugin();
                obj.inlayDir = this.inlayDir.toString(0);
                obj.instanceID = this.instanceID;

                return obj;
            },

            checkRefresh: function() {
                log("checkRefresh");

                if (!isDefined(this.accessClaims)) {
                    log("access token refresh skipped: no access claims");
                    return;
                }

                if (this.accessClaims.getAgeMs() > this.accessRefreshAge) {
                    log("access token needs to be refreshed");
                    this.requestAccessToRefresh();
                    return;
                }

                log("access token is fresh enough");
            },

            broadcastStatus: function(status) {
                this.statusBroadcaster.sendAsyncMessage([status]);
            },

            broadcastActivationError: function(error) {
                this.activationErrBroadcaster.sendAsyncMessage([error]);
            },

            broadcastUnlockingError: function(error) {
                this.unlockingErrBroadcaster.sendAsyncMessage([error]);
            },

            syncLock: function() {
                var lock = this.syncLockFile.loadAsObject();
                if (lock && timeSince(lock.time) < 2000) {
                    log("another instance has taken sync lock: " + lock.instanceID);
                    return false;
                }

                this.syncLockFile.writeObject({
                    time: Date.getSystemTimeMs(),
                    instanceID: this.instanceID,
                });

                lock = this.syncLockFile.loadAsObject();
                if (lock.instanceID != this.instanceID) {
                    log("another instance has taken sync lock (last won): " + lock.instanceID);
                    return false;
                }

                return true;
            },

            triggerActivationEvent: function() {
                this.activationEventFile.writeObject({
                    time: Date.getSystemTimeMs(),
                    instanceID: this.instanceID,
                });
            },

            startActivationEventWatcher: function() {
                this.activationEventWatchTimer.startTimer(2000);
            },

            stopActivationEventWatcher: function() {
                this.activationEventWatchTimer.stopTimer();
            },

            checkActivationEvent: function() {
                log("checkActivationEvent");
                
                var e = this.activationEventFile.loadAsObject();
                if (e == undefined) {
                    return;
                }

                if (timeSince(e.time) > 5000) {
                    return;
                }

                if (e.instanceID == this.instanceID) {
                    return;
                }

                log("received activation event from another instance");

                this.startup();
            },
            
            openWebsite: function(url) {
                Engine.openWebsite(url);
            },
            
            callWithDelay: function(delayMs, cb) {
                this.oneTimeTimer.setTimerCallback(function[cb]() {
                    this.stopTimer();
                    cb();
                });
                this.oneTimeTimer.startTimer(delayMs);
            },
        };

        unlocker.statusBroadcaster.addListener(unlocker, "inlayUnlockerStatusListener", onStatusChanged);
        unlocker.completeActivationPollTimer.setTimerCallback(function[unlocker]() {
            unlocker.tryCompleteActivationProcess();
        });
        unlocker.completeExpansionActivationPollTimer.setTimerCallback(function [unlocker](){
            unlocker.tryCompleteExpansionActivation();
        });
        unlocker.activationEventWatchTimer.setTimerCallback(function[unlocker]() {
            unlocker.checkActivationEvent();
        });

        return unlocker;
    }
    
    // ------------ Broadcaster Listeners -------------
    
    inline function onStatusChanged(status) {
        log("onStatusChanged:" + status);
        
        this.locked = status != STATUS_UNLOCKED;
        
        if (status == STATUS_ACTIVATION_REQUIRED) {
            this.startActivationEventWatcher();
        } else {
            this.stopActivationEventWatcher();
        }

        if (status == STATUS_UNLOCKED) {
            this.triggerActivationEvent();
            this.scheduleRefreshCheck();
        }
        
        if (status == STATUS_UNLOCKING) {
            this.requestAccessToUnlock();
        }
    }

    // ------------ Dependencies ----------------------
    
    inline function createTokenValidator(publicKey, productId, deviceID) {
        return {
            log: log,
            publicKey: publicKey,
            productId: productId,
            deviceID: deviceID,

            loadAndValidateAccessToken: function(tokenFile) {
                log("loadAndValidateAccessToken");

                var token = tokenFile.loadAsString();
                if (str(token) == "") {
                    log("- no access token");
                    return undefined;
                }

                var claims = this.validateAccessToken(token);
                if (!claims) {
                    log("- invalid access token");
                    return undefined;
                }

                return claims;
            },

            validateAccessToken: function(token) {
                log("validateAccessToken");
                
                if (str(token) == "") {
                    log("- undefined/empty token");
                    return undefined;
                }
                var claimsJson = this.parseSignedAccessToken(token);
                if (!claimsJson) {
                    log("- invalid access token structure");
                    return undefined;
                }

                var claimsObj = this.makeAccessTokenClaimsObjFromJSON(claimsJson);

                if (!this.validateAccessTokenClaims(claimsObj)) {
                    log("- invalid access token claims");
                    return undefined;
                }

                return claimsObj;
            },

            parseSignedAccessToken: function(token) {
                var tokenParts = token.split(".");

                if (tokenParts.length != 2) {
                    log("parseSignedAccessToken: invalid token parts count");
                    return undefined;
                }

                var encryptedClaims = tokenParts[0];
                var encryptedClaimsHash = tokenParts[1];

                if (str(encryptedClaims) == "" || str(encryptedClaimsHash) == "") {
                    log("parseSignedAccessToken: empty token part");
                    return undefined;
                }

                var decryptedClaimsHash = FileSystem.decryptWithRSA(encryptedClaimsHash, this.publicKey);
                if (!decryptedClaimsHash) {
                    log("parseSignedAccessToken: hash decrypt failed");
                    return undefined;
                }

                var claimsDecrypted = FileSystem.decryptWithRSA(encryptedClaims, this.publicKey);
                if (!claimsDecrypted) {
                    log("parseSignedAccessToken: claims decrypt failed");
                    return undefined;
                }

                if (claimsDecrypted.hash() != decryptedClaimsHash) {
                    log("parseSignedAccessToken: hash check failed");
                    return undefined;
                }


                var hasSpaces = claimsDecrypted.indexOf(" ") != -1;
                var hasTabs = claimsDecrypted.indexOf("\t") != -1;
                var hasNewLines = claimsDecrypted.indexOf("\n") != -1 || claimsDecrypted.indexOf("\r") != -1;
                if (hasSpaces || hasTabs || hasNewLines) {
                    log("extractEncryptedAccessTokenClaims: claims contain whitespace");
                    return undefined;
                }
                
                var claimsJson = claimsDecrypted.parseAsJSON();

                var fieldsCount = 0;
                var key;
                for (key in claimsJson) {
                    if (key != "p" && key != "d" && key != "e" && key != "i" && key != "u") {
                        log("parseSignedAccessToken: unexpected claims field");
                        return undefined;
                    }
                    fieldsCount += 1;
                }

                if (fieldsCount != 5 && fieldsCount != 4) {
                    log("parseSignedAccessToken: invalid claims fields count");
                    return undefined;
                }

                return claimsJson;
            },

            makeAccessTokenClaimsObjFromJSON: function(claimsJson) {
                return {
                    productIdSuff: claimsJson["p"],
                    deviceId: claimsJson["d"],
                    issuedAt: claimsJson["i"] * 1000,
                    expiresAt: claimsJson["e"] * 1000,
                    userEmail: claimsJson["u"],
                    getAgeMs: function () {
                        return timeSince(this.issuedAt);
                    }
                };
            },

            validateAccessTokenClaims: function(claimsObj) {
                var now = Date.getSystemTimeMs();

                var productCheck = str(claimsObj.productIdSuff) != "" && hasSuffix(this.productId, claimsObj.productIdSuff);
                if (!productCheck) {
                    log("productCheck failed");
                    return false;
                }

                var deviceCheck = claimsObj.deviceId == this.deviceID;
                if (!deviceCheck) {
                    log("deviceCheck failed");
                    return false;
                }

                var expirationCheck = claimsObj.expiresAt != undefined && claimsObj.expiresAt > now;
                if (!expirationCheck) {
                    log("expirationCheck failed");
                    return false;
                }

                var issuedCheck = claimsObj.issuedAt != undefined && claimsObj.issuedAt < now;
                if (!issuedCheck) {
                    log("issuedCheck failed");
                    return false;
                }

                return true;
            },
        };
    }

    inline function createServerAPI(apiUrl, productId, moduleVersion, instanceID) {
        return {
            apiUrl: apiUrl,
            productId: productId,
            moduleVersion: moduleVersion,
            instanceID: instanceID,

            apiPost: function(path, body, callback) {
                log("HTTP request: POST " + this.apiUrl + "/" + path);

                body["X-Inlay-Product-Id"] = this.productId;
                body["X-Inlay-Module-Version"] = this.moduleVersion;
                body["X-Inlay-Instance-Id"] = this.instanceID;
                body["_stub"] = {"_stub": "stub"}; // to force json

                Server.setBaseURL(this.apiUrl);
                Server.setEnforceTrailingSlash(false);
                Server.callWithPOST(path, body, function [callback](status, body){
                    if (status== 200) {
                        log("OK HTTP response");    
                    } else {
                        log("NOK HTTP response: " + httpErrText(status, body));
                    }
                    callback(status, body);
                });
            },
        };
    }

    // ------------ Helpers --------------------------
    
    inline function getExpansionProductId(e) {
        local props = e.getProperties();
        if (!isDefined(props)) {
            return undefined;
        }
        
        local id = str(props[inlayProductIDProp]).trim();
        if (id.length == ulidLength) {
            return id;
        }
        
        local tagsStr = str(props.Tags);
        if (tagsStr == "") {
            return undefined;
        }
        
        local tags = tagsStr.split(",");
        for (tag in tags) {
            tag = tag.trim();
            if (tag.length != inlayProductIDTagLength) {
                continue;
            }
            local kv = tag.split("=");
            if (kv.length != 2) {
                continue;
            }
            if (kv[0] != inlayProductIDProp) {
                continue;
            }
            return kv[1];
        }
        
        return undefined;
    }

    inline function getExpansionName(e) {
        return e.getProperties().Name;
    }

    inline function getExpansionVersion(e) {
        return e.getProperties().Version;
    }
    
    inline function httpErrText(status, resp) {
        if (!isDefined(status) || status == 0) {
            return "HTTP error. Check your internet connection.";
        }
        
        local userMsg = str(resp.message);
        
        if (userMsg != "") {
            return userMsg;
        }
        
        local defaultMsg = "HTTP error. Status: " + status;
        
        local traceId = str(resp.traceId);
        
        if (traceId != "") {
            defaultMsg += ". Trace: " + traceId;
        }
        
        return defaultMsg;
    }
    
    inline function timeSince(timeMs) {
        return Date.getSystemTimeMs() - timeMs;
    }

    inline function hasSuffix(str, suff) {
        local strSuff = str.substring(str.length-suff.length, str.length);
        return strSuff == suff;
    }

    inline function log(msg) {
        Console.print("InlayUnlocker: " + msg);
    }
    
    inline function str(s) {
        if (s == undefined) {
            return ""
        }
        return "" + s;
    }

    inline function copyObjFields(dest, from) {
        local key;
        for (key in from) {
            dest[key] = from[key];
        }
    }
}
