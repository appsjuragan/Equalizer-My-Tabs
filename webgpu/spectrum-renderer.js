
// Spectrum Renderer - Improved for Ears v2 (Canvas 2D)
// Uses optimized drawing and logarithmic (quartic) frequency scaling to match EQ graph.

class SpectrumRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = null;
        this.isRunning = false;
        this.animationId = null;
        this.frequencyData = null;

        // Configuration matching EQ graph
        this.width = canvas.width;
        this.height = canvas.height;
        this.smoothing = 0.5;
        this.previousData = null;

        // Logarithmic data buffer for smoother rendering
        this.logData = new Float32Array(this.width);
    }

    async init() {
        try {
            this.ctx = this.canvas.getContext('2d');
            if (!this.ctx) {
                console.error("Canvas 2D context not available.");
                return false;
            }

            console.log("Spectrum Renderer (Canvas 2D - Log Scale) initialized");
            return true;
        } catch (e) {
            console.error("Failed to initialize spectrum renderer:", e);
            return false;
        }
    }

    // Convert X (0..width) to Frequency (Hz) using EQ scaling
    // Formula: freq = (x / width)^4 * 24000 (Nyquist for 48kHz)
    xToFreq(x) {
        return Math.pow(x / this.width, 4) * 24000; // Nyquist for 48kHz sample rate
    }

    // Get array index for a given freq
    freqToIndex(freq, fftSize) {
        // Nyquist = SampleRate / 2 = 24000 for 48kHz
        // Bin size = SampleRate / FFT_SIZE
        // Index = freq / (SampleRate / FFT_SIZE) = freq * FFT_SIZE / SampleRate
        // Using 48000Hz sample rate to match AudioContext
        return Math.floor(freq * fftSize / 48000);
    }

    updateFrequencyData(fftData) {
        if (!fftData || fftData.length === 0) return;

        // Calculate log-scaled data point for each X pixel
        if (!this.logData || this.logData.length !== this.width) {
            this.logData = new Float32Array(this.width);
            this.previousData = new Float32Array(this.width);
        }

        const fftLen = fftData.length;

        for (let x = 0; x < this.width; x++) {
            // Calculate frequency range for this pixel
            const f1 = this.xToFreq(x);
            const f2 = this.xToFreq(x + 1);

            const i1 = this.freqToIndex(f1, fftLen * 2); // fftData is half size (0..Nyquist)
            const i2 = this.freqToIndex(f2, fftLen * 2);

            let maxDb = -Infinity;
            // Find max magnitude (dB) in bin range
            // For low freqs, i1 might equal i2.
            if (i2 <= i1) {
                maxDb = fftData[i1] !== undefined ? fftData[i1] : -100;
            } else {
                for (let k = i1; k < i2 && k < fftLen; k++) {
                    if (fftData[k] > maxDb) maxDb = fftData[k];
                }
            }

            // Handle -Infinity (no signal) and clamp to reasonable range
            if (!isFinite(maxDb) || maxDb < -100) maxDb = -100;
            if (maxDb > 0) maxDb = 0;

            // Convert dB to normalized value (0-1)
            // AnalyserNode returns dB values typically -100 to 0
            // Map: -100 dB -> 0.0, 0 dB -> 1.0
            let normalizedVal = (maxDb + 100) / 100;

            // Smooth falloff
            const prev = this.previousData[x] || 0;
            // asymmetrical smoothing: fast attack, slow decay
            if (normalizedVal > prev) {
                this.logData[x] = prev * 0.2 + normalizedVal * 0.8;
            } else {
                this.logData[x] = prev * 0.8 + normalizedVal * 0.2; // slower decay
            }
        }

        // Swap or copy
        for (let i = 0; i < this.width; i++) this.previousData[i] = this.logData[i];
    }

    render() {
        if (!this.ctx || !this.logData) return;

        const width = this.width;
        const height = this.height;

        // Clear canvas
        this.ctx.clearRect(0, 0, width, height);

        // Create gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, height);
        // Colors from screenshot/original style (purple/blueish)
        // Top (loud) -> Bottom (quiet)
        gradient.addColorStop(0, "rgba(200, 200, 255, 0.4)");
        gradient.addColorStop(0.5, "rgba(100, 100, 255, 0.2)");
        gradient.addColorStop(1, "rgba(50, 50, 100, 0.1)");

        this.ctx.beginPath();
        this.ctx.moveTo(0, height);

        for (let x = 0; x < width; x++) {
            const val = this.logData[x];
            // Scale: val 0..1 corresponds to -100dB .. 0dB.
            // But EQ graph is -30dB .. +30dB (Height 300).
            // -30dB corresponds to y ~ 300. +30dB corresponds to y ~ 0.
            // 0dB corresponds to y ~ 150.
            // -100dB corresponds to y ~ 500 (offscreen).

            // However, typical music is -10..-20 RMS.
            // Let's map val (0..1) to canvas height in a visually pleasing way for now,
            // or try to match dB exactly if required.
            // Usually visualizers fill 0 to height.
            // If checking screenshot: curve goes up to maybe top 1/3?

            // Let's implement a scaling factor.
            // 1.0 (0dB) -> y = height * 0.1 (near top)
            // 0.5 (-50dB) -> y = height.

            // Heuristic scaling
            // val is 0..1.
            // If val=0 -> y=height.
            // If val=1 -> y=height * 0.2?

            const amplitude = val * 0.8; // Reduce amplitude slightly
            const y = height * (1 - amplitude);
            // Clamp
            this.ctx.lineTo(x, y);
        }

        this.ctx.lineTo(width, height);
        this.ctx.lineTo(0, height);
        this.ctx.closePath();

        this.ctx.fillStyle = gradient;
        this.ctx.fill();

        // Stroke
        this.ctx.beginPath();
        for (let x = 0; x < width; x++) {
            const val = this.logData[x];
            const y = height - (val * height * 0.8);
            if (x === 0) this.ctx.moveTo(x, y);
            else this.ctx.lineTo(x, y);
        }
        this.ctx.strokeStyle = "rgba(180, 180, 220, 0.6)";
        this.ctx.lineWidth = 1.5;
        this.ctx.stroke();
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        const loop = () => {
            if (!this.isRunning) return;
            this.render();
            this.animationId = requestAnimationFrame(loop);
        };
        loop();
    }

    stop() {
        this.isRunning = false;
        if (this.animationId) cancelAnimationFrame(this.animationId);
        if (this.ctx) this.ctx.clearRect(0, 0, this.width, this.height);
    }
}
