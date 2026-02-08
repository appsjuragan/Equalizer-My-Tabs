export class JuraganAudioSBR {
    constructor() {
        this.sbrEnabled = false;
        this.sbrUserGain = 1.0;
        this.sbrActive = false;
        this.sbrGain = 0.0;
        this.sbrHoldTimer = 0;
        this.sbrHp1 = { x1: 0, y1: 0 };
        this.sbrHp2 = { x1: 0, y1: 0 };
    }

    setOptions(enabled, gain) {
        this.sbrEnabled = enabled;
        if (gain !== undefined) this.sbrUserGain = gain;
    }

    highpass(input, state, alpha) {
        const output = alpha * (state.y1 + input - state.x1);
        state.x1 = input; state.y1 = output;
        return output;
    }

    detectSBR(magnitudes) {
        let midEnergy = 0, highEnergy = 0;
        // Check array bounds before accessing
        if (magnitudes.length < 2700) return;

        // Mid Band: 2kHz - 5kHz (Bin ~340 to ~850)
        for (let i = 340; i < 850; i++) midEnergy += magnitudes[i];

        // High Band: 6kHz - 16kHz (Bin ~1024 to ~2700)
        for (let i = 1024; i < 2700; i++) highEnergy += magnitudes[i];

        midEnergy /= (850 - 340);
        highEnergy /= (2700 - 1024);

        // Relaxes threshold to 0.6 so it activates more easily for "punchy" feel
        const conditionMet = (midEnergy > 0.05 && (highEnergy / midEnergy) < 0.6);

        if (conditionMet) {
            this.sbrHoldTimer = 3.0; // Hold for 3 seconds (slightly less sticky)
            this.sbrActive = true;
        } else {
            if (this.sbrHoldTimer > 0) {
                this.sbrHoldTimer -= 0.035; // Approx 35ms per frame
                this.sbrActive = true;
            } else {
                this.sbrActive = false;
            }
        }

        if (this.sbrActive) {
            this.sbrGain += 0.1; // Faster attack (approx 0.4s to full)
            if (this.sbrGain > 1.0) this.sbrGain = 1.0;
        } else {
            this.sbrGain -= 0.02; // Faster release
            if (this.sbrGain < 0.0) this.sbrGain = 0.0;
        }
    }

    processBlock(blockL, blockR, blockSize) {
        if (!this.sbrEnabled || !this.sbrActive) return;

        for (let i = 0; i < blockSize; i++) {
            let l = blockL[i];
            let r = blockR[i];

            // L
            let hpL = 0.8 * (this.sbrHp1.y1 + l - this.sbrHp1.x1);
            this.sbrHp1.x1 = l; this.sbrHp1.y1 = hpL;
            l = l + (Math.abs(hpL) * this.sbrGain * 0.2 * this.sbrUserGain);

            // R
            let hpR = 0.8 * (this.sbrHp2.y1 + r - this.sbrHp2.x1);
            this.sbrHp2.x1 = r; this.sbrHp2.y1 = hpR;
            r = r + (Math.abs(hpR) * this.sbrGain * 0.2 * this.sbrUserGain);

            blockL[i] = l;
            blockR[i] = r;
        }
    }
}
