include("LicenseManager/Ui.js");

namespace LicenseManagerObj {
    const var _appDir = FileSystem.getFolder(FileSystem.AppData);
    const var _idTokenFile = _appDir.getChildFile("license-manager.id");
    const var _accessTokenFile = _appDir.getChildFile("license-manager.access");

    const _apiBaseURL = "http://127.0.0.1:8080";
    const _deviceID = FileSystem.getSystemId();

    var _cfg = {
        productId: "",
        publicKey: "",
    };
    var _locked = true;
    var _activationId = "";
    var _onRequestAccessFinished = undefined;
    var _lastApiPost = {
        path: "",
        body: {},
        callback: function (status, resp) {},
    };

    inline function init(cfg) {
        _cfg = cfg;

        Console.print("LicenseManagerObj.run");
        Console.print("- productID: " + _cfg.productId);
        Console.print("- publicKey: " + _cfg.publicKey);
        Console.print("- deviceID: " + _deviceID);
        Console.print("- appDir: " + _appDir.toString(0));

        local idToken = _idTokenFile.loadAsString();
        if (idToken == "") {
            showActivationScreen();
            return;
        }

        local accessClaims = checkAccessOffline();
        if (!accessClaims) {
            showInProgressScreenAndRequestAccess(idToken);
            return;
        }

        _locked = false;
        scheduleRefreshAccess(idToken);
    }

    inline function isLocked() {
        return _locked;
    }

    inline function checkAccessOffline() {
        Console.print("checkAccessOffline");

        local token = _accessTokenFile.loadAsString();
        if (token == "") {
            Console.print("- no access token");
            return undefined;
        }

        local claims = validateAccessToken(token);
        if (!claims) {
            Console.print("- invalid access token");
            return undefined;
        }

        return claims;
    }

    inline function validateAccessToken(token) {
        Console.print("validateAccessToken");

        local claimsJson = decryptRSAJSON(token, _cfg.publicKey);
        if (!claimsJson) {
            Console.print("- decryptRSAJSON failed");
            return undefined;
        }

        local claimsObj = makeAccessTokenClaimsObjFromJSON(claimsJson);

        if (!validateAccessTokenClaims(claimsObj)) {
            Console.print("- invalid access token claims");
            return undefined;
        }

        return claims;
    }

    inline function makeAccessTokenClaimsObjFromJSON(claimsJson) {
        return {
            productIdSuff: claimsJson["p"],
            deviceId: claimsJson["d"],
            issuedAt: claimsJson["i"] * 1000,
            expiresAt: claimsJson["e"] * 1000,
        };
    }

    inline function validateAccessTokenClaims(claimsObj) {
        local now = Date.getSystemTimeMs();

        return claimsObj.productIdSuff != "" && hasSuffix(_cfg.productId, claimsObj.productIdSuff) &&
            claimsObj.deviceId == _deviceID &&
            claimsObj.expiresAt != undefined && claimsObj.expiresAt > now &&
            claimsObj.issuedAt != undefined && claimsObj.issuedAt < now;
    }

    inline function refreshAccess (idToken) {
        Console.print("refreshAccess");

        local cb = function (status, respBody) {
            Console.print("refreshAccess: requestAccess status: " + status);

            if (status == 422) {
                showActivationScreen();
                return;
            }

            if (status != 200) {
                return; // assuming that refresh will be retried on the next launch
            }

            saveAccessTokenFromResponse(respBody);
        };

        requestAccess(idToken, cb);
    }

    inline function showActivationScreen() {
        Console.print("showActivationScreen");

        LicenseManagerUi.showActivationScreen(startActivationProcess, completeActivationProcess);
    }

    inline function showInProgressScreenAndRequestAccess(idToken){
        Console.print("showInProgressScreenAndRequestAccess");
        LicenseManagerUi.showAuthInProgressScreen();

        local cb = function (status, resp) {
            Console.print("showInProgressScreenAndRequestAccess.cb: status: " + status);
            // specific error
            if (status == 422) {
                showActivationScreen();
                return;
            }

            // general error
            if (status != 200) {
                LicenseManagerUi.showHttpErrDialog(status, retryLastApiPost, LicenseManagerUi.setAuthProgressAborted);
                return;
            }

            saveAccessTokenFromResponse(respBody);

            var accessClaims = checkAccessOffline();
            if (!accessClaims) {
                Console.print("CAOFASA: checkAccessOffline failed after successful authorization");
                LicenseManagerUi.showInternalErrDialog("CAOFASAZ");
                return;
            }

            _locked = false;
            LicenseManagerUi.hideAuthInProgressScreen();
        };

        requestAccess(idToken, cb);
    }

    inline function requestAccess(idToken, cb) {
        Console.print("requestAccess");
        local body = {
            idToken: idToken,
        };
        apiPost("auth/access", body, cb);
    }

    inline function scheduleRefreshAccess(idToken) {
        Console.print("scheduleRefreshAccess");
        // todo: call refreshAccess in <1-100> seconds
        refreshAccess(idToken);
    }

    inline function startActivationProcess() {
        Console.print("startActivationProcess");

        local reqBody = {
            meta: getMetaData(),
        };

        local cb = function(status, resp){
            if (status != 200) {
                LicenseManagerUi.showHttpErrDialog(status, retryLastApiPost, noop);
                return;
            }

            _activationId = resp.activationId;
            var continueUrl = _apiBaseURL + "/auth/continue?activationId=" + _activationId;
            Engine.openWebsite(continueUrl);
        };

        apiPost("auth/start", reqBody, cb);
    }

    inline function completeActivationProcess() {
        Console.print("completeActivationProcess. activationId: " + _activationId);

        local reqBody = {
            activationId: _activationId,
        };

        local cb = function(status, resp){
            if (status == 422) {
                // show non retryable error
                return;
            }

            if (status != 200) {
                LicenseManagerUi.showHttpErrDialog(status, retryLastApiPost, noop);
                return;
            }

            saveAccessTokenFromResponse(resp);
            saveIdTokenFromResponse(resp);

            var accessClaims = checkAccessOffline();
            if (!accessClaims) {
                Console.print("CAOFASAN: checkAccessOffline failed after successful authentication");
                LicenseManagerUi.showInternalErrDialog("CAOFASAN");
                return;
            }

            _locked = false;
            LicenseManagerUi.hideActivationScreen();
        };

        apiPost("auth/complete", reqBody, cb);
    }

    inline function hasSuffix(str, suff) {
        local strSuff = str.substring(str.length-suff.length, str.length);
        return strSuff == suff;
    }

    inline function decryptRSAJSON(enc, pubKey) {
        local claimsJSON = FileSystem.decryptWithRSA(enc, pubKey);
        local claims = claimsJSON.parseAsJSON();

        return claims;
    }

    inline function apiPost(path, body, callback) {
        Console.print("apiPost: " + _apiBaseURL + "/" + path);
        Server.setBaseURL(_apiBaseURL);
        Server.setEnforceTrailingSlash(false);

        body["_stub"] = {}; // force JSON body

        _lastApiPost = {
            path: path,
            body: body,
            callback: callback,
        };

        Server.callWithPOST(path, body, callback);
    }

    inline function retryLastApiPost() {
        Server.callWithPOST(_lastApiPost.path, _lastApiPost.body, _lastApiPost.callback);
    }

    inline function saveIdTokenFromResponse(okResponse) {
        local token = okResponse.idToken;
        _idTokenFile.writeString(token);
    }

    inline function saveAccessTokenFromResponse(okResponse) {
        local token = okResponse.accessToken;
        _accessTokenFile.writeString(token);
    }

    inline function getMetaData() {
        return {
            systemId:  FileSystem.getSystemId(),
            systemStats: Engine.getSystemStats(),
            productId: _cfg.productId,
            productVersion: Engine.getVersion(),
            productName: Engine.getName(),
            isPlugin: Engine.isPlugin(),
        }
    }

    inline function noop() {}
}
