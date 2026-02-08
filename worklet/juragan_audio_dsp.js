/* @ts-self-types="./juragan_audio_dsp.d.ts" */

/**
 * @enum {0 | 1}
 */
export const DetectorMode = Object.freeze({
    Peak: 0, "0": "Peak",
    Rms: 1, "1": "Rms",
});

export class DynamicsProcessor {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        DynamicsProcessorFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_dynamicsprocessor_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    get_reduction_db() {
        const ret = wasm.dynamicsprocessor_get_reduction_db(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} sample_rate
     */
    constructor(sample_rate) {
        const ret = wasm.dynamicsprocessor_new(sample_rate);
        this.__wbg_ptr = ret >>> 0;
        DynamicsProcessorFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {Float32Array} left
     * @param {Float32Array} right
     */
    process_block(left, right) {
        var ptr0 = passArrayF32ToWasm0(left, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        var ptr1 = passArrayF32ToWasm0(right, wasm.__wbindgen_malloc);
        var len1 = WASM_VECTOR_LEN;
        wasm.dynamicsprocessor_process_block(this.__wbg_ptr, ptr0, len0, left, ptr1, len1, right);
    }
    /**
     * @param {boolean} enabled
     * @param {number} attack
     */
    set_limiter_options(enabled, attack) {
        wasm.dynamicsprocessor_set_limiter_options(this.__wbg_ptr, enabled, attack);
    }
    /**
     * @param {number} threshold
     * @param {number} knee
     * @param {DetectorMode} detector_mode
     * @param {number} lookahead_ms
     * @param {number} rms_time_ms
     */
    set_limiter_params(threshold, knee, detector_mode, lookahead_ms, rms_time_ms) {
        wasm.dynamicsprocessor_set_limiter_params(this.__wbg_ptr, threshold, knee, detector_mode, lookahead_ms, rms_time_ms);
    }
}
if (Symbol.dispose) DynamicsProcessor.prototype[Symbol.dispose] = DynamicsProcessor.prototype.free;

export class JuraganAudioDSP {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        JuraganAudioDSPFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_juraganaudiodsp_free(ptr, 0);
    }
    /**
     * @param {Float32Array} input
     * @returns {Float32Array}
     */
    get_fft(input) {
        const ptr0 = passArrayF32ToWasm0(input, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.juraganaudiodsp_get_fft(this.__wbg_ptr, ptr0, len0);
        var v2 = getArrayF32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v2;
    }
    /**
     * @returns {number}
     */
    get_reduction_db() {
        const ret = wasm.juraganaudiodsp_get_reduction_db(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {boolean}
     */
    is_sbr_active() {
        const ret = wasm.juraganaudiodsp_is_sbr_active(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @param {number} sample_rate
     */
    constructor(sample_rate) {
        const ret = wasm.juraganaudiodsp_new(sample_rate);
        this.__wbg_ptr = ret >>> 0;
        JuraganAudioDSPFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {Float32Array} input_l
     * @param {Float32Array} input_r
     * @param {Float32Array} output_l
     * @param {Float32Array} output_r
     */
    process_stereo(input_l, input_r, output_l, output_r) {
        const ptr0 = passArrayF32ToWasm0(input_l, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArrayF32ToWasm0(input_r, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        var ptr2 = passArrayF32ToWasm0(output_l, wasm.__wbindgen_malloc);
        var len2 = WASM_VECTOR_LEN;
        var ptr3 = passArrayF32ToWasm0(output_r, wasm.__wbindgen_malloc);
        var len3 = WASM_VECTOR_LEN;
        wasm.juraganaudiodsp_process_stereo(this.__wbg_ptr, ptr0, len0, ptr1, len1, ptr2, len2, output_l, ptr3, len3, output_r);
    }
    /**
     * @param {number} index
     * @param {number} type_id
     * @param {number} freq
     * @param {number} q
     * @param {number} gain
     */
    set_filter(index, type_id, freq, q, gain) {
        wasm.juraganaudiodsp_set_filter(this.__wbg_ptr, index, type_id, freq, q, gain);
    }
    /**
     * @param {number} val
     */
    set_gain(val) {
        wasm.juraganaudiodsp_set_gain(this.__wbg_ptr, val);
    }
    /**
     * @param {boolean} enabled
     * @param {number} attack
     */
    set_limiter_options(enabled, attack) {
        wasm.juraganaudiodsp_set_limiter_options(this.__wbg_ptr, enabled, attack);
    }
    /**
     * @param {number} threshold
     * @param {number} knee
     * @param {DetectorMode} detector_mode
     * @param {number} lookahead_ms
     * @param {number} rms_time_ms
     */
    set_limiter_params(threshold, knee, detector_mode, lookahead_ms, rms_time_ms) {
        wasm.juraganaudiodsp_set_limiter_params(this.__wbg_ptr, threshold, knee, detector_mode, lookahead_ms, rms_time_ms);
    }
    /**
     * @param {boolean} enabled
     * @param {number} gain
     */
    set_sbr_options(enabled, gain) {
        wasm.juraganaudiodsp_set_sbr_options(this.__wbg_ptr, enabled, gain);
    }
}
if (Symbol.dispose) JuraganAudioDSP.prototype[Symbol.dispose] = JuraganAudioDSP.prototype.free;

export class SBRProcessor {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        SBRProcessorFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_sbrprocessor_free(ptr, 0);
    }
    /**
     * @returns {boolean}
     */
    is_enabled() {
        const ret = wasm.sbrprocessor_is_enabled(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @param {number} sample_rate
     */
    constructor(sample_rate) {
        const ret = wasm.sbrprocessor_new(sample_rate);
        this.__wbg_ptr = ret >>> 0;
        SBRProcessorFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {Float32Array} input_l
     * @param {Float32Array} input_r
     * @param {boolean} sbr_active
     */
    process_block(input_l, input_r, sbr_active) {
        var ptr0 = passArrayF32ToWasm0(input_l, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        var ptr1 = passArrayF32ToWasm0(input_r, wasm.__wbindgen_malloc);
        var len1 = WASM_VECTOR_LEN;
        wasm.sbrprocessor_process_block(this.__wbg_ptr, ptr0, len0, input_l, ptr1, len1, input_r, sbr_active);
    }
    /**
     * @param {boolean} enabled
     * @param {number} gain
     */
    set_options(enabled, gain) {
        wasm.sbrprocessor_set_options(this.__wbg_ptr, enabled, gain);
    }
}
if (Symbol.dispose) SBRProcessor.prototype[Symbol.dispose] = SBRProcessor.prototype.free;

function __wbg_get_imports() {
    const import0 = {
        __proto__: null,
        __wbg___wbindgen_copy_to_typed_array_fc0809a4dec43528: function(arg0, arg1, arg2) {
            new Uint8Array(arg2.buffer, arg2.byteOffset, arg2.byteLength).set(getArrayU8FromWasm0(arg0, arg1));
        },
        __wbg___wbindgen_throw_be289d5034ed271b: function(arg0, arg1) {
            throw new Error(getStringFromWasm0(arg0, arg1));
        },
        __wbindgen_init_externref_table: function() {
            const table = wasm.__wbindgen_externrefs;
            const offset = table.grow(4);
            table.set(0, undefined);
            table.set(offset + 0, undefined);
            table.set(offset + 1, null);
            table.set(offset + 2, true);
            table.set(offset + 3, false);
        },
    };
    return {
        __proto__: null,
        "./juragan_audio_dsp_bg.js": import0,
    };
}

const DynamicsProcessorFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_dynamicsprocessor_free(ptr >>> 0, 1));
const JuraganAudioDSPFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_juraganaudiodsp_free(ptr >>> 0, 1));
const SBRProcessorFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_sbrprocessor_free(ptr >>> 0, 1));

function getArrayF32FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getFloat32ArrayMemory0().subarray(ptr / 4, ptr / 4 + len);
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

let cachedFloat32ArrayMemory0 = null;
function getFloat32ArrayMemory0() {
    if (cachedFloat32ArrayMemory0 === null || cachedFloat32ArrayMemory0.byteLength === 0) {
        cachedFloat32ArrayMemory0 = new Float32Array(wasm.memory.buffer);
    }
    return cachedFloat32ArrayMemory0;
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return decodeText(ptr, len);
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function passArrayF32ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 4, 4) >>> 0;
    getFloat32ArrayMemory0().set(arg, ptr / 4);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

let WASM_VECTOR_LEN = 0;

let wasmModule, wasm;
function __wbg_finalize_init(instance, module) {
    wasm = instance.exports;
    wasmModule = module;
    cachedFloat32ArrayMemory0 = null;
    cachedUint8ArrayMemory0 = null;
    wasm.__wbindgen_start();
    return wasm;
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);
            } catch (e) {
                const validResponse = module.ok && expectedResponseType(module.type);

                if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else { throw e; }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);
    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };
        } else {
            return instance;
        }
    }

    function expectedResponseType(type) {
        switch (type) {
            case 'basic': case 'cors': case 'default': return true;
        }
        return false;
    }
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (module !== undefined) {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();
    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }
    const instance = new WebAssembly.Instance(module, imports);
    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (module_or_path !== undefined) {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (module_or_path === undefined) {
        module_or_path = new URL('juragan_audio_dsp_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync, __wbg_init as default };
