package com.simplebiometrics

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.bridge.ReactApplicationContext

import androidx.biometric.BiometricPrompt;
import androidx.biometric.BiometricManager;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.FragmentActivity;
import com.facebook.react.bridge.WritableNativeMap

class SimpleBiometricsModule internal constructor(context: ReactApplicationContext) :
  SimpleBiometricsSpec(context) {

  override fun getName(): String {
    return NAME
  }

  companion object {
    const val NAME = "SimpleBiometrics"
    const val ALLOWED_AUTHENTICATORS: Int = (BiometricManager.Authenticators.BIOMETRIC_STRONG
      or BiometricManager.Authenticators.BIOMETRIC_WEAK
      or BiometricManager.Authenticators.DEVICE_CREDENTIAL);
  }

  @ReactMethod
  override fun canAuthenticate(promise: Promise) {
    try {
      val biometricManager: BiometricManager = BiometricManager.from(reactApplicationContext)

      val canAuth = biometricManager.canAuthenticate(ALLOWED_AUTHENTICATORS)

      when (canAuth) {
        BiometricManager.BIOMETRIC_SUCCESS -> {
          promise.resolve(true)
        }
        else -> {
          promise.resolve(false)
        }
      }
    } catch (e: Exception) {
      promise.reject(e)
    }
  }

  @ReactMethod
  override fun checkCapability(promise: Promise) {
    try {
      val biometricManager: BiometricManager = BiometricManager.from(reactApplicationContext)

      val response = WritableNativeMap()
      response.putBoolean("canAuthenticate", false)
      response.putString("errorReason", "")

      val canAuth = biometricManager.canAuthenticate(ALLOWED_AUTHENTICATORS)

      when (canAuth) {
        BiometricManager.BIOMETRIC_SUCCESS -> {
          response.putBoolean("canAuthenticate", true)
        }

        BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE -> {
          response.putString("errorReason", "Biometry is not available on this device.")
        }

        BiometricManager.BIOMETRIC_ERROR_HW_UNAVAILABLE -> {
          response.putString("errorReason", "Biometry is temporarily not available on this device.")
        }

        BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED -> {
          response.putString("errorReason", "Biometry is not enrolled on this device.")
        }

        BiometricManager.BIOMETRIC_ERROR_SECURITY_UPDATE_REQUIRED -> {
          response.putString("errorReason", "Biometry is not available due to a required security update")
        }

        BiometricManager.BIOMETRIC_ERROR_UNSUPPORTED -> {
          response.putString("errorReason", "Biometry is not supported on this device.")
        }

        BiometricManager.BIOMETRIC_STATUS_UNKNOWN -> {
          response.putString("errorReason", "Unknown error")
        }
      }

      promise.resolve(response)
    } catch (e: Exception) {
      promise.reject(e)
    }
  }


  @ReactMethod
  override fun requestBioAuth(title: String, subtitle: String, promise: Promise) {
    UiThreadUtil.runOnUiThread {
      val executor = ContextCompat.getMainExecutor(reactApplicationContext)
      val biometricPrompt: BiometricPrompt =
        BiometricPrompt(currentActivity as FragmentActivity, executor,
          object : BiometricPrompt.AuthenticationCallback() {
            override fun onAuthenticationError(
              errorCode: Int,
              errString: CharSequence
            ) {
              super.onAuthenticationError(errorCode, errString)
              promise.reject(Exception(errString.toString()));
            }

            override fun onAuthenticationSucceeded(
              result: BiometricPrompt.AuthenticationResult
            ) {
              super.onAuthenticationSucceeded(result)
              promise.resolve(true);
            }

            override fun onAuthenticationFailed() {
              super.onAuthenticationFailed()
              promise.reject(Exception("Auth Failed!"));
            }
          })

      val promptInfo = BiometricPrompt.PromptInfo.Builder()
        .setAllowedAuthenticators(ALLOWED_AUTHENTICATORS)
        .setTitle(title)
        .setSubtitle(subtitle)
        .build()

      biometricPrompt.authenticate(promptInfo)
    }
  }
}
