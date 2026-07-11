include("Inlay/Unlocker.js");
include("Inlay/Ui.js");

reg inlayUnlocker = InlayUnlocker.create(
    Engine.isHISE() ? 
    {
        // dev environment
        productId: "01KX37M20BWDCF06761FF10TGZ",
        publicKey: "10001,c7d83d349e3a51300895076870856e8afca6a875c2e74d0c47fc27a1c4e9e039bc7aa62467bcb775e24e9b518a094d685cae72a396c1e854cb7fda36c75a580679f8b1d9badf3e30fa03d98e1aebfa089fde2c6e845be8d76c1e24c5af19ba52475db548bd3c7cf77926cd2b2a02d10f833306c4e3d31aa1be8fdc8f4c12f6007c4e9708ec779dfdb41e51639321f7ed2022a18f664af8bd31e4eb7594c4e3e0bb4acb22e222a7fadb71b52db257b7913916f218479a5f275798973ebfe21711cb3aa38beaca8c399e39093ea284a82c2b3bd42ac654749b078fdc16f69b25dea8b02c743f1f164a06fc401a924943e3c6b056fc6a7f057e285ab9ae762f09bf",
        apiUrl: "https://api-dev.inlay.cloud",
    }:
    {
        // production environment
        productId: "01KX3F46C23J6A5NWMFCVVVH9K",
        publicKey: "10001,e14117382f2145280700699968b03279a4a5eac7de73a44932282d57389cb1f4065259d9053890d38eaaa03cc1a3f30c007b13bafcb329383c9d67fab8e90432bb867e83013302beb41a2a5f1a8dff2f533af67d01cbec6bd5911ae016b19cdd7d0cbd42ea4000aa4b8d190360117346dd467bc24ff6e308f66f841f170c4cd5c06fa071fa1bc7e6ff0b5383c071fb9ce94174e4257ce7bdbabbfd6467dd819977fc63de8451397f9d4058f3689b6a398c693a1760bcd6bb0c692f5c274540d4234f14aa133119d15da22f5428dc2e1f753be3410f142da00457fc5f394d9882df377b1a207fdf52d38fcaf92641ea24f69f0a70d11d36aa324790520734e4cd",
        apiUrl: "https://api.inlay.cloud",
    }
);

const var EmailButton = Content.getComponent("EmailButton");

inlayUnlocker.statusBroadcaster.addListener("EmailButtonUpdateListener", "EmailButtonUpdateListener", function(status){
    if (status == InlayUnlocker.STATUS_UNLOCKED) {
        EmailButton.set("text", inlayUnlocker.getCurrentUser());    
    } else {
        EmailButton.set("text", "");
    }
});

InlayUi.create(inlayUnlocker);

EmailButton.setControlCallback(onEmailButtonControl);
inline function onEmailButtonControl(component, value)
{
    if (value) {
        Engine.showYesNoWindow(
            "Account",
            "Current user: " + inlayUnlocker.getCurrentUser() + "\n\nLogout?",
            function(shouldLogout) {
                if (shouldLogout) inlayUnlocker.logout();
            }
        );
    }
}

inlayUnlocker.startup();
