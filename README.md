# 🌿 LeafLens-AI  
### AI-Powered Smart Agriculture Assistant (Weather + Mandi + Localization)

LeafLens-AI is a Flask-based intelligent agriculture assistant that helps farmers and users with:

- 🌦 Live Weather Information  
- 🏪 Real-Time Mandi (Market) Prices  
- 🌍 Multi-Language Support (Localization)  
- 📍 Location-Based Data  
- 🧠 AI-based Leaf/Disease Ready Integration  
---
## 🚀 Features
### 🌦 Weather Module
- Live weather by city
- Temperature, humidity, wind speed
- Weather condition insights
- Weather caching system
### 🏪 Mandi Prices Module
- Crop price lookup
- Market-wise data
- State-based filtering
- Integrated Combined View
### 🌍 Multi-Language Support
Supported languages:
- English
- Hindi
- Marathi
- Gujarati
- Bengali
- Tamil
- Telugu
- Odia
Dynamic translation using JSON-based localization system.
---
## 🛠 Tech Stack
- Python 3.x
- Flask
- HTML5
- CSS3
- JavaScript
- JSON (Localization)
- REST APIs
- Git & GitHub
---
## 📂 Project Structure
LeafLens-AI/
│
├── backend/
│ └── localization/
│ ├── language_manager.py
│ ├── translator.py
│ └── locales/
│
├── static/
│ └── js/
│
├── templates/
│
├── app.py
├── weather_cache.json
├── requirements.txt
└── README.md
## ⚙️ Installation & Setup
### 1️⃣ Clone Repository
```bash
git clone https://github.com/Developer-Deepali1/LeafLens-AI.git
cd LeafLens-AI
2️⃣ Create Virtual Environment
python -m venv .venv
.venv\Scripts\activate   # Windows
3️⃣ Install Dependencies
pip install -r requirements.txt
4️⃣ Run Application
python app.py
Open in browser:
http://127.0.0.1:5000
🌐 Combined View
LeafLens-AI provides a combined dashboard integrating:
Weather Data
Mandi Prices
Language Selection
All accessible from a unified interface.
📌 Future Enhancements
AI Leaf Disease Detection
Satellite Crop Monitoring
Farmer Advisory System
SMS/WhatsApp Alerts
Deployment on Cloud

👩‍💻 Author
A.S. Deepali
GitHub: https://github.com/Developer-Deepali1
