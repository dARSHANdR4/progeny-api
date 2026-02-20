"""
Test TFLite Model Type: Classification vs Object Detection
Checks if best_float16.tflite outputs bounding boxes or just labels
"""

import tensorflow as tf
import numpy as np
from PIL import Image

def analyze_tflite_model(model_path):
    """Analyze TFLite model structure to determine type"""
    
    print("=" * 60)
    print("🔍 ANALYZING TFLITE MODEL")
    print("=" * 60)
    
    # Load the TFLite model
    interpreter = tf.lite.Interpreter(model_path=model_path)
    interpreter.allocate_tensors()
    
    # Get input details
    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()
    
    print("\n📥 INPUT DETAILS:")
    print("-" * 60)
    for i, inp in enumerate(input_details):
        print(f"Input {i}:")
        print(f"  Name: {inp['name']}")
        print(f"  Shape: {inp['shape']}")
        print(f"  Type: {inp['dtype']}")
    
    print("\n📤 OUTPUT DETAILS:")
    print("-" * 60)
    for i, out in enumerate(output_details):
        print(f"Output {i}:")
        print(f"  Name: {out['name']}")
        print(f"  Shape: {out['shape']}")
        print(f"  Type: {out['dtype']}")
    
    # Determine model type based on outputs
    print("\n" + "=" * 60)
    print("🎯 MODEL TYPE ANALYSIS")
    print("=" * 60)
    
    num_outputs = len(output_details)
    
    if num_outputs == 1:
        shape = output_details[0]['shape']
        if len(shape) == 2 and shape[1] <= 100:
            print("\n✅ CLASSIFICATION MODEL")
            print(f"   Output shape: {shape}")
            print(f"   Number of classes: {shape[1]}")
            print("\n❌ Cannot show bounding boxes")
            print("   Need Object Detection model for real-time camera")
            return "classification"
    
    elif num_outputs >= 4:
        print("\n✅ OBJECT DETECTION MODEL (YOLO)")
        print(f"   Number of outputs: {num_outputs}")
        print("   Likely outputs: boxes, classes, scores, num_detections")
        print("\n✅ CAN show bounding boxes!")
        print("   Ready for real-time camera detection")
        return "object_detection"
    
    else:
        print("\n⚠️ UNKNOWN MODEL TYPE")
        print(f"   Number of outputs: {num_outputs}")
        print("   Need manual inspection")
        return "unknown"

def test_with_sample_image(model_path, image_path=None):
    """Run inference on a sample image to see output format"""
    
    interpreter = tf.lite.Interpreter(model_path=model_path)
    interpreter.allocate_tensors()
    
    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()
    
    # Get input shape
    input_shape = input_details[0]['shape']
    height, width = input_shape[1], input_shape[2]
    
    print("\n" + "=" * 60)
    print("🖼️ TEST INFERENCE (Random Input)")
    print("=" * 60)
    
    # Create random input (or load image if provided)
    if image_path:
        img = Image.open(image_path).resize((width, height))
        input_data = np.array(img, dtype=np.float32)
        input_data = np.expand_dims(input_data, axis=0)
        input_data = input_data / 255.0  # Normalize
    else:
        input_data = np.random.random(input_shape).astype(np.float32)
    
    # Run inference
    interpreter.set_tensor(input_details[0]['index'], input_data)
    interpreter.invoke()
    
    # Get outputs
    print("\n📊 OUTPUT VALUES:")
    print("-" * 60)
    for i, out in enumerate(output_details):
        output_data = interpreter.get_tensor(out['index'])
        print(f"\nOutput {i} ({out['name']}):")
        print(f"  Shape: {output_data.shape}")
        print(f"  Sample values: {output_data.flatten()[:10]}")
        
        # Interpret based on shape
        if len(output_data.shape) == 2 and output_data.shape[1] <= 100:
            print(f"  → Likely class probabilities ({output_data.shape[1]} classes)")
            print(f"  → Top class: {np.argmax(output_data)}")
            print(f"  → Confidence: {np.max(output_data):.2%}")

if __name__ == "__main__":
    # Path to your TFLite model
    MODEL_PATH = "progeny-mobile/best_float16.tflite"
    
    # Alternative paths to check
    PATHS_TO_CHECK = [
        "progeny-mobile/best_float16.tflite",
        "progeny-mobile/assets/models/best_float16.tflite",
        "best_float16.tflite",
    ]
    
    model_found = False
    for path in PATHS_TO_CHECK:
        try:
            print(f"\n🔍 Checking: {path}")
            analyze_tflite_model(path)
            test_with_sample_image(path)
            model_found = True
            break
        except FileNotFoundError:
            print(f"❌ Not found: {path}")
            continue
        except Exception as e:
            print(f"❌ Error: {e}")
            continue
    
    if not model_found:
        print("\n" + "=" * 60)
        print("❌ MODEL NOT FOUND")
        print("=" * 60)
        print("\nPlease run this script from the project root:")
        print("  cd x:\\progeny-main\\progeny-main")
        print("  python test_tflite_model.py")
        print("\nOr specify the correct path in the script.")
