#import <Foundation/Foundation.h>
#import <NitroModules/HybridObjectRegistry.hpp>
#import "NitroRnRemoveImageBg-Swift-Cxx-Bridge.hpp"

extern "C" void* createHybridImageBackgroundRemover();

@interface NitroRnRemoveImageBgOnLoad : NSObject
@end

@implementation NitroRnRemoveImageBgOnLoad

+ (void)load {
  margelo::nitro::HybridObjectRegistry::registerHybridObjectConstructor(
    "ImageBackgroundRemover",
    []() -> std::shared_ptr<margelo::nitro::HybridObject> {
      void* unsafe = createHybridImageBackgroundRemover();
      return margelo::nitro::rnremoveimagebg::bridge::swift::create_std__shared_ptr_HybridImageBackgroundRemoverSpec_(unsafe);
    }
  );
}

@end
