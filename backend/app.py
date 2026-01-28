# Suppress TensorFlow warnings - MUST be at the very top before any imports
import os
import warnings

# Suppress TensorFlow CPU and oneDNN warnings
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'  # 0=all, 1=info, 2=warning, 3=error
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'  # Disable oneDNN custom operations

# Suppress absl warnings about compiled metrics
warnings.filterwarnings('ignore', category=UserWarning, module='absl')

# Now import other libraries
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import tensorflow as tf
import numpy as np
from PIL import Image
import io
import tempfile
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# Get the path to models directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, 'models')

@app.route('/', methods=['GET'])
def home():
    return jsonify({
        'status': 'online',
        'service': 'Progeny ML Service',
        'endpoints': ['/predict', '/api/chat/voice']
    })

# Initialize Groq client
groq_client = None
if os.getenv("GROQ_API_KEY"):
    groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    print("✓ Groq AI initialized")
else:
    print("⚠️ WARNING: GROQ_API_KEY not found in environment")

print(f"Looking for models in: {MODELS_DIR}")

# Load models at startup with class mappings
MODELS = {}
crop_types = ['apple', 'corn', 'potato', 'tomato']

CLASS_MAPPINGS = {
    'apple': ['Apple Scab', 'Black Rot', 'Cedar Apple Rust', 'Healthy'],
    'potato': ['Early Blight', 'Late Blight', 'Healthy'],
    'corn': ['Blight', 'Common Rust', 'Healthy'],
    'tomato': ['Bacterial Spot', 'Early Blight', 'Late Blight', 'Leaf Mold', 'Target Spot', 'Healthy']
}

for crop in crop_types:
    try:
        model_path = os.path.join(MODELS_DIR, f'{crop}_model.h5')
        MODELS[crop] = {
            'model': tf.keras.models.load_model(model_path),
            'classes': CLASS_MAPPINGS[crop]
        }
        print(f'✓ Loaded {crop} model from {model_path}')
        # Log class count mismatch
        model = MODELS[crop]['model']
        expected = len(MODELS[crop]['classes'])
        actual = model.output_shape[-1]
        if expected != actual:
            print(f'⚠️ WARNING: {crop} model expects {actual} classes, but mapping has {expected}!')
    except Exception as e:
        print(f'✗ Error loading {crop} model: {e}')

# Disease remedies - 4 detailed points per disease
DISEASE_REMEDIES = {
    'Healthy': [
        'Continue regular monitoring and scouting every 7-10 days',
        'Maintain balanced NPK fertilization (10-10-10 for general crops)',
        'Ensure proper irrigation - 1-2 inches per week depending on crop',
        'Practice crop rotation to prevent future disease buildup'
    ],
    
    # ===== APPLE DISEASES =====
    'Apple Scab': [
        'Apply preventive fungicides (Captan 50WP at 2-3 lb/acre or Myclobutanil) starting at green tip stage',
        'Remove and destroy all fallen leaves and infected fruit to reduce overwintering spores',
        'Prune trees to improve air circulation - target 25-30% canopy thinning',
        'Plant resistant varieties like Liberty, Freedom, or Enterprise for long-term management'
    ],
    
    'Black Rot': [
        'Remove all infected fruit, branches, and mummified apples within 100 feet of trees',
        'Apply fungicides containing Thiophanate-methyl or Captan during pink and petal fall stages',
        'Prune out dead and diseased wood during dormant season (late winter)',
        'Avoid overhead irrigation and maintain proper tree spacing (15-20 feet minimum)'
    ],
    
    'Cedar Apple Rust': [
        'Remove nearby cedar/juniper trees within 1/4 mile radius if possible',
        'Apply protective fungicides (Myclobutanil or Propiconazole) from pink bud through 3 weeks after petal fall',
        'Use resistant apple varieties like Freedom, Liberty, Redfree, or Williams Pride',
        'Monitor cedar trees for galls in spring and remove them before they release spores'
    ],
    
    # ===== CORN DISEASES =====
    'Blight': [
        'Apply foliar fungicides (Azoxystrobin or Pyraclostrobin) when disease first appears on lower leaves',
        'Remove and destroy infected plant debris immediately after harvest',
        'Practice 2-3 year crop rotation with non-host crops like soybeans or wheat',
        'Plant resistant hybrids and ensure proper plant spacing (8-10 inches in-row) for air circulation'
    ],
    
    'Common Rust': [
        'Apply triazole fungicides (Tebuconazole or Propiconazole) if disease appears before tasseling',
        'Plant resistant or moderately resistant corn hybrids',
        'Remove volunteer corn plants that can harbor rust spores between seasons',
        'Scout fields weekly during vegetative stages and apply fungicide at <5% leaf infection threshold'
    ],
    
    # ===== POTATO DISEASES =====
    'Early Blight': [
        'Apply protectant fungicides (Chlorothalonil 720g/L at 2L/ha) starting when plants are 6-8 inches tall',
        'Remove and destroy lower leaves that touch soil to reduce initial infection',
        'Mulch with straw (4-6 inches deep) to prevent soil splash onto foliage',
        'Practice 3-4 year rotation with non-solanaceous crops and avoid overhead irrigation'
    ],
    
    'Late Blight': [
        'URGENT: Apply systemic fungicides (Metalaxyl + Mancozeb) immediately upon detection',
        'Destroy entire infected plants including tubers - do not compost',
        'Monitor weather for blight-favorable conditions (cool, wet weather 15-25°C with RH >90%)',
        'Use certified disease-free seed potatoes and hill rows adequately to protect tubers'
    ],
    
    # ===== TOMATO DISEASES =====
    'Bacterial Spot': [
        'Apply copper-based bactericides (Copper hydroxide 53.8% at 1.5 lb/acre) preventively',
        'Use only certified disease-free transplants and saved seeds from healthy fruit',
        'Avoid working in wet fields - wait until foliage is completely dry',
        'Practice 2-year rotation and destroy all crop debris immediately after final harvest'
    ],
    
    'Leaf Mold': [
        'Improve greenhouse ventilation - maintain relative humidity below 85%',
        'Space plants 18-24 inches apart and prune lower leaves for air movement',
        'Remove and destroy infected leaves immediately - do not compost',
        'Apply fungicides (Chlorothalonil or Mancozeb) at first sign of yellowing on upper leaf surfaces'
    ],
    
    'Target Spot': [
        'Apply fungicides containing Chlorothalonil (720g/L at 2-3 L/ha) at 7-10 day intervals',
        'Remove all infected lower leaves and crop debris to reduce spore load',
        'Improve air circulation through wider plant spacing (24-30 inches) and staking',
        'Mulch with black plastic to prevent soil splash and practice 2-3 year crop rotation'
    ]
}


def read_file_as_image(data) -> np.ndarray:
    """Preprocess image for model input"""
    image = Image.open(io.BytesIO(data))
    
    # Convert to RGB if needed (handles RGBA, grayscale, etc.)
    if image.mode != 'RGB':
        image = image.convert('RGB')
    
    # Resize to model input size
    image = image.resize((256, 256))
    
    # Convert to array
    image_array = np.array(image)
    
    # [FIX] No manual normalization here!
    # The models have an internal Rescaling layer that handles / 255.0
    # Keep as float32 for model compatibility
    image_array = image_array.astype('float32')
    
    return image_array

@app.route('/password-reset-success.html', methods=['GET'])
def password_reset_success():
    """Serve the password reset success page"""
    return send_from_directory(os.path.join(BASE_DIR, 'static'), 'password-reset-success.html')

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy', 
        'models_loaded': list(MODELS.keys()),
        'models_directory': MODELS_DIR
    })

@app.route('/predict', methods=['POST'])
def predict():
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image provided'}), 400
        
        crop_type = request.form.get('crop_type')
        
        print(f"\n{'='*60}")
        print(f"🌱 CROP TYPE RECEIVED: {crop_type}")
        print(f"{'='*60}")
        
        if not crop_type or crop_type not in MODELS:
            return jsonify({'error': f'Invalid crop type. Must be one of: {list(MODELS.keys())}'}), 400
        
        model_info = MODELS[crop_type]
        model = model_info['model']
        class_names = model_info['classes']
        
        # Read and preprocess image
        image_file = request.files['image']
        image = read_file_as_image(image_file.read())
        img_batch = np.expand_dims(image, 0)
        
        print(f"📷 Image shape: {img_batch.shape}")
        
        # Get predictions
        predictions = model.predict(img_batch, verbose=0)
        predicted_class_idx = np.argmax(predictions[0])
        predicted_class = class_names[predicted_class_idx]
        confidence = float(np.max(predictions[0]))
        
        print(f"\n🎯 PREDICTION PROBABILITIES:")
        print(f"{'-'*60}")
        for idx, class_name in enumerate(class_names):
            conf = predictions[0][idx]
            bar = '█' * int(conf * 50)
            print(f"   {idx}. {class_name:20s} → {conf:.4f} ({conf*100:5.1f}%) {bar}")
        
        print(f"{'-'*60}")
        print(f"🏆 TOP PREDICTION: {predicted_class} ({confidence*100:.1f}%)")
        print(f"{'='*60}\n")
        
        # Create all predictions array
        all_predictions = [
            {'class': class_names[i], 'confidence': float(predictions[0][i])}
            for i in range(len(class_names))
        ]
        all_predictions.sort(key=lambda x: x['confidence'], reverse=True)
        
        # Get remedies
        remedies = DISEASE_REMEDIES.get(predicted_class, [
            'Consult with agricultural specialist',
            'Remove infected plant parts',
            'Monitor plants regularly'
        ])
        
        return jsonify({
            'disease_name': predicted_class,
            'confidence_score': confidence,
            'remedies': remedies,
            'all_predictions': all_predictions
        })
        
    except Exception as e:
        print(f'\n❌ PREDICTION ERROR: {e}')
        import traceback
        traceback.print_exc()
        print(f"{'='*60}\n")
        return jsonify({'error': str(e)}), 500

@app.route('/remedies', methods=['POST'])
def get_remedies():
    """Get remedies for a disease without running inference (for on-device YOLO)"""
    try:
        data = request.get_json()
        disease_name = data.get('disease_name')
        
        if not disease_name:
            return jsonify({'error': 'disease_name required'}), 400
        
        # Get remedies from the DISEASE_REMEDIES dictionary
        remedies = DISEASE_REMEDIES.get(disease_name, [
            'Consult with agricultural specialist',
            'Remove infected plant parts',
            'Monitor plants regularly',
            'Practice good crop hygiene'
        ])
        
        return jsonify({
            'disease_name': disease_name,
            'remedies': remedies,
            'source': 'on-device' if disease_name in DISEASE_REMEDIES else 'fallback'
        })
    except Exception as e:
        print(f'\n❌ REMEDIES ERROR: {e}')
        return jsonify({'error': str(e)}), 500

@app.route('/api/chat/voice', methods=['POST'])
def voice_chat():
    """Handle voice chat: Transcribe audio with Whisper and respond with LLM"""
    if not groq_client:
        return jsonify({'error': 'Groq client not initialized'}), 500
        
    try:
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400
            
        audio_file = request.files['audio']
        
        # 1. Save audio to a temporary file
        # Whisper API requires a file path or a file-like object with a name
        with tempfile.NamedTemporaryFile(delete=False, suffix='.m4a') as temp_audio:
            audio_file.save(temp_audio.name)
            temp_path = temp_audio.name
            
        try:
            # 2. Get language code from request (optional)
            language = request.form.get('language')
            
            # 3. Transcribe using Groq Whisper
            with open(temp_path, "rb") as file:
                # Basic options for Whisper
                whisper_options = {
                    "file": (os.path.basename(temp_path), file.read()),
                    "model": "whisper-large-v3",
                    "response_format": "json",
                }
                
                # Add language if provided to improve accuracy
                if language:
                    whisper_options["language"] = language
                    print(f"🎙️ Transcription forced language: {language}")

                transcription = groq_client.audio.transcriptions.create(**whisper_options)
            
            user_text = transcription.text
            print(f"🎙️ Transcribed: {user_text}")
            
            if not user_text.strip():
                return jsonify({'error': 'Could not understand audio'}), 400

            # 3. Generate LLM response
            # System prompt matching the Next.js backend for consistency
            SYSTEM_PROMPT = """
# CORE IDENTITY: PROGENITURE AI
You are Progeniture AI, the specialized agricultural expert built for the Progeny platform. 
You are NOT a generic LLM, assistant, or "computer program". You are a dedicated plant pathologist and farming advisor.

## COMMUNICATION RULE: LANGUAGE PARITY
EXTREMELY IMPORTANT: Always respond in the EXACT same language the user uses. 
- If the user speaks Hindi, respond in Hindi.
- If the user speaks Tamil/Telugu/Kannada/Marathi, respond in that specific language.
- Maintain a professional and helpful tone in all languages.

## YOUR MISSION
Support farmers by diagnosing plant diseases and providing actionable, step-by-step recovery plans. 
Focus strictly on:
- Disease identification and explanation.
- Organic and chemical treatment options (always prioritize safety).
- Preventive farming practices and seasonal advice.
- Yield protection and field management.

## PERSONALITY & CONTEXT
- If asked "Who are you?", identify as Progeniture AI, the agricultural core of the Progeny platform.
- Never mention being a generic AI. You are a field-ready expert.
- Tone: Empathetic to the hard work of farmers, direct, professional, and practical.

## OPERATION RULES
1. RESPONSE FORMAT: Plain text only. NO markdown (no **, no #), NO emojis.
2. CONCISENESS: 6 steps maximum per response. 
3. SAFETY: Always advise checking with local experts for high-severity issues. Never specify exact chemical dosages; suggest consulting labels.
4. SCOPE: If asked questions completely unrelated to agriculture, politely redirect the user back to their farm and plant health.
"""
            
            completion = groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT.strip()},
                    {"role": "user", "content": user_text}
                ],
                temperature=0.7,
                max_tokens=1024,
            )
            
            bot_response = completion.choices[0].message.content
            
            return jsonify({
                'user_text': user_text,
                'response': bot_response,
                'success': True
            })
            
        finally:
            # Clean up temporary file
            if os.path.exists(temp_path):
                os.remove(temp_path)
                
    except Exception as e:
        print(f'❌ VOICE CHAT ERROR: {e}')
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
