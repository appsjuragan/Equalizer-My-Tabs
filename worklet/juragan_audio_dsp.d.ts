/* tslint:disable */
/* eslint-disable */

export class DynamicsProcessor {
    free(): void;
    [Symbol.dispose](): void;
    get_reduction_db(): number;
    constructor(sample_rate: number);
    process_block(left: Float32Array, right: Float32Array): void;
    set_limiter_options(enabled: boolean, attack: number): void;
}

export class JuraganAudioDSP {
    free(): void;
    [Symbol.dispose](): void;
    get_fft(input: Float32Array): Float32Array;
    get_reduction_db(): number;
    is_sbr_active(): boolean;
    constructor(sample_rate: number);
    process_stereo(input_l: Float32Array, input_r: Float32Array, output_l: Float32Array, output_r: Float32Array): void;
    set_filter(index: number, type_id: number, freq: number, q: number, gain: number): void;
    set_gain(val: number): void;
    set_limiter_options(enabled: boolean, attack: number): void;
    set_sbr_options(enabled: boolean, gain: number): void;
}

export class SBRProcessor {
    free(): void;
    [Symbol.dispose](): void;
    is_enabled(): boolean;
    constructor(sample_rate: number);
    process_block(input_l: Float32Array, input_r: Float32Array, sbr_active: boolean): void;
    set_options(enabled: boolean, gain: number): void;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_dynamicsprocessor_free: (a: number, b: number) => void;
    readonly __wbg_juraganaudiodsp_free: (a: number, b: number) => void;
    readonly __wbg_sbrprocessor_free: (a: number, b: number) => void;
    readonly dynamicsprocessor_get_reduction_db: (a: number) => number;
    readonly dynamicsprocessor_new: (a: number) => number;
    readonly dynamicsprocessor_process_block: (a: number, b: number, c: number, d: any, e: number, f: number, g: any) => void;
    readonly dynamicsprocessor_set_limiter_options: (a: number, b: number, c: number) => void;
    readonly juraganaudiodsp_get_fft: (a: number, b: number, c: number) => [number, number];
    readonly juraganaudiodsp_get_reduction_db: (a: number) => number;
    readonly juraganaudiodsp_is_sbr_active: (a: number) => number;
    readonly juraganaudiodsp_new: (a: number) => number;
    readonly juraganaudiodsp_process_stereo: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: any, i: number, j: number, k: any) => void;
    readonly juraganaudiodsp_set_filter: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
    readonly juraganaudiodsp_set_gain: (a: number, b: number) => void;
    readonly juraganaudiodsp_set_limiter_options: (a: number, b: number, c: number) => void;
    readonly juraganaudiodsp_set_sbr_options: (a: number, b: number, c: number) => void;
    readonly sbrprocessor_is_enabled: (a: number) => number;
    readonly sbrprocessor_new: (a: number) => number;
    readonly sbrprocessor_process_block: (a: number, b: number, c: number, d: any, e: number, f: number, g: any, h: number) => void;
    readonly sbrprocessor_set_options: (a: number, b: number, c: number) => void;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
