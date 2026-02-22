# 🌿 LeafLens-AI  
### AI-Powered Smart Agriculture Assistant  
*(Weather + Mandi + Multi-Language Support)*

LeafLens-AI is a modular Flask-based smart agriculture assistant that provides:

- 🌦 Real-time Weather Information  
- 🏪 Live Mandi (Market) Prices  
- 🌍 Multi-language Support (Localization)  
- 📍 Location-based Advisory  
- 🧠 Intelligent Weather Confidence & Advisory Engine  

This project is designed to support farmers and agriculture-based decision-making using technology.

---

## 🚀 Features

### 🌦 Weather Module
- Live weather data by city
- Temperature, humidity, wind details
- Location auto-detection
- Advisory engine
- Confidence scoring logic
- Weather API integration

### 🏪 Mandi Module
- Crop price lookup
- Market-based data retrieval
- Database integration
- API integration
- Notification system support

### 🌍 Localization Module
- Multi-language support
- Dynamic translation system
- JSON-based language files
- Easily extendable for new languages

Supported Languages:
- English
- Hindi
- Marathi
- Gujarati
- Bengali
- Tamil
- Telugu
- Odia

---

## 🛠 Tech Stack

- Python 3.x
- Flask
- HTML5
- CSS3
- JavaScript
- JSON
- REST APIs
- Git & GitHub

---

## 📁 Project Structure

```
LeafLens-AI/
│
├── backend/
│   │
│   ├── mandi_module/
│   │   ├── __init__.py
│   │   ├── mandi_api.py
│   │   ├── mandi_db.py
│   │   ├── mandi_routes.py
│   │   └── notification_system.py
│   │
│   ├── weather_module/
│   │   ├── __init__.py
│   │   ├── advisory_engine.py
│   │   ├── confidence_logic.py
│   │   ├── location_detector.py
│   │   ├── utils.py
│   │   └── weather_api.py
│   │
│   └── localization/
│       ├── __init__.py
│       ├── language_manager.py
│       ├── translator.py
│       └── locales/
│           ├── en.json
│           ├── hi.json
│           ├── mr.json
│           ├── gu.json
│           ├── bn.json
│           ├── ta.json
│           ├── te.json
│           └── od.json
│
├── static/
│   └── js/
│       └── localization.js
│
├── templates/
│
├── config/
├── data/
├── output/
├── tests/
│
├── app.py
├── live_location_demo.py
├── main_demo.py
├── weather_cache.json
├── requirements.txt
└── README.md
```

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/Developer-Deepali1/LeafLens-AI.git
cd LeafLens-AI
```

### 2️⃣ Create Virtual Environment

```bash
python -m venv .venv
```

Activate:

**Windows**
```bash
.venv\Scripts\activate
```

**Mac/Linux**
```bash
source .venv/bin/activate
```

### 3️⃣ Install Dependencies

```bash
pip install -r requirements.txt
```

### 4️⃣ Run the Application

```bash
python app.py
```

Open in browser:

```
http://127.0.0.1:5000
```

---

## 🔄 System Workflow

1. User selects language
2. Location is detected (or manually entered)
3. Weather data is fetched
4. Mandi prices are retrieved
5. Advisory & confidence score generated
6. Data displayed in unified dashboard

---

## 📌 Future Enhancements

- 🌱 AI Leaf Disease Detection
- 📡 Satellite-based crop insights
- 📲 SMS/WhatsApp alert integration
- ☁ Cloud deployment
- 📊 Farmer analytics dashboard

---

## 👩‍💻 Author

**Deepali**  
GitHub: https://github.com/Developer-Deepali1  

---

## 📜 License

This project is licensed under the MIT License.

---

## ⭐ Support

If you found this project helpful:

- ⭐ Star the repository  
- 🍴 Fork it  
- 🤝 Contribute  

---

🌾 *Empowering Agriculture with AI & Technology*