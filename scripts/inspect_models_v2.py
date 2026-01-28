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
            
            # Print layers specifically looking for Rescaling or Normalization
            for layer in model.layers:
                if 'rescaling' in layer.name.lower() or 'normalization' in layer.name.lower():
                    print(f"Found layer: {layer.name} - {layer.__class__.__name__}")
                    if hasattr(layer, 'get_config'):
                        print(f"  Config: {layer.get_config()}")
        except Exception as e:
            print(f"Error loading {crop}: {e}")
    else:
        print(f"Model not found: {model_path}")
