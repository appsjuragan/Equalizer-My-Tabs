export class JuraganAudioFFT {
    constructor(fftSize) {
        this.fftSize = fftSize;
        this.fftBuffer = new Float32Array(this.fftSize);
        this.fftPosition = 0;
        this.fftCounter = 0;

        // Initialize FFT window (Hann)
        this.window = new Float32Array(this.fftSize);
        for (let i = 0; i < this.fftSize; i++) {
            this.window[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (this.fftSize - 1)));
        }

        // Precompute bit reversal table
        this.bitRev = new Uint32Array(this.fftSize);
        let rev = 0;
        for (let i = 0; i < this.fftSize; i++) {
            this.bitRev[i] = rev;
            let mask = this.fftSize >> 1;
            while (rev & mask) {
                rev &= ~mask;
                mask >>= 1;
            }
            rev |= mask;
        }

        // Precompute twiddle factors
        this.sinTable = new Float32Array(this.fftSize / 2);
        this.cosTable = new Float32Array(this.fftSize / 2);
        for (let i = 0; i < this.fftSize / 2; i++) {
            this.sinTable[i] = Math.sin(-2 * Math.PI * i / this.fftSize);
            this.cosTable[i] = Math.cos(-2 * Math.PI * i / this.fftSize);
        }
    }

    reset() {
        this.fftPosition = 0;
        this.fftCounter = 0;
        this.fftBuffer.fill(0);
    }

    getBuffer() {
        return this.fftBuffer;
    }

    addToBuffer(sample) {
        this.fftBuffer[this.fftPosition++] = sample;
        if (this.fftPosition >= this.fftSize) this.fftPosition = 0;
    }

    performFFT(input) {
        const n = this.fftSize;
        const real = new Float32Array(n);
        const imag = new Float32Array(n);

        for (let i = 0; i < n; i++) {
            const val = input[i] * this.window[i];
            const rev = this.bitRev[i];
            real[rev] = val; imag[rev] = 0;
        }

        for (let size = 2; size <= n; size *= 2) {
            const halfSize = size / 2;
            const tabStep = n / size;
            for (let i = 0; i < n; i += size) {
                for (let j = 0; j < halfSize; j++) {
                    const k = j * tabStep;
                    const tReal = real[i + j + halfSize] * this.cosTable[k] - imag[i + j + halfSize] * this.sinTable[k];
                    const tImag = real[i + j + halfSize] * this.sinTable[k] + imag[i + j + halfSize] * this.cosTable[k];
                    real[i + j + halfSize] = real[i + j] - tReal; imag[i + j + halfSize] = imag[i + j] - tImag;
                    real[i + j] += tReal; imag[i + j] += tImag;
                }
            }
        }

        const magnitudes = new Float32Array(n / 2);
        for (let i = 0; i < n / 2; i++) {
            magnitudes[i] = Math.sqrt(real[i] * real[i] + imag[i] * imag[i]);
            let db = 20 * Math.log10(magnitudes[i] + 1e-6);
            magnitudes[i] = Math.max(0, (db + 100) / 100);
        }
        return magnitudes;
    }
}
