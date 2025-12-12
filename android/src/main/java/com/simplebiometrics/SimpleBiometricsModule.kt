package com.simplebiometrics

import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.UiThreadUtil.runOnUiThread
import com.facebook.react.module.annotations.ReactModule


@ReactModule(name = SimpleBiometricsModule.NAME)
class SimpleBiometricsModule(reactContext: ReactApplicationContext) :
  NativeSimpleBiometricsSpec(reactContext) {

  override fun getName(): String {
    return NAME
  }

  companion object {
    const val NAME = "SimpleBiometrics"
  }

  /**
   * Helper to choose allowed authenticators depending on API level and JS param.
   */
  private fun getAllowedAuthenticators(allowDeviceCredentials: Boolean): Int {
    if (allowDeviceCredentials) {
      return BiometricManager.Authenticators.BIOMETRIC_STRONG or
        BiometricManager.Authenticators.BIOMETRIC_WEAK or
        BiometricManager.Authenticators.DEVICE_CREDENTIAL
    }
    // Default to biometrics only
    return BiometricManager.Authenticators.BIOMETRIC_STRONG or
      BiometricManager.Authenticators.BIOMETRIC_WEAK
  }

  override fun canAuthenticate(
    allowDeviceCredentials: Boolean,
    promise: Promise?
  ) {
    try {
      val context = reactApplicationContext
      val biometricManager = BiometricManager.from(context)

      val authenticators = getAllowedAuthenticators(allowDeviceCredentials)
      val res = biometricManager.canAuthenticate(authenticators)
      val can = res == BiometricManager.BIOMETRIC_SUCCESS

      promise!!.resolve(can)
    } catch (e: Exception) {
      promise!!.reject(e)
    }
  }

  override fun requestBioAuth(
    promptTitle: String?,
    promptMessage: String?,
    allowDeviceCredentials: Boolean,
    promise: Promise?
  ) {
    runOnUiThread {
      try {
        val context = reactApplicationContext
        val activity = this.reactApplicationContext.currentActivity
        val mainExecutor = ContextCompat.getMainExecutor(context)
        val authenticationCallback: BiometricPrompt.AuthenticationCallback =
          object : BiometricPrompt.AuthenticationCallback() {
            override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
              super.onAuthenticationError(errorCode, errString)
              promise!!.reject(java.lang.Exception(errString.toString()))
            }

            override fun onAuthenticationSucceeded(
              result: BiometricPrompt.AuthenticationResult
            ) {
              super.onAuthenticationSucceeded(result)
              promise!!.resolve(true)
            }
          }

        if (activity != null) {
          val prompt = BiometricPrompt(
            activity as FragmentActivity, mainExecutor,
            authenticationCallback
          )

          val authenticators = getAllowedAuthenticators(allowDeviceCredentials)
          val promptInfo: BiometricPrompt.PromptInfo = BiometricPrompt.PromptInfo.Builder()
            .setAllowedAuthenticators(authenticators)
            .setTitle(promptTitle ?: "")
            .setSubtitle(promptMessage)
            .build()

          prompt.authenticate(promptInfo)
        } else {
          throw java.lang.Exception("null activity")
        }
      } catch (e: java.lang.Exception) {
        promise!!.reject(e)
      }
    }
  }
}
