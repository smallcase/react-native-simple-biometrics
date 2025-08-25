#ifdef RCT_NEW_ARCH_ENABLED
#import "RNSimpleBiometricsSpec.h"

namespace facebook {
namespace react {

static facebook::jsi::Value __hostFunction_NativeSimpleBiometricsSpecJSI_canAuthenticate(
    facebook::jsi::Runtime &rt,
    TurboModule &turboModule,
    const facebook::jsi::Value *args,
    size_t count)
{
    return facebook::jsi::Value::undefined();
}

static facebook::jsi::Value __hostFunction_NativeSimpleBiometricsSpecJSI_requestBioAuth(
    facebook::jsi::Runtime &rt,
    TurboModule &turboModule,
    const facebook::jsi::Value *args,
    size_t count)
{
    return facebook::jsi::Value::undefined();
}

NativeSimpleBiometricsSpecJSI::NativeSimpleBiometricsSpecJSI(const ObjCTurboModule::InitParams &params)
    : ObjCTurboModule(params) {

    methodMap_["canAuthenticate"] = MethodMetadata{1, __hostFunction_NativeSimpleBiometricsSpecJSI_canAuthenticate};
    methodMap_["requestBioAuth"] = MethodMetadata{3, __hostFunction_NativeSimpleBiometricsSpecJSI_requestBioAuth};
}

} // namespace react
} // namespace facebook
#endif /* RCT_NEW_ARCH_ENABLED */
