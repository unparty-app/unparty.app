#!/usr/bin/env swift

//
//  precompute-colors.swift
//  theunpartyapp Cover Colors Extraction
//
//  Pre-computes dominant colors for all cover images
//  Generates cover-colors.json for Next.js OG image generation
//

import Foundation
import AppKit
import Vision

print("🧠")
print("COLOR.")
print("THINKING...")
// MARK: - Configuration

let projectRoot = ProcessInfo.processInfo.environment["PWD"] ?? FileManager.default.currentDirectoryPath
let coversPath = "\(projectRoot)/public/covers"
let outputPath = "\(projectRoot)/src/app/covers/cover-colors.json"

// Dynamically discover all cover images from the directory
func discoverCoverImages() -> [String] {
    let fileManager = FileManager.default

    guard let files = try? fileManager.contentsOfDirectory(atPath: coversPath) else {
        print("🧨 OH NO! NOTHING IS HERE, OOPS.")
        return []
    }

    // Filter for image files (excluding directories and non-images)
    let imageExtensions = ["png", "jpg", "JPG", "jpeg", "svg"]
    let coverImages = files.filter { filename in
        imageExtensions.contains(where: { filename.hasSuffix(".\($0)") })
    }.sorted()

    print("🔎 FOUND \(coverImages.count) cover images")
    return coverImages
}

let coverImages = discoverCoverImages()

// MARK: - Color Extraction

func extractColors(from filename: String) -> [String]? {
    let fullPath = "\(coversPath)/\(filename)"
    
    // Skip SVG files (can't process with Vision)
    if filename.hasSuffix(".svg") {
       // print("   Skipping SVG: \(filename)")
        return welcomeColors()
    }
    
    // Try to load image from file path
    guard let image = NSImage(contentsOfFile: fullPath),
          let cgImage = image.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
        // print("⚠️  Failed to load image: \(filename)")
        return nil
    }
    
    // print("   Processing: \(filename)")
    
    // Use Vision framework for extraction
    if let colors = extractWithVision(cgImage) {
        return colors
    }
    
    // Fallback to grid sampling
    return extractWithGridSampling(cgImage)
}

func loadImageFromAssets(_ imageName: String) -> NSImage? {
    // No longer needed for cover images
    return nil
}

func extractWithVision(_ cgImage: CGImage) -> [String]? {
    let request = VNGenerateAttentionBasedSaliencyImageRequest()
    let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
    
    do {
        try handler.perform([request])
        // Simplified extraction - just sample key pixels
        return sampleColors(from: cgImage, count: 5)
    } catch {
        return nil
    }
}

func extractWithGridSampling(_ cgImage: CGImage) -> [String] {
    return sampleColors(from: cgImage, count: 5)
}

func sampleColors(from cgImage: CGImage, count: Int) -> [String] {
    let width = cgImage.width
    let height = cgImage.height
    
    guard let context = CGContext(
        data: nil,
        width: width,
        height: height,
        bitsPerComponent: 8,
        bytesPerRow: width * 4,
        space: CGColorSpaceCreateDeviceRGB(),
        bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
    ),
    let data = context.data else {
        return welcomeColors()
    }
    
    context.draw(cgImage, in: CGRect(x: 0, y: 0, width: width, height: height))
    let buffer = data.bindMemory(to: UInt8.self, capacity: width * height * 4)
    
    var colors: [(r: Double, g: Double, b: Double)] = []
    let sampleCount = 200
    
    for _ in 0..<sampleCount {
        let x = Int.random(in: 0..<width)
        let y = Int.random(in: 0..<height)
        let offset = (y * width + x) * 4
        
        let r = Double(buffer[offset]) / 255.0
        let g = Double(buffer[offset + 1]) / 255.0
        let b = Double(buffer[offset + 2]) / 255.0
        let a = Double(buffer[offset + 3]) / 255.0
        
        if a > 0.5 {
            colors.append((r, g, b))
        }
    }
    
    // Simple clustering by uniqueness
    var dominantColors: [(r: Double, g: Double, b: Double)] = []
    for color in colors {
        var isUnique = true
        for existing in dominantColors {
            let distance = sqrt(pow(color.r - existing.r, 2) + pow(color.g - existing.g, 2) + pow(color.b - existing.b, 2))
            if distance < 0.15 {
                isUnique = false
                break
            }
        }
        if isUnique {
            dominantColors.append(color)
        }
        if dominantColors.count >= count {
            break
        }
    }
    
    // Fill remaining with variations
    while dominantColors.count < count {
        if let base = dominantColors.randomElement() {
            let variation = (
                r: min(1.0, max(0.0, base.r + Double.random(in: -0.1...0.1))),
                g: min(1.0, max(0.0, base.g + Double.random(in: -0.1...0.1))),
                b: min(1.0, max(0.0, base.b + Double.random(in: -0.1...0.1)))
            )
            dominantColors.append(variation)
        } else {
            break
        }
    }
    
    return dominantColors.map { colorToHex($0.r, $0.g, $0.b) }
}

func colorToHex(_ r: Double, _ g: Double, _ b: Double) -> String {
    let red = Int(r * 255)
    let green = Int(g * 255)
    let blue = Int(b * 255)
    return String(format: "#%02X%02X%02X", red, green, blue)
}

func welcomeColors() -> [String] {
    return ["#3500D3", "#4D6647", "#66474D", "#80664D", "#4D4D66"]
}

// MARK: - Main Execution

if coverImages.isEmpty {
    print("❌ NOTHING in \(coversPath)")
    exit(1)
}

// A cover keeps the palette it has: sampling is random, so working one out again
// would change every cover on every run. Only new covers get one. Replaced a
// cover's picture? Name it: npm run extract-colors -- cover-052
let redo = Set(CommandLine.arguments.dropFirst())
let existingColors: [String: [String]] = {
    guard let data = try? Data(contentsOf: URL(fileURLWithPath: outputPath)) else { return [:] }
    return (try? JSONDecoder().decode([String: [String]].self, from: data)) ?? [:]
}()

var precomputedColors: [String: [String]] = [:]

for filename in coverImages {
    // Extract cover ID without extension for JSON key
    let coverId = filename.replacingOccurrences(of: ".JPG", with: "")
                         .replacingOccurrences(of: ".jpg", with: "")
                         .replacingOccurrences(of: ".png", with: "")
                         .replacingOccurrences(of: ".svg", with: "")
    
    if let kept = existingColors[coverId], !redo.contains(coverId) {
        precomputedColors[coverId] = kept
    } else if let colors = extractColors(from: filename) {
        precomputedColors[coverId] = colors
      
    } else {
        precomputedColors[coverId] = welcomeColors()
        print("⚠️ADD. WELCOME-COLORS for \(coverId)")
    }
}

// Write to JSON
do {
    let encoder = JSONEncoder()
    encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
    let jsonData = try encoder.encode(precomputedColors)
    try jsonData.write(to: URL(fileURLWithPath: outputPath))
    print("\n🛠️BUILT:")
    print("   FEAT. cover-colors.json")
    print("   LEARN. \(outputPath)")
    print("   STAT. \(precomputedColors.count) images")
} catch {
    print("\n❌ FAIL. \(error)")
    exit(1)
}
