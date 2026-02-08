pub struct SbrConfig {
    pub detection_hp_alpha: f32,
    pub synth_hp_cutoff_hz: f32,
    pub synth_lp_cutoff_hz: f32,
    pub fast_env_alpha: f32,
    pub slow_env_alpha: f32,
    pub tail_decay: f32,
}

pub const SBR_CONFIG: SbrConfig = SbrConfig {
    detection_hp_alpha: 0.6,
    synth_hp_cutoff_hz: 6000.0,
    synth_lp_cutoff_hz: 18000.0,
    fast_env_alpha: 0.85,
    slow_env_alpha: 0.992,
    tail_decay: 0.9994,
};

pub struct LimiterConfig {
    pub threshold: f32,
    pub knee: f32,
    pub rms_time_ms: f32,
    pub lookahead_ms: f32,
    pub release_s: f32,
}

pub const LIMITER_CONFIG: LimiterConfig = LimiterConfig {
    threshold: 0.95,
    knee: 0.05,
    rms_time_ms: 50.0,
    lookahead_ms: 2.0,
    release_s: 0.1,
};
