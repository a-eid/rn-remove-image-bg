import Foundation
import Vision
import CoreImage
import UIKit
import CoreML
import UniformTypeIdentifiers

class HybridImageBackgroundRemover: HybridImageBackgroundRemoverSpec {
    var memorySize: Int {
        return 0
    }
    
    // Reuse CIContext for better performance
    private let ciContext: CIContext = {
        // Use Metal for hardware acceleration if available
        if let metalDevice = MTLCreateSystemDefaultDevice() {
            return CIContext(mtlDevice: metalDevice, options: [.cacheIntermediates: false])
        }
        return CIContext(options: [.useSoftwareRenderer: false, .cacheIntermediates: false])
    }()
    
    // Lazy load CoreML model for iOS < 17
    private lazy var coreMLModel: VNCoreMLModel? = {
        guard let modelURL = Bundle(for: HybridImageBackgroundRemover.self).url(forResource: "U2Netp", withExtension: "mlmodelc") else {
            return nil
        }
        guard let model = try? MLModel(contentsOf: modelURL) else {
            return nil
        }
        return try? VNCoreMLModel(for: model)
    }()

    func removeBackground(imagePath: String, options: NativeRemoveBackgroundOptions) throws -> Promise<String> {
        return Promise.async { [self] in
            let maxDimension = Int(options.maxDimension)
            let format = options.format
            let quality = Int(options.quality)
            
            // Handle both absolute paths and file:// URLs
            let cleanPath = imagePath.hasPrefix("file://") ? String(imagePath.dropFirst(7)) : imagePath
            let fileUrl = URL(fileURLWithPath: cleanPath)
            
            // Validate file exists
            guard FileManager.default.fileExists(atPath: fileUrl.path) else {
                throw RuntimeError.error(withMessage: "File does not exist: \(imagePath)")
            }
            
            guard var inputImage = CIImage(contentsOf: fileUrl) else {
                throw RuntimeError.error(withMessage: "Could not load image from path: \(imagePath)")
            }
            
            // Downsample large images for better performance
            inputImage = self.downsampleIfNeeded(inputImage, maxDimension: maxDimension)

            var maskImage: CIImage?

            if #available(iOS 17.0, *) {
                // Use Vision's native foreground instance mask
                let request = VNGenerateForegroundInstanceMaskRequest()
                let handler = VNImageRequestHandler(ciImage: inputImage, options: [:])
                try handler.perform([request])

                if let result = request.results?.first {
                    let maskPixelBuffer = try result.generateScaledMaskForImage(forInstances: result.allInstances, from: handler)
                    maskImage = CIImage(cvPixelBuffer: maskPixelBuffer)
                }
            } else {
                // Fallback to CoreML (U2Netp) for iOS < 17
                maskImage = try self.processWithCoreML(inputImage: inputImage)
            }

            guard let mask = maskImage else {
                throw RuntimeError.error(withMessage: "Failed to generate mask")
            }

            // Apply the mask to the original image
            let maskedImage = inputImage.applyingFilter("CIBlendWithMask", parameters: [
                kCIInputMaskImageKey: mask
            ])

            // Render and save
            return try self.saveImage(maskedImage, format: format, quality: quality)
        }
    }
    
    /// Downsample image if it exceeds maxDimension
    private func downsampleIfNeeded(_ image: CIImage, maxDimension: Int) -> CIImage {
        let width = image.extent.width
        let height = image.extent.height
        let maxDim = CGFloat(maxDimension)
        
        guard width > maxDim || height > maxDim else {
            return image
        }
        
        let scale: CGFloat
        if width > height {
            scale = maxDim / width
        } else {
            scale = maxDim / height
        }
        
        return image.transformed(by: CGAffineTransform(scaleX: scale, y: scale))
    }
    
    /// Save processed image to disk
    private func saveImage(_ image: CIImage, format: OutputFormat, quality: Int) throws -> String {
        guard let cgImage = ciContext.createCGImage(image, from: image.extent) else {
            throw RuntimeError.error(withMessage: "Failed to render masked image")
        }
        
        let uiImage = UIImage(cgImage: cgImage)
        let tempDir = FileManager.default.temporaryDirectory
        let uuid = UUID().uuidString
        
        let data: Data?
        let fileName: String
        
        switch format {
        case .png:
            data = uiImage.pngData()
            fileName = "bg_removed_\(uuid).png"
        case .webp:
            // iOS doesn't natively support WEBP encoding
            // Use HEIC on iOS 17+ (supports alpha), otherwise fall back to PNG
            if #available(iOS 17.0, *) {
                data = uiImage.heicData()
                fileName = "bg_removed_\(uuid).heic"
            } else {
                data = uiImage.pngData()
                fileName = "bg_removed_\(uuid).png"
            }
        }
        
        guard let imageData = data else {
            throw RuntimeError.error(withMessage: "Failed to encode image")
        }
        
        let fileURL = tempDir.appendingPathComponent(fileName)
        try imageData.write(to: fileURL)
        
        return fileURL.path
    }

    private func processWithCoreML(inputImage: CIImage) throws -> CIImage? {
        guard let vnModel = coreMLModel else {
            throw RuntimeError.error(withMessage: "Could not load U2Netp model")
        }

        let request = VNCoreMLRequest(model: vnModel)
        request.imageCropAndScaleOption = .scaleFill

        let handler = VNImageRequestHandler(ciImage: inputImage, options: [:])
        try handler.perform([request])

        // Try VNPixelBufferObservation first
        if let results = request.results as? [VNPixelBufferObservation], let observation = results.first {
            return CIImage(cvPixelBuffer: observation.pixelBuffer)
        }
        
        // Fallback to VNCoreMLFeatureValueObservation (MultiArray)
        if let results = request.results as? [VNCoreMLFeatureValueObservation],
           let feature = results.first?.featureValue.multiArrayValue {
            return try self.convertMultiArrayToImage(multiArray: feature, originalSize: inputImage.extent.size)
        }
        
        throw RuntimeError.error(withMessage: "No valid result from CoreML model")
    }
    
    private func convertMultiArrayToImage(multiArray: MLMultiArray, originalSize: CGSize) throws -> CIImage? {
        // U2Net output is typically [1, 1, H, W] where H,W are usually 320x320
        guard multiArray.shape.count >= 3 else {
            throw RuntimeError.error(withMessage: "Unexpected MultiArray shape: \(multiArray.shape)")
        }
        
        let height = multiArray.shape[multiArray.shape.count - 2].intValue
        let width = multiArray.shape[multiArray.shape.count - 1].intValue
        
        // Create grayscale bitmap from MultiArray
        var pixelBuffer: CVPixelBuffer?
        let status = CVPixelBufferCreate(
            kCFAllocatorDefault,
            width,
            height,
            kCVPixelFormatType_OneComponent8,
            nil,
            &pixelBuffer
        )
        
        guard status == kCVReturnSuccess, let buffer = pixelBuffer else {
            throw RuntimeError.error(withMessage: "Failed to create pixel buffer")
        }
        
        CVPixelBufferLockBaseAddress(buffer, [])
        defer { CVPixelBufferUnlockBaseAddress(buffer, []) }
        
        guard let baseAddress = CVPixelBufferGetBaseAddress(buffer) else {
            throw RuntimeError.error(withMessage: "Failed to get pixel buffer base address")
        }
        
        let pointer = baseAddress.assumingMemoryBound(to: UInt8.self)
        
        // Copy and normalize values from MultiArray (0.0-1.0) to UInt8 (0-255)
        for y in 0..<height {
            for x in 0..<width {
                let index = y * width + x
                let value = multiArray[[0, 0, y as NSNumber, x as NSNumber]].floatValue
                pointer[index] = UInt8(min(max(value * 255.0, 0), 255))
            }
        }
        
        // Convert to CIImage and scale to original size
        let maskImage = CIImage(cvPixelBuffer: buffer)
        let scaleX = originalSize.width / CGFloat(width)
        let scaleY = originalSize.height / CGFloat(height)
        return maskImage.transformed(by: CGAffineTransform(scaleX: scaleX, y: scaleY))
    }
}

@_cdecl("createHybridImageBackgroundRemover")
public func createHybridImageBackgroundRemover() -> UnsafeMutableRawPointer {
  let hybridObject = HybridImageBackgroundRemover()
  return hybridObject.getCxxWrapper().toUnsafe()
}
