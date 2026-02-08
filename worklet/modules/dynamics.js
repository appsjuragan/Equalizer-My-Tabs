export class JuraganAudioDynamics {
    constructor(sampleRate) {
        this.sampleRate = sampleRate;
        this.compGain = { L: 1.0, R: 1.0 };
        this.compRelease = 0.1; // Fixed release ~100ms
        this.limiterThreshold = 0.95; // Safety Threshold
        this.minReduction = 1.0;

        this.limiterEnabled = true;
        this.limiterAttack = 0.1; // User attack (seconds)

        this.updateCoefficients();
    }

    setLimiterOptions(enabled, attack) {
        this.limiterEnabled = enabled;
        if (attack !== undefined) this.limiterAttack = attack;
        this.updateCoefficients();
    }

    updateCoefficients() {
        const tInterval = 1 / this.sampleRate;
        this.attackCoeff = Math.exp(-tInterval / this.limiterAttack);
        this.releaseCoeff = Math.exp(-tInterval / this.compRelease);
    }

    getMinReduction() {
        return this.minReduction;
    }

    resetMinReduction() {
        this.minReduction = 1.0;
    }

    processBlock(blockL, blockR, blockSize) {
        if (!this.limiterEnabled) {
            // Pass through but perhaps clamp just in case? No, "OFF" means off.
            return;
        }

        for (let i = 0; i < blockSize; i++) {
            let l = blockL[i];
            let r = blockR[i];

            // Compressor (Stage 1: Slow Attack Leveller)
            // L
            let absL = Math.abs(l);
            let targetL = 1.0;
            if (absL > 0.95) targetL = 0.95 / absL; // Threshold 0.95 (-0.5dB)

            if (targetL < this.compGain.L) {
                this.compGain.L = this.attackCoeff * this.compGain.L + (1 - this.attackCoeff) * targetL;
            } else {
                this.compGain.L = this.releaseCoeff * this.compGain.L + (1 - this.releaseCoeff) * targetL;
            }
            l *= this.compGain.L;

            // R
            let absR = Math.abs(r);
            let targetR = 1.0;
            if (absR > 0.95) targetR = 0.95 / absR;

            if (targetR < this.compGain.R) {
                this.compGain.R = this.attackCoeff * this.compGain.R + (1 - this.attackCoeff) * targetR;
            } else {
                this.compGain.R = this.releaseCoeff * this.compGain.R + (1 - this.releaseCoeff) * targetR;
            }
            r *= this.compGain.R;

            // Track max reduction (min gain) for UI
            if (this.compGain.L < this.minReduction) this.minReduction = this.compGain.L;
            if (this.compGain.R < this.minReduction) this.minReduction = this.compGain.R;

            // Safety Clipper (Stage 2: Brickwall)
            // Hard/Soft clip at 0.99
            if (l > 0.99) l = 0.99 + (l - 0.99) / (1 + (l - 0.99));
            else if (l < -0.99) l = -0.99 + (l + 0.99) / (1 - (l + 0.99));

            if (r > 0.99) r = 0.99 + (r - 0.99) / (1 + (r - 0.99));
            else if (r < -0.99) r = -0.99 + (r + 0.99) / (1 - (r + 0.99));

            blockL[i] = l;
            blockR[i] = r;
        }
    }

    softLimit(input, threshold) {
        // Legacy Soft Limit function if needed individually
        const absInput = Math.abs(input);
        if (absInput < threshold) return input;
        const excess = absInput - threshold;
        const limited = threshold + excess / (1 + excess);
        return input > 0 ? limited : -limited;
    }
}
