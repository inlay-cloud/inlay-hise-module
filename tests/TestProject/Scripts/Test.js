include("Inlay/Unlocker.js");

namespace InlayTest {
    runAllTests();
    
    inline function runAllTests() {
        Console.print("");
        Console.print("");

        local totals = {
            executed: 0,
            failed: 0,
            ok: 0,
            failedAsserts: 0,
            okAsserts: 0,

            add: function(t) {
                this.executed += 1;
                this.failedAsserts += t.failedAsserts;
                this.okAsserts += t.okAsserts;
                if (t.failed) {
                    this.failed += 1;
                } else {
                    this.ok += 1;
                }
            },
        };

        totals.add(test("FileSystem.decryptWithRSA", decryptWithRSA));
        totals.add(test("hise.Hash", hiseHash));
        totals.add(test("httpErrText", httpErrText));
        totals.add(test("getExpansionProductId", getExpansionProductId));
        
        totals.add(test("tokenValidator.parseSignedAccessToken", parseSignedAccessToken));
        totals.add(test("tokenValidator.validateAccessTokenClaims", validateAccessTokenClaims));
        totals.add(test("tokenValidator.makeAccessTokenClaimsObjFromJSON", makeAccessTokenClaimsObjFromJSON));
        totals.add(test("tokenValidator.loadAndValidateAccessToken", loadAndValidateAccessToken));
        totals.add(test("unlocker.startup", unlockerStartup));
        totals.add(test("unlocker.logout", unlockerLogout));
        totals.add(test("unlocker.getCurrentUser", unlockerGetCurrentUser));
        totals.add(test("unlocker.saveOkAuthResponse", unlockerSaveOkAuthResponse));
        totals.add(test("unlocker.setMetaData", unlockerSetMetaData));
        totals.add(test("unlocker.requestAccessToRefresh", unlockerRequestAccessToRefresh));
        totals.add(test("unlocker.checkRefresh", unlockerCheckRefresh));
        totals.add(test("unlocker.requestAccessToUnlock", unlockerRequestAccessToUnlock));
        totals.add(test("unlocker.retryUnlocking", unlockerRetryUnlocking));
        totals.add(test("unlocker.checkExpansion", unlockerCheckExpansion));
        totals.add(test("unlocker.unlockExpansion", unlockerUnlockExpansion));
        totals.add(test("unlocker.cancelExpansionUnlocking", unlockerCancelExpansionUnlocking));
        totals.add(test("unlocker.finishExpansionUnlocking", unlockerFinishExpansionUnlocking));
        totals.add(test("unlocker.handleExpansionOkAccessResp", unlockerHandleExpansionOkAccessResp));
        totals.add(test("unlocker.tryCompleteActivationProcess", unlockerTryCompleteActivationProcess));
        totals.add(test("unlocker.tryCompleteExpansionActivation", unlockerTryCompleteExpansionActivation));
        totals.add(test("unlocker.startActivation", unlockerStartActivation));

        benchmarkValidateAccessToken();

        local totalAsserts = totals.okAsserts + totals.failedAsserts;
        Console.print("");
        Console.print("Total tests executed: " + totals.executed + ", ok: " + totals.ok + ", failed: " + totals.failed);
        Console.print("Total asserts: " + totals.okAsserts + "/" + totalAsserts + " ok, failed: " + totals.failedAsserts);

        Console.print("");
        Console.print("");
    }

    inline function test(name, func) {
        local t = {
            failed: false,
            failedAsserts: 0,
            okAsserts: 0,
            subName: "",

            assert: function (b) {
                var caseName = this.getCaseName();

                if (!b) {
                    this.failed = true;
                    this.failedAsserts += 1;
                    Console.print("  " + caseName + ": assert failed");
                    return false;
                }
                this.okAsserts += 1;
                return true;
            },

            assertEqual: function(msg, l, r) {
                var caseName = this.getCaseName();
                if (l != r) {
                    this.failed = true;
                    this.failedAsserts += 1;
                    Console.print("!!!  " + caseName + ": " + msg);
                    return false;
                } else {
                    this.okAsserts += 1;
                    return true;
                }
            },

            getCaseName: function() {
                var caseName = this.subName;
                if (caseName == "") {
                    caseName = "assert #" + (this.failedAsserts + this.okAsserts);
                }
                return caseName;
            }
        };

        Console.print("Running test: " + name);
        func(t);
        local total = t.okAsserts + t.failedAsserts;
        if (!t.failed) {
            Console.print(t.okAsserts + "/" + total + " PASSED\n");
        } else {
            Console.print(t.failedAsserts + "/" + total + " FAILED!!!\n");
        }

        return t;
    }

    inline function validateAccessTokenClaims(t) {
        local validator = InlayUnlocker.createTokenValidator("", "my-test-product-id", FileSystem.getSystemId());

        t.subName = "all valid";
        {
            local c = {
                "p": "-test-product-id", // ok
                "d": FileSystem.getSystemId(), // ok
                "e": 1857787893, // ok
                "i": 1757787893, // ok
            };
            local co = validator.makeAccessTokenClaimsObjFromJSON(c);

            t.assertEqual("access token claims", validator.validateAccessTokenClaims(co), true);
        }

        t.subName = "invalid device id";
        {
            local c = {
                "p": "-test-product-id", // ok
                "d": FileSystem.getSystemId() + "+extra", // NOK
                "e": 1857787893, // ok
                "i": 1757787893, // ok
            };
            local co = validator.makeAccessTokenClaimsObjFromJSON(c);
            t.assertEqual("access token claims", validator.validateAccessTokenClaims(co), false);
        }

        t.subName = "expired";
        {
            local c = {
                "p": "-test-product-id", // ok
                "d": FileSystem.getSystemId() , // ok
                "e": 1757787893, // NOK
                "i": 1757787893, // ok
            };
            local co = validator.makeAccessTokenClaimsObjFromJSON(c);
            t.assertEqual("access token claims", validator.validateAccessTokenClaims(co), false);
        }

        t.subName = "issued in future";
        {
            local c = {
                "p": "-test-product-id", // ok
                "d": FileSystem.getSystemId() , // ok
                "e": 1857787893, // ok
                "i": 1857787893, // NOK
            };
            local co = validator.makeAccessTokenClaimsObjFromJSON(c);
            t.assertEqual("access token claims", validator.validateAccessTokenClaims(co), false);
        }

        t.subName = "missed product id suff";
        {
            local c = {
                "d": FileSystem.getSystemId() , // ok
                "e": 1857787893, // ok
                "i": 1757787893, // ok
            };
            local co = validator.makeAccessTokenClaimsObjFromJSON(c);
            t.assertEqual("access token claims", validator.validateAccessTokenClaims(co), false);
        }

        t.subName = "missed device id";
        {
            local c = {
                "p": "-test-product-id", // ok
                "e": 1857787893, // ok
                "i": 1757787893, // ok
            };
            local co = validator.makeAccessTokenClaimsObjFromJSON(c);
            t.assertEqual("access token claims", validator.validateAccessTokenClaims(co), false);
        }

        t.subName = "missed expiration";
        {
            local c = {
                "d": FileSystem.getSystemId() , // ok
                "p": "-test-product-id", // ok
                "i": 1757787893, // ok
            };
            local co = validator.makeAccessTokenClaimsObjFromJSON(c);
            t.assertEqual("access token claims", validator.validateAccessTokenClaims(co), false);
        }

        t.subName = "missed issued at";
        {
            local c = {
                "d": FileSystem.getSystemId() , // ok
                "e": 1857787893, // ok
                "p": "-test-product-id", // ok
            };
            local co = validator.makeAccessTokenClaimsObjFromJSON(c);
            t.assertEqual("access token claims", validator.validateAccessTokenClaims(co), false);
        }
    }

    inline function makeAccessTokenClaimsObjFromJSON(t) {
        local validator = InlayUnlocker.createTokenValidator("", "", "");

        local cases = [
            { name: "missing defaults to one day", input: undefined, expected: 1 },
            { name: "positive integer", input: 3, expected: 3 },
            { name: "zero", input: 0, expected: 0 },
            { name: "minus one", input: -1, expected: -1 },
            { name: "fraction defaults to one day", input: 0.5, expected: 1 },
            { name: "string defaults to one day", input: "3", expected: 1 },
            { name: "below minus one defaults to one day", input: -2, expected: 1 },
            { name: "positive infinity defaults to one day", input: 1 / 0, expected: 1 },
            { name: "negative infinity defaults to one day", input: -1 / 0, expected: 1 },
        ];

        for (testCase in cases) {
            t.subName = testCase.name;
            local claims = validator.makeAccessTokenClaimsObjFromJSON({ "r": testCase.input });
            t.assertEqual("claims.refreshAfterDays", claims.refreshAfterDays, testCase.expected);
        }
    }

    inline function decryptWithRSA(t) {
        local public = "10001,a4390d557ff756d07678aead66f1b0e44c4ab2c7a0d4e5312964e9b0ab328d2bc40f2c177318e13fecc21fb738c0675d979e5095908cdde40fbd5a5d46acd7bc4f101c4dd9f38e46425c62de23ee7f0afa679d3aab926c9e3c7815ecf13e751afa5f9fd6951fe9230a9532fb5c10de20e21898375d893da8de27a2d447a9e23ab347e6107934a7eb62c527226ebea87bd8f1d387b78a044006eead3c6e113e4db8f37f294df1ad76ceada6599d17403fa2e1c9723587f81d01e8fcbd106c6c4fb5380871205e4601abd2ffbcdaf064c185b033b87c1a8f1075e85613244127c2ca4d1f58ae727b4d7d1fa04d161f2e3a089b2b3a795fc996dbf8917b70773369";
        local private = "8f61d0a689e7e640746fc1f35c224193d29895a77e60e30b1d5d223c41fd0d0cdd4d71edb76c4d9e8694a7244dc48f7b43d9d1fa040f39dcd97135e8a2c05e4be7abe54a83b506cf89392889534df4561d7341efebc51858bfeb0919ab3820fec103a486b204fe84bdc4ae92903b99f593f26d5449b27dc766cfac77336abc3da59d9e2c567414d244fc73e26af506a19e06d2ee5dc5a000246a52ca45e4ac074cfac0c24bdc47ecd343605b348d2e4d8f3939b207019265602be3397903c125bd926251950ce6558c240d4a69f5759b1bf896278a69f383a4d6a029b4e03092f9b3b85cea6653c5f426c837b22b8ac1fed41bb064feed1adecb0c9f34da101,a4390d557ff756d07678aead66f1b0e44c4ab2c7a0d4e5312964e9b0ab328d2bc40f2c177318e13fecc21fb738c0675d979e5095908cdde40fbd5a5d46acd7bc4f101c4dd9f38e46425c62de23ee7f0afa679d3aab926c9e3c7815ecf13e751afa5f9fd6951fe9230a9532fb5c10de20e21898375d893da8de27a2d447a9e23ab347e6107934a7eb62c527226ebea87bd8f1d387b78a044006eead3c6e113e4db8f37f294df1ad76ceada6599d17403fa2e1c9723587f81d01e8fcbd106c6c4fb5380871205e4601abd2ffbcdaf064c185b033b87c1a8f1075e85613244127c2ca4d1f58ae727b4d7d1fa04d161f2e3a089b2b3a795fc996dbf8917b70773369";

        {
            local secret = "Hello from GO!";
            local enc = FileSystem.encryptWithRSA(secret, private);
            local dec = FileSystem.decryptWithRSA(enc, public);
            t.assertEqual("RSA decrypt round trip", dec, secret);
        }
        {
            // encoded in Go
            local enc = "433db8a608d5760216e3183d5b7790a5cff9dfb94241228db0e33e3386038ad9646f517eb9b4cd38e3eec02347ba830b40030f42495634a237e69378e1b5d95a366becdeb4b887852606d51a786ac3690982eb55d4d06eb406c4e91d96985a1491a2c18515e36d44e681ee71b0e9334acce191c18ad10324479cbdad295f5058889f43a123c15358a08917f6908b5d969237b4ad4c0e19e137d749bbf5390735bf20077dc10c58266dc4059b7d1fc30a559303885cbd9b6ed50527396171c25eb8335736309233846530e931f6ffbd69c4b94a82b0d3b030c9e5bb13477a215fafde350dbf58363d71be30333630dfa44815df2e620e9c0a94bab15ff91a2bea";
            local dec = FileSystem.decryptWithRSA(enc, public);
            t.assertEqual("RSA decrypt Go string", dec, "Hello from GO!");
        }
        {
            // encoded JSON in Go 
            local enc = "464b57df693cdf4b38eaa681fab4407c83ff2eb7db24066bb6fc674f37c3a42dc6d2df5774a733a550b3b74771c870be8439be62738539babb5f63f32c42d4d4ce47c09e8e0c4d5aeaa20a1698411396a70185cf14c2b595809611a7ee6d826a5dd4e93916a0426e5a1c7e61a743335e35ebc6034cb9120790dad4c99c4cd5b49fc3613e9b93c62d4659e027420b914d53abbeb630f07f0b78965e1ee5ddd7034f90c1a6a8228ad0986f6256de00c4e57207b16ac417b738bfa1dea283d984143921f65361d80337c83268f07aa74e7bcfae6e837d27810438073bfe605ff23db1b30ae26d7fc8d4f8d272ff201d75211bb748432e307add2d1b1d5ba784bde";
            local dec = FileSystem.decryptWithRSA(enc, public);
            t.assertEqual("RSA decrypt Go JSON", dec, '{"p":"8d40be3179","m":"L8D2F4A6E1","e":17577105045}');
        }

        return true;
    }

    inline function hiseHash(t) {
        t.subName = "empty";
        t.assertEqual("hash", "".hash(), "0");

        t.subName = "single character";
        t.assertEqual("hash", "a".hash(), "97");

        t.subName = "short ascii";
        t.assertEqual("hash", "abc".hash(), "999494");

        t.subName = "word";
        t.assertEqual("hash", "hello".hash(), "10927454832");

        t.subName = "payload with digits";
        t.assertEqual("hash", "payload-123".hash(), "9178236762498733625");

        t.subName = "access claims json";
        t.assertEqual("hash", "{\"p\":\"prod_123\",\"d\":\"dev_456\",\"e\":1712345678,\"i\":1712341234}".hash(), "-2888271669555255183");

        t.subName = "access claims json 2";
        t.assertEqual("hash", "{\"p\":\"MDD0FE2F21\",\"d\":\"JSKDJKSJ\",\"e\":1712440000,\"i\":1712441111}".hash(), "-12651648732088023");

        t.subName = "access claims json 3";
        t.assertEqual("hash", "{\"p\":\"MDD0AAAF21\",\"d\":\"JSKDJKSJ\",\"e\":1712440000,\"i\":1712441111}".hash(), "2950813302869975095");

        t.subName = "access claims json 4";
        t.assertEqual("hash", "{\"p\":\"MDD0AAAF21\",\"d\":\"JSKDJKSJ\",\"e\":1712440000,\"i\":1712441112}".hash(), "2950813302869975196");

        t.subName = "access claims json 5";
        t.assertEqual("hash", "{\"p\":\"prod_123\",\"d\":\"dev_456\",\"e\":1712345678,\"i\":1712341234}".hash(), "-2888271669555255183");
    }

    inline function httpErrText(t) {
        t.subName = "uses response message";
        t.assertEqual("HTTP error text", InlayUnlocker.httpErrText(403, {
            message: "License activation is not allowed",
            traceId: "trace-ignored",
        }), "License activation is not allowed");

        t.subName = "uses status without message";
        t.assertEqual("HTTP error text", InlayUnlocker.httpErrText(503, {}), "HTTP error. Status: 503");

        t.subName = "appends trace id";
        t.assertEqual("HTTP error text", InlayUnlocker.httpErrText(500, {
            traceId: "trace-123",
        }), "HTTP error. Status: 500. Trace: trace-123");

        t.subName = "default message for 0 status";
        t.assertEqual("HTTP error text", InlayUnlocker.httpErrText(0, {}), "HTTP error. Check your internet connection.");
    }

    inline function unlockerStartup(t) {
        local createStartupTestUnlocker = function(idToken, accessClaims, appUpdate) {
            var unlocker = InlayUnlocker.create({
                productId: "startup-test-product-id",
                publicKey: "",
                apiUrl: "",
            });

            unlocker.idTokenFile = {
                value: idToken,
                loadAsString: function() {
                    return this.value;
                }
            };

            unlocker.updateFile = {
                calls: 0,
                value: appUpdate,
                loadAsObject: function() {
                    this.calls += 1;
                    return this.value;
                },
            };

            unlocker.tokenValidator = {
                calls: 0,
                result: accessClaims,
                loadAndValidateAccessToken: function() {
                    this.calls += 1;
                    return this.result;
                }
            };

            unlocker.broadcastedStatuses = [];
            unlocker.broadcastStatus = function(status) {
                this.broadcastedStatuses.push(status);
            };

            return unlocker;
        };

        t.subName = "loads app update from file";
        {
            local appUpdate = {
                version: "1.2.3",
                url: "https://updates.example/app.zip",
            };
            local unlocker = createStartupTestUnlocker("", undefined, appUpdate);

            unlocker.startup();

            t.assertEqual("unlocker.updateFile.calls", unlocker.updateFile.calls, 1);
            t.assertEqual("unlocker.appUpdate.version", unlocker.appUpdate.version, "1.2.3");
            t.assertEqual("unlocker.appUpdate.url", unlocker.appUpdate.url, "https://updates.example/app.zip");
        }

        t.subName = "missing id token requires activation";
        {
            local unlocker = createStartupTestUnlocker("", undefined);

            unlocker.startup();

            t.assertEqual("unlocker.idToken", unlocker.idToken, "");
            t.assertEqual("unlocker.broadcastedStatuses.length", unlocker.broadcastedStatuses.length, 1);
            t.assertEqual("unlocker.broadcastedStatuses[0]", unlocker.broadcastedStatuses[0], InlayUnlocker.STATUS_ACTIVATION_REQUIRED);
            t.assertEqual("unlocker.tokenValidator.calls", unlocker.tokenValidator.calls, 0);
        }

        t.subName = "missing access token starts unlocking";
        {
            local unlocker = createStartupTestUnlocker("id-token", undefined);

            unlocker.startup();

            t.assertEqual("unlocker.idToken", unlocker.idToken, "id-token");
            t.assertEqual("unlocker.accessClaims is undefined", unlocker.accessClaims == undefined, true);
            t.assertEqual("unlocker.broadcastedStatuses.length", unlocker.broadcastedStatuses.length, 1);
            t.assertEqual("unlocker.broadcastedStatuses[0]", unlocker.broadcastedStatuses[0], InlayUnlocker.STATUS_UNLOCKING);
            t.assertEqual("unlocker.tokenValidator.calls", unlocker.tokenValidator.calls, 1);
        }

        t.subName = "valid access token unlocks";
        {
            local claims = {
                userEmail: "user@example.com"
            };
            local unlocker = createStartupTestUnlocker("id-token", claims);

            unlocker.startup();

            t.assertEqual("unlocker.idToken", unlocker.idToken, "id-token");
            t.assertEqual("unlocker.accessClaims.userEmail", unlocker.accessClaims.userEmail, "user@example.com");
            t.assertEqual("unlocker.broadcastedStatuses.length", unlocker.broadcastedStatuses.length, 1);
            t.assertEqual("unlocker.broadcastedStatuses[0]", unlocker.broadcastedStatuses[0], InlayUnlocker.STATUS_UNLOCKED);
            t.assertEqual("unlocker.tokenValidator.calls", unlocker.tokenValidator.calls, 1);
        }
    }

    inline function unlockerLogout(t) {
        local createDeleteableFile = function() {
            return {
                deleteCalls: 0,
                deleteFileOrDirectory: function() {
                    this.deleteCalls++;
                },
            };
        };

        t.subName = "clears tokens and requires activation";
        {
            var unlocker = InlayUnlocker.create({
                productId: "logout-test-product-id",
                publicKey: "",
                apiUrl: "",
            });

            unlocker.idToken = "id-token";
            unlocker.accessClaims = {
                userEmail: "user@example.com",
            };
            unlocker.idTokenFile = createDeleteableFile();
            unlocker.accessTokenFile = createDeleteableFile();
            unlocker.expansionsDir = createDeleteableFile();

            unlocker.broadcastedStatuses = [];
            unlocker.broadcastStatus = function(status) {
                this.broadcastedStatuses.push(status);
            };

            unlocker.logout();

            t.assertEqual("unlocker.idToken is undefined", unlocker.idToken == undefined, true);
            t.assertEqual("unlocker.accessClaims is undefined", unlocker.accessClaims == undefined, true);
            t.assertEqual("unlocker.getCurrentUser() is undefined", unlocker.getCurrentUser() == undefined, true);
            t.assertEqual("unlocker.idTokenFile.deleteCalls", unlocker.idTokenFile.deleteCalls, 1);
            t.assertEqual("unlocker.accessTokenFile.deleteCalls", unlocker.accessTokenFile.deleteCalls, 1);
            t.assertEqual("unlocker.expansionsDir.deleteCalls", unlocker.expansionsDir.deleteCalls, 1);
            t.assertEqual("unlocker.broadcastedStatuses.length", unlocker.broadcastedStatuses.length, 1);
            t.assertEqual("unlocker.broadcastedStatuses[0]", unlocker.broadcastedStatuses[0], InlayUnlocker.STATUS_ACTIVATION_REQUIRED);
        }
    }

    inline function unlockerGetCurrentUser(t) {
        local createGetCurrentUserTestUnlocker = function() {
            return InlayUnlocker.create({
                productId: "get-current-user-test-product-id",
                publicKey: "",
                apiUrl: "",
            });
        };

        t.subName = "missing access claims returns undefined";
        {
            local unlocker = createGetCurrentUserTestUnlocker();

            t.assertEqual("unlocker.getCurrentUser() is undefined", unlocker.getCurrentUser() == undefined, true);
        }

        t.subName = "empty user email returns undefined";
        {
            local unlocker = createGetCurrentUserTestUnlocker();
            unlocker.accessClaims = {
                userEmail: "",
            };

            t.assertEqual("unlocker.getCurrentUser() is undefined", unlocker.getCurrentUser() == undefined, true);
        }

        t.subName = "current user email is returned";
        {
            local unlocker = createGetCurrentUserTestUnlocker();
            unlocker.accessClaims = {
                userEmail: "user@example.com",
            };

            t.assertEqual("unlocker.getCurrentUser()", unlocker.getCurrentUser(), "user@example.com");
        }
    }

    inline function unlockerSaveOkAuthResponse(t) {
        local createWritableStringFile = function(value) {
            return {
                value: value,
                writeString: function(value) {
                    this.value = value;
                },
            };
        };

        local createWritableObjectFile = function() {
            return {
                value: undefined,
                deleted: false,
                writeObject: function(value) {
                    this.value = value;
                    this.deleted = false;
                },
                deleteFileOrDirectory: function() {
                    this.value = undefined;
                    this.deleted = true;
                },
            };
        };

        local createSaveAuthResponseUnlocker = function[createWritableStringFile, createWritableObjectFile](accessClaims) {
            var unlocker = InlayUnlocker.create({
                productId: "save-auth-response-test-product-id",
                publicKey: "",
                apiUrl: "",
            });

            unlocker.accessTokenFile = createWritableStringFile("old-access-token");
            unlocker.idTokenFile = createWritableStringFile("old-id-token");
            unlocker.updateFile = createWritableObjectFile();
            unlocker.tokenValidator = {
                calls: [],
                result: accessClaims,
                validateAccessToken: function(token) {
                    this.calls.push(token);
                    return this.result;
                },
            };
            unlocker.expansionsDir = {
                requestedIds: [],
                files: {},
                getChildFile: function(id) {
                    this.requestedIds.push(id);
                    if (!isDefined(this.files[id])) {
                        this.files[id] = {
                            value: undefined,
                            writeObject: function(value) {
                                this.value = value;
                            },
                        };
                    }

                    return this.files[id];
                },
            };

            return unlocker;
        };

        t.subName = "persists access token and validates claims";
        {
            local claims = {
                userEmail: "user@example.com",
            };
            local unlocker = createSaveAuthResponseUnlocker(claims);

            unlocker.saveOkAuthResponse({
                accessToken: "access-token",
            });

            t.assertEqual("unlocker.accessTokenFile.value", unlocker.accessTokenFile.value, "access-token");
            t.assertEqual("unlocker.tokenValidator.calls.length", unlocker.tokenValidator.calls.length, 1);
            t.assertEqual("unlocker.tokenValidator.calls[0]", unlocker.tokenValidator.calls[0], "access-token");
            t.assertEqual("unlocker.accessClaims.userEmail", unlocker.accessClaims.userEmail, "user@example.com");
        }

        t.subName = "ignores missing access token";
        {
            local unlocker = createSaveAuthResponseUnlocker(undefined);
            unlocker.accessClaims = {
                userEmail: "previous@example.com",
            };

            unlocker.saveOkAuthResponse({});

            t.assertEqual("unlocker.accessTokenFile.value", unlocker.accessTokenFile.value, "old-access-token");
            t.assertEqual("unlocker.tokenValidator.calls.length", unlocker.tokenValidator.calls.length, 0);
            t.assertEqual("unlocker.accessClaims.userEmail", unlocker.accessClaims.userEmail, "previous@example.com");
        }

        t.subName = "persists id token";
        {
            local unlocker = createSaveAuthResponseUnlocker(undefined);

            unlocker.saveOkAuthResponse({
                idToken: "id-token",
            });

            t.assertEqual("unlocker.idToken", unlocker.idToken, "id-token");
            t.assertEqual("unlocker.idTokenFile.value", unlocker.idTokenFile.value, "id-token");
        }

        t.subName = "persists app update";
        {
            local unlocker = createSaveAuthResponseUnlocker(undefined);

            unlocker.saveOkAuthResponse({
                appUpdate: {
                    version: "1.2.3",
                    url: "https://updates.example/app.zip",
                },
            });

            t.assertEqual("unlocker.appUpdate.version", unlocker.appUpdate.version, "1.2.3");
            t.assertEqual("unlocker.updateFile.value.version", unlocker.updateFile.value.version, "1.2.3");
            t.assertEqual("unlocker.updateFile.value.url", unlocker.updateFile.value.url, "https://updates.example/app.zip");
            t.assertEqual("unlocker.updateFile.deleted", unlocker.updateFile.deleted, false);
        }

        t.subName = "deletes stale app update when missing";
        {
            local unlocker = createSaveAuthResponseUnlocker(undefined);
            unlocker.updateFile.writeObject({
                version: "old-version",
                url: "https://updates.example/old.zip",
            });

            unlocker.saveOkAuthResponse({});

            t.assertEqual("unlocker.appUpdate", unlocker.appUpdate, undefined);
            t.assertEqual("unlocker.updateFile.value", unlocker.updateFile.value, undefined);
            t.assertEqual("unlocker.updateFile.deleted", unlocker.updateFile.deleted, true);
        }

        t.subName = "persists subproduct access by id";
        {
            local unlocker = createSaveAuthResponseUnlocker(undefined);

            unlocker.saveOkAuthResponse({
                subproducts: {
                    "expansion-a": {
                        accessToken: "expansion-a-access-token",
                        updateUrl: "https://updates.example/expansion-a.zip",
                    },
                    "expansion-b": {
                        accessToken: "expansion-b-access-token",
                        updateUrl: "https://updates.example/expansion-b.zip",
                    },
                },
            });

            t.assertEqual("unlocker.expansionsDir.requestedIds.length", unlocker.expansionsDir.requestedIds.length, 2);
            t.assertEqual("unlocker.expansionsDir.files[expansion-a].value.accessToken", unlocker.expansionsDir.files["expansion-a"].value.accessToken, "expansion-a-access-token");
            t.assertEqual("unlocker.expansionsDir.files[expansion-a].value.updateUrl", unlocker.expansionsDir.files["expansion-a"].value.updateUrl, "https://updates.example/expansion-a.zip");
            t.assertEqual("unlocker.expansionsDir.files[expansion-b].value.accessToken", unlocker.expansionsDir.files["expansion-b"].value.accessToken, "expansion-b-access-token");
            t.assertEqual("unlocker.expansionsDir.files[expansion-b].value.updateUrl", unlocker.expansionsDir.files["expansion-b"].value.updateUrl, "https://updates.example/expansion-b.zip");
        }
    }

    inline function unlockerSetMetaData(t) {
        local createExpansionFile = function(name, isFile, data) {
            return {
                name: name,
                file: isFile,
                data: data,

                isFile: function() {
                    return this.file;
                },

                toString: function(format) {
                    return this.name;
                },

                loadAsObject: function() {
                    return this.data;
                },
            };
        };

        local createMetaDataUnlocker = function[createExpansionFile](files) {
            var unlocker = InlayUnlocker.create({
                productId: "metadata-test-product-id",
                publicKey: "",
                apiUrl: "",
            });

            unlocker.getExpansionFilesCalls = 0;
            unlocker.expansionFiles = files;
            unlocker.getExpansionFiles = function() {
                this.getExpansionFilesCalls += 1;
                return this.expansionFiles;
            };

            return unlocker;
        };

        t.subName = "includes cached expansion ids and versions";
        {
            local unlocker = createMetaDataUnlocker([
                createExpansionFile("01KQEN95FVR6CQCFMDD0AAAF21", true, {
                    version: "1.2.3",
                    accessToken: "expansion-a-access-token",
                }),
                createExpansionFile("01KQEN95FVR6CQCF6DSGA04QYJ", true, {
                    version: "4.5.6",
                    accessToken: "expansion-b-access-token",
                }),
            ]);

            local meta = unlocker.setMetaData({
                idToken: "id-token",
            });

            t.assertEqual("unlocker.getExpansionFilesCalls", unlocker.getExpansionFilesCalls, 1);
            t.assertEqual("meta.idToken", meta.idToken, "id-token");
            t.assertEqual("meta.productId", meta.productId, "metadata-test-product-id");
            t.assertEqual("meta.subproducts.length", meta.subproducts.length, 2);
            t.assertEqual("meta.subproducts[0].id", meta.subproducts[0].id, "01KQEN95FVR6CQCFMDD0AAAF21");
            t.assertEqual("meta.subproducts[0].version", meta.subproducts[0].version, "1.2.3");
            t.assertEqual("meta.subproducts[0].accessToken is undefined", meta.subproducts[0].accessToken == undefined, true);
            t.assertEqual("meta.subproducts[1].id", meta.subproducts[1].id, "01KQEN95FVR6CQCF6DSGA04QYJ");
            t.assertEqual("meta.subproducts[1].version", meta.subproducts[1].version, "4.5.6");
            t.assertEqual("meta.subproducts[1].accessToken is undefined", meta.subproducts[1].accessToken == undefined, true);
        }

        t.subName = "skips non-files invalid ids missing data and empty versions";
        {
            local unlocker = createMetaDataUnlocker([
                createExpansionFile("01KQEN95FVR6CQCFMDD0AAAF21", false, {
                    version: "1.2.3",
                }),
                createExpansionFile("too-short", true, {
                    version: "2.3.4",
                }),
                createExpansionFile("01KQEN95FVR6CQCF6DSGA04QYJ", true, undefined),
                createExpansionFile("01KQEN95FVR6CQCFMDD0AAAF22", true, {
                    version: "",
                }),
            ]);

            local meta = unlocker.setMetaData({});

            t.assertEqual("unlocker.getExpansionFilesCalls", unlocker.getExpansionFilesCalls, 1);
            t.assertEqual("meta.subproducts is undefined", meta.subproducts == undefined, true);
        }

        t.subName = "handles missing expansion files";
        {
            local unlocker = createMetaDataUnlocker(undefined);

            local meta = unlocker.setMetaData({});

            t.assertEqual("unlocker.getExpansionFilesCalls", unlocker.getExpansionFilesCalls, 1);
            t.assertEqual("meta.subproducts is undefined", meta.subproducts == undefined, true);
        }
    }

    inline function unlockerRequestAccessToRefresh(t) {
        local createRefreshTestUnlocker = function() {
            var unlocker = InlayUnlocker.create({
                productId: "refresh-test-product-id",
                publicKey: "",
                apiUrl: "",
            });

            unlocker.idToken = "id-token";
            unlocker.requestAccessCalls = [];
            unlocker.requestAccess = function(idToken, callback) {
                this.requestAccessCalls.push({
                    idToken: idToken,
                    callback: callback,
                });
            };

            unlocker.logoutCalls = 0;
            unlocker.logout = function() {
                this.logoutCalls += 1;
            };

            unlocker.savedResponses = [];
            unlocker.saveOkAuthResponse = function(resp) {
                this.savedResponses.push(resp);
            };

            return unlocker;
        };

        t.subName = "requests access with current id token";
        {
            local unlocker = createRefreshTestUnlocker();

            unlocker.requestAccessToRefresh();

            t.assertEqual("unlocker.requestAccessCalls.length", unlocker.requestAccessCalls.length, 1);
            t.assertEqual("unlocker.requestAccessCalls[0].idToken", unlocker.requestAccessCalls[0].idToken, "id-token");
            t.assertEqual("unlocker.requestAccessCalls[0].callback is set", unlocker.requestAccessCalls[0].callback != undefined, true);
        }

        t.subName = "unprocessable id token logs out";
        {
            local unlocker = createRefreshTestUnlocker();

            unlocker.requestAccessToRefresh();
            unlocker.requestAccessCalls[0].callback(422, {});

            t.assertEqual("unlocker.logoutCalls", unlocker.logoutCalls, 1);
            t.assertEqual("unlocker.savedResponses.length", unlocker.savedResponses.length, 0);
        }

        t.subName = "server error does not save response";
        {
            local unlocker = createRefreshTestUnlocker();

            unlocker.requestAccessToRefresh();
            unlocker.requestAccessCalls[0].callback(503, {
                accessToken: "new-access-token",
            });

            t.assertEqual("unlocker.logoutCalls", unlocker.logoutCalls, 0);
            t.assertEqual("unlocker.savedResponses.length", unlocker.savedResponses.length, 0);
        }

        t.subName = "success saves auth response";
        {
            local unlocker = createRefreshTestUnlocker();

            unlocker.requestAccessToRefresh();
            unlocker.requestAccessCalls[0].callback(200, {
                accessToken: "new-access-token",
                idToken: "new-id-token",
            });

            t.assertEqual("unlocker.logoutCalls", unlocker.logoutCalls, 0);
            t.assertEqual("unlocker.savedResponses.length", unlocker.savedResponses.length, 1);
            t.assertEqual("unlocker.savedResponses[0].accessToken", unlocker.savedResponses[0].accessToken, "new-access-token");
            t.assertEqual("unlocker.savedResponses[0].idToken", unlocker.savedResponses[0].idToken, "new-id-token");
        }
    }

    inline function unlockerCheckRefresh(t) {
        local createCheckRefreshTestUnlocker = function(refreshAfterDays, ageMs) {
            var unlocker = InlayUnlocker.create({
                productId: "refresh-check-test-product-id",
                publicKey: "",
                apiUrl: "",
            });

            unlocker.accessClaims = {
                refreshAfterDays: refreshAfterDays,
                getAgeMs: function[ageMs]() {
                    return ageMs;
                },
            };
            unlocker.refreshCalls = 0;
            unlocker.requestAccessToRefresh = function() {
                this.refreshCalls += 1;
            };
            return unlocker;
        };

        t.subName = "refreshes after configured days";
        {
            local unlocker = createCheckRefreshTestUnlocker(2, 2 * 24 * 60 * 60 * 1000 + 1);
            unlocker.checkRefresh();
            t.assertEqual("unlocker.refreshCalls", unlocker.refreshCalls, 1);
        }

        t.subName = "stays fresh at configured days";
        {
            local unlocker = createCheckRefreshTestUnlocker(2, 2 * 24 * 60 * 60 * 1000);
            unlocker.checkRefresh();
            t.assertEqual("unlocker.refreshCalls", unlocker.refreshCalls, 0);
        }

        t.subName = "minus one never refreshes";
        {
            local unlocker = createCheckRefreshTestUnlocker(-1, 30 * 24 * 60 * 60 * 1000);
            unlocker.checkRefresh();
            t.assertEqual("unlocker.refreshCalls", unlocker.refreshCalls, 0);
        }

        t.subName = "zero refreshes positive-age token";
        {
            local unlocker = createCheckRefreshTestUnlocker(0, 1);
            unlocker.checkRefresh();
            t.assertEqual("unlocker.refreshCalls", unlocker.refreshCalls, 1);
        }

        t.subName = "zero does not refresh zero-age token";
        {
            local unlocker = createCheckRefreshTestUnlocker(0, 0);
            unlocker.checkRefresh();
            t.assertEqual("unlocker.refreshCalls", unlocker.refreshCalls, 0);
        }
    }

    inline function unlockerRequestAccessToUnlock(t) {
        local createUnlockAccessTestUnlocker = function(syncLockResult, accessClaims) {
            var unlocker = InlayUnlocker.create({
                productId: "unlock-access-test-product-id",
                publicKey: "",
                apiUrl: "",
            });

            unlocker.idToken = "id-token";

            unlocker.syncLockCalls = 0;
            unlocker.syncLockResult = syncLockResult;
            unlocker.syncLock = function() {
                this.syncLockCalls += 1;
                return this.syncLockResult;
            };

            unlocker.delayedCalls = [];
            unlocker.callWithDelay = function(delayMs, callback) {
                this.delayedCalls.push({
                    delayMs: delayMs,
                    callback: callback,
                });
            };

            unlocker.startupCalls = 0;
            unlocker.startup = function() {
                this.startupCalls += 1;
            };

            unlocker.requestAccessCalls = [];
            unlocker.requestAccess = function(idToken, callback) {
                this.requestAccessCalls.push({
                    idToken: idToken,
                    callback: callback,
                });
            };

            unlocker.logoutCalls = 0;
            unlocker.logout = function() {
                this.logoutCalls += 1;
            };

            unlocker.savedResponses = [];
            unlocker.saveOkAuthResponse = function[accessClaims](resp) {
                this.savedResponses.push(resp);
                this.accessClaims = accessClaims;
            };

            unlocker.unlockingErrors = [];
            unlocker.broadcastUnlockingError = function(error) {
                this.unlockingErrors.push(error);
            };

            unlocker.broadcastedStatuses = [];
            unlocker.broadcastStatus = function(status) {
                this.broadcastedStatuses.push(status);
            };

            return unlocker;
        };

        t.subName = "sync lock failure schedules startup retry";
        {
            local unlocker = createUnlockAccessTestUnlocker(false, undefined);

            unlocker.requestAccessToUnlock();

            t.assertEqual("unlocker.syncLockCalls", unlocker.syncLockCalls, 1);
            t.assertEqual("unlocker.requestAccessCalls.length", unlocker.requestAccessCalls.length, 0);
            t.assertEqual("unlocker.delayedCalls.length", unlocker.delayedCalls.length, 1);
            t.assertEqual("unlocker.delayedCalls[0].delayMs", unlocker.delayedCalls[0].delayMs, 2000);

            unlocker.delayedCalls[0].callback();
            t.assertEqual("unlocker.startupCalls", unlocker.startupCalls, 1);
        }

        t.subName = "requests access with current id token";
        {
            local unlocker = createUnlockAccessTestUnlocker(true, undefined);

            unlocker.requestAccessToUnlock();

            t.assertEqual("unlocker.syncLockCalls", unlocker.syncLockCalls, 1);
            t.assertEqual("unlocker.delayedCalls.length", unlocker.delayedCalls.length, 0);
            t.assertEqual("unlocker.requestAccessCalls.length", unlocker.requestAccessCalls.length, 1);
            t.assertEqual("unlocker.requestAccessCalls[0].idToken", unlocker.requestAccessCalls[0].idToken, "id-token");
            t.assertEqual("unlocker.requestAccessCalls[0].callback is set", unlocker.requestAccessCalls[0].callback != undefined, true);
        }

        t.subName = "unprocessable id token logs out";
        {
            local unlocker = createUnlockAccessTestUnlocker(true, undefined);

            unlocker.requestAccessToUnlock();
            unlocker.requestAccessCalls[0].callback(422, {});

            t.assertEqual("unlocker.logoutCalls", unlocker.logoutCalls, 1);
            t.assertEqual("unlocker.savedResponses.length", unlocker.savedResponses.length, 0);
            t.assertEqual("unlocker.broadcastedStatuses.length", unlocker.broadcastedStatuses.length, 0);
        }

        t.subName = "http error broadcasts unlocking error";
        {
            local unlocker = createUnlockAccessTestUnlocker(true, undefined);

            unlocker.requestAccessToUnlock();
            unlocker.requestAccessCalls[0].callback(503, {});

            t.assertEqual("unlocker.unlockingErrors.length", unlocker.unlockingErrors.length, 1);
            t.assertEqual("unlocker.unlockingErrors[0]", unlocker.unlockingErrors[0], "HTTP error. Status: 503");
            t.assertEqual("unlocker.savedResponses.length", unlocker.savedResponses.length, 0);
            t.assertEqual("unlocker.broadcastedStatuses.length", unlocker.broadcastedStatuses.length, 0);
        }

        t.subName = "successful auth with invalid access broadcasts internal error";
        {
            local unlocker = createUnlockAccessTestUnlocker(true, undefined);

            unlocker.requestAccessToUnlock();
            unlocker.requestAccessCalls[0].callback(200, {
                accessToken: "access-token",
                idToken: "id-token",
            });

            t.assertEqual("unlocker.savedResponses.length", unlocker.savedResponses.length, 1);
            t.assertEqual("unlocker.accessClaims is undefined", unlocker.accessClaims == undefined, true);
            t.assertEqual("unlocker.unlockingErrors.length", unlocker.unlockingErrors.length, 1);
            t.assertEqual("unlocker.unlockingErrors[0]", unlocker.unlockingErrors[0], "Internal error. Code: VFASAZ");
            t.assertEqual("unlocker.broadcastedStatuses.length", unlocker.broadcastedStatuses.length, 0);
        }

        t.subName = "successful auth unlocks";
        {
            local claims = {
                userEmail: "user@example.com",
            };
            local unlocker = createUnlockAccessTestUnlocker(true, claims);

            unlocker.requestAccessToUnlock();
            unlocker.requestAccessCalls[0].callback(201, {
                accessToken: "access-token",
                idToken: "id-token",
            });

            t.assertEqual("unlocker.savedResponses.length", unlocker.savedResponses.length, 1);
            t.assertEqual("unlocker.accessClaims.userEmail", unlocker.accessClaims.userEmail, "user@example.com");
            t.assertEqual("unlocker.getCurrentUser()", unlocker.getCurrentUser(), "user@example.com");
            t.assertEqual("unlocker.unlockingErrors.length", unlocker.unlockingErrors.length, 0);
            t.assertEqual("unlocker.broadcastedStatuses.length", unlocker.broadcastedStatuses.length, 1);
            t.assertEqual("unlocker.broadcastedStatuses[0]", unlocker.broadcastedStatuses[0], InlayUnlocker.STATUS_UNLOCKED);
        }
    }

    inline function unlockerRetryUnlocking(t) {
        local createRetryTestUnlocker = function(status, error) {
            var unlocker = InlayUnlocker.create({
                productId: "retry-test-product-id",
                publicKey: "",
                apiUrl: "",
            });

            unlocker.statusBroadcaster = {
                status: status,
            };

            unlocker.unlockingErrBroadcaster = {
                error: error,
            };

            unlocker.unlockingErrors = [];
            unlocker.broadcastUnlockingError = function(error) {
                this.unlockingErrBroadcaster.error = error;
                this.unlockingErrors.push(error);
            };

            unlocker.requestAccessCalls = 0;
            unlocker.requestAccessToUnlock = function() {
                this.requestAccessCalls += 1;
            };

            return unlocker;
        };

        t.subName = "ignored when status is not unlocking";
        {
            local unlocker = createRetryTestUnlocker(InlayUnlocker.STATUS_ACTIVATION_REQUIRED, "previous error");

            unlocker.retryUnlocking();

            t.assertEqual("unlocker.unlockingErrors.length", unlocker.unlockingErrors.length, 0);
            t.assertEqual("unlocker.requestAccessCalls", unlocker.requestAccessCalls, 0);
        }

        t.subName = "ignored when there is no unlocking error";
        {
            local unlocker = createRetryTestUnlocker(InlayUnlocker.STATUS_UNLOCKING, "");

            unlocker.retryUnlocking();

            t.assertEqual("unlocker.unlockingErrors.length", unlocker.unlockingErrors.length, 0);
            t.assertEqual("unlocker.requestAccessCalls", unlocker.requestAccessCalls, 0);
        }

        t.subName = "clears error and requests access";
        {
            local unlocker = createRetryTestUnlocker(InlayUnlocker.STATUS_UNLOCKING, "previous error");

            unlocker.retryUnlocking();

            t.assertEqual("unlocker.unlockingErrors.length", unlocker.unlockingErrors.length, 1);
            t.assertEqual("unlocker.unlockingErrors[0]", unlocker.unlockingErrors[0], "");
            t.assertEqual("unlocker.unlockingErrBroadcaster.error", unlocker.unlockingErrBroadcaster.error, "");
            t.assertEqual("unlocker.requestAccessCalls", unlocker.requestAccessCalls, 1);
        }
    }

    inline function unlockerCheckExpansion(t) {
        local publicKey = "10001,d00939d757247c6b9eda3b3c6f917bee54d59f0851947c9ddfa7391d7811fb64d85dbb70fa8380f5c50a6cb7b9d5ac1c7da6ea4701ef74d2ca5faefc08eacf82914179961d668cd18020f2f5c7bbba369a725afd29dd42b527b771d97fdfcdf39851a4d0df267aae2d6a08ac39309b8ebab8579b93a859dd857e034333b3491c18b49a4c73e77d793d29ba85e99041e3730949084483cc8fe0658a0d9c527e6020614fa62274680a4e69515e2cc0a30e7e8a1c6f25881c01ee76fb1b4f9e74cd80e2dcda874b06dcc6f9573af30e10a7765b9a5865486a5865743fdeca606e5c30a5a7269637e11944c53053b36396bf377deabe19dfa762a8900a1d5bc5afe9";
        local accessToken = "22237c46240d22a187d1afb194c873f4c02537a8c2a7129ea93eff40eae758b5c4fb4b6b0f510dd68c93f3095e966aac13eac0e103b3ee37ccfbc64c26e9e78dc0a2b6837d11078efca1e425c05b598397ad2c152275a86b22f2856aca3ca58a594397dede52628ef86af6e8efb3f02f4b4ddaeb1f3830dd0f37ede7a76c4627b5c9d6df0403ac18b59b70a02c52e75abae33a22f52c6abd1bd047d7c793268c9c6484cb48904f84d1e0774a7c5e0920b7c295206291e8f9e4b5a20eee69e9dcdf3b51188e668e10f90d744b0b32b2e3ffdfef4a1b51e4b99a01a17e3a23f02425b4a4926e2d56ef67046d3332b9a51c284eccbc819a2d49c40891b47323b6ea.8b46d5c44c80494a730cfed471f59381db20d315bd7ffd31b927d05b350e56d907f6a6d9a5b3aad9c931678a877b0ab28f935f26d05e87aeef785c5471ab56d05cc0d651e7d1167568f216000a1118cc4091ae4d072440ab940a3e40c3a473cb7b580cfeacabbe58172d9e7ef1d6fdd5feb489814b62de4dbf2b445a657b9a6ba6fdc2294f87d45fcb9b06f324389b694574aa916ffafcf139655251db4f4a9f03140cd47182e4c0adcaa13da0396ca83184852aed3a42b2abaac522fe31e639275dba346e324c8a5936a5f359bd883efdeb7bf64a6b967f61082ee6e4aa9e33dd83fef81a2648e507f9839d4d25e9deef5eca8e68cc8601736223db1ff9c5cc";

        local createExpansion = function(productId) {
            return {
                productId: productId,
                getProperties: function() {
                    return {
                        Name: "Test Expansion",
                        Version: "1.2.3",
                        InlayProductID: this.productId,
                    };
                },
            };
        };

        local createCheckExpansionUnlocker = function[publicKey, accessToken](inAccessToken) {
            var unlocker = InlayUnlocker.create({
                productId: "host-product-id",
                publicKey: publicKey,
                apiUrl: "",
            });

            unlocker.deviceID = "device-2";
            unlocker.accessClaims = InlayUnlocker.createTokenValidator(publicKey, "01KQEN95FVR6CQCFMDD0FE2F21", unlocker.deviceID).validateAccessToken(accessToken);
            unlocker.expansionsDir = {
                productId: "",
                data: {
                    accessToken: inAccessToken,
                    version: "1.2.3",
                    updateUrl: "https://updates.example/expansion.zip",
                },
                getChildFile: function(productId) {
                    this.productId = productId;
                    return {
                        data: this.data,
                        loadAsObject: function() {
                            return this.data;
                        },
                    };
                },
            };

            return unlocker;
        };

        t.subName = "locked host returns undefined";
        {
            local unlocker = createCheckExpansionUnlocker(accessToken);
            unlocker.accessClaims = undefined;

            local result = unlocker.checkExpansion(createExpansion("01KQEN95FVR6CQCFMDD0FE2F21"));

            t.assertEqual("result is undefined", result == undefined, true);
        }

        t.subName = "missing product id returns undefined";
        {
            local unlocker = createCheckExpansionUnlocker(accessToken);
            local result = unlocker.checkExpansion(createExpansion(""));

            t.assertEqual("result is undefined", result == undefined, true);
        }

        t.subName = "valid cached access unlocks expansion";
        {
            local unlocker = createCheckExpansionUnlocker(accessToken);
            local result = unlocker.checkExpansion(createExpansion("01KQEN95FVR6CQCFMDD0FE2F21"));

            t.assertEqual("unlocker.expansionsDir.productId", unlocker.expansionsDir.productId, "01KQEN95FVR6CQCFMDD0FE2F21");
            t.assertEqual("result.id", result.id, "01KQEN95FVR6CQCFMDD0FE2F21");
            t.assertEqual("result.locked", result.locked, false);
            t.assertEqual("result.updateUrl", result.updateUrl, "https://updates.example/expansion.zip");
        }

        t.subName = "valid cached access locks for different current user";
        {
            local unlocker = createCheckExpansionUnlocker(accessToken);
            unlocker.accessClaims = {
                userEmail: "different-user@example.com",
            };
            local result = unlocker.checkExpansion(createExpansion("01KQEN95FVR6CQCFMDD0FE2F21"));

            t.assertEqual("unlocker.getCurrentUser()", unlocker.getCurrentUser(), "different-user@example.com");
            t.assertEqual("result.id", result.id, "01KQEN95FVR6CQCFMDD0FE2F21");
            t.assertEqual("result.locked", result.locked, true);
            t.assertEqual("result.updateUrl", result.updateUrl, "https://updates.example/expansion.zip");
        }

        t.subName = "invalid cached access locks expansion";
        {
            local unlocker = createCheckExpansionUnlocker("");
            local result = unlocker.checkExpansion(createExpansion("01KQEN95FVR6CQCFMDD0FE2F21"));

            t.assertEqual("result.id", result.id, "01KQEN95FVR6CQCFMDD0FE2F21");
            t.assertEqual("result.locked", result.locked, true);
            t.assertEqual("result.updateUrl", result.updateUrl, "https://updates.example/expansion.zip");
        }

        t.subName = "cached access locks after expansion version changes";
        {
            local unlocker = createCheckExpansionUnlocker(accessToken);
            unlocker.expansionsDir.data.version = "1.2.2";
            local result = unlocker.checkExpansion(createExpansion("01KQEN95FVR6CQCFMDD0FE2F21"));

            t.assertEqual("result.id", result.id, "01KQEN95FVR6CQCFMDD0FE2F21");
            t.assertEqual("result.locked", result.locked, true);
            t.assertEqual("result.updateUrl", result.updateUrl, undefined);
        }

        t.subName = "legacy cached access without version locks expansion";
        {
            local unlocker = createCheckExpansionUnlocker(accessToken);
            unlocker.expansionsDir.data.version = undefined;
            local result = unlocker.checkExpansion(createExpansion("01KQEN95FVR6CQCFMDD0FE2F21"));

            t.assertEqual("result.id", result.id, "01KQEN95FVR6CQCFMDD0FE2F21");
            t.assertEqual("result.locked", result.locked, true);
            t.assertEqual("result.updateUrl", result.updateUrl, undefined);
        }
    }

    inline function unlockerUnlockExpansion(t) {
        local createTimer = function() {
            return {
                stopped: 0,
                started: 0,
                interval: 0,

                stopTimer: function() {
                    this.stopped += 1;
                },

                startTimer: function(interval) {
                    this.started += 1;
                    this.interval = interval;
                },
            };
        };

        local createExpansion = function(productId) {
            return {
                props: {
                    Name: "Unlock Test Expansion",
                    Version: "1.2.3",
                    InlayProductID: productId,
                },
                getProperties: function() {
                    return this.props;
                },
            };
        };

        local createUnlockExpansionTestUnlocker = function[createTimer]() {
            var unlocker = InlayUnlocker.create({
                productId: "host-product-id",
                publicKey: "",
                apiUrl: "https://test.inlay.example",
            });

            unlocker.idToken = "id-token";
            unlocker.deviceID = "device-id";
            unlocker.completeExpansionActivationPollTimer = createTimer();

            unlocker.serverAPI = {
                calls: [],
                apiPost: function(path, body, callback) {
                    this.calls.push({
                        path: path,
                        body: body,
                        callback: callback,
                    });
                },
            };

            unlocker.openedUrls = [];
            unlocker.openWebsite = function(url) {
                this.openedUrls.push(url);
            };

            unlocker.setExpMetaData = function(obj, exp) {
                var props = exp.getProperties();
                obj.deviceId = this.deviceID;
                obj.productId = props.InlayProductID;
                obj.productVersion = props.Version;
                obj.productName = props.Name;
                return obj;
            };

            unlocker.handledAccess = [];
            unlocker.handleExpansionOkAccessResp = function(accessData) {
                this.handledAccess.push(accessData);
                this.unlockingExpansion = undefined;
            };

            unlocker.callbackResults = [];
            unlocker.expansionUnlockingCallback = function[unlocker](data) {
                unlocker.callbackResults.push(data);
            };

            return unlocker;
        };

        t.subName = "active unlock is ignored";
        {
            local unlocker = createUnlockExpansionTestUnlocker();
            unlocker.unlockingExpansion = {
                id: "existing-expansion-id",
            };

            local result = unlocker.unlockExpansion(createExpansion("01KQEN95FVR6CQCF6DSGA04QYJ"));

            t.assertEqual("result is undefined", result == undefined, true);
            t.assertEqual("unlocker.serverAPI.calls.length", unlocker.serverAPI.calls.length, 0);
            t.assertEqual("unlocker.unlockingExpansion.id", unlocker.unlockingExpansion.id, "existing-expansion-id");
        }

        t.subName = "sends access request with expansion metadata";
        {
            local unlocker = createUnlockExpansionTestUnlocker();
            local exp = createExpansion("01KQEN95FVR6CQCF6DSGA04QYJ");

            local result = unlocker.unlockExpansion(exp);

            t.assertEqual("result", result, true);
            t.assertEqual("unlocker.unlockingExpansion.id", unlocker.unlockingExpansion.id, "01KQEN95FVR6CQCF6DSGA04QYJ");
            t.assertEqual("unlocker.unlockingExpansion.md.productName", unlocker.unlockingExpansion.md.productName, "Unlock Test Expansion");
            t.assertEqual("unlocker.serverAPI.calls.length", unlocker.serverAPI.calls.length, 1);
            t.assertEqual("unlocker.serverAPI.calls[0].path", unlocker.serverAPI.calls[0].path, "app/sub-auth/access");
            t.assertEqual("unlocker.serverAPI.calls[0].body.idToken", unlocker.serverAPI.calls[0].body.idToken, "id-token");
            t.assertEqual("unlocker.serverAPI.calls[0].body.subproductId", unlocker.serverAPI.calls[0].body.subproductId, "01KQEN95FVR6CQCF6DSGA04QYJ");
            t.assertEqual("unlocker.serverAPI.calls[0].body.productId", unlocker.serverAPI.calls[0].body.productId, "01KQEN95FVR6CQCF6DSGA04QYJ");
            t.assertEqual("unlocker.serverAPI.calls[0].body.productVersion", unlocker.serverAPI.calls[0].body.productVersion, "1.2.3");
            t.assertEqual("unlocker.serverAPI.calls[0].body.productName", unlocker.serverAPI.calls[0].body.productName, "Unlock Test Expansion");
        }

        t.subName = "access response is handled";
        {
            local unlocker = createUnlockExpansionTestUnlocker();

            unlocker.unlockExpansion(createExpansion("01KQEN95FVR6CQCF6DSGA04QYJ"));
            unlocker.serverAPI.calls[0].callback(200, {
                access: {
                    accessToken: "expansion-access-token",
                    updateUrl: "https://updates.example/expansion.zip",
                },
            });

            t.assertEqual("unlocker.handledAccess.length", unlocker.handledAccess.length, 1);
            t.assertEqual("unlocker.handledAccess[0].accessToken", unlocker.handledAccess[0].accessToken, "expansion-access-token");
            t.assertEqual("unlocker.handledAccess[0].updateUrl", unlocker.handledAccess[0].updateUrl, "https://updates.example/expansion.zip");
            t.assertEqual("unlocker.unlockingExpansion is undefined", unlocker.unlockingExpansion == undefined, true);
        }

        t.subName = "activation response opens browser and starts polling";
        {
            local unlocker = createUnlockExpansionTestUnlocker();

            unlocker.unlockExpansion(createExpansion("01KQEN95FVR6CQCF6DSGA04QYJ"));
            unlocker.serverAPI.calls[0].callback(200, {
                activation: {
                    activationToken: "activation-token",
                },
            });

            t.assertEqual("unlocker.unlockingExpansion.activationToken", unlocker.unlockingExpansion.activationToken, "activation-token");
            t.assertEqual("unlocker.openedUrls.length", unlocker.openedUrls.length, 1);
            t.assertEqual("unlocker.openedUrls[0]", unlocker.openedUrls[0], "https://test.inlay.example/appweb/auth/continue?activationToken=activation-token");
            t.assertEqual("unlocker.completeExpansionActivationPollTimer.started", unlocker.completeExpansionActivationPollTimer.started, 1);
            t.assertEqual("unlocker.completeExpansionActivationPollTimer.interval", unlocker.completeExpansionActivationPollTimer.interval, 2000);
        }

        t.subName = "error response finishes locked";
        {
            local unlocker = createUnlockExpansionTestUnlocker();
            local exp = createExpansion("01KQEN95FVR6CQCF6DSGA04QYJ");

            unlocker.unlockExpansion(exp);
            unlocker.serverAPI.calls[0].callback(503, {});

            t.assertEqual("unlocker.callbackResults.length", unlocker.callbackResults.length, 1);
            t.assertEqual("unlocker.callbackResults[0].id", unlocker.callbackResults[0].id, "01KQEN95FVR6CQCF6DSGA04QYJ");
            t.assertEqual("unlocker.callbackResults[0].name", unlocker.callbackResults[0].name, "Unlock Test Expansion");
            t.assertEqual("unlocker.callbackResults[0].locked", unlocker.callbackResults[0].locked, true);
            t.assertEqual("unlocker.callbackResults[0].error", unlocker.callbackResults[0].error, "HTTP error. Status: 503");
            t.assertEqual("unlocker.completeExpansionActivationPollTimer.stopped", unlocker.completeExpansionActivationPollTimer.stopped, 1);
            t.assertEqual("unlocker.unlockingExpansion is undefined", unlocker.unlockingExpansion == undefined, true);
        }
    }

    inline function unlockerCancelExpansionUnlocking(t) {
        local createCancelExpansionTestUnlocker = function() {
            return InlayUnlocker.create({
                productId: "cancel-expansion-test-product-id",
                publicKey: "",
                apiUrl: "",
            });
        };

        t.subName = "ignored when no expansion unlock is active";
        {
            local unlocker = createCancelExpansionTestUnlocker();

            unlocker.cancelExpansionUnlocking();

            t.assertEqual("unlocker.unlockingExpansion is undefined", unlocker.unlockingExpansion == undefined, true);
        }

        t.subName = "marks active expansion unlock as canceled";
        {
            local unlocker = createCancelExpansionTestUnlocker();
            unlocker.unlockingExpansion = {
                id: "01KQEN95FVR6CQCF6DSGA04QYJ",
                cancel: false,
            };

            unlocker.cancelExpansionUnlocking();

            t.assertEqual("unlocker.unlockingExpansion.id", unlocker.unlockingExpansion.id, "01KQEN95FVR6CQCF6DSGA04QYJ");
            t.assertEqual("unlocker.unlockingExpansion.cancel", unlocker.unlockingExpansion.cancel, true);
        }
    }

    inline function unlockerFinishExpansionUnlocking(t) {
        local createTimer = function() {
            return {
                stopped: 0,
                stopTimer: function() {
                    this.stopped += 1;
                },
            };
        };

        local createFinishExpansionTestUnlocker = function[createTimer](withCallback) {
            var unlocker = InlayUnlocker.create({
                productId: "finish-expansion-test-product-id",
                publicKey: "",
                apiUrl: "",
            });

            unlocker.completeExpansionActivationPollTimer = createTimer();
            unlocker.unlockingExpansion = {
                id: "01KQEN95FVR6CQCF6DSGA04QYJ",
                md: {
                    productName: "Finish Expansion",
                },
            };

            unlocker.callbackResults = [];
            if (withCallback) {
                unlocker.expansionUnlockingCallback = function[unlocker](data) {
                    unlocker.callbackResults.push(data);
                };
            }

            return unlocker;
        };

        t.subName = "finishes without callback";
        {
            local unlocker = createFinishExpansionTestUnlocker(false);
            local cbData = {
                locked: true,
                error: "test error",
            };

            unlocker.finishExpansionUnlocking(cbData);

            t.assertEqual("cbData.id", cbData.id, "01KQEN95FVR6CQCF6DSGA04QYJ");
            t.assertEqual("cbData.name", cbData.name, "Finish Expansion");
            t.assertEqual("unlocker.completeExpansionActivationPollTimer.stopped", unlocker.completeExpansionActivationPollTimer.stopped, 1);
            t.assertEqual("unlocker.unlockingExpansion is undefined", unlocker.unlockingExpansion == undefined, true);
            t.assertEqual("unlocker.callbackResults.length", unlocker.callbackResults.length, 0);
        }

        t.subName = "adds expansion and invokes callback";
        {
            local unlocker = createFinishExpansionTestUnlocker(true);

            unlocker.finishExpansionUnlocking({
                locked: false,
                updateUrl: "https://updates.example/expansion.zip",
            });

            t.assertEqual("unlocker.callbackResults.length", unlocker.callbackResults.length, 1);
            t.assertEqual("unlocker.callbackResults[0].id", unlocker.callbackResults[0].id, "01KQEN95FVR6CQCF6DSGA04QYJ");
            t.assertEqual("unlocker.callbackResults[0].name", unlocker.callbackResults[0].name, "Finish Expansion");
            t.assertEqual("unlocker.callbackResults[0].locked", unlocker.callbackResults[0].locked, false);
            t.assertEqual("unlocker.callbackResults[0].updateUrl", unlocker.callbackResults[0].updateUrl, "https://updates.example/expansion.zip");
            t.assertEqual("unlocker.completeExpansionActivationPollTimer.stopped", unlocker.completeExpansionActivationPollTimer.stopped, 1);
            t.assertEqual("unlocker.unlockingExpansion is undefined", unlocker.unlockingExpansion == undefined, true);
        }
    }

    inline function unlockerHandleExpansionOkAccessResp(t) {
        local publicKey = "10001,d00939d757247c6b9eda3b3c6f917bee54d59f0851947c9ddfa7391d7811fb64d85dbb70fa8380f5c50a6cb7b9d5ac1c7da6ea4701ef74d2ca5faefc08eacf82914179961d668cd18020f2f5c7bbba369a725afd29dd42b527b771d97fdfcdf39851a4d0df267aae2d6a08ac39309b8ebab8579b93a859dd857e034333b3491c18b49a4c73e77d793d29ba85e99041e3730949084483cc8fe0658a0d9c527e6020614fa62274680a4e69515e2cc0a30e7e8a1c6f25881c01ee76fb1b4f9e74cd80e2dcda874b06dcc6f9573af30e10a7765b9a5865486a5865743fdeca606e5c30a5a7269637e11944c53053b36396bf377deabe19dfa762a8900a1d5bc5afe9";
        local accessToken = "22237c46240d22a187d1afb194c873f4c02537a8c2a7129ea93eff40eae758b5c4fb4b6b0f510dd68c93f3095e966aac13eac0e103b3ee37ccfbc64c26e9e78dc0a2b6837d11078efca1e425c05b598397ad2c152275a86b22f2856aca3ca58a594397dede52628ef86af6e8efb3f02f4b4ddaeb1f3830dd0f37ede7a76c4627b5c9d6df0403ac18b59b70a02c52e75abae33a22f52c6abd1bd047d7c793268c9c6484cb48904f84d1e0774a7c5e0920b7c295206291e8f9e4b5a20eee69e9dcdf3b51188e668e10f90d744b0b32b2e3ffdfef4a1b51e4b99a01a17e3a23f02425b4a4926e2d56ef67046d3332b9a51c284eccbc819a2d49c40891b47323b6ea.8b46d5c44c80494a730cfed471f59381db20d315bd7ffd31b927d05b350e56d907f6a6d9a5b3aad9c931678a877b0ab28f935f26d05e87aeef785c5471ab56d05cc0d651e7d1167568f216000a1118cc4091ae4d072440ab940a3e40c3a473cb7b580cfeacabbe58172d9e7ef1d6fdd5feb489814b62de4dbf2b445a657b9a6ba6fdc2294f87d45fcb9b06f324389b694574aa916ffafcf139655251db4f4a9f03140cd47182e4c0adcaa13da0396ca83184852aed3a42b2abaac522fe31e639275dba346e324c8a5936a5f359bd883efdeb7bf64a6b967f61082ee6e4aa9e33dd83fef81a2648e507f9839d4d25e9deef5eca8e68cc8601736223db1ff9c5cc";

        local createTimer = function() {
            return {
                stopped: 0,
                stopTimer: function() {
                    this.stopped += 1;
                },
            };
        };

        local createExpansion = function() {
            return {
                props: {
                    Name: "Persisted Version Expansion",
                    Version: "4.5.6",
                    InlayProductID: "01KQEN95FVR6CQCFMDD0FE2F21",
                },
                getProperties: function() {
                    return this.props;
                },
            };
        };

        local createUnlocker = function[publicKey, createTimer, createExpansion]() {
            var unlocker = InlayUnlocker.create({
                productId: "host-product-id",
                publicKey: publicKey,
                apiUrl: "",
            });

            unlocker.deviceID = "device-2";
            unlocker.completeExpansionActivationPollTimer = createTimer();
            unlocker.unlockingExpansion = {
                id: "01KQEN95FVR6CQCFMDD0FE2F21",
                md: {
                    productVersion: "4.5.6",
                    productName: "Persisted Version Expansion",
                },
            };

            unlocker.expansionsDir = {
                requestedId: "",
                file: {
                    value: undefined,
                    writeObject: function(value) {
                        this.value = value;
                    },
                },
                getChildFile: function(productId) {
                    this.requestedId = productId;
                    return this.file;
                },
            };

            unlocker.callbackResults = [];
            unlocker.expansionUnlockingCallback = function[unlocker](data) {
                unlocker.callbackResults.push(data);
            };

            return unlocker;
        };

        t.subName = "persists current expansion version with access data";
        {
            local unlocker = createUnlocker();

            unlocker.handleExpansionOkAccessResp({
                accessToken: accessToken,
                updateUrl: "https://updates.example/expansion.zip",
            });

            t.assertEqual("unlocker.expansionsDir.requestedId", unlocker.expansionsDir.requestedId, "01KQEN95FVR6CQCFMDD0FE2F21");
            t.assertEqual("unlocker.expansionsDir.file.value.accessToken", unlocker.expansionsDir.file.value.accessToken, accessToken);
            t.assertEqual("unlocker.expansionsDir.file.value.updateUrl", unlocker.expansionsDir.file.value.updateUrl, "https://updates.example/expansion.zip");
            t.assertEqual("unlocker.expansionsDir.file.value.version", unlocker.expansionsDir.file.value.version, "4.5.6");
            t.assertEqual("unlocker.callbackResults.length", unlocker.callbackResults.length, 1);
            t.assertEqual("unlocker.callbackResults[0].name", unlocker.callbackResults[0].name, "Persisted Version Expansion");
            t.assertEqual("unlocker.callbackResults[0].locked", unlocker.callbackResults[0].locked, false);
            t.assertEqual("unlocker.callbackResults[0].updateUrl", unlocker.callbackResults[0].updateUrl, "https://updates.example/expansion.zip");
            t.assertEqual("unlocker.completeExpansionActivationPollTimer.stopped", unlocker.completeExpansionActivationPollTimer.stopped, 1);
            t.assertEqual("unlocker.unlockingExpansion is undefined", unlocker.unlockingExpansion == undefined, true);
        }
    }

    inline function unlockerTryCompleteActivationProcess(t) {
        local createTimer = function() {
            return {
                stopped: 0,
                stopTimer: function() {
                    this.stopped += 1;
                },
            };
        };

        local createTryCompleteActivationTestUnlocker = function[createTimer](accessClaims) {
            var unlocker = InlayUnlocker.create({
                productId: "complete-activation-test-product-id",
                publicKey: "",
                apiUrl: "",
            });

            unlocker.activationToken = "activation-token";
            unlocker.completeActivationPollTimer = createTimer();

            unlocker.serverAPI = {
                calls: [],
                apiPost: function(path, body, callback) {
                    this.calls.push({
                        path: path,
                        body: body,
                        callback: callback,
                    });
                },
            };

            unlocker.setMetaData = function(obj) {
                obj.deviceId = "device-id";
                obj.productId = this.cfg.productId;
                return obj;
            };

            unlocker.savedResponses = [];
            unlocker.saveOkAuthResponse = function[accessClaims](resp) {
                this.savedResponses.push(resp);
                this.accessClaims = accessClaims;
            };

            unlocker.activationErrors = [];
            unlocker.broadcastActivationError = function(error) {
                this.activationErrors.push(error);
            };

            unlocker.broadcastedStatuses = [];
            unlocker.broadcastStatus = function(status) {
                this.broadcastedStatuses.push(status);
            };

            return unlocker;
        };

        t.subName = "sends complete request with activation token";
        {
            local unlocker = createTryCompleteActivationTestUnlocker(undefined);

            unlocker.tryCompleteActivationProcess();

            t.assertEqual("unlocker.serverAPI.calls.length", unlocker.serverAPI.calls.length, 1);
            t.assertEqual("unlocker.serverAPI.calls[0].path", unlocker.serverAPI.calls[0].path, "app/auth/complete");
            t.assertEqual("unlocker.serverAPI.calls[0].body.activationToken", unlocker.serverAPI.calls[0].body.activationToken, "activation-token");
            t.assertEqual("unlocker.serverAPI.calls[0].body.deviceId", unlocker.serverAPI.calls[0].body.deviceId, "device-id");
            t.assertEqual("unlocker.serverAPI.calls[0].body.productId", unlocker.serverAPI.calls[0].body.productId, "complete-activation-test-product-id");
        }

        t.subName = "pending response keeps polling";
        {
            local unlocker = createTryCompleteActivationTestUnlocker(undefined);

            unlocker.tryCompleteActivationProcess();
            unlocker.serverAPI.calls[0].callback(202, {});

            t.assertEqual("unlocker.completeActivationPollTimer.stopped", unlocker.completeActivationPollTimer.stopped, 0);
            t.assertEqual("unlocker.savedResponses.length", unlocker.savedResponses.length, 0);
            t.assertEqual("unlocker.activationErrors.length", unlocker.activationErrors.length, 0);
            t.assertEqual("unlocker.broadcastedStatuses.length", unlocker.broadcastedStatuses.length, 0);
        }

        t.subName = "server error keeps polling";
        {
            local unlocker = createTryCompleteActivationTestUnlocker(undefined);

            unlocker.tryCompleteActivationProcess();
            unlocker.serverAPI.calls[0].callback(503, {});

            t.assertEqual("unlocker.completeActivationPollTimer.stopped", unlocker.completeActivationPollTimer.stopped, 0);
            t.assertEqual("unlocker.savedResponses.length", unlocker.savedResponses.length, 0);
            t.assertEqual("unlocker.activationErrors.length", unlocker.activationErrors.length, 0);
            t.assertEqual("unlocker.broadcastedStatuses.length", unlocker.broadcastedStatuses.length, 0);
        }

        t.subName = "client error stops polling and broadcasts activation error";
        {
            local unlocker = createTryCompleteActivationTestUnlocker(undefined);

            unlocker.tryCompleteActivationProcess();
            unlocker.serverAPI.calls[0].callback(404, {});

            t.assertEqual("unlocker.completeActivationPollTimer.stopped", unlocker.completeActivationPollTimer.stopped, 1);
            t.assertEqual("unlocker.savedResponses.length", unlocker.savedResponses.length, 0);
            t.assertEqual("unlocker.activationErrors.length", unlocker.activationErrors.length, 1);
            t.assertEqual("unlocker.activationErrors[0]", unlocker.activationErrors[0], "HTTP error. Status: 404");
            t.assertEqual("unlocker.broadcastedStatuses.length", unlocker.broadcastedStatuses.length, 0);
        }

        t.subName = "unexpected status keeps polling";
        {
            local unlocker = createTryCompleteActivationTestUnlocker(undefined);

            unlocker.tryCompleteActivationProcess();
            unlocker.serverAPI.calls[0].callback(302, {});

            t.assertEqual("unlocker.completeActivationPollTimer.stopped", unlocker.completeActivationPollTimer.stopped, 0);
            t.assertEqual("unlocker.savedResponses.length", unlocker.savedResponses.length, 0);
            t.assertEqual("unlocker.activationErrors.length", unlocker.activationErrors.length, 0);
            t.assertEqual("unlocker.broadcastedStatuses.length", unlocker.broadcastedStatuses.length, 0);
        }

        t.subName = "success with invalid access broadcasts internal error";
        {
            local unlocker = createTryCompleteActivationTestUnlocker(undefined);
            unlocker.accessClaimsToSetAfterSave = "access-claims";

            unlocker.tryCompleteActivationProcess();
            unlocker.serverAPI.calls[0].callback(200, {
                accessToken: "access-token",
                idToken: "id-token",
            });

            t.assertEqual("unlocker.completeActivationPollTimer.stopped", unlocker.completeActivationPollTimer.stopped, 1);
            t.assertEqual("unlocker.savedResponses.length", unlocker.savedResponses.length, 1);
            t.assertEqual("unlocker.accessClaims is undefined", unlocker.accessClaims == undefined, true);
            t.assertEqual("unlocker.activationErrors.length", unlocker.activationErrors.length, 1);
            t.assertEqual("unlocker.activationErrors[0]", unlocker.activationErrors[0], "Internal error. Code: VFASAN");
            t.assertEqual("unlocker.broadcastedStatuses.length", unlocker.broadcastedStatuses.length, 0);
        }

        t.subName = "success unlocks";
        {
            local claims = {
                userEmail: "activated@example.com",
            };
            local unlocker = createTryCompleteActivationTestUnlocker(claims);

            unlocker.tryCompleteActivationProcess();
            unlocker.serverAPI.calls[0].callback(200, {
                accessToken: "access-token",
                idToken: "id-token",
            });

            t.assertEqual("unlocker.completeActivationPollTimer.stopped", unlocker.completeActivationPollTimer.stopped, 1);
            t.assertEqual("unlocker.savedResponses.length", unlocker.savedResponses.length, 1);
            t.assertEqual("unlocker.activationErrors.length", unlocker.activationErrors.length, 0);
            t.assertEqual("unlocker.broadcastedStatuses.length", unlocker.broadcastedStatuses.length, 1);
            t.assertEqual("unlocker.broadcastedStatuses[0]", unlocker.broadcastedStatuses[0], InlayUnlocker.STATUS_UNLOCKED);
        }
    }

    inline function unlockerTryCompleteExpansionActivation(t) {
        local createTryCompleteExpansionTestUnlocker = function(cancel) {
            var unlocker = InlayUnlocker.create({
                productId: "host-product-id",
                publicKey: "",
                apiUrl: "",
            });

            unlocker.unlockingExpansion = {
                id: "01KQEN95FVR6CQCF6DSGA04QYJ",
                activationToken: "expansion-activation-token",
                cancel: cancel,
                md: {
                    productId: "01KQEN95FVR6CQCF6DSGA04QYJ",
                    productVersion: "2.3.4",
                    productName: "Complete Expansion",
                },
            };

            unlocker.serverAPI = {
                calls: [],
                apiPost: function(path, body, callback) {
                    this.calls.push({
                        path: path,
                        body: body,
                        callback: callback,
                    });
                },
            };

            unlocker.finished = [];
            unlocker.finishExpansionUnlocking = function(data) {
                this.finished.push(data);
            };

            unlocker.handledAccess = [];
            unlocker.handleExpansionOkAccessResp = function(resp) {
                this.handledAccess.push(resp);
            };

            return unlocker;
        };

        t.subName = "canceled unlock finishes without request";
        {
            local unlocker = createTryCompleteExpansionTestUnlocker(true);

            unlocker.tryCompleteExpansionActivation();

            t.assertEqual("unlocker.serverAPI.calls.length", unlocker.serverAPI.calls.length, 0);
            t.assertEqual("unlocker.finished.length", unlocker.finished.length, 1);
            t.assertEqual("unlocker.finished[0].locked", unlocker.finished[0].locked, true);
            t.assertEqual("unlocker.finished[0].canceled", unlocker.finished[0].canceled, true);
            t.assertEqual("unlocker.handledAccess.length", unlocker.handledAccess.length, 0);
        }

        t.subName = "sends complete request with activation token and metadata";
        {
            local unlocker = createTryCompleteExpansionTestUnlocker(false);

            unlocker.tryCompleteExpansionActivation();

            t.assertEqual("unlocker.serverAPI.calls.length", unlocker.serverAPI.calls.length, 1);
            t.assertEqual("unlocker.serverAPI.calls[0].path", unlocker.serverAPI.calls[0].path, "app/auth/complete");
            t.assertEqual("unlocker.serverAPI.calls[0].body.activationToken", unlocker.serverAPI.calls[0].body.activationToken, "expansion-activation-token");
            t.assertEqual("unlocker.serverAPI.calls[0].body.productId", unlocker.serverAPI.calls[0].body.productId, "01KQEN95FVR6CQCF6DSGA04QYJ");
            t.assertEqual("unlocker.serverAPI.calls[0].body.productVersion", unlocker.serverAPI.calls[0].body.productVersion, "2.3.4");
            t.assertEqual("unlocker.serverAPI.calls[0].body.productName", unlocker.serverAPI.calls[0].body.productName, "Complete Expansion");
        }

        t.subName = "pending response keeps polling";
        {
            local unlocker = createTryCompleteExpansionTestUnlocker(false);

            unlocker.tryCompleteExpansionActivation();
            unlocker.serverAPI.calls[0].callback(202, {});

            t.assertEqual("unlocker.finished.length", unlocker.finished.length, 0);
            t.assertEqual("unlocker.handledAccess.length", unlocker.handledAccess.length, 0);
        }

        t.subName = "server error keeps polling";
        {
            local unlocker = createTryCompleteExpansionTestUnlocker(false);

            unlocker.tryCompleteExpansionActivation();
            unlocker.serverAPI.calls[0].callback(503, {});

            t.assertEqual("unlocker.finished.length", unlocker.finished.length, 0);
            t.assertEqual("unlocker.handledAccess.length", unlocker.handledAccess.length, 0);
        }

        t.subName = "client error finishes locked";
        {
            local unlocker = createTryCompleteExpansionTestUnlocker(false);

            unlocker.tryCompleteExpansionActivation();
            unlocker.serverAPI.calls[0].callback(404, {});

            t.assertEqual("unlocker.finished.length", unlocker.finished.length, 1);
            t.assertEqual("unlocker.finished[0].locked", unlocker.finished[0].locked, true);
            t.assertEqual("unlocker.finished[0].error", unlocker.finished[0].error, "HTTP error. Status: 404");
            t.assertEqual("unlocker.handledAccess.length", unlocker.handledAccess.length, 0);
        }

        t.subName = "success handles access response";
        {
            local unlocker = createTryCompleteExpansionTestUnlocker(false);

            unlocker.tryCompleteExpansionActivation();
            unlocker.serverAPI.calls[0].callback(200, {
                accessToken: "expansion-access-token",
                updateUrl: "https://updates.example/expansion.zip",
            });

            t.assertEqual("unlocker.finished.length", unlocker.finished.length, 0);
            t.assertEqual("unlocker.handledAccess.length", unlocker.handledAccess.length, 1);
            t.assertEqual("unlocker.handledAccess[0].accessToken", unlocker.handledAccess[0].accessToken, "expansion-access-token");
            t.assertEqual("unlocker.handledAccess[0].updateUrl", unlocker.handledAccess[0].updateUrl, "https://updates.example/expansion.zip");
        }
    }

    inline function unlockerStartActivation(t) {
        local createTimer = function() {
            return {
                stopped: 0,
                started: 0,
                interval: 0,
                callback: undefined,

                stopTimer: function() {
                    this.stopped += 1;
                },

                setTimerCallback: function(cb) {
                    this.callback = cb;
                },

                startTimer: function(interval) {
                    this.started += 1;
                    this.interval = interval;
                },
            };
        };

        local createWritableFile = function() {
            return {
                value: "",
                loadAsString: function() {
                    return this.value;
                },
                writeString: function(value) {
                    this.value = value;
                },
            };
        };

        local createActivationTestUnlocker = function[createTimer, createWritableFile, createWritableFile](accessClaims) {
            var unlocker = InlayUnlocker.create({
                productId: "activation-test-product-id",
                publicKey: "",
                apiUrl: "https://test.inlay.example",
            });

            unlocker.completeActivationPollTimer = createTimer();
            unlocker.accessTokenFile = createWritableFile();
            unlocker.idTokenFile = createWritableFile();
            unlocker.completeActivationPollTimer.setTimerCallback(function[unlocker]() {
                unlocker.tryCompleteActivationProcess();
            });

            unlocker.serverAPI = {
                calls: [],
                apiPost: function(path, body, callback) {
                    this.calls.push({
                        path: path,
                        body: body,
                        callback: callback,
                    });
                },
            };

            unlocker.tokenValidator = {
                calls: [],
                result: accessClaims,
                validateAccessToken: function(token) {
                    this.calls.push(token);
                    return this.result;
                },
            };

            unlocker.openedUrls = [];
            unlocker.openWebsite = function(url) {
                this.openedUrls.push(url);
            };

            unlocker.activationErrors = [];
            unlocker.broadcastActivationError = function(error) {
                this.activationErrors.push(error);
            };

            unlocker.broadcastedStatuses = [];
            unlocker.broadcastStatus = function(status) {
                this.broadcastedStatuses.push(status);
            };

            return unlocker;
        };

        t.subName = "start request clears error and sends product/device";
        {
            local unlocker = createActivationTestUnlocker(undefined);

            unlocker.startActivation();

            t.assertEqual("unlocker.activationErrors.length", unlocker.activationErrors.length, 1);
            t.assertEqual("unlocker.activationErrors[0]", unlocker.activationErrors[0], "");
            t.assertEqual("unlocker.serverAPI.calls.length", unlocker.serverAPI.calls.length, 1);
            t.assertEqual("unlocker.serverAPI.calls[0].path", unlocker.serverAPI.calls[0].path, "app/auth/start");
            t.assertEqual("unlocker.serverAPI.calls[0].body.productId", unlocker.serverAPI.calls[0].body.productId, "activation-test-product-id");
            t.assertEqual("unlocker.serverAPI.calls[0].body.deviceId", unlocker.serverAPI.calls[0].body.deviceId, unlocker.deviceID);
        }

        t.subName = "startup requires activation then activation unlocks";
        {
            local claims = {
                userEmail: "activated@example.com"
            };
            local unlocker = createActivationTestUnlocker(claims);

            unlocker.startup();

            t.assertEqual("unlocker.idToken", unlocker.idToken, "");
            t.assertEqual("unlocker.broadcastedStatuses.length", unlocker.broadcastedStatuses.length, 1);
            t.assertEqual("unlocker.broadcastedStatuses[0]", unlocker.broadcastedStatuses[0], InlayUnlocker.STATUS_ACTIVATION_REQUIRED);
            
            t.assertEqual("unlocker.tokenValidator.calls.length", unlocker.tokenValidator.calls.length, 0);

            unlocker.startActivation();
            unlocker.serverAPI.calls[0].callback(200, {
                activationToken: "activation-token",
            });
            unlocker.completeActivationPollTimer.callback();

            t.assertEqual("unlocker.serverAPI.calls.length", unlocker.serverAPI.calls.length, 2);
            t.assertEqual("unlocker.serverAPI.calls[1].path", unlocker.serverAPI.calls[1].path, "app/auth/complete");
            t.assertEqual("unlocker.serverAPI.calls[1].body.activationToken", unlocker.serverAPI.calls[1].body.activationToken, "activation-token");

            unlocker.serverAPI.calls[1].callback(200, {
                accessToken: "access-token",
                idToken: "id-token",
            });

            t.assertEqual("unlocker.completeActivationPollTimer.stopped", unlocker.completeActivationPollTimer.stopped, 2);
            t.assertEqual("unlocker.accessTokenFile.value", unlocker.accessTokenFile.value, "access-token");
            t.assertEqual("unlocker.idTokenFile.value", unlocker.idTokenFile.value, "id-token");
            t.assertEqual("unlocker.idToken 2", unlocker.idToken, "id-token");
            t.assertEqual("unlocker.accessClaims.userEmail", unlocker.accessClaims.userEmail, "activated@example.com");
            t.assertEqual("unlocker.tokenValidator.calls.length 2", unlocker.tokenValidator.calls.length, 1);
            t.assertEqual("unlocker.tokenValidator.calls[0]", unlocker.tokenValidator.calls[0], "access-token");
            t.assertEqual("unlocker.broadcastedStatuses.length 2", unlocker.broadcastedStatuses.length, 2);
            t.assertEqual("unlocker.broadcastedStatuses[1]", unlocker.broadcastedStatuses[1], InlayUnlocker.STATUS_UNLOCKED);
        }

        t.subName = "start failure broadcasts activation error";
        {
            local unlocker = createActivationTestUnlocker(undefined);

            unlocker.startActivation();
            unlocker.serverAPI.calls[0].callback(503, {});

            t.assertEqual("unlocker.activationErrors.length", unlocker.activationErrors.length, 2);
            t.assertEqual("unlocker.activationErrors[1]", unlocker.activationErrors[1], "HTTP error. Status: 503");
            t.assertEqual("unlocker.openedUrls.length", unlocker.openedUrls.length, 0);
            t.assertEqual("unlocker.completeActivationPollTimer.started", unlocker.completeActivationPollTimer.started, 0);
        }

        t.subName = "start success opens browser and starts polling";
        {
            local unlocker = createActivationTestUnlocker(undefined);

            unlocker.startActivation();
            unlocker.serverAPI.calls[0].callback(200, {
                activationToken: "activation-token",
            });

            t.assertEqual("unlocker.activationToken", unlocker.activationToken, "activation-token");
            t.assertEqual("unlocker.openedUrls.length", unlocker.openedUrls.length, 1);
            t.assertEqual("unlocker.openedUrls[0]", unlocker.openedUrls[0], "https://test.inlay.example/appweb/auth/continue?activationToken=activation-token");
            t.assertEqual("unlocker.completeActivationPollTimer.stopped", unlocker.completeActivationPollTimer.stopped, 1);
            t.assertEqual("unlocker.completeActivationPollTimer.started", unlocker.completeActivationPollTimer.started, 1);
            t.assertEqual("unlocker.completeActivationPollTimer.interval", unlocker.completeActivationPollTimer.interval, 2000);
            t.assertEqual("unlocker.completeActivationPollTimer.callback is set", unlocker.completeActivationPollTimer.callback != undefined, true);
        }

        t.subName = "poll callback completes activation";
        {
            local claims = {
                userEmail: "activated@example.com"
            };
            local unlocker = createActivationTestUnlocker(claims);

            unlocker.startActivation();
            unlocker.serverAPI.calls[0].callback(200, {
                activationToken: "activation-token",
            });
            unlocker.completeActivationPollTimer.callback();

            t.assertEqual("unlocker.serverAPI.calls.length", unlocker.serverAPI.calls.length, 2);
            t.assertEqual("unlocker.serverAPI.calls[1].path", unlocker.serverAPI.calls[1].path, "app/auth/complete");
            t.assertEqual("unlocker.serverAPI.calls[1].body.activationToken", unlocker.serverAPI.calls[1].body.activationToken, "activation-token");

            unlocker.serverAPI.calls[1].callback(200, {
                accessToken: "access-token",
                idToken: "id-token",
            });

            t.assertEqual("unlocker.completeActivationPollTimer.stopped", unlocker.completeActivationPollTimer.stopped, 2);
            t.assertEqual("unlocker.accessTokenFile.value", unlocker.accessTokenFile.value, "access-token");
            t.assertEqual("unlocker.idTokenFile.value", unlocker.idTokenFile.value, "id-token");
            t.assertEqual("unlocker.idToken", unlocker.idToken, "id-token");
            t.assertEqual("unlocker.accessClaims.userEmail", unlocker.accessClaims.userEmail, "activated@example.com");
            t.assertEqual("unlocker.tokenValidator.calls.length", unlocker.tokenValidator.calls.length, 1);
            t.assertEqual("unlocker.tokenValidator.calls[0]", unlocker.tokenValidator.calls[0], "access-token");
            t.assertEqual("unlocker.broadcastedStatuses.length", unlocker.broadcastedStatuses.length, 1);
            t.assertEqual("unlocker.broadcastedStatuses[0]", unlocker.broadcastedStatuses[0], InlayUnlocker.STATUS_UNLOCKED);
        }

        t.subName = "complete validation failure broadcasts activation error";
        {
            local unlocker = createActivationTestUnlocker(undefined);

            unlocker.startActivation();
            unlocker.serverAPI.calls[0].callback(200, {
                activationToken: "activation-token",
            });
            unlocker.completeActivationPollTimer.callback();
            unlocker.serverAPI.calls[1].callback(200, {
                accessToken: "access-token",
                idToken: "id-token",
            });

            t.assertEqual("unlocker.activationErrors.length", unlocker.activationErrors.length, 2);
            t.assertEqual("unlocker.activationErrors[1]", unlocker.activationErrors[1], "Internal error. Code: VFASAN");
            t.assertEqual("unlocker.broadcastedStatuses.length", unlocker.broadcastedStatuses.length, 0);
        }
    }

    inline function getExpansionProductId(t) {
        local productId = "01KQEN95FVR6CQCF6DSGA04QYJ";
        local tagProductId = "01KQEN95FVR6CQCF7DSGA04QYK";

        t.subName = "undefined properties returns undefined";
        {
            local result = InlayUnlocker.getExpansionProductId({
                getProperties: function() {
                    return undefined;
                },
            });

            t.assertEqual("result is undefined", result == undefined, true);
        }

        t.subName = "direct InlayProductID property wins";
        {
            local result = InlayUnlocker.getExpansionProductId({
                getProperties: function[productId, tagProductId]() {
                    return {
                        InlayProductID: "  " + productId + "  ",
                        Tags: "InlayProductID=" + tagProductId,
                    };
                },
            });

            t.assertEqual("result", result, productId);
        }

        t.subName = "falls back to Tags InlayProductID";
        {
            local result = InlayUnlocker.getExpansionProductId({
                getProperties: function[tagProductId]() {
                    return {
                        Tags: "Factory,InlayProductID=" + tagProductId + ",Drums",
                    };
                },
            });

            t.assertEqual("result", result, tagProductId);
        }

        t.subName = "invalid direct and missing tag returns undefined";
        {
            local result = InlayUnlocker.getExpansionProductId({
                getProperties: function() {
                    return {
                        InlayProductID: "not-a-product-id",
                        Tags: "Factory,Drums",
                    };
                },
            });

            t.assertEqual("result is undefined", result == undefined, true);
        }
    }

    inline function parseSignedAccessToken(t) {
        local publicKey = "10001,a4390d557ff756d07678aead66f1b0e44c4ab2c7a0d4e5312964e9b0ab328d2bc40f2c177318e13fecc21fb738c0675d979e5095908cdde40fbd5a5d46acd7bc4f101c4dd9f38e46425c62de23ee7f0afa679d3aab926c9e3c7815ecf13e751afa5f9fd6951fe9230a9532fb5c10de20e21898375d893da8de27a2d447a9e23ab347e6107934a7eb62c527226ebea87bd8f1d387b78a044006eead3c6e113e4db8f37f294df1ad76ceada6599d17403fa2e1c9723587f81d01e8fcbd106c6c4fb5380871205e4601abd2ffbcdaf064c185b033b87c1a8f1075e85613244127c2ca4d1f58ae727b4d7d1fa04d161f2e3a089b2b3a795fc996dbf8917b70773369";
        local privateKey = "8f61d0a689e7e640746fc1f35c224193d29895a77e60e30b1d5d223c41fd0d0cdd4d71edb76c4d9e8694a7244dc48f7b43d9d1fa040f39dcd97135e8a2c05e4be7abe54a83b506cf89392889534df4561d7341efebc51858bfeb0919ab3820fec103a486b204fe84bdc4ae92903b99f593f26d5449b27dc766cfac77336abc3da59d9e2c567414d244fc73e26af506a19e06d2ee5dc5a000246a52ca45e4ac074cfac0c24bdc47ecd343605b348d2e4d8f3939b207019265602be3397903c125bd926251950ce6558c240d4a69f5759b1bf896278a69f383a4d6a029b4e03092f9b3b85cea6653c5f426c837b22b8ac1fed41bb064feed1adecb0c9f34da101,a4390d557ff756d07678aead66f1b0e44c4ab2c7a0d4e5312964e9b0ab328d2bc40f2c177318e13fecc21fb738c0675d979e5095908cdde40fbd5a5d46acd7bc4f101c4dd9f38e46425c62de23ee7f0afa679d3aab926c9e3c7815ecf13e751afa5f9fd6951fe9230a9532fb5c10de20e21898375d893da8de27a2d447a9e23ab347e6107934a7eb62c527226ebea87bd8f1d387b78a044006eead3c6e113e4db8f37f294df1ad76ceada6599d17403fa2e1c9723587f81d01e8fcbd106c6c4fb5380871205e4601abd2ffbcdaf064c185b033b87c1a8f1075e85613244127c2ca4d1f58ae727b4d7d1fa04d161f2e3a089b2b3a795fc996dbf8917b70773369";
        local makeSignedToken = function[privateKey](claimsText) {
            var encryptedClaims = FileSystem.encryptWithRSA(claimsText, privateKey);
            var encryptedHash = FileSystem.encryptWithRSA(claimsText.hash(), privateKey);
            return encryptedClaims + "." + encryptedHash;
        };

        t.subName = "valid six fields preserve refresh claim";
        {
            local validator = InlayUnlocker.createTokenValidator(publicKey, "", "");
            local claimsText = '{"p":"product","d":"device","e":1712345678,"i":1712341234,"u":"user@example.com","r":3}';
            local claims = validator.parseSignedAccessToken(makeSignedToken(claimsText));

            t.assertEqual("claims[p]", claims["p"], "product");
            t.assertEqual("claims[d]", claims["d"], "device");
            t.assertEqual("claims[e]", claims["e"], 1712345678);
            t.assertEqual("claims[i]", claims["i"], 1712341234);
            t.assertEqual("claims[u]", claims["u"], "user@example.com");
            t.assertEqual("claims[r]", claims["r"], 3);
        }

        t.subName = "signed token rejects unknown seventh field";
        {
            local validator = InlayUnlocker.createTokenValidator(publicKey, "", "");
            local claimsText = '{"p":"product","d":"device","e":1712345678,"i":1712341234,"u":"user@example.com","r":3,"x":true}';
            local claims = validator.parseSignedAccessToken(makeSignedToken(claimsText));

            t.assertEqual("claims are undefined", claims == undefined, true);
        }

        t.subName = "fixture mutation";
        {
            local validator = InlayUnlocker.createTokenValidator("10001,dac1806e0ff8a533b6f9d8176c7c8f764b5b617152e6ddbd0772be130bc246bdf2521e475553edb0e206a4a958b1f003e8b7eee606257e52bb5c285626cb6461f015d4dacb84286c2824698a47e0fec6fed187288590140b9ded672b5aae8e31d96aba99e9282b744914735eb59c7119aa45849cb09dd7b42a7fd44c6867c90eaea637c30de5e6042d89f5c91b3eed77e5f47ce43cc1c9d8c612247e020390b3c6234051c4c320b69430141c714c9312e1f22d7dcc0dd1ddf348a2ca34551de0818d319f65908a47259cd0a842adcbf92861f1f76fc3fa255159cd3d729b0b46e24cfe7e212630535e14d9e6db5a921629793d5da03a9fcfb0fde51615cb5a29", "", "");
            local token = "d48f6f4fac840a82b00334fcd873528c97fa5193b7585add946d1bffaea6d10033f88cd38e4e58860988b9c74f86ee4d7087d04bab0f3db63920663f4c84976a6c8a838375c5c0b0f4c5fc7c2fc6eb0b3dc16fd5124ddabf850fd2154ab4cb6087dc55d669f6c465e936fb41a0b666262ee9b89932366bf676f9be66f328cd8c3dccc38024d724c29d48f5b776275085cb33fb6bcf1b498b82d21574548cd8c6624ab8dcc0746d1b30774e27ec80455ea0a91952f179017ad461e8ca7de009f2f6f71701f7562fd25df0fa3f3f15c64278035f8c589a35611181325307b37378c833a8c107e1a8379c22d061bbde76e9aa19d621b5a39c31239644b7df90d0dd.7974d368b23939b5160a495592a55418a214c010e5e8e00aa1d65aa60a2adec62ab02d61931a8df5502a64a539f8fb23e04111b79434afe1f5142ea171ffa39c41803857590e4cab745580f22c9c084bd33f863abbd0d2c59d6f38222198262ac8e9d76762ef640eebc6ed10a50ee58ed789c0976399c4b4b159ca80ae7b6d659abb0bdc9b2b01c7f7631d95e302e4de5ef9b262a23805d524e0b7607e448e674d1a8bae4fa65c2e3057bfa12bcb0b5d4fedb6691ade53757bd3d121e3e24b805f667513c717a99a0714eabb827cd528e40db109819fa95220f4dc53af3c12a08d43f2bd43bd81f5712f83f7e4ead333b589029f4b207a3f65fa66da43068062";
            local claims = validator.parseSignedAccessToken(token);

            t.assertEqual("claims[p]", claims["p"], "od_123");
            t.assertEqual("claims[d]", claims["d"], "dev_456");
            t.assertEqual("claims[e]", claims["e"], 1712345678);
            t.assertEqual("claims[i]", claims["i"], 1712341234);
        }

        t.subName = "zero mutation";
        {
            local validator = InlayUnlocker.createTokenValidator("10001,bfbebb6ec558760640be1ee9f63d7d0b272e210dc238ebc76299f70bf64054eaaad3c6d74e88b6a2f0ce0efe0d86e19e1d23a7a93c6eab3db8e7f3f773d0da26278a2aaa3aa4b3694f2627589709e490302015639eb7ddea49473e4bbc0b8ffa6fbca40a9899b6bad4d376ec055527c7fa7e70930a171f3c108dcaf38ae55162904ccab6ac2dee425f839919353b73682cad51fad1ff96d06e1776a681e420b6898125b3c3740d0c60bbacae51281f8738316c39ad7ae61c6949fcdac56d83233ffdce3e8633e479352d7f06f9248801faac87d5925fa946d51c707c36e7031b306685201bd5a863c49e349aefba1174609c5e4410f8a998b73834687ef92a09", "", "");
            local token = "92b3deb262dc3fbb365989bac53fc90b0a728227f5ceabea61f660a0f7a170a6a069629981013541194ea71f495d0dfcdb53f0ebb7fab5fbe8b3a67a0160e5849c118fd15d67e7996466346f2b5dbbb40614acb6596bb2afa7eaa73110e077cc3637dab140ce3be64bedff4966b1e6eca28cac034422a84034fe58b89ccd703f80e29f5635db0d91cf421202f4f73bdba4e7f7b360839c532a424dfae1d8ed5a80a899235b515c6cefba2ed29282ed2e5ea2ac7c958e397df603174cf9ed160bd44b1ff7ba70d1d07a4e0e5cfe70b73968dbed835938e23d0a5b1db8202346b436e275a6d7edc9dfb094d740e52fa498f96245696d08cc06346c44aea9a908c1.342f4bdba0d3c91d0e86329563a6e079a8b011760ebc2889c1613473d631da1d2129dece3dc7e646afec7bac14ae58204ba70f658db8b4362b63be155d52c43f2282a66bcf644f899060f2a5783ebf31cd97ea2c0a7df9d95e869ed9a5ef114c9ee0cbb544f87a646b8aac62204b27d70ca9d433c0c4a13152c0060df4a51f2a5b689068113fa5e1988863d9aefcc4dab24695ca429df71c0cac90725943c32aaef9b788147a59a31e1fb5bed4a48a97b3b6eae99caf3c5dc675c3e657abfe549233476310ea1345dfecbfba580c663b8b6fb9a905dd31f8bdad395ffd17166087b27790ddd7de91b21f7118e154f44022e431a65458f39a5e71ff040d8b3031";
            local claims = validator.parseSignedAccessToken(token);

            t.assertEqual("claims[p]", claims["p"], "FE2F21");
            t.assertEqual("claims[d]", claims["d"], "JSKDJKSJ");
            t.assertEqual("claims[e]", claims["e"], 1712440000);
            t.assertEqual("claims[i]", claims["i"], 1712441111);
        }

        t.subName = "invalid token parts count";
        {
            local validator = InlayUnlocker.createTokenValidator("", "", "");
            local claims = validator.parseSignedAccessToken("not-a-signed-token");
            t.assertEqual("claims are undefined", claims == undefined, true);
        }

        t.subName = "empty token part";
        {
            local validator = InlayUnlocker.createTokenValidator("", "", "");
            local claims = validator.parseSignedAccessToken(".");
            t.assertEqual("claims are undefined", claims == undefined, true);
        }

        t.subName = "hash mismatch";
        {
            local validator = InlayUnlocker.createTokenValidator("10001,dac1806e0ff8a533b6f9d8176c7c8f764b5b617152e6ddbd0772be130bc246bdf2521e475553edb0e206a4a958b1f003e8b7eee606257e52bb5c285626cb6461f015d4dacb84286c2824698a47e0fec6fed187288590140b9ded672b5aae8e31d96aba99e9282b744914735eb59c7119aa45849cb09dd7b42a7fd44c6867c90eaea637c30de5e6042d89f5c91b3eed77e5f47ce43cc1c9d8c612247e020390b3c6234051c4c320b69430141c714c9312e1f22d7dcc0dd1ddf348a2ca34551de0818d319f65908a47259cd0a842adcbf92861f1f76fc3fa255159cd3d729b0b46e24cfe7e212630535e14d9e6db5a921629793d5da03a9fcfb0fde51615cb5a29", "", "");
            local token = "6344740df3cf24d6322fdab70e7e9e46c9dab572bc5b2cd26652e6d283a3f646d5abe567e8b841e101d9f27c70bdc129a3582f5646791a0a3befb0ef565bf0a58e79cff7c5c1b98f94616aff2b30ceb1979dc1fabc99d7d11014c1d0f864440c4c5f8a572eb03e3d48cc54999726f0ba5c14a2af0d8a01a7a968fd2b5805f0348e81268dcf8c691fb8e31e397abae698d82278566e86345a7a4b406a079d544593aff4c33c92a7a90056794647b97fb78213d66674ee0478a696c8cbc4ee00b2942c648dad1aa6143caa55b62e99bdac836a50574f312715bcf22ecdf53ce295d4c3421d8d3f7810b60b66530a5b0dcf665e04dc8b0fd9836a0dcef8473b6624.a5fab8a8993825c699b9181562673d858db907d466a81b9220c814de9a179cbd555fb31f0f37f77f83ea18626914d11c1d049d49ffab54123800d63e0e2dddf5a6cb6b82b40c630be6514ab905421ce4490d49c8916a1f431bd5f9f4b66ecf3ca2ce33ef0d8a18f44e90ec0d3b5f894deccaf09768919625467e4971d2568e0284f1d6da18d4f16798466df1ded6b538116bf597a0648caa8ba4fa67c49ec326626378676639acd484e5c84ebeccd487423479902db694c77216e2d6bc54261d369453b15e8b058328c347baa5ed7e5f74f4b687e537ed0648039a29bfbea374a3d7951e6d1c5bc5a8bdc3bfd23bcfec9345412c59b67866783ac2a701c6d7fa";
            local claims = validator.parseSignedAccessToken(token);
            t.assertEqual("claims are undefined", claims == undefined, true);
        }
    }

    inline function loadAndValidateAccessToken(t) {
        local inlayDir = FileSystem.getFolder(FileSystem.AppData).createDirectory(".inlay");
        local accessTokenFile = inlayDir.getChildFile("access-token");
        local validator = InlayUnlocker.createTokenValidator(
            "10001,d00939d757247c6b9eda3b3c6f917bee54d59f0851947c9ddfa7391d7811fb64d85dbb70fa8380f5c50a6cb7b9d5ac1c7da6ea4701ef74d2ca5faefc08eacf82914179961d668cd18020f2f5c7bbba369a725afd29dd42b527b771d97fdfcdf39851a4d0df267aae2d6a08ac39309b8ebab8579b93a859dd857e034333b3491c18b49a4c73e77d793d29ba85e99041e3730949084483cc8fe0658a0d9c527e6020614fa62274680a4e69515e2cc0a30e7e8a1c6f25881c01ee76fb1b4f9e74cd80e2dcda874b06dcc6f9573af30e10a7765b9a5865486a5865743fdeca606e5c30a5a7269637e11944c53053b36396bf377deabe19dfa762a8900a1d5bc5afe9",
            "01KQEN95FVR6CQCFMDD0FE2F21",
            "device-2",
        );

        t.subName = "valid key";
        {
            
            local accesKey = "22237c46240d22a187d1afb194c873f4c02537a8c2a7129ea93eff40eae758b5c4fb4b6b0f510dd68c93f3095e966aac13eac0e103b3ee37ccfbc64c26e9e78dc0a2b6837d11078efca1e425c05b598397ad2c152275a86b22f2856aca3ca58a594397dede52628ef86af6e8efb3f02f4b4ddaeb1f3830dd0f37ede7a76c4627b5c9d6df0403ac18b59b70a02c52e75abae33a22f52c6abd1bd047d7c793268c9c6484cb48904f84d1e0774a7c5e0920b7c295206291e8f9e4b5a20eee69e9dcdf3b51188e668e10f90d744b0b32b2e3ffdfef4a1b51e4b99a01a17e3a23f02425b4a4926e2d56ef67046d3332b9a51c284eccbc819a2d49c40891b47323b6ea.8b46d5c44c80494a730cfed471f59381db20d315bd7ffd31b927d05b350e56d907f6a6d9a5b3aad9c931678a877b0ab28f935f26d05e87aeef785c5471ab56d05cc0d651e7d1167568f216000a1118cc4091ae4d072440ab940a3e40c3a473cb7b580cfeacabbe58172d9e7ef1d6fdd5feb489814b62de4dbf2b445a657b9a6ba6fdc2294f87d45fcb9b06f324389b694574aa916ffafcf139655251db4f4a9f03140cd47182e4c0adcaa13da0396ca83184852aed3a42b2abaac522fe31e639275dba346e324c8a5936a5f359bd883efdeb7bf64a6b967f61082ee6e4aa9e33dd83fef81a2648e507f9839d4d25e9deef5eca8e68cc8601736223db1ff9c5cc";
            accessTokenFile.writeString(accesKey);
            local accessClaims = validator.loadAndValidateAccessToken(accessTokenFile);
            t.assertEqual("accessClaims truthiness", !accessClaims, false);
            t.assertEqual("accessClaims is undefined", accessClaims == undefined, false);
        }

        t.subName = "missing key";
        {
            accessTokenFile.writeString("");
            local accessClaims = validator.loadAndValidateAccessToken(accessTokenFile);
            t.assertEqual("accessClaims truthiness", !accessClaims, true);
            t.assertEqual("accessClaims is undefined", accessClaims == undefined, true);
        }
    }

    inline function benchmarkValidateAccessToken() {
        local publicKey = "10001,d00939d757247c6b9eda3b3c6f917bee54d59f0851947c9ddfa7391d7811fb64d85dbb70fa8380f5c50a6cb7b9d5ac1c7da6ea4701ef74d2ca5faefc08eacf82914179961d668cd18020f2f5c7bbba369a725afd29dd42b527b771d97fdfcdf39851a4d0df267aae2d6a08ac39309b8ebab8579b93a859dd857e034333b3491c18b49a4c73e77d793d29ba85e99041e3730949084483cc8fe0658a0d9c527e6020614fa62274680a4e69515e2cc0a30e7e8a1c6f25881c01ee76fb1b4f9e74cd80e2dcda874b06dcc6f9573af30e10a7765b9a5865486a5865743fdeca606e5c30a5a7269637e11944c53053b36396bf377deabe19dfa762a8900a1d5bc5afe9";
        local accessToken = "22237c46240d22a187d1afb194c873f4c02537a8c2a7129ea93eff40eae758b5c4fb4b6b0f510dd68c93f3095e966aac13eac0e103b3ee37ccfbc64c26e9e78dc0a2b6837d11078efca1e425c05b598397ad2c152275a86b22f2856aca3ca58a594397dede52628ef86af6e8efb3f02f4b4ddaeb1f3830dd0f37ede7a76c4627b5c9d6df0403ac18b59b70a02c52e75abae33a22f52c6abd1bd047d7c793268c9c6484cb48904f84d1e0774a7c5e0920b7c295206291e8f9e4b5a20eee69e9dcdf3b51188e668e10f90d744b0b32b2e3ffdfef4a1b51e4b99a01a17e3a23f02425b4a4926e2d56ef67046d3332b9a51c284eccbc819a2d49c40891b47323b6ea.8b46d5c44c80494a730cfed471f59381db20d315bd7ffd31b927d05b350e56d907f6a6d9a5b3aad9c931678a877b0ab28f935f26d05e87aeef785c5471ab56d05cc0d651e7d1167568f216000a1118cc4091ae4d072440ab940a3e40c3a473cb7b580cfeacabbe58172d9e7ef1d6fdd5feb489814b62de4dbf2b445a657b9a6ba6fdc2294f87d45fcb9b06f324389b694574aa916ffafcf139655251db4f4a9f03140cd47182e4c0adcaa13da0396ca83184852aed3a42b2abaac522fe31e639275dba346e324c8a5936a5f359bd883efdeb7bf64a6b967f61082ee6e4aa9e33dd83fef81a2648e507f9839d4d25e9deef5eca8e68cc8601736223db1ff9c5cc";
        local callCount = 10;
        local validator = InlayUnlocker.createTokenValidator(
            publicKey,
            "01KQEN95FVR6CQCFMDD0FE2F21",
            "device-2",
        );

        Console.print("");
        Console.print("Running benchmark: tokenValidator.validateAccessToken x" + callCount);

        local validCalls = 0;
        local startMs = Date.getSystemTimeMs();

        for (i = 0; i < callCount; i++) {
            local accessClaims = validator.validateAccessToken(accessToken);
            if (accessClaims != undefined) {
                validCalls += 1;
            }
        }

        local elapsedMs = Date.getSystemTimeMs() - startMs;
        Console.print("validateAccessToken benchmark: total " + elapsedMs + "ms, avg " + (elapsedMs / callCount) + "ms, valid calls " + validCalls + "/" + callCount);
    }
}
