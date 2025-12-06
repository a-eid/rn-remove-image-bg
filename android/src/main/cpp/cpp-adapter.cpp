#include <jni.h>
#include "NitroRnRemoveImageBgOnLoad.hpp"

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void*) {
  return margelo::nitro::rnremoveimagebg::initialize(vm);
}
