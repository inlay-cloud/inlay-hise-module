include("LicenseManager/Obj.js");

namespace LicenseManager {
    inline function init(productCfg) {
        Console.print("LicenseManager.init");
        LicenseManagerObj.init(productCfg);
        Console.print("LicenseManager.init finished");
    }

    inline function isLocked() {
        return LicenseManagerObj.isLocked();
    }
}