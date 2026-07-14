package com.simplebiometrics

import android.util.Log
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity
import androidx.lifecycle.Lifecycle
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.UiThreadUtil.runOnUiThread
import com.facebook.react.module.annotations.ReactModule


@ReactModule(name = SimpleBiometricsModule.NAME)
class SimpleBiometricsModule(reactContext: ReactApplicationContext) :
  NativeSimpleBiometricsSpec(reactContext), LifecycleEventListener {

  data class PendingAuthRequest(
    val promptTitle: String?,
    val promptMessage: String?,
    val allowDeviceCredentials: Boolean,
    val promise: Promise
  )

  private var pendingAuthRequest: PendingAuthRequest? = null
  private var isAuthenticationActive = false
  private var isHostResumed = false
  private var launchAttemptScheduled = false

  init {
    reactContext.addLifecycleEventListener(this)
  }

  override fun getName(): String {
    return NAME
  }

  companion object {
    const val NAME = "SimpleBiometrics"
    private const val LOG_TAG = "SimpleBiometrics"
  }

  override fun onHostResume() {
    isHostResumed = true
    Log.d(LOG_TAG, "onHostResume pending=${pendingAuthRequest != null} active=$isAuthenticationActive scheduled=$launchAttemptScheduled")
    launchPendingAuthentication()
  }

  override fun onHostPause() {
    Log.d(LOG_TAG, "onHostPause pending=${pendingAuthRequest != null} active=$isAuthenticationActive")
    isHostResumed = false
    launchAttemptScheduled = false
  }

  override fun onHostDestroy() {
    Log.d(LOG_TAG, "onHostDestroy pending=${pendingAuthRequest != null} active=$isAuthenticationActive")
    isHostResumed = false
    isAuthenticationActive = false
  }

  override fun invalidate() {
    reactApplicationContext.removeLifecycleEventListener(this)
    pendingAuthRequest = null
    isAuthenticationActive = false
    isHostResumed = false
    launchAttemptScheduled = false
    super.invalidate()
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
      if (promise == null) {
        Log.d(LOG_TAG, "requestBioAuth ignored because promise was null")
        return@runOnUiThread
      }

      if (pendingAuthRequest != null) {
        Log.d(LOG_TAG, "requestBioAuth rejected because another request is already pending")
        promise.reject("BIOMETRIC_IN_PROGRESS", "Another biometric authentication request is already in progress")
        return@runOnUiThread
      }

      pendingAuthRequest = PendingAuthRequest(
        promptTitle = promptTitle,
        promptMessage = promptMessage,
        allowDeviceCredentials = allowDeviceCredentials,
        promise = promise
      )

      Log.d(
        LOG_TAG,
        "requestBioAuth queued hostResumed=$isHostResumed active=$isAuthenticationActive title=${promptTitle ?: ""}"
      )

      launchPendingAuthentication()
    }
  }

  private fun launchPendingAuthentication() {
    runOnUiThread {
      val request = pendingAuthRequest ?: return@runOnUiThread
      if (isAuthenticationActive) {
        Log.d(LOG_TAG, "launchPendingAuthentication skipped because authentication is already active")
        return@runOnUiThread
      }

      if (!isHostResumed) {
        Log.d(LOG_TAG, "launchPendingAuthentication skipped because host is not resumed")
        return@runOnUiThread
      }

      val activity = reactApplicationContext.currentActivity as? FragmentActivity ?: return@runOnUiThread

      Log.d(
        LOG_TAG,
        "launchPendingAuthentication activity=${activity::class.java.simpleName} lifecycle=${activity.lifecycle.currentState} finishing=${activity.isFinishing} destroyed=${activity.isDestroyed}"
      )

      if (activity.isFinishing || activity.isDestroyed) {
        Log.d(LOG_TAG, "launchPendingAuthentication aborted because activity is finishing or destroyed")
        return@runOnUiThread
      }

      if (!activity.lifecycle.currentState.isAtLeast(Lifecycle.State.RESUMED)) {
        if (!launchAttemptScheduled) {
          Log.d(LOG_TAG, "launchPendingAuthentication deferring until decorView post because lifecycle is ${activity.lifecycle.currentState}")
          launchAttemptScheduled = true
          activity.window?.decorView?.post {
            launchAttemptScheduled = false
            Log.d(LOG_TAG, "launchPendingAuthentication retrying after decorView post")
            launchPendingAuthentication()
          } ?: run {
            launchAttemptScheduled = false
            Log.d(LOG_TAG, "launchPendingAuthentication could not schedule decorView post")
          }
        }
        return@runOnUiThread
      }

      try {
        isAuthenticationActive = true
        Log.d(LOG_TAG, "launchPendingAuthentication showing BiometricPrompt allowDeviceCredentials=${request.allowDeviceCredentials}")
        val context = reactApplicationContext
        val mainExecutor = ContextCompat.getMainExecutor(context)
        val authenticationCallback: BiometricPrompt.AuthenticationCallback =
          object : BiometricPrompt.AuthenticationCallback() {
            override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
              super.onAuthenticationError(errorCode, errString)
              isAuthenticationActive = false
              Log.d(
                LOG_TAG,
                "onAuthenticationError code=$errorCode message=$errString hostResumed=$isHostResumed pending=${pendingAuthRequest != null}"
              )
              if (errorCode == BiometricPrompt.ERROR_CANCELED && !isHostResumed) {
                Log.d(LOG_TAG, "onAuthenticationError preserving pending request for next resume")
                return
              }

              pendingAuthRequest = null
              if (errorCode == BiometricPrompt.ERROR_CANCELED) {
                request.promise.reject("BIOMETRIC_SYSTEM_CANCELED", errString.toString())
              } else {
                request.promise.reject(java.lang.Exception(errString.toString()))
              }
            }

            override fun onAuthenticationSucceeded(
              result: BiometricPrompt.AuthenticationResult
            ) {
              super.onAuthenticationSucceeded(result)
              isAuthenticationActive = false
              pendingAuthRequest = null
              Log.d(LOG_TAG, "onAuthenticationSucceeded")
              request.promise.resolve(true)
            }
          }

        val prompt = BiometricPrompt(
          activity,
          mainExecutor,
          authenticationCallback
        )

        val authenticators = getAllowedAuthenticators(request.allowDeviceCredentials)
        val promptInfo: BiometricPrompt.PromptInfo = BiometricPrompt.PromptInfo.Builder()
          .setAllowedAuthenticators(authenticators)
          .setTitle(request.promptTitle ?: "")
          .setSubtitle(request.promptMessage)
          .build()

        prompt.authenticate(promptInfo)
      } catch (e: java.lang.Exception) {
        isAuthenticationActive = false
        pendingAuthRequest = null
        Log.d(LOG_TAG, "launchPendingAuthentication failed: ${e.message}", e)
        request.promise.reject(e)
      }
    }
  }
}
