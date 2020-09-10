package com.smallcase.rnbiometrics;

import android.app.Activity;

import androidx.annotation.NonNull;
import androidx.biometric.BiometricManager;
import androidx.biometric.BiometricPrompt;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.FragmentActivity;

import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import java.util.concurrent.Executor;

public class RNBiometricsModule extends ReactContextBaseJavaModule {


    public RNBiometricsModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "RNBiometrics";
    }

    @ReactMethod
    public void canAuthenticate(Promise promise) {
        try {
            ReactApplicationContext context = getReactApplicationContext();
            BiometricManager biometricManager = BiometricManager.from(context);
            boolean can = biometricManager.canAuthenticate() == BiometricManager.BIOMETRIC_SUCCESS;
            promise.resolve(can);
        } catch (Exception e) {
            promise.reject(e);
        }
    }

    @ReactMethod
    public void requestBioAuth(String title, String subtitle, final Promise promise) {
        try {
            ReactApplicationContext context = getReactApplicationContext();
            Activity activity = getCurrentActivity();

            Executor mainExecutor = ContextCompat.getMainExecutor(context);

            final BiometricPrompt.AuthenticationCallback authenticationCallback = new BiometricPrompt.AuthenticationCallback() {

                @Override
                public void onAuthenticationError(int errorCode, @NonNull CharSequence errString) {
                    super.onAuthenticationError(errorCode, errString);
                    promise.reject(new Exception(errString.toString()));
                }

                @Override
                public void onAuthenticationSucceeded(@NonNull BiometricPrompt.AuthenticationResult result) {
                    super.onAuthenticationSucceeded(result);
                    promise.resolve(true);
                }
            };

            if(activity != null){
                BiometricPrompt prompt = new BiometricPrompt((FragmentActivity) activity, mainExecutor, authenticationCallback);

                BiometricPrompt.PromptInfo promptInfo = new BiometricPrompt.PromptInfo.Builder()
                        .setTitle(title)
                        .setSubtitle(subtitle)
                        .setDeviceCredentialAllowed(true)
                        .build();

                prompt.authenticate(promptInfo);
            } else {
                throw new Exception("null activity");
            }

        } catch (Exception e) {
            promise.reject(e);
        }
    }
}
