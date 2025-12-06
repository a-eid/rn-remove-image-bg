package com.margelo.nitro.rnremoveimagebg

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.os.Build
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.segmentation.subject.SubjectSegmentation
import com.google.mlkit.vision.segmentation.subject.SubjectSegmenterOptions
import com.margelo.nitro.rnremoveimagebg.HybridImageBackgroundRemoverSpec
import com.margelo.nitro.rnremoveimagebg.NativeRemoveBackgroundOptions
import com.margelo.nitro.rnremoveimagebg.OutputFormat
import com.margelo.nitro.core.Promise
import com.margelo.nitro.NitroModules
import java.io.File
import java.io.FileOutputStream
import java.util.UUID
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlin.coroutines.suspendCoroutine
import kotlin.math.max
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class HybridImageBackgroundRemover : HybridImageBackgroundRemoverSpec() {
    override val memorySize: Long
        get() = 0L

    private val segmenter by lazy {
        val options = SubjectSegmenterOptions.Builder()
            .enableForegroundBitmap()
            .build()
        SubjectSegmentation.getClient(options)
    }

    override fun removeBackground(imagePath: String, options: NativeRemoveBackgroundOptions): Promise<String> {
        return Promise.async {
            withContext(Dispatchers.Default) {
                processImage(imagePath, options)
            }
        }
    }

    private suspend fun processImage(imagePath: String, options: NativeRemoveBackgroundOptions): String {
        val cleanPath = if (imagePath.startsWith("file://")) imagePath.substring(7) else imagePath
        val file = File(cleanPath)
        
        if (!file.exists() || !file.canRead()) {
            throw Exception("File does not exist or is not readable: $imagePath")
        }
        
        // Decode with downsampling for large images
        val bitmap = decodeBitmapEfficiently(cleanPath, options.maxDimension.toInt())
            ?: throw Exception("Could not decode image at path: $imagePath")

        val inputImage = InputImage.fromBitmap(bitmap, 0)

        return suspendCoroutine { continuation ->
            segmenter.process(inputImage)
                .addOnSuccessListener { result ->
                    val foregroundBitmap = result.foregroundBitmap
                    if (foregroundBitmap != null) {
                        try {
                            val context = NitroModules.applicationContext
                            if (context == null) {
                                bitmap.recycle()
                                foregroundBitmap.recycle()
                                continuation.resumeWithException(Exception("Application Context is null"))
                                return@addOnSuccessListener
                            }
                            
                            val outputPath = saveImage(
                                foregroundBitmap,
                                context.cacheDir,
                                options.format,
                                options.quality.toInt()
                            )
                            
                            bitmap.recycle()
                            foregroundBitmap.recycle()
                            continuation.resume(outputPath)
                        } catch (e: Exception) {
                            bitmap.recycle()
                            foregroundBitmap.recycle()
                            continuation.resumeWithException(e)
                        }
                    } else {
                        bitmap.recycle()
                        continuation.resumeWithException(Exception("Could not generate foreground bitmap"))
                    }
                }
                .addOnFailureListener { e ->
                    bitmap.recycle()
                    continuation.resumeWithException(e)
                }
        }
    }

    /**
     * Decode bitmap with efficient sampling for large images
     */
    private fun decodeBitmapEfficiently(path: String, maxDimension: Int): Bitmap? {
        // First, get image dimensions without loading into memory
        val boundsOptions = BitmapFactory.Options().apply {
            inJustDecodeBounds = true
        }
        BitmapFactory.decodeFile(path, boundsOptions)
        
        val imageWidth = boundsOptions.outWidth
        val imageHeight = boundsOptions.outHeight
        
        if (imageWidth <= 0 || imageHeight <= 0) {
            return null
        }
        
        // Calculate sample size
        val sampleSize = calculateInSampleSize(imageWidth, imageHeight, maxDimension)
        
        // Decode with sample size
        val decodeOptions = BitmapFactory.Options().apply {
            inSampleSize = sampleSize
            inPreferredConfig = Bitmap.Config.ARGB_8888
        }
        
        return BitmapFactory.decodeFile(path, decodeOptions)
    }

    /**
     * Calculate optimal inSampleSize for downsampling
     */
    private fun calculateInSampleSize(width: Int, height: Int, maxDimension: Int): Int {
        var sampleSize = 1
        val maxSize = max(width, height)
        
        if (maxSize > maxDimension) {
            val halfWidth = width / 2
            val halfHeight = height / 2
            
            // Calculate the largest inSampleSize value that is a power of 2
            // and keeps both dimensions above the requested max dimension
            while ((halfWidth / sampleSize) >= maxDimension && 
                   (halfHeight / sampleSize) >= maxDimension) {
                sampleSize *= 2
            }
        }
        
        return sampleSize
    }

    /**
     * Save bitmap to cache directory with specified format and quality
     */
    @Suppress("DEPRECATION")
    private fun saveImage(
        bitmap: Bitmap,
        outputDir: File,
        format: OutputFormat,
        quality: Int
    ): String {
        val compressFormat = when (format) {
            OutputFormat.WEBP -> {
                // Use lossy for quality < 100 (smaller files), lossless for 100
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                    if (quality < 100) Bitmap.CompressFormat.WEBP_LOSSY
                    else Bitmap.CompressFormat.WEBP_LOSSLESS
                } else {
                    // Pre-Android 11 uses deprecated WEBP format
                    Bitmap.CompressFormat.WEBP
                }
            }
            OutputFormat.PNG -> Bitmap.CompressFormat.PNG
        }
        
        val extension = when (format) {
            OutputFormat.WEBP -> "webp"
            OutputFormat.PNG -> "png"
        }
        
        val outputFile = File(outputDir, "bg_removed_${UUID.randomUUID()}.$extension")
        
        FileOutputStream(outputFile).use { outStream ->
            // For PNG, quality is ignored (always lossless)
            // For WEBP, use the provided quality
            val finalQuality = if (format == OutputFormat.PNG) 100 else quality
            bitmap.compress(compressFormat, finalQuality, outStream)
        }
        
        return outputFile.absolutePath
    }
}
