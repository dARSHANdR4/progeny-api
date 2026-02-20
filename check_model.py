"""
Simple TFLite Model Analyzer - Determines Classification vs Object Detection
"""
import tensorflow as tf
import os

# Find the model
paths = [
    "progeny-mobile/best_float16.tflite",
    "progeny-mobile/assets/models/best_float16.tflite",
    "best_float16.tflite"
]

model_path = None
for path in paths:
    if os.path.exists(path):
        model_path = path
        break

if not model_path:
    print("ERROR: Model not found in any expected location")
    print("Checked:")
    for p in paths:
        print(f"  - {p}")
    exit(1)

print(f"Found model: {model_path}")
print("=" * 80)

# Load model
interpreter = tf.lite.Interpreter(model_path=model_path)
interpreter.allocate_tensors()

# Get details
input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()

print("\nINPUT:")
print(f"  Shape: {input_details[0]['shape']}")

print("\nOUTPUTS:")
num_outputs = len(output_details)
print(f"  Number of outputs: {num_outputs}")

for i, out in enumerate(output_details):
    print(f"\n  Output {i}:")
    print(f"    Name: {out['name']}")
    print(f"    Shape: {out['shape']}")

print("\n" + "=" * 80)
print("RESULT:")
print("=" * 80)

if num_outputs == 1:
    shape = output_details[0]['shape']
    print("\n✅ CLASSIFICATION MODEL")
    print(f"   - Output classes: {shape[-1]}")
    print("\n❌ CANNOT show bounding boxes")
    print("   - Need Object Detection YOLO model for real-time camera")
    print("\n💡 Current model only classifies whole images")
    
elif num_outputs >= 4:
    print("\n✅ OBJECT DETECTION MODEL")  
    print("   - Can detect multiple objects")
    print("\n✅ CAN show bounding boxes")
    print("   - Ready for real-time camera detection!")
    
else:
    print(f"\n⚠️  UNKNOWN (unusual number of outputs: {num_outputs})")

print("\n" + "=" * 80)
