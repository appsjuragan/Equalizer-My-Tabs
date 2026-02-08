export class JuraganAudioSBR {
    constructor() {
        this.sbrEnabled = false;
        this.sbrUserGain = 1.0;

        // Envelope followers for transient detection
        // Left
        this.envFastL = 0.0;
        this.envSlowL = 0.0;
        // Right
        this.envFastR = 0.0;
        this.envSlowR = 0.0;

        // Highpass filters state
        this.sbrHp1 = { x1: 0, y1: 0 };
        this.sbrHp2 = { x1: 0, y1: 0 };

        // Constants for transient detection
        // Sample rate is ~48000. 
        // Fast attack ~1ms, Slow ~50ms
        this.alphaFast = 0.90;
        this.alphaSlow = 0.995;
        this.transientThreshold = 0.01;
    }

    setOptions(enabled, gain) {
        this.sbrEnabled = enabled;
        if (gain !== undefined) this.sbrUserGain = gain;
    }

    detectSBR(magnitudes) {
        // Legacy FFT detection kept for visualization or future "Smart" modes.
        // For "Punchy" mode, we rely on time-domain transient detection in processBlock.
        return;
    }

    processBlock(blockL, blockR, blockSize) {
        if (!this.sbrEnabled) return;

        // HPF Coeff (approx 1.5kHz at 48k)
        const alpha = 0.8;

        // SBR Makeup scale
        const makeup = 0.5 * this.sbrUserGain;

        for (let i = 0; i < blockSize; i++) {
            let l = blockL[i];
            let r = blockR[i] || l;

            // 1. High Pass Filter (Isolate Mids/Highs for detection & synthesis)
            // L
            let hpL = alpha * (this.sbrHp1.y1 + l - this.sbrHp1.x1);
            this.sbrHp1.x1 = l; this.sbrHp1.y1 = hpL;
            // R
            let hpR = alpha * (this.sbrHp2.y1 + r - this.sbrHp2.x1);
            this.sbrHp2.x1 = r; this.sbrHp2.y1 = hpR;

            // 2. Rectification (Harmonic Generation)
            let harmL = Math.abs(hpL);
            let harmR = Math.abs(hpR);

            // 3. Transient Detection (Dynamic Gate)
            // Track envelopes of the High-passed signal energy
            this.envFastL = this.alphaFast * this.envFastL + (1.0 - this.alphaFast) * harmL;
            this.envSlowL = this.alphaSlow * this.envSlowL + (1.0 - this.alphaSlow) * harmL;

            this.envFastR = this.alphaFast * this.envFastR + (1.0 - this.alphaFast) * harmR;
            this.envSlowR = this.alphaSlow * this.envSlowR + (1.0 - this.alphaSlow) * harmR;

            // Ratio or Difference indicates a transient (sudden rise)
            // We want to apply SBR when Fast > Slow (Attack phase)
            let transientL = Math.max(0, this.envFastL - this.envSlowL);
            let transientR = Math.max(0, this.envFastR - this.envSlowR);

            // Scale transient reaction
            // This curve focuses the effect on the "hit"
            let gainL = Math.min(1.0, transientL * 20.0);
            let gainR = Math.min(1.0, transientR * 20.0);

            // 4. Mix
            // Add generated harmonics only during transients
            blockL[i] = l + (harmL * gainL * makeup);
            if (blockR) blockR[i] = r + (harmR * gainR * makeup);
        }
    }
}
