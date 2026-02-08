use wasm_bindgen::prelude::*;
use crate::config::LIMITER_CONFIG;

#[wasm_bindgen]
#[derive(Clone, Copy)]
pub enum DetectorMode {
    Peak = 0,
    Rms = 1,
}

#[wasm_bindgen]
pub struct DynamicsProcessor {
    sample_rate: f32,
    
    // Compressor State
    comp_gain_l: f32,
    comp_gain_r: f32,
    rms_l: f32,
    rms_r: f32,
    
    // Compressor Params
    attack_coeff: f32,
    release_coeff: f32,
    limiter_enabled: bool,
    min_reduction: f32,
    detector_mode: DetectorMode,
    knee: f32,
    threshold: f32,
    rms_coeff: f32,
    lookahead_samples: usize,
    lookahead_index: usize,
    lookahead_l: Vec<f32>,
    lookahead_r: Vec<f32>,
    
}

#[wasm_bindgen]
impl DynamicsProcessor {
    #[wasm_bindgen(constructor)]
    pub fn new(sample_rate: f32) -> Self {
        let lookahead_samples = ms_to_samples(LIMITER_CONFIG.lookahead_ms, sample_rate);
        let lookahead_len = lookahead_samples.max(1);
        let mut d = Self {
            sample_rate,
            comp_gain_l: 1.0,
            comp_gain_r: 1.0,
            rms_l: 0.0,
            rms_r: 0.0,
            attack_coeff: 0.0, // set in update_coeffs
            release_coeff: 0.0,
            limiter_enabled: true,
            min_reduction: 1.0,
            detector_mode: DetectorMode::Peak,
            knee: LIMITER_CONFIG.knee,
            threshold: LIMITER_CONFIG.threshold,
            rms_coeff: 0.0,
            lookahead_samples,
            lookahead_index: 0,
            lookahead_l: vec![0.0; lookahead_len],
            lookahead_r: vec![0.0; lookahead_len],
        };
        d.set_limiter_options(true, 0.1); // Default attack 0.1s
        d.set_limiter_params(
            LIMITER_CONFIG.threshold,
            LIMITER_CONFIG.knee,
            DetectorMode::Peak,
            LIMITER_CONFIG.lookahead_ms,
            LIMITER_CONFIG.rms_time_ms,
        );
        d
    }

    pub fn set_limiter_options(&mut self, enabled: bool, attack: f32) {
        self.limiter_enabled = enabled;
        // attack in seconds
        
        let t_interval = 1.0 / self.sample_rate;
        // JS: this.attackCoeff = Math.exp(-tInterval / this.limiterAttack);
        // JS: this.compRelease = 0.1; 
        let release = LIMITER_CONFIG.release_s;
        
        let safe_attack = attack.max(0.001);
        self.attack_coeff = (-t_interval / safe_attack).exp();
        self.release_coeff = (-t_interval / release).exp();
    }

    pub fn set_limiter_params(
        &mut self,
        threshold: f32,
        knee: f32,
        detector_mode: DetectorMode,
        lookahead_ms: f32,
        rms_time_ms: f32,
    ) {
        self.threshold = threshold.clamp(0.1, 1.2);
        self.knee = knee.max(0.0);
        self.detector_mode = detector_mode;
        self.rms_coeff = rms_coeff(rms_time_ms, self.sample_rate);

        let lookahead_samples = ms_to_samples(lookahead_ms, self.sample_rate);
        self.lookahead_samples = lookahead_samples;
        let lookahead_len = lookahead_samples.max(1);
        if self.lookahead_l.len() != lookahead_len {
            self.lookahead_l = vec![0.0; lookahead_len];
            self.lookahead_r = vec![0.0; lookahead_len];
            self.lookahead_index = 0;
        }
    }
    
    pub fn get_reduction_db(&mut self) -> f32 {
        if self.min_reduction < 1.0 {
            let db = 20.0 * self.min_reduction.log10();
            self.min_reduction = 1.0; // Reset
            return db;
        }
        0.0
    }

    pub fn process_block(&mut self, left: &mut [f32], right: &mut [f32]) {
        if !self.limiter_enabled {
            return;
        }
        
        let block_size = left.len().min(right.len());
        
        for i in 0..block_size {
            let input_l = left[i];
            let input_r = right[i];
            let (mut l, mut r) = if self.lookahead_samples > 0 {
                let idx = self.lookahead_index;
                let delayed_l = self.lookahead_l[idx];
                let delayed_r = self.lookahead_r[idx];
                self.lookahead_l[idx] = input_l;
                self.lookahead_r[idx] = input_r;
                self.lookahead_index = (idx + 1) % self.lookahead_l.len();
                (delayed_l, delayed_r)
            } else {
                (input_l, input_r)
            };
            
            // --- Stage 1: Compressor (Leveller) ---
            
            // Left
            let abs_l = self.detector_sample(input_l, true);
            let mut target_l = 1.0;
            if abs_l > 0.0 {
                target_l = limiter_gain(abs_l, self.threshold, self.knee);
            }
            
            if target_l < self.comp_gain_l {
                self.comp_gain_l = self.attack_coeff * self.comp_gain_l + (1.0 - self.attack_coeff) * target_l;
            } else {
                self.comp_gain_l = self.release_coeff * self.comp_gain_l + (1.0 - self.release_coeff) * target_l;
            }
            l *= self.comp_gain_l;
            
            // Right
            let abs_r = self.detector_sample(input_r, false);
            let mut target_r = 1.0;
            if abs_r > 0.0 {
                target_r = limiter_gain(abs_r, self.threshold, self.knee);
            }
            
            if target_r < self.comp_gain_r {
                self.comp_gain_r = self.attack_coeff * self.comp_gain_r + (1.0 - self.attack_coeff) * target_r;
            } else {
                self.comp_gain_r = self.release_coeff * self.comp_gain_r + (1.0 - self.release_coeff) * target_r;
            }
            r *= self.comp_gain_r;
            
            // Reduction Tracking
            if self.comp_gain_l < self.min_reduction { self.min_reduction = self.comp_gain_l; }
            if self.comp_gain_r < self.min_reduction { self.min_reduction = self.comp_gain_r; }
            
            // --- Stage 2: Safety Clipper ---
            // Hard/Soft clip at 0.99
             if l > 0.99 {
                l = 0.99 + (l - 0.99) / (1.0 + (l - 0.99));
            } else if l < -0.99 {
                l = -0.99 + (l + 0.99) / (1.0 - (l + 0.99));
            }
            
            if r > 0.99 {
                r = 0.99 + (r - 0.99) / (1.0 + (r - 0.99));
            } else if r < -0.99 {
                r = -0.99 + (r + 0.99) / (1.0 - (r + 0.99));
            }
            
            left[i] = l;
            right[i] = r;
        }
    }

    fn detector_sample(&mut self, sample: f32, is_left: bool) -> f32 {
        match self.detector_mode {
            DetectorMode::Peak => sample.abs(),
            DetectorMode::Rms => {
                if is_left {
                    self.rms_l = self.rms_coeff * self.rms_l + (1.0 - self.rms_coeff) * (sample * sample);
                    self.rms_l.sqrt()
                } else {
                    self.rms_r = self.rms_coeff * self.rms_r + (1.0 - self.rms_coeff) * (sample * sample);
                    self.rms_r.sqrt()
                }
            }
        }
    }
}

fn limiter_gain(level: f32, threshold: f32, knee: f32) -> f32 {
    if knee <= 0.0 {
        if level > threshold {
            threshold / level
        } else {
            1.0
        }
    } else {
        let lower = threshold - knee * 0.5;
        let upper = threshold + knee * 0.5;
        if level <= lower {
            1.0
        } else if level >= upper {
            threshold / level
        } else {
            let t = (level - lower) / knee;
            let hard = threshold / level;
            (1.0 - t) + t * hard
        }
    }
}

fn rms_coeff(rms_time_ms: f32, sample_rate: f32) -> f32 {
    let time_s = (rms_time_ms / 1000.0).max(0.001);
    (-1.0 / (time_s * sample_rate)).exp()
}

fn ms_to_samples(ms: f32, sample_rate: f32) -> usize {
    ((ms.max(0.0) / 1000.0) * sample_rate).round() as usize
}
