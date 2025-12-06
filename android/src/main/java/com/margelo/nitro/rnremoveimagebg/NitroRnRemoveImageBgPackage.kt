package com.margelo.nitro.rnremoveimagebg

import com.facebook.react.TurboReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfoProvider
import com.facebook.react.uimanager.ViewManager

class NitroRnRemoveImageBgPackage : TurboReactPackage() {
  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
    return null
  }

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
    return ReactModuleInfoProvider { HashMap() }
  }



  companion object {
    init {
      try {
        System.loadLibrary("NitroRnRemoveImageBg")
        println("🔥 Loaded native library: NitroRnRemoveImageBg")
      } catch (e: Throwable) {
        println("❌ Failed to load NitroRnRemoveImageBg: $e")
      }
      NitroRnRemoveImageBgOnLoad.initializeNative()
    }
  }
}
