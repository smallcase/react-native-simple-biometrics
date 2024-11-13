package com.simplebiometrics

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.Promise

abstract class SimpleBiometricsSpec internal constructor(context: ReactApplicationContext) :
  ReactContextBaseJavaModule(context) {

  abstract fun requestBioAuth(title: String, subtitle: String, promise: Promise)
  abstract fun checkCapability(promise: Promise)
  abstract fun canAuthenticate(promise: Promise)
}
