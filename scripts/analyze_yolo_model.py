#!/usr/bin/env python3
"""
YOLO TFLite Model Analyzer
Extracts all relevant information from a .tflite model file
"""

import sys
import os

try:
    import tensorflow as tf
    import numpy as np
except ImportError:
    print("❌ ERROR: TensorFlow not installed!")
    print("Run: pip install tensorflow")
    sys.exit(1)


def analyze_tflite_model(model_path):
    """Analyze a TFLite model and extract all metadata"""
    
    if not os.path.exists(model_path):
        print(f"❌ ERROR: Model file not found: {model_path}")
        sys.exit(1)
    
    print("="*70)
    print("🔍 YOLO TFLITE MODEL ANALYSIS")
    print("="*70)
    print(f"\n📁 Model Path: {model_path}")
    print(f"📦 File Size: {os.path.getsize(model_path) / (1024*1024):.2f} MB")
    
    # Load interpreter
    try:
        interpreter = tf.lite.Interpreter(model_path=model_path)
        interpreter.allocate_tensors()
    except Exception as e:
        print(f"\n❌ ERROR loading model: {e}")
        sys.exit(1)
    
    # Get input details
    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()
    
    print("\n" + "="*70)
    print("📥 INPUT SPECIFICATION")
    print("="*70)
    
    for i, input_detail in enumerate(input_details):
        print(f"\nInput {i}:")
        print(f"  Name:  {input_detail['name']}")
        print(f"  Shape: {input_detail['shape']}")
        print(f"  Type:  {input_detail['dtype']}")
        
        # Check quantization
        if 'quantization' in input_detail and len(input_detail['quantization']) > 0:
            scale = input_detail['quantization'][0]
            zero_point = input_detail['quantization'][1]
            if scale != 0.0 or zero_point != 0:
                print(f"  Quantization: scale={scale}, zero_point={zero_point}")
                print(f"  ⚠️  Model uses quantized input!")
    
    print("\n" + "="*70)
    print("📤 OUTPUT SPECIFICATION")
    print("="*70)
    
    for i, output_detail in enumerate(output_details):
        print(f"\nOutput {i}:")
        print(f"  Name:  {output_detail['name']}")
        print(f"  Shape: {output_detail['shape']}")
        print(f"  Type:  {output_detail['dtype']}")
        
        # Infer number of classes
        shape = output_detail['shape']
        if len(shape) >= 2:
            num_classes = shape[-1]
            print(f"  📊 Detected Classes: {num_classes}")
    
    # Test inference
    print("\n" + "="*70)
    print("🧪 TEST INFERENCE")
    print("="*70)
    
    input_shape = input_details[0]['shape']
    input_dtype = input_details[0]['dtype']
    
    print(f"\nCreating random test input with shape {input_shape}...")
    
    # Create appropriate test input based on dtype
    if input_dtype == np.uint8:
        test_input = np.random.randint(0, 256, size=input_shape, dtype=np.uint8)
        print("  Using uint8 input (0-255 range)")
    elif input_dtype == np.float32:
        test_input = np.random.rand(*input_shape).astype(np.float32)
        print("  Using float32 input (0.0-1.0 range)")
    else:
        test_input = np.zeros(input_shape, dtype=input_dtype)
        print(f"  Using {input_dtype} input")
    
    # Run inference
    try:
        interpreter.set_tensor(input_details[0]['index'], test_input)
        interpreter.invoke()
        output = interpreter.get_tensor(output_details[0]['index'])
        
        print(f"✅ Inference successful!")
        print(f"\nOutput shape: {output.shape}")
        print(f"Output dtype: {output.dtype}")
        print(f"Output range: [{output.min():.4f}, {output.max():.4f}]")
        
        # Show some predictions
        if len(output.shape) == 2:
            print(f"\nSample predictions (first 10 classes):")
            print(output[0][:10])
    except Exception as e:
        print(f"❌ Inference failed: {e}")
    
    # Recommendations
    print("\n" + "="*70)
    print("💡 RECOMMENDATIONS")
    print("="*70)
    
    input_shape_str = str(input_shape)
    
    if input_dtype == np.uint8:
        print("\n✅ Model uses uint8 input - no normalization needed in preprocessing")
        print("   Just resize images to the expected shape")
    else:
        print("\n⚠️  Model uses float32 input - normalization REQUIRED")
        print("   Images must be normalized to [0, 1] range: image / 255.0")
    
    if input_shape[1] == input_shape[2]:
        print(f"\n✅ Square input: {input_shape[1]}x{input_shape[2]}")
    else:
        print(f"\n⚠️  Non-square input: {input_shape[1]}x{input_shape[2]}")
        print("   Make sure image resizing maintains aspect ratio correctly")
    
    # Check model size
    model_size_mb = os.path.getsize(model_path) / (1024*1024)
    if model_size_mb > 50:
        print(f"\n⚠️  Large model ({model_size_mb:.1f} MB) - consider dynamic download instead of bundling")
    elif model_size_mb > 25:
        print(f"\n⚡ Medium model ({model_size_mb:.1f} MB) - acceptable for bundling")
    else:
        print(f"\n✅ Small model ({model_size_mb:.1f} MB) - perfect for bundling in app")
    
    print("\n" + "="*70)
    print("📋 NEXT STEPS")
    print("="*70)
    
    print(f"""
1. Copy model to mobile app:
   mkdir -p progeny-mobile/src/assets/models
   cp {model_path} progeny-mobile/src/assets/models/plant_disease.tflite

2. Update modelConfig.ts with:
   - Input shape: {input_shape}
   - Input type: {input_dtype}
   - Number of classes: {output_details[0]['shape'][-1]}

3. Implement preprocessing:
   - Resize to: {input_shape[1]}x{input_shape[2]}
   {"- Normalize: NO (uint8)" if input_dtype == np.uint8 else "- Normalize: YES (divide by 255.0)"}

4. Map class indices to disease names (update CLASS_NAMES array)
""")
    
    print("="*70)
    print("✅ ANALYSIS COMPLETE")
    print("="*70)
    
    return {
        'input_shape': input_shape.tolist(),
        'input_dtype': str(input_dtype),
        'output_shape': output_details[0]['shape'].tolist(),
        'num_classes': output_details[0]['shape'][-1],
        'model_size_mb': model_size_mb
    }


if __name__ == '__main__':
    if len(sys.argv) != 2:
        print("Usage: python analyze_yolo_model.py <path_to_model.tflite>")
        print("\nExample:")
        print("  python analyze_yolo_model.py models/plant_disease.tflite")
        sys.exit(1)
    
    model_path = sys.argv[1]
    analyze_tflite_model(model_path)
