export class JuraganAudioFilters {
    constructor(sampleRate, numFilters, centerFrequencies) {
        this.sampleRate = sampleRate;
        this.numFilters = numFilters;
        this.centerFrequencies = centerFrequencies;
        this.qualityMode = 'efficient';
        this.filters = [];
        this.initFilters();
    }

    initFilters() {
        this.filters = this.centerFrequencies.map((freq, index) => ({
            type: index === 0 ? 'lowshelf' : (index === this.numFilters - 1 ? 'highshelf' : 'peaking'),
            frequency: freq,
            gain: 0,
            q: this.getQForFrequency(freq),
            b0: 1, b1: 0, b2: 0, a1: 0, a2: 0,
            x1L: 0, x2L: 0, y1L: 0, y2L: 0,
            x1R: 0, x2R: 0, y1R: 0, y2R: 0
        }));
        this.updateAllFilterCoefficients();
    }

    getFilters() {
        return this.filters;
    }

    setQualityMode(mode) {
        this.qualityMode = mode;
        this.filters.forEach(filter => {
            filter.q = this.getQForFrequency(filter.frequency);
        });
        this.updateAllFilterCoefficients();
    }

    getQForFrequency(freq) {
        let q = 1.0;
        if (freq < 100) q = 0.7;
        else if (freq < 500) q = 0.9;
        else if (freq < 2000) q = 1.1;
        else if (freq < 8000) q = 1.3;
        else q = 1.5;

        if (this.qualityMode === 'efficient') return q * 0.8;
        else if (this.qualityMode === 'quality') return q * 1.0;
        else return q * 1.2;
    }

    updateAllFilterCoefficients() {
        this.filters.forEach(filter => this.calculateBiquadCoefficients(filter));
    }

    calculateBiquadCoefficients(filter) {
        const { type, frequency, gain, q } = filter;
        const w0 = 2 * Math.PI * frequency / this.sampleRate;
        const cosW0 = Math.cos(w0);
        const sinW0 = Math.sin(w0);
        const alpha = sinW0 / (2 * q);
        const A = Math.pow(10, gain / 40);
        let b0, b1, b2, a0, a1, a2;

        if (type === 'lowshelf') {
            b0 = A * ((A + 1) - (A - 1) * cosW0 + 2 * Math.sqrt(A) * alpha);
            b1 = 2 * A * ((A - 1) - (A + 1) * cosW0);
            b2 = A * ((A + 1) - (A - 1) * cosW0 - 2 * Math.sqrt(A) * alpha);
            a0 = (A + 1) + (A - 1) * cosW0 + 2 * Math.sqrt(A) * alpha;
            a1 = -2 * ((A - 1) + (A + 1) * cosW0);
            a2 = (A + 1) + (A - 1) * cosW0 - 2 * Math.sqrt(A) * alpha;
        } else if (type === 'highshelf') {
            b0 = A * ((A + 1) + (A - 1) * cosW0 + 2 * Math.sqrt(A) * alpha);
            b1 = -2 * A * ((A - 1) + (A + 1) * cosW0);
            b2 = A * ((A + 1) + (A - 1) * cosW0 - 2 * Math.sqrt(A) * alpha);
            a0 = (A + 1) - (A - 1) * cosW0 + 2 * Math.sqrt(A) * alpha;
            a1 = 2 * ((A - 1) - (A + 1) * cosW0);
            a2 = (A + 1) - (A - 1) * cosW0 - 2 * Math.sqrt(A) * alpha;
        } else {
            b0 = 1 + alpha * A; b1 = -2 * cosW0; b2 = 1 - alpha * A;
            a0 = 1 + alpha / A; a1 = -2 * cosW0; a2 = 1 - alpha / A;
        }
        filter.b0 = b0 / a0; filter.b1 = b1 / a0; filter.b2 = b2 / a0;
        filter.a1 = a1 / a0; filter.a2 = a2 / a0;
    }

    processBiquad(filter, input, channel) {
        const isLeft = channel === 'L';
        const x1 = isLeft ? filter.x1L : filter.x1R;
        const x2 = isLeft ? filter.x2L : filter.x2R;
        const y1 = isLeft ? filter.y1L : filter.y1R;
        const y2 = isLeft ? filter.y2L : filter.y2R;

        const output = filter.b0 * input + filter.b1 * x1 + filter.b2 * x2 - filter.a1 * y1 - filter.a2 * y2;

        if (isLeft) { filter.x2L = filter.x1L; filter.x1L = input; filter.y2L = filter.y1L; filter.y1L = output; }
        else { filter.x2R = filter.x1R; filter.x1R = input; filter.y2R = filter.y1R; filter.y1R = output; }
        return output;
    }
}
