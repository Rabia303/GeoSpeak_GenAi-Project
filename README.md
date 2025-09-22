# GeoSpeak 🌍✨

*A Next-Gen AI-Powered Real-Time Translation Platform*

![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-2.3.x-000000?logo=flask)
![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-Build%20Tool-646CFF?logo=vite&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-Database-003B57?logo=sqlite&logoColor=white)
![ChromaDB](https://img.shields.io/badge/ChromaDB-Vector%20Store-FF6B35?logo=vectorworks&logoColor=white)
![geminiAI](https://img.shields.io/badge/geminiAI-API-412991?logo=geminiai&logoColor=white)

---

## 📖 Table of Contents

- [🌟 Overview](#-overview)
- [🚀 Features](#-features)
- [🛠️ Tech Stack](#-tech-stack)
- [⚙️ Installation & Setup](#-installation--setup)
- [📁 Project Structure](#-project-structure)
- [🎮 Usage](#-usage)
- [📊 Project Deliverables](#-project-deliverables)
- [👥 Contributors](#-contributors)
- [📜 License](#-license)

---

## 🌟 Overview

GeoSpeak is an intelligent, AI-driven multilingual translation platform designed to break down language barriers in real-time. Built with a modern tech stack including **Flask** (backend) and **React + Vite** (frontend), GeoSpeak leverages the power of **geminiAI's LLMs**, **ChromaDB** for semantic understanding, and **SQLite** for data persistence.

Beyond basic translation, GeoSpeak offers:

- 📝 **Text translation** with multi-language support
- 📋 **One-click copy** to clipboard functionality
- 🖼️ **Image translation** using OCR technology
- 💬 **Interactive conversation mode** for natural dialogues
- 📜 **Translation history** with user-specific tracking
- 🔐 **Secure user authentication** system
- 🧠 **Context-aware translations** powered by ChromaDB vector embeddings

<div align="center">

[![GeoSpeak Demo](https://img.shields.io/badge/Watch-Demo_Video-red?style=for-the-badge&logo=youtube)](https://example.com/demo-video)
[![View Blog](https://img.shields.io/badge/Read-Project_Blog-green?style=for-the-badge&logo=wordpress)](https://example.com/blog)
[![GitHub Repo](https://img.shields.io/badge/Explore-Source_Code-blue?style=for-the-badge&logo=github)](https://github.com/yourusername/geospeak)

</div>

---

## 🚀 Features

| Feature | Description |
|---------|-------------|
| 🔤 **Text Translation** | Instantly translate text between multiple languages with high accuracy |
| 📋 **Copy to Clipboard** | Easily copy translated text with a single click |
| 🖼️ **Image Translation** | Extract and translate text from uploaded images using OCR technology |
| 💬 **Conversation Mode** | Engage in fluid, multi-language conversations with AI assistance |
| 📜 **Translation History** | Access your complete translation history for quick reference |
| 🔐 **User Authentication** | Secure login/register system with personalized experiences |
| 🧠 **Context-Aware Translations** | Enhanced accuracy through ChromaDB semantic vector search |

---

## 🛠️ Tech Stack

### Frontend
- **React 18** with Vite for fast development builds
- **JSX** for component-based architecture
- **CSS3** with modern styling and responsive design
- **Axios** for efficient API communication

### Backend
- **Flask** Python web framework
- **SQLite** for user management and translation history
- **ChromaDB** for vector storage and semantic search
- **geminiAI API** for advanced translation capabilities

### AI & Processing
- **TensorFlow/Keras** for machine learning components
- **Pre-trained Transformers** for NLP tasks
- **PyTesseract** for OCR-based image text extraction
- **Jupyter Notebook/Colab** for experimentation and testing

---

## ⚙️ Installation & Setup

### Prerequisites
- Python 3.10+
- Node.js 16+
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/geospeak.git
cd geospeak
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv

# On Windows
venv\Scripts\activate

# On macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
flask run
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 4. Environment Configuration
Create a `.env` file in the `backend` directory:
```env
geminiAI_API_KEY=your_geminiai_api_key_here
DATABASE_URL=sqlite:///geospeak.db
SECRET_KEY=your_secret_key_here
```

---

## 📁 Project Structure

```
geospeak/
├── 📂 backend/
│   ├── app.py                 # Flask application entry point
│   ├── models/               # Database models
│   ├── services/             # Business logic (translation, OCR, etc.)
│   ├── utils/                # Helper functions
│   └── requirements.txt      # Python dependencies
│
├── 📂 frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom React hooks
│   │   └── styles/          # CSS files
│   ├── public/              # Static assets
│   └── package.json         # Node dependencies
│
├── 📂 notebooks/             # Jupyter/Colab experiments
├── 📂 docs/                  # Documentation & SRS
└── README.md                # This file
```

---

## 🎮 Usage

1. **Launch the Application**:
   - Start both backend and frontend servers
   - gemini your browser to `http://localhost:3000`

2. **Account Creation**:
   - Register a new account or login with existing credentials

3. **Text Translation**:
   - Enter text in the source box
   - Select target language from the dropdown
   - Click "Translate" to get instant results

4. **Image Translation**:
   - Click the image upload button
   - Select an image containing text
   - View extracted and translated text

5. **Conversation Mode**:
   - Switch to conversation tab
   - Select languages for each participant
   - Begin your multilingual dialogue

6. **History Access**:
   - View your translation history from the history tab
   - Re-use previous translations with one click

---

## 📊 Project Deliverables

- ✅ **Complete Source Code** (Flask + React + Database)
- ✅ **Project Documentation** (SRS, design diagrams, installation guide)[Read Here ](https://github.com/Rabia303/GeoSpeak_GenAi-Project/blob/main/GeoSpeak-GenAI%20Smart%20Solutions_SRS.pdf)
- ✅ **Demo Video** - [Watch Here](https://github.com/Rabia303/GeoSpeak_GenAi-Project/blob/main/GeoSpeak_Demo.mp4)
- ✅ **GitHub Repository** - [Explore Code](https://github.com/Rabia303/GeoSpeak_GenAi-Project)

---
