import tensorflow as tf
import os

MODELS_DIR = r'x:\progeny-main\progeny-main\backend\models'
crops = ['apple', 'corn', 'potato', 'tomato']

for crop in crops:
    model_path = os.path.join(MODELS_DIR, f'{crop}_model.h5')
    if os.path.exists(model_path):
        try:
            print(f"\n--- {crop.upper()} MODEL ---")
            model = tf.keras.models.load_model(model_path)
            print(f"Input shape: {model.input_shape}")
            print(f"Output shape: {model.output_shape}")
            
            # Look at the first few layers to see if there's any normalization layer
            for i, layer in enumerate(model.layers[:5]):
                print(f"Layer {i}: {layer.__class__.__name__} - {layer.name}")
                if hasattr(layer, 'get_config'):
                    config = layer.get_config()
                    # Check for rescaling layers in newer Keras or specific patterns
                    if 'rescaling' in layer.name.lower() or 'normalization' in layer.name.lower():
                        print(f"  Config: {config}")
        except Exception as e:
            print(f"Error loading {crop}: {e}")
    else:
        print(f"Model not found: {model_path}")
