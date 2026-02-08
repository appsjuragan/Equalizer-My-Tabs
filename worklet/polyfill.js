// Polyfill for TextDecoder in AudioWorkletGlobalScope (for Wasm support)
if (typeof TextDecoder === 'undefined') {
    globalThis.TextDecoder = class TextDecoder {
        constructor(label) { this.label = label; }
        decode(buffer) {
            if (!buffer) return "";
            let str = "";
            for (let i = 0; i < buffer.length; i++) str += String.fromCharCode(buffer[i]);
            try { return decodeURIComponent(escape(str)); } catch (e) { return str; }
        }
    };
}
