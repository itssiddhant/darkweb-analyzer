# 🔍 DarkWeb Analyzer

A full-stack web application that monitors, analyzes, and visualizes threat intelligence data from the dark web in real time. This platform leverages **NLP techniques**, **data visualization**, and **real-time monitoring** to assist cybersecurity professionals and researchers.

## 📌 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Installation](#installation)
- [Usage](#usage)
- [Challenges Faced](#challenges-faced)
- [License](#license)

---

## ✅ Features

- **Real-Time Monitoring**  
  - WebSocket-based live updates of threat intelligence

- **Advanced Data Analysis**  
  - NLP processing: sentiment analysis, topic modeling, IOC (Indicators of Compromise) extraction

- **Interactive Visualizations**  
  - Built with Plotly: bar charts, pie charts, geographic maps, and timeline graphs

- **Robust Search & Filtering**  
  - Topic and IOC-based search and filtering system

- **Data Export**  
  - Export processed threat data as structured JSON

---

## 🛠️ Tech Stack

### Frontend

- **Framework**: React.js (with Vite)
- **Styling**: Tailwind CSS + Custom CSS
- **Development Tools**:  
  - ESLint  
  - PostCSS  
  - Vite  

### Backend

- **Framework**: Flask (Python)
- **Key Libraries**:
  - `Flask-CORS` for cross-origin resource sharing
  - `Flask-Sock` for WebSocket support
  - `Pandas` for data manipulation
  - `Plotly` for visualization
  - `python-dotenv` for environment variable management

---

## 📐 Architecture

```
📁 darkweb-analyzer/
├── frontend/ (React + Vite)
│   ├── components/
│   ├── pages/
│   └── services/
├── backend/ (Flask)
│   ├── app.py
│   ├── routes/
│   ├── processing/
│   └── websocket/
└── data/
    └── offline_data.json
```

---

## ⚙️ Installation

### Prerequisites
- Python 3.9+
- Node.js 16+
- npm or yarn
- Tor browser (for real scraping if needed)

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
python app.py
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## ▶️ Usage

1. Start the backend server (Flask)
2. Start the frontend dev server (Vite)
3. Open your browser at `http://localhost:5173`
4. Explore threat visualizations, perform sentiment analysis, and filter/search threat intel

---

## ⚠️ Challenges Faced

- **Dark Web Scraping**  
  - Unlike the surface web, the dark web lacks search engine indexing, making scraping difficult and slow.

- **Performance Optimization**  
  - Due to slow scraping, we opted for **offline analysis** post initial data scrape, improving performance for testing and debugging.


---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
