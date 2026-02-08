export class JuraganAudioSBR {
    constructor() {
        this.sbrEnabled = false;
        this.sbrUserGain = 1.0;
    }

    setOptions(enabled, gain) {
        this.sbrEnabled = enabled;
        if (gain !== undefined) this.sbrUserGain = gain;
    }

    detectSBR(magnitudes) {
        return;
    }

    processBlock(blockL, blockR, blockSize) {
        // Intentionally no-op: SBR processing is handled in WASM.
        // This class is kept only for config/state consistency.
        return;
    }
}
