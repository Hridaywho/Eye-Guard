
# 👁️ EyeGuard  
### Smart AI-Powered Blink Detection & Eye Health Monitor

![JavaScript](https://img.shields.io/badge/JavaScript-ES6-yellow)
![MediaPipe](https://img.shields.io/badge/MediaPipe-FaceMesh-blue)
![License](https://img.shields.io/badge/License-MIT-green)
![Status](https://img.shields.io/badge/Status-Active-success)

> Real-time eye strain prevention system using MediaPipe Face Mesh and Eye Aspect Ratio (EAR).

---

## 🌟 Overview

EyeGuard is a real-time AI-powered eye health monitoring system that tracks blink rate using computer vision and alerts users when it drops below healthy levels.

Designed for students, developers, gamers, and professionals who spend long hours in front of screens.

---

## 🚀 Features

### 🔍 Core Functionality
- Real-time Blink Detection using MediaPipe Face Mesh
- Eye Aspect Ratio (EAR) based blink recognition
- Live Blink Rate Monitoring (blinks per minute)
- Session Duration Tracking
- Smart Automated Health Alerts

### 📊 Key Metrics
- Total Blinks
- Blink Rate (per minute)
- Average EAR
- Session Time

---

## 🧠 How It Works

EyeGuard detects 468 facial landmarks using MediaPipe Face Mesh and calculates:

EAR = (||p2 − p6|| + ||p3 − p5||) / (2 × ||p1 − p4||)

When EAR falls below 0.21 for consecutive frames, a blink is registered.

---

## 📊 Blink Rate Classification

| Blink Rate | Status |
|------------|--------|
| 15+        | ✅ Healthy |
| 10–14      | ⚠️ Below Average |
| <10        | 🚨 Risk of Eye Strain |

---

## 🎥 Demo

Demo GIF coming soon.  

---

## 🛠️ Tech Stack

- MediaPipe Face Mesh (Google ML)
- JavaScript (ES6)
- HTML5 Canvas
- CSS3
- Web Camera API

---

## ▶️ How To Run

1. Clone the repository:

   git clone https://github.com/Hridaywho/Eye-Guard.git

2. Open `index.html` in a modern browser.
3. Allow camera permission.
4. Click **Start Monitoring**.

---

## 🔧 Customization

Modify in `app.js`:

this.earThreshold = 0.21  
this.consecutiveFrames = 2  
this.alertCooldown = 30000  

Adjust thresholds based on sensitivity needs.

---

## 🔒 Privacy First

- No server communication  
- No video upload  
- No data storage  
- 100% local browser processing  

Your camera feed never leaves your device.

---

## 🌐 Browser Compatibility

- Chrome 90+
- Firefox 88+
- Edge 90+
- Safari 14+

Desktop recommended for best experience.

---

## 📈 Future Enhancements

- CSV Export
- Historical Trend Graphs
- Dark Mode
- Posture Detection
- Fatigue Prediction Model
- Mobile App Version

---

## 👨‍💻 Author

Hriday  

---

## 📄 License

Licensed under the MIT License – free for personal, educational, and research use.

---

⭐ If you found this project useful, consider starring the repository!
