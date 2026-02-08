use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct DynamicsProcessor {
    sample_rate: f32,
    
    // Compressor State
    comp_gain_l: f32,
    comp_gain_r: f32,
    
    // Compressor Params
    attack_coeff: f32,
    release_coeff: f32,
    limiter_enabled: bool,
    min_reduction: f32,
    
    // Constants
    threshold: f32, // 0.95
}

#[wasm_bindgen]
impl DynamicsProcessor {
    #[wasm_bindgen(constructor)]
    pub fn new(sample_rate: f32) -> Self {
        let mut d = Self {
            sample_rate,
            comp_gain_l: 1.0,
            comp_gain_r: 1.0,
            attack_coeff: 0.0, // set in update_coeffs
            release_coeff: 0.0,
            limiter_enabled: true,
            min_reduction: 1.0,
            threshold: 0.95,
        };
        d.set_limiter_options(true, 0.1); // Default attack 0.1s
        d
    }

    pub fn set_limiter_options(&mut self, enabled: bool, attack: f32) {
        self.limiter_enabled = enabled;
        // attack in seconds
        
        let t_interval = 1.0 / self.sample_rate;
        // JS: this.attackCoeff = Math.exp(-tInterval / this.limiterAttack);
        // JS: this.compRelease = 0.1; 
        let release = 0.1;
        
        self.attack_coeff = (-t_interval / attack).exp();
        self.release_coeff = (-t_interval / release).exp();
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
            let mut l = left[i];
            let mut r = right[i];
            
            // --- Stage 1: Compressor (Leveller) ---
            
            // Left
            let abs_l = l.abs();
            let mut target_l = 1.0;
            if abs_l > self.threshold {
                target_l = self.threshold / abs_l;
            }
            
            if target_l < self.comp_gain_l {
                self.comp_gain_l = self.attack_coeff * self.comp_gain_l + (1.0 - self.attack_coeff) * target_l;
            } else {
                self.comp_gain_l = self.release_coeff * self.comp_gain_l + (1.0 - self.release_coeff) * target_l;
            }
            l *= self.comp_gain_l;
            
            // Right
            let abs_r = r.abs();
            let mut target_r = 1.0;
            if abs_r > self.threshold {
                target_r = self.threshold / abs_r;
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
}
