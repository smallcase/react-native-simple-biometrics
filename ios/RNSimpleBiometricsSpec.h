#pragma once

#ifdef RCT_NEW_ARCH_ENABLED
#import "RCTTurboModule.h"

namespace facebook
{
    namespace react
    {

        class JSI_EXPORT NativeSimpleBiometricsSpecJSI : public ObjCTurboModule
        {
        public:
            explicit NativeSimpleBiometricsSpecJSI(const ObjCTurboModule::InitParams &params);
        };

    } // namespace react
} // namespace facebook

#endif /* RCT_NEW_ARCH_ENABLED */
