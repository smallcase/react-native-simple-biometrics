package com.simplebiometrics

import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.UiThreadUtil.runOnUiThread
import com.facebook.react.module.annotations.ReactModule
import java.security.KeyStore
import java.security.PrivateKey
import java.security.Signature


@ReactModule(name = SimpleBiometricsModule.NAME)
class SimpleBiometricsModule(reactContext: ReactApplicationContext) :
  NativeSimpleBiometricsSpec(reactContext) {

  override fun getName(): String {
    return NAME
  }

  companion object {
    const val NAME = "SimpleBiometrics"
    private const val KEYSTORE = "AndroidKeyStore"
    private const val ALGORITHM = "RSA"
    private const val SIGNATURE_ALGORITHM = "SHA256withRSA"
    private const val KEY_SIZE = 2048
  }

  private fun getKeyStore(): KeyStore =
    KeyStore.getInstance(KEYSTORE).apply { load(null) }

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
    cancelLabel: String?,
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
          val promptInfoBuilder = BiometricPrompt.PromptInfo.Builder()
            .setAllowedAuthenticators(authenticators)
            .setTitle(promptTitle ?: "")
            .setSubtitle(promptMessage)

          // A negative button is required when device credentials are not allowed.
          if (!allowDeviceCredentials) {
            promptInfoBuilder.setNegativeButtonText(cancelLabel ?: "Cancel")
          }

          val promptInfo: BiometricPrompt.PromptInfo = promptInfoBuilder.build()

          prompt.authenticate(promptInfo)
        } else {
          throw java.lang.Exception("null activity")
        }
      } catch (e: java.lang.Exception) {
        promise!!.reject(e)
      }
    }
  }

  override fun createKeys(keyName: String?, promise: Promise?) {
    try {
      val name = keyName ?: throw java.lang.Exception("key name is required")
      val keyStore = getKeyStore()

      if (keyStore.containsAlias(name)) {
        throw java.lang.Exception("key already exists")
      }

      val generator =
        java.security.KeyPairGenerator.getInstance(KeyProperties.KEY_ALGORITHM_RSA, KEYSTORE)

      val spec = KeyGenParameterSpec.Builder(
        name,
        KeyProperties.PURPOSE_SIGN or
          KeyProperties.PURPOSE_VERIFY or
          KeyProperties.PURPOSE_ENCRYPT or
          KeyProperties.PURPOSE_DECRYPT
      )
        .setKeySize(KEY_SIZE)
        .setDigests(KeyProperties.DIGEST_SHA256)
        .setSignaturePaddings(KeyProperties.SIGNATURE_PADDING_RSA_PKCS1)
        .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_RSA_PKCS1)
        .setUserAuthenticationRequired(true)
        .setInvalidatedByBiometricEnrollment(true)
        .build()

      generator.initialize(spec)
      generator.generateKeyPair()

      val publicKey = keyStore.getCertificate(name).publicKey
      val publicKeyBase64 = Base64.encodeToString(publicKey.encoded, Base64.DEFAULT)

      val result = Arguments.createMap()
      result.putString("keyName", name)
      result.putString("publicKey", publicKeyBase64)
      result.putString("algorithm", ALGORITHM)

      promise!!.resolve(result)
    } catch (e: java.lang.Exception) {
      promise!!.reject(e)
    }
  }

  override fun biometricKeysExist(keyName: String?, promise: Promise?) {
    try {
      val name = keyName ?: throw java.lang.Exception("key name is required")
      promise!!.resolve(getKeyStore().containsAlias(name))
    } catch (e: java.lang.Exception) {
      promise!!.reject(e)
    }
  }

  override fun deleteKeys(keyName: String?, promise: Promise?) {
    try {
      val name = keyName ?: throw java.lang.Exception("key name is required")
      val keyStore = getKeyStore()
      val exists = keyStore.containsAlias(name)

      if (exists) {
        keyStore.deleteEntry(name)
      }

      promise!!.resolve(exists)
    } catch (e: java.lang.Exception) {
      promise!!.reject(e)
    }
  }

  override fun createSignature(
    keyName: String?,
    payload: String?,
    promptMessage: String?,
    promise: Promise?
  ) {
    runOnUiThread {
      try {
        val name = keyName ?: throw java.lang.Exception("key name is required")
        val data = payload ?: throw java.lang.Exception("payload is required")
        val message = promptMessage ?: throw java.lang.Exception("prompt message is required")

        val keyStore = getKeyStore()

        if (!keyStore.containsAlias(name)) {
          throw java.lang.Exception("key does not exist")
        }

        val privateKey = keyStore.getKey(name, null) as PrivateKey
        val publicKey = keyStore.getCertificate(name).publicKey

        val signature = Signature.getInstance(SIGNATURE_ALGORITHM)
        signature.initSign(privateKey)

        val cryptoObject = BiometricPrompt.CryptoObject(signature)

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

              try {
                val signed = result.cryptoObject?.signature
                  ?: throw java.lang.Exception("failed to create signature")

                signed.update(data.toByteArray(Charsets.UTF_8))
                val signatureBytes = signed.sign()
                val resultMap = Arguments.createMap()
                resultMap.putString("keyName", name)
                resultMap.putString(
                  "publicKey",
                  Base64.encodeToString(publicKey.encoded, Base64.DEFAULT)
                )
                resultMap.putString(
                  "signature",
                  Base64.encodeToString(signatureBytes, Base64.DEFAULT)
                )

                promise!!.resolve(resultMap)
              } catch (e: java.lang.Exception) {
                promise!!.reject(e)
              }
            }
          }

        if (activity != null) {
          val prompt = BiometricPrompt(
            activity as FragmentActivity, mainExecutor,
            authenticationCallback
          )

          val promptInfo: BiometricPrompt.PromptInfo = BiometricPrompt.PromptInfo.Builder()
            .setAllowedAuthenticators(BiometricManager.Authenticators.BIOMETRIC_STRONG)
            .setTitle(message)
            .setNegativeButtonText("Cancel")
            .build()

          prompt.authenticate(promptInfo, cryptoObject)
        } else {
          throw java.lang.Exception("null activity")
        }
      } catch (e: java.lang.Exception) {
        promise!!.reject(e)
      }
    }
  }
}
