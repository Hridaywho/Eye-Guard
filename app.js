// Eye Strain Monitor with Blink Detection
// Using MediaPipe Face Mesh for accurate eye tracking

class EyeStrainMonitor {
    constructor() {
        this.video = document.getElementById('video');
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Blink detection variables
        this.blinkCount = 0;
        this.isBlinking = false;
        this.earHistory = [];
        this.earThreshold = 0.21; // Eye Aspect Ratio threshold for blink detection
        this.consecutiveFrames = 2; // Frames below threshold to count as blink
        this.framesBelow = 0;
        
        // Statistics
        this.sessionStartTime = null;
        this.lastBlinkTime = Date.now();
        this.blinkTimestamps = [];
        this.earValues = [];
        
        // Alerts
        this.lastAlertTime = 0;
        this.alertCooldown = 30000; // 30 seconds between alerts
        
        // Camera and FaceMesh
        this.camera = null;
        this.faceMesh = null;
        this.isRunning = false;
        
        // Eye landmark indices for MediaPipe Face Mesh
        this.LEFT_EYE = [33, 160, 158, 133, 153, 144];
        this.RIGHT_EYE = [362, 385, 387, 263, 373, 380];
        
        this.initializeEventListeners();
    }
    
    initializeEventListeners() {
        document.getElementById('startBtn').addEventListener('click', () => this.start());
        document.getElementById('stopBtn').addEventListener('click', () => this.stop());
    }
    
    async start() {
        try {
            document.getElementById('loading').style.display = 'block';
            document.getElementById('startBtn').style.display = 'none';
            
            await this.initializeFaceMesh();
            await this.initializeCamera();
            
            this.sessionStartTime = Date.now();
            this.isRunning = true;
            
            document.getElementById('stopBtn').style.display = 'inline-block';
            document.getElementById('status').textContent = 'Active';
            document.getElementById('status').className = 'status-badge active';
            document.getElementById('loading').style.display = 'none';
            
            this.addAlert('info', 'Monitoring Started', 'Eye strain monitoring is now active. Blink naturally!');
            this.updateStats();
            
        } catch (error) {
            console.error('Error starting monitor:', error);
            this.addAlert('danger', 'Error', 'Failed to start camera. Please check permissions.');
            document.getElementById('loading').style.display = 'none';
            document.getElementById('startBtn').style.display = 'inline-block';
        }
    }
    
    async initializeFaceMesh() {
        this.faceMesh = new FaceMesh({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
            }
        });
        
        this.faceMesh.setOptions({
            maxNumFaces: 1,
            refineLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });
        
        this.faceMesh.onResults((results) => this.onResults(results));
    }
    
    async initializeCamera() {
        this.camera = new Camera(this.video, {
            onFrame: async () => {
                if (this.isRunning) {
                    await this.faceMesh.send({image: this.video});
                }
            },
            width: 1280,
            height: 720
        });
        
        await this.camera.start();
        
        // Set canvas size to match video
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
    }
    
    onResults(results) {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
            const landmarks = results.multiFaceLandmarks[0];
            
            // Draw face mesh
            this.drawFaceMesh(landmarks);
            
            // Calculate EAR for both eyes
            const leftEAR = this.calculateEAR(landmarks, this.LEFT_EYE);
            const rightEAR = this.calculateEAR(landmarks, this.RIGHT_EYE);
            const avgEAR = (leftEAR + rightEAR) / 2;
            
            // Store EAR value
            this.earValues.push(avgEAR);
            if (this.earValues.length > 300) { // Keep last 10 seconds at 30fps
                this.earValues.shift();
            }
            
            // Detect blink
            this.detectBlink(avgEAR);
            
            // Draw EAR value on canvas
            this.drawEARValue(avgEAR);
            
            // Highlight eyes
            this.highlightEyes(landmarks);
        }
    }
    
    calculateEAR(landmarks, eyeIndices) {
        // Eye Aspect Ratio calculation
        // EAR = (||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)
        
        const points = eyeIndices.map(idx => landmarks[idx]);
        
        // Vertical distances
        const vertical1 = this.euclideanDistance(points[1], points[5]);
        const vertical2 = this.euclideanDistance(points[2], points[4]);
        
        // Horizontal distance
        const horizontal = this.euclideanDistance(points[0], points[3]);
        
        const ear = (vertical1 + vertical2) / (2.0 * horizontal);
        return ear;
    }
    
    euclideanDistance(point1, point2) {
        const dx = point1.x - point2.x;
        const dy = point1.y - point2.y;
        const dz = point1.z - point2.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    
    detectBlink(ear) {
        if (ear < this.earThreshold) {
            this.framesBelow++;
        } else {
            if (this.framesBelow >= this.consecutiveFrames && !this.isBlinking) {
                // Blink detected!
                this.blinkCount++;
                this.blinkTimestamps.push(Date.now());
                this.lastBlinkTime = Date.now();
                this.isBlinking = true;
                
                // Flash indicator
                this.flashBlinkIndicator();
                
                // Keep last 60 seconds of blinks
                const sixtySecondsAgo = Date.now() - 60000;
                this.blinkTimestamps = this.blinkTimestamps.filter(t => t > sixtySecondsAgo);
            }
            this.framesBelow = 0;
            this.isBlinking = false;
        }
    }
    
    flashBlinkIndicator() {
        const indicator = document.getElementById('blinkIndicator');
        indicator.style.transform = 'scale(1.1)';
        setTimeout(() => {
            indicator.style.transform = 'scale(1)';
        }, 200);
    }
    
    drawFaceMesh(landmarks) {
        this.ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
        landmarks.forEach((landmark) => {
            const x = landmark.x * this.canvas.width;
            const y = landmark.y * this.canvas.height;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 1, 0, 2 * Math.PI);
            this.ctx.fill();
        });
    }
    
    highlightEyes(landmarks) {
        this.highlightEye(landmarks, this.LEFT_EYE, '#00ff00');
        this.highlightEye(landmarks, this.RIGHT_EYE, '#00ff00');
    }
    
    highlightEye(landmarks, eyeIndices, color) {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        
        eyeIndices.forEach((idx, i) => {
            const point = landmarks[idx];
            const x = point.x * this.canvas.width;
            const y = point.y * this.canvas.height;
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        });
        
        this.ctx.closePath();
        this.ctx.stroke();
    }
    
    drawEARValue(ear) {
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.fillText(`EAR: ${ear.toFixed(3)}`, 10, 30);
        
        // Draw blink status
        if (this.isBlinking) {
            this.ctx.fillStyle = 'yellow';
            this.ctx.fillText('BLINK!', 10, 60);
        }
    }
    
    updateStats() {
        if (!this.isRunning) return;
        
        // Update total blinks
        document.getElementById('totalBlinks').textContent = this.blinkCount;
        
        // Calculate blink rate (blinks per minute)
        const blinkRate = this.calculateBlinkRate();
        document.getElementById('blinkRate').innerHTML = `${blinkRate}<span class="stat-unit">blinks/min</span>`;
        
        // Update average EAR
        const avgEAR = this.earValues.length > 0 
            ? (this.earValues.reduce((a, b) => a + b, 0) / this.earValues.length)
            : 0;
        document.getElementById('avgEAR').textContent = avgEAR.toFixed(3);
        
        // Update session time
        const sessionDuration = Math.floor((Date.now() - this.sessionStartTime) / 1000);
        const minutes = Math.floor(sessionDuration / 60);
        const seconds = sessionDuration % 60;
        document.getElementById('sessionTime').textContent = 
            `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        
        // Update blink indicator
        this.updateBlinkIndicator(blinkRate);
        
        // Check for alerts
        this.checkAlerts(blinkRate);
        
        // Continue updating
        setTimeout(() => this.updateStats(), 1000);
    }
    
    calculateBlinkRate() {
        if (this.blinkTimestamps.length < 2) return 0;
        
        // Calculate blinks in last 60 seconds
        const now = Date.now();
        const recentBlinks = this.blinkTimestamps.filter(t => now - t < 60000);
        
        if (recentBlinks.length === 0) return 0;
        
        // Calculate time span
        const timeSpanSeconds = (now - recentBlinks[0]) / 1000;
        const blinkRate = (recentBlinks.length / timeSpanSeconds) * 60;
        
        return Math.round(blinkRate);
    }
    
    updateBlinkIndicator(blinkRate) {
        const indicator = document.getElementById('blinkIndicator');
        
        if (blinkRate >= 15) {
            indicator.className = 'blink-indicator good';
            indicator.innerHTML = `
                <div class="icon">😊</div>
                <h3>Healthy Blink Rate</h3>
                <p>Keep it up! Your eyes are well-hydrated.</p>
            `;
        } else if (blinkRate >= 10) {
            indicator.className = 'blink-indicator warning';
            indicator.innerHTML = `
                <div class="icon">😐</div>
                <h3>Below Average</h3>
                <p>Try to blink more frequently to avoid dry eyes.</p>
            `;
        } else {
            indicator.className = 'blink-indicator danger';
            indicator.innerHTML = `
                <div class="icon">😟</div>
                <h3>Low Blink Rate</h3>
                <p>Blink more! Your eyes need moisture.</p>
            `;
        }
    }
    
    checkAlerts(blinkRate) {
        const now = Date.now();
        
        // Cooldown check
        if (now - this.lastAlertTime < this.alertCooldown) return;
        
        // Low blink rate alert
        if (blinkRate > 0 && blinkRate < 10) {
            this.addAlert('warning', 'Low Blink Rate', 
                `Your blink rate is ${blinkRate} blinks/min. Normal range is 15-20. Take a break!`);
            this.lastAlertTime = now;
        }
        
        // No blink in 30 seconds alert
        if (now - this.lastBlinkTime > 30000) {
            this.addAlert('danger', 'No Recent Blinks', 
                'You haven\'t blinked in over 30 seconds! Blink several times now.');
            this.lastAlertTime = now;
        }
        
        // Long session reminder
        const sessionMinutes = (now - this.sessionStartTime) / 60000;
        if (sessionMinutes % 20 < 0.02) { // Every 20 minutes
            this.addAlert('info', '20-20-20 Rule Reminder', 
                'Look at something 20 feet away for 20 seconds to reduce eye strain.');
            this.lastAlertTime = now;
        }
    }
    
    addAlert(type, title, message) {
        const alertsContainer = document.getElementById('alerts');
        
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert ${type}`;
        
        const icons = {
            info: 'ℹ️',
            warning: '⚠️',
            danger: '🚨'
        };
        
        alertDiv.innerHTML = `
            <span class="icon">${icons[type]}</span>
            <div>
                <strong>${title}</strong> ${message}
            </div>
        `;
        
        // Add to top
        alertsContainer.insertBefore(alertDiv, alertsContainer.firstChild);
        
        // Keep only last 5 alerts
        while (alertsContainer.children.length > 5) {
            alertsContainer.removeChild(alertsContainer.lastChild);
        }
    }
    
    stop() {
        this.isRunning = false;
        
        if (this.camera) {
            this.camera.stop();
        }
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Reset UI
        document.getElementById('stopBtn').style.display = 'none';
        document.getElementById('startBtn').style.display = 'inline-block';
        document.getElementById('status').textContent = 'Inactive';
        document.getElementById('status').className = 'status-badge inactive';
        
        // Generate session summary
        const sessionDuration = Math.floor((Date.now() - this.sessionStartTime) / 1000);
        const avgBlinkRate = this.calculateBlinkRate();
        
        this.addAlert('info', 'Session Ended', 
            `Session duration: ${Math.floor(sessionDuration/60)}min. Total blinks: ${this.blinkCount}. Avg rate: ${avgBlinkRate} blinks/min.`);
    }
}

// Initialize the application
let monitor;
window.addEventListener('DOMContentLoaded', () => {
    monitor = new EyeStrainMonitor();
});