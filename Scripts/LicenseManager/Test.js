include("LicenseManager/Obj.js");

namespace LicenseManagerTest {
    inline function runAllTests() {
        Console.print("");
        Console.print("");

        test("decryptWithRSA", decryptWithRSA);
        test("validateAccessTokenClaims", validateAccessTokenClaims);

        LicenseManagerObj.init({
            productID: "ef3c3ee9-929a-43ea-b58c-182db11dbd31",
            publicKey: "todo",
        });

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

            assertEqual: function(l, r) {
                var caseName = this.getCaseName();
                if (l != r) {
                    this.failed = true;
                    this.failedAsserts += 1;
                    Console.print("  " + caseName + ": assertEqual '" + l + "' == '" + r + "' failed");
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
    }

    inline function validateAccessTokenClaims(t) {
        LicenseManagerObj._cfg = {
            productId: "my-test-product-id",
        };

        t.subName = "all valid";
        {
            local c = {
                "p": "-test-product-id", // ok
                "d": FileSystem.getSystemId(), // ok
                "e": 1857787893, // ok
                "i": 1757787893, // ok
            };
            local co = LicenseManagerObj.makeAccessTokenClaimsObjFromJSON(c);

            t.assertEqual(LicenseManagerObj.validateAccessTokenClaims(co), true);
        }

        t.subName = "invalid device id";
        {
            local c = {
                "p": "-test-product-id", // ok
                "d": FileSystem.getSystemId() + "+extra", // NOK
                "e": 1857787893, // ok
                "i": 1757787893, // ok
            };
            local co = LicenseManagerObj.makeAccessTokenClaimsObjFromJSON(c);
            t.assertEqual(LicenseManagerObj.validateAccessTokenClaims(co), false);
        }

        t.subName = "expired";
        {
            local c = {
                "p": "-test-product-id", // ok
                "d": FileSystem.getSystemId() , // ok
                "e": 1757787893, // NOK
                "i": 1757787893, // ok
            };
            local co = LicenseManagerObj.makeAccessTokenClaimsObjFromJSON(c);
            t.assertEqual(LicenseManagerObj.validateAccessTokenClaims(co), false);
        }

        t.subName = "issued in future";
        {
            local c = {
                "p": "-test-product-id", // ok
                "d": FileSystem.getSystemId() , // ok
                "e": 1857787893, // ok
                "i": 1857787893, // NOK
            };
            local co = LicenseManagerObj.makeAccessTokenClaimsObjFromJSON(c);
            t.assertEqual(LicenseManagerObj.validateAccessTokenClaims(co), false);
        }

        t.subName = "missed product id suff";
        {
            local c = {
                "d": FileSystem.getSystemId() , // ok
                "e": 1857787893, // ok
                "i": 1757787893, // ok
            };
            local co = LicenseManagerObj.makeAccessTokenClaimsObjFromJSON(c);
            t.assertEqual(LicenseManagerObj.validateAccessTokenClaims(co), false);
        }

        t.subName = "missed device id";
        {
            local c = {
                "p": "-test-product-id", // ok
                "e": 1857787893, // ok
                "i": 1757787893, // ok
            };
            local co = LicenseManagerObj.makeAccessTokenClaimsObjFromJSON(c);
            t.assertEqual(LicenseManagerObj.validateAccessTokenClaims(co), false);
        }

        t.subName = "missed expiration";
        {
            local c = {
                "d": FileSystem.getSystemId() , // ok
                "p": "-test-product-id", // ok
                "i": 1757787893, // ok
            };
            local co = LicenseManagerObj.makeAccessTokenClaimsObjFromJSON(c);
            t.assertEqual(LicenseManagerObj.validateAccessTokenClaims(co), false);
        }

        t.subName = "missed issued at";
        {
            local c = {
                "d": FileSystem.getSystemId() , // ok
                "e": 1857787893, // ok
                "p": "-test-product-id", // ok
            };
            local co = LicenseManagerObj.makeAccessTokenClaimsObjFromJSON(c);
            t.assertEqual(LicenseManagerObj.validateAccessTokenClaims(co), false);
        }
    }

    inline function decryptWithRSA(t) {
        local public = "10001,a4390d557ff756d07678aead66f1b0e44c4ab2c7a0d4e5312964e9b0ab328d2bc40f2c177318e13fecc21fb738c0675d979e5095908cdde40fbd5a5d46acd7bc4f101c4dd9f38e46425c62de23ee7f0afa679d3aab926c9e3c7815ecf13e751afa5f9fd6951fe9230a9532fb5c10de20e21898375d893da8de27a2d447a9e23ab347e6107934a7eb62c527226ebea87bd8f1d387b78a044006eead3c6e113e4db8f37f294df1ad76ceada6599d17403fa2e1c9723587f81d01e8fcbd106c6c4fb5380871205e4601abd2ffbcdaf064c185b033b87c1a8f1075e85613244127c2ca4d1f58ae727b4d7d1fa04d161f2e3a089b2b3a795fc996dbf8917b70773369";
        local private = "8f61d0a689e7e640746fc1f35c224193d29895a77e60e30b1d5d223c41fd0d0cdd4d71edb76c4d9e8694a7244dc48f7b43d9d1fa040f39dcd97135e8a2c05e4be7abe54a83b506cf89392889534df4561d7341efebc51858bfeb0919ab3820fec103a486b204fe84bdc4ae92903b99f593f26d5449b27dc766cfac77336abc3da59d9e2c567414d244fc73e26af506a19e06d2ee5dc5a000246a52ca45e4ac074cfac0c24bdc47ecd343605b348d2e4d8f3939b207019265602be3397903c125bd926251950ce6558c240d4a69f5759b1bf896278a69f383a4d6a029b4e03092f9b3b85cea6653c5f426c837b22b8ac1fed41bb064feed1adecb0c9f34da101,a4390d557ff756d07678aead66f1b0e44c4ab2c7a0d4e5312964e9b0ab328d2bc40f2c177318e13fecc21fb738c0675d979e5095908cdde40fbd5a5d46acd7bc4f101c4dd9f38e46425c62de23ee7f0afa679d3aab926c9e3c7815ecf13e751afa5f9fd6951fe9230a9532fb5c10de20e21898375d893da8de27a2d447a9e23ab347e6107934a7eb62c527226ebea87bd8f1d387b78a044006eead3c6e113e4db8f37f294df1ad76ceada6599d17403fa2e1c9723587f81d01e8fcbd106c6c4fb5380871205e4601abd2ffbcdaf064c185b033b87c1a8f1075e85613244127c2ca4d1f58ae727b4d7d1fa04d161f2e3a089b2b3a795fc996dbf8917b70773369";

        {
            local secret = "Hello from GO!";
            local enc = FileSystem.encryptWithRSA(secret, private);
            local dec = FileSystem.decryptWithRSA(enc, public);
            t.assertEqual(dec, secret);
        }
        {
            // encoded in Go
            local enc = "433db8a608d5760216e3183d5b7790a5cff9dfb94241228db0e33e3386038ad9646f517eb9b4cd38e3eec02347ba830b40030f42495634a237e69378e1b5d95a366becdeb4b887852606d51a786ac3690982eb55d4d06eb406c4e91d96985a1491a2c18515e36d44e681ee71b0e9334acce191c18ad10324479cbdad295f5058889f43a123c15358a08917f6908b5d969237b4ad4c0e19e137d749bbf5390735bf20077dc10c58266dc4059b7d1fc30a559303885cbd9b6ed50527396171c25eb8335736309233846530e931f6ffbd69c4b94a82b0d3b030c9e5bb13477a215fafde350dbf58363d71be30333630dfa44815df2e620e9c0a94bab15ff91a2bea";
            local dec = FileSystem.decryptWithRSA(enc, public);
            t.assertEqual(dec, "Hello from GO!");
        }
        {
            // encoded JSON in Go 
            local enc = "464b57df693cdf4b38eaa681fab4407c83ff2eb7db24066bb6fc674f37c3a42dc6d2df5774a733a550b3b74771c870be8439be62738539babb5f63f32c42d4d4ce47c09e8e0c4d5aeaa20a1698411396a70185cf14c2b595809611a7ee6d826a5dd4e93916a0426e5a1c7e61a743335e35ebc6034cb9120790dad4c99c4cd5b49fc3613e9b93c62d4659e027420b914d53abbeb630f07f0b78965e1ee5ddd7034f90c1a6a8228ad0986f6256de00c4e57207b16ac417b738bfa1dea283d984143921f65361d80337c83268f07aa74e7bcfae6e837d27810438073bfe605ff23db1b30ae26d7fc8d4f8d272ff201d75211bb748432e307add2d1b1d5ba784bde";
            local dec = FileSystem.decryptWithRSA(enc, public);
            t.assertEqual(dec, '{"p":"8d40be3179","m":"L8D2F4A6E1","e":17577105045}');
        }

        return true;
    }
}
