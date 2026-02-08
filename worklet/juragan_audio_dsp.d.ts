/* tslint:disable */
/* eslint-disable */

export class JuraganAudioDSP {
    free(): void;
    [Symbol.dispose](): void;
    get_fft(input: Float32Array): Float32Array;
    get_reduction_db(): number;
    constructor(sample_rate: number);
    process_block(input: Float32Array, output: Float32Array): void;
    set_filter(index: number, type_id: number, freq: number, q: number, gain: number): void;
    set_gain(val: number): void;
    set_limiter(threshold: number, knee: number): void;
    set_sbr_active(active: boolean): void;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_juraganaudiodsp_free: (a: number, b: number) => void;
    readonly juraganaudiodsp_get_fft: (a: number, b: number, c: number) => [number, number];
    readonly juraganaudiodsp_get_reduction_db: (a: number) => number;
    readonly juraganaudiodsp_new: (a: number) => number;
    readonly juraganaudiodsp_process_block: (a: number, b: number, c: number, d: number, e: number, f: any) => void;
    readonly juraganaudiodsp_set_filter: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
    readonly juraganaudiodsp_set_gain: (a: number, b: number) => void;
    readonly juraganaudiodsp_set_limiter: (a: number, b: number, c: number) => void;
    readonly juraganaudiodsp_set_sbr_active: (a: number, b: number) => void;
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
