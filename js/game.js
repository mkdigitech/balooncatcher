// Balloon Catcher Game Engine
class BalloonCatcherGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameState = 'start'; // start, playing, gameOver
        
        this.score = 0;
        this.balloons = [];
        this.jar = null;
        
        this.lastTime = 0;
        this.gameTime = 0;
        this.balloonSpawnTimer = 0;
        this.balloonSpawnDelay = 2.0; // Start with 2 seconds between balloons
        this.minSpawnDelay = 0.5; // Minimum spawn delay
        this.difficultyIncreaseRate = 0.02; // How fast difficulty increases
        
        this.balloonSpeed = 100; // Starting speed (pixels per second)
        this.maxBalloonSpeed = 400; // Maximum balloon speed
        
        this.init();
    }

    init() {
        this.setupCanvas();
        this.setupControls();
        this.gameLoop();
        
        // Initialize audio context on first user interaction
        this.setupAudioContext();
    }

    setupCanvas() {
        const resizeCanvas = () => {
            const container = document.getElementById('gameContainer');
            const containerWidth = container.clientWidth;
            const containerHeight = container.clientHeight;
            
            this.canvas.width = containerWidth;
            this.canvas.height = containerHeight;
            
            // Update jar position if it exists
            if (this.jar) {
                this.jar.y = this.canvas.height - 80;
                this.jar.x = Math.min(this.jar.x, this.canvas.width - this.jar.width);
            }
        };
        
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        window.addEventListener('orientationchange', () => {
            setTimeout(resizeCanvas, 100);
        });
    }

    setupControls() {
        // Enhanced touch controls
        this.canvas.addEventListener('touchstart', this.handleTouch.bind(this), { passive: false });
        this.canvas.addEventListener('touchmove', this.handleTouch.bind(this), { passive: false });
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        
        // Mouse controls for desktop testing
        this.canvas.addEventListener('mousedown', this.handleMouse.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouse.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        
        // Prevent context menu and scrolling
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        document.addEventListener('touchmove', (e) => {
            if (e.target === this.canvas) {
                e.preventDefault();
            }
        }, { passive: false });
        
        // Track touch state
        this.isTracking = false;
        this.lastTouchX = 0;
    }

    setupAudioContext() {
        const enableAudio = () => {
            audioManager.resumeAudioContext();
        };
        
        document.addEventListener('touchstart', enableAudio, { once: true });
        document.addEventListener('click', enableAudio, { once: true });
    }

    handleTouch(event) {
        event.preventDefault();
        if (this.gameState !== 'playing' || !this.jar) return;
        
        const touch = event.touches[0] || event.changedTouches[0];
        const rect = this.canvas.getBoundingClientRect();
        const x = (touch.clientX - rect.left) * (this.canvas.width / rect.width);
        
        this.isTracking = true;
        this.lastTouchX = x;
        this.moveJar(x);
    }

    handleTouchEnd(event) {
        event.preventDefault();
        this.isTracking = false;
    }

    handleMouse(event) {
        if (this.gameState !== 'playing' || !this.jar) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = (event.clientX - rect.left) * (this.canvas.width / rect.width);
        
        this.isTracking = true;
        this.lastTouchX = x;
        this.moveJar(x);
    }

    handleMouseUp(event) {
        this.isTracking = false;
    }

    moveJar(targetX) {
        if (!this.jar) return;
        
        // Smooth jar movement with better responsiveness
        const centerX = targetX - this.jar.width / 2;
        const clampedX = Math.max(0, Math.min(centerX, this.canvas.width - this.jar.width));
        
        // Immediate response for better mobile feel
        this.jar.x = clampedX;
        
        // Add subtle jar tilt based on movement direction
        if (this.jar.lastX !== undefined) {
            const deltaX = clampedX - this.jar.lastX;
            this.jar.tilt = Math.max(-0.3, Math.min(0.3, deltaX * 0.01));
        }
        this.jar.lastX = clampedX;
    }

    startGame() {
        this.gameState = 'playing';
        this.score = 0;
        this.gameTime = 0;
        this.balloonSpawnTimer = 0;
        this.balloonSpawnDelay = 2.0;
        this.balloonSpeed = 100;
        
        // Clear balloons
        this.balloons = [];
        
        // Create jar
        this.jar = new Jar(this.canvas.width / 2 - 40, this.canvas.height - 80);
        
        // Hide start screen
        document.getElementById('startScreen').classList.add('hidden');
        
        // Start background music
        audioManager.startBackgroundMusic();
        
        this.updateUI();
    }

    restartGame() {
        // Hide game over screen
        document.getElementById('gameOverScreen').classList.add('hidden');
        
        // Start new game
        this.startGame();
    }

    quitGame() {
        // Stop background music
        audioManager.stopBackgroundMusic();
        
        // Hide game over screen
        document.getElementById('gameOverScreen').classList.add('hidden');
        
        // Show start screen
        document.getElementById('startScreen').classList.remove('hidden');
        
        this.gameState = 'start';
    }

    gameOver() {
        this.gameState = 'gameOver';
        
        // Stop background music
        audioManager.stopBackgroundMusic();
        
        // Play game over sound
        audioManager.playGameOverSound();
        
        // Show game over screen
        document.getElementById('finalScore').textContent = this.score;
        
        let message = "Better luck next time!";
        if (this.score >= 50) message = "Amazing! You're a balloon catching master! 🎈";
        else if (this.score >= 30) message = "Great job! You caught so many balloons! 🌟";
        else if (this.score >= 15) message = "Good effort! Keep practicing! 👍";
        else if (this.score >= 5) message = "Not bad for a start! Try again! 😊";
        
        document.getElementById('gameOverMessage').textContent = message;
        document.getElementById('gameOverScreen').classList.remove('hidden');
    }

    gameLoop(currentTime = 0) {
        const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.016); // Cap at 60fps
        this.lastTime = currentTime;
        
        if (this.gameState === 'playing') {
            this.update(deltaTime);
        }
        
        this.render();
        
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    update(deltaTime) {
        this.gameTime += deltaTime;
        
        // Update jar
        if (this.jar) {
            this.jar.update(deltaTime);
        }
        
        // Increase difficulty over time
        this.balloonSpawnDelay = Math.max(
            this.minSpawnDelay, 
            2.0 - (this.gameTime * this.difficultyIncreaseRate)
        );
        
        this.balloonSpeed = Math.min(
            this.maxBalloonSpeed,
            100 + (this.gameTime * 20)
        );
        
        // Spawn balloons
        this.balloonSpawnTimer += deltaTime;
        if (this.balloonSpawnTimer >= this.balloonSpawnDelay) {
            this.spawnBalloon();
            this.balloonSpawnTimer = 0;
        }
        
        // Update balloons
        for (let i = this.balloons.length - 1; i >= 0; i--) {
            const balloon = this.balloons[i];
            balloon.update(deltaTime);
            
            // Check if balloon hit the ground
            if (balloon.y + balloon.radius >= this.canvas.height) {
                // Game over - balloon missed
                audioManager.playBalloonPopSound();
                this.gameOver();
                return;
            }
            
            // Check collision with jar
            if (this.jar && this.jar.isColliding(balloon)) {
                // Balloon caught!
                this.score += balloon.points;
                
                // Change jar color to match balloon
                this.jar.changeColor(balloon.color);
                
                // Play appropriate sound
                if (balloon.points > 1) {
                    audioManager.playBonusSound();
                } else {
                    audioManager.playCatchSound();
                }
                
                // Create particle effect
                this.createCatchParticles(balloon.x, balloon.y, balloon.color);
                
                // Remove balloon
                this.balloons.splice(i, 1);
                continue;
            }
            
            // Remove balloons that are off screen (shouldn't happen, but safety check)
            if (balloon.y > this.canvas.height + 100) {
                this.balloons.splice(i, 1);
            }
        }
        
        this.updateUI();
    }

    spawnBalloon() {
        const x = Math.random() * (this.canvas.width - 60) + 30; // Keep balloons within bounds
        const balloon = new Balloon(x, -30, this.balloonSpeed);
        this.balloons.push(balloon);
    }

    createCatchParticles(x, y, color) {
        // Simple particle effect - could be enhanced
        // For now, we'll just add a visual feedback through the balloon's own animation
    }

    render() {
        // Clear canvas with gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#98FB98');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.gameState !== 'playing') {
            return;
        }
        
        // Draw jar
        if (this.jar) {
            this.jar.draw(this.ctx);
        }
        
        // Draw balloons
        for (let balloon of this.balloons) {
            balloon.draw(this.ctx);
        }
        
        // Draw some decorative clouds
        this.drawClouds();
    }

    drawClouds() {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        
        // Static clouds for decoration
        const time = this.gameTime * 0.5;
        
        // Cloud 1
        this.drawCloud(50 + Math.sin(time) * 20, 80, 40);
        
        // Cloud 2
        this.drawCloud(this.canvas.width - 100 + Math.cos(time * 0.7) * 15, 120, 35);
        
        // Cloud 3
        this.drawCloud(this.canvas.width * 0.3 + Math.sin(time * 0.5) * 25, 60, 30);
    }

    drawCloud(x, y, size) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, size, 0, Math.PI * 2);
        this.ctx.arc(x + size * 0.6, y, size * 0.8, 0, Math.PI * 2);
        this.ctx.arc(x - size * 0.6, y, size * 0.8, 0, Math.PI * 2);
        this.ctx.arc(x, y - size * 0.5, size * 0.7, 0, Math.PI * 2);
        this.ctx.fill();
    }

    updateUI() {
        document.getElementById('scoreValue').textContent = this.score;
    }
}

// Jar class
class Jar {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 80;
        this.height = 60;
        this.baseColor = '#8B4513'; // Default brown color
        this.currentColor = '#8B4513';
        this.rimColor = '#A0522D';
        this.colorTransition = 0;
        this.targetColor = '#8B4513';
        this.tilt = 0;
        this.lastX = x;
        this.colorChangeEffect = 0; // For visual feedback when color changes
    }

    isColliding(balloon) {
        // Check if balloon is within jar bounds
        return balloon.x + balloon.radius > this.x &&
               balloon.x - balloon.radius < this.x + this.width &&
               balloon.y + balloon.radius > this.y &&
               balloon.y - balloon.radius < this.y + this.height;
    }

    changeColor(balloonColor) {
        this.targetColor = balloonColor;
        this.colorTransition = 0;
        this.colorChangeEffect = 1.0; // Trigger visual effect
    }

    update(deltaTime) {
        // Smooth color transition
        if (this.colorTransition < 1) {
            this.colorTransition = Math.min(1, this.colorTransition + deltaTime * 3);
            this.currentColor = this.interpolateColor(this.currentColor, this.targetColor, this.colorTransition);
            
            // Update rim color to be slightly darker
            this.rimColor = this.darkenColor(this.currentColor, 0.8);
        }
        
        // Smooth tilt decay
        this.tilt *= 0.9;
        
        // Decay color change effect
        if (this.colorChangeEffect > 0) {
            this.colorChangeEffect = Math.max(0, this.colorChangeEffect - deltaTime * 2);
        }
    }

    interpolateColor(color1, color2, factor) {
        // Simple color interpolation
        const rgb1 = this.hexToRgb(color1);
        const rgb2 = this.hexToRgb(color2);
        
        if (!rgb1 || !rgb2) return color1;
        
        const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * factor);
        const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * factor);
        const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * factor);
        
        return `rgb(${r}, ${g}, ${b})`;
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    darkenColor(color, factor) {
        const rgb = this.hexToRgb(color);
        if (!rgb) return color;
        
        const r = Math.round(rgb.r * factor);
        const g = Math.round(rgb.g * factor);
        const b = Math.round(rgb.b * factor);
        
        return `rgb(${r}, ${g}, ${b})`;
    }

    draw(ctx) {
        ctx.save();
        
        // Apply tilt transformation
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        
        ctx.translate(centerX, centerY);
        ctx.rotate(this.tilt);
        ctx.translate(-centerX, -centerY);
        
        // Add color change glow effect
        if (this.colorChangeEffect > 0) {
            ctx.shadowColor = this.currentColor;
            ctx.shadowBlur = 20 * this.colorChangeEffect;
            ctx.globalAlpha = 0.8 + 0.2 * this.colorChangeEffect;
        }
        
        // Draw jar body with current color
        ctx.fillStyle = this.currentColor;
        ctx.fillRect(this.x, this.y + 10, this.width, this.height - 10);
        
        // Draw jar rim with darker shade
        ctx.fillStyle = this.rimColor;
        ctx.fillRect(this.x - 5, this.y, this.width + 10, 15);
        
        // Reset shadow for other elements
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
        
        // Draw jar handle
        ctx.strokeStyle = this.currentColor;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(this.x + this.width + 10, this.y + 25, 15, -Math.PI/2, Math.PI/2);
        ctx.stroke();
        
        // Add some shine
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(this.x + 5, this.y + 15, 15, this.height - 20);
        
        // Add sparkle effect when color changes
        if (this.colorChangeEffect > 0) {
            const sparkles = 5;
            ctx.fillStyle = 'rgba(255, 255, 255, ' + this.colorChangeEffect + ')';
            for (let i = 0; i < sparkles; i++) {
                const sparkleX = this.x + Math.random() * this.width;
                const sparkleY = this.y + Math.random() * this.height;
                const sparkleSize = 2 + Math.random() * 3;
                
                ctx.beginPath();
                ctx.arc(sparkleX, sparkleY, sparkleSize, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        ctx.restore();
    }
}

// Balloon class
class Balloon {
    constructor(x, y, speed) {
        this.x = x;
        this.y = y;
        this.radius = 20 + Math.random() * 10; // Varying sizes
        this.speed = speed + Math.random() * 50 - 25; // Some speed variation
        this.color = this.getRandomColor();
        this.points = 1;
        this.bobOffset = Math.random() * Math.PI * 2;
        this.stringLength = 30 + Math.random() * 20;
        
        // Special balloon types
        if (Math.random() < 0.1) { // 10% chance for bonus balloon
            this.points = 5;
            this.color = '#FFD700'; // Gold
            this.radius += 5;
        }
    }

    getRandomColor() {
        const colors = [
            '#FF6B6B', // Red
            '#4ECDC4', // Teal
            '#45B7D1', // Blue
            '#96CEB4', // Green
            '#FFEAA7', // Yellow
            '#DDA0DD', // Plum
            '#98D8C8', // Mint
            '#F7DC6F', // Light Yellow
            '#BB8FCE', // Light Purple
            '#85C1E9'  // Light Blue
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    update(deltaTime) {
        this.y += this.speed * deltaTime;
        
        // Add gentle horizontal bobbing
        this.x += Math.sin(Date.now() * 0.001 + this.bobOffset) * 0.5;
    }

    draw(ctx) {
        // Draw balloon string
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + this.radius);
        ctx.lineTo(this.x, this.y + this.radius + this.stringLength);
        ctx.stroke();
        
        // Draw balloon
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Add balloon highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(this.x - this.radius * 0.3, this.y - this.radius * 0.3, this.radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw bonus indicator for special balloons
        if (this.points > 1) {
            ctx.fillStyle = '#FFF';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('★', this.x, this.y + 5);
        }
        
        // Draw balloon knot
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(this.x, this.y + this.radius, 3, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Global game instance
const game = new BalloonCatcherGame();

// Prevent zoom on double tap
let lastTouchEnd = 0;
document.addEventListener('touchend', (event) => {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, false);

// Handle visibility change
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        audioManager.setMasterVolume(0.1);
    } else {
        audioManager.setMasterVolume(0.7);
    }
});
