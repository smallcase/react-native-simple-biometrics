#import <ReactCommon/ReactTurboModule.h>
#import <ReactCommon/TurboModuleUtils.h>
#import <React/RCTBridgeModule.h>
#import <memory>

namespace facebook {
namespace react {

  class JSI_EXPORT NativeSimpleBiometricsSpecJSI : public ObjCTurboModule {
  public:
    NativeSimpleBiometricsSpecJSI(const ObjCTurboModule::InitParams &params);

    // Declare the methods your module exports
    void canAuthenticate(jsi::Runtime &rt, std::function<void(jsi::Value)> &&resolve, std::function<void(jsi::Value)> &&reject);
    void requestBioAuth(jsi::Runtime &rt, const std::string &title, const std::string &subtitle, std::function<void(jsi::Value)> &&resolve, std::function<void(jsi::Value)> &&reject);
    void getBiometryType(jsi::Runtime &rt, std::function<void(jsi::Value)> &&resolve, std::function<void(jsi::Value)> &&reject);
  };

}
}
