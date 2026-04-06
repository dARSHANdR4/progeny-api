# Progeny ML: Machine Learning Inference Service

This directory contains the Python Flask service responsible for real-time plant disease detection and AI-powered remedy generation.

## 🚀 Technology Stack
- **Framework:** Flask (Python 3.9)
- **Engine:** TensorFlow 2.16.1
- **Brain (Remedies):** Groq AI (Llama 3.3 70B)
- **Deployment:** Dockerized (Hugging Face Spaces)

## 🛠️ Local Installation

1. **Environment Setup**
   ```bash
   python -m venv venv
   source venv/bin/activate  # venv\Scripts\activate on Windows
   pip install -r requirements.txt
   ```

2. **Environment Variables**
   Create a `.env` file with the following:
   ```env
   GROQ_API_KEY=your_groq_key_here
   PORT=5000
   FLASK_ENV=development
   ```

3. **Running the Service**
   ```bash
   python app.py
   ```
   The service will be available at `http://localhost:5000`.

## 📦 Model Management
The service expects `.h5` model files in the `models/` directory for the following crops:
- `apple_model.h5`
- `corn_model.h5`
- `cotton_model.h5`
- `potato_model.h5`
- `tomato_model.h5`
- `leaf_detector.h5` (Pre-filter for leaf detection)

## 📡 API Endpoints

### 1. Health Check
`GET /health`
- Verifies system status and lists loaded models.

### 2. Disease Prediction
`POST /predict`
- **Body (multipart/form-data):**
  - `image`: Image file (JPG/PNG)
  - `crop_type`: One of [`apple`, `corn`, `potato`, `tomato`, `cotton`]
- **Returns:** Predicted disease, confidence score, and detailed remedies.

### 3. Leaf Detector (Pre-filter)
`POST /detect-leaf`
- **Body (multipart/form-data):**
  - `image`: Image file
- **Returns:** Boolean `is_leaf` and confidence score.

### 4. AI Voice Chat / Remedies
`POST /api/chat/voice`
- Handles multi-lingual agricultural queries using Whisper (STT) and Llama 3 (LLM).

## 🚢 Production Deployment (Hugging Face)
Current production URL: `https://darshandr4-progeny-backend.hf.space`

To deploy a new version:
1. Ensure the `Dockerfile` is present in the root of the backend.
2. Push the code to a Hugging Face Space repository.
3. Configure `GROQ_API_KEY` in the Space settings secrets.

> [!TIP]
> Hugging Face Spaces uses port `7860` by default. The `Dockerfile` and `app.py` are already configured to handle this.
