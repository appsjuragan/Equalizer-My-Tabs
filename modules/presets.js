
let presetsCache = {};

export function updatePresetsUI(presets, onPresetClick, currentFilters, currentGain) {
    presetsCache = presets; // Cache for export

    const select = document.getElementById("presetSelect");
    if (!select) return;

    // Clear existing options but keep the first one if it's a placeholder
    // Or just rebuild entirely. Let's rebuild but keep a "Select preset" placeholder
    select.innerHTML = '<option value="" disabled selected>Select preset</option>';

    const keys = presets ? Object.keys(presets) : [];
    let matchedPreset = null;

    if (currentFilters && currentFilters.length > 0) {
        // Find matching preset
        matchedPreset = keys.find(key => {
            const p = presets[key];
            // Compare gain (with small epsilon)
            if (Math.abs((p.gain || 1) - (currentGain || 1)) > 0.01) return false;

            // Compare filters
            // filters is array of objects {frequency, gain, q}
            // preset has arrays frequencies[], gains[], qs[]
            // Length check? K=11 usually.
            if (p.frequencies.length !== currentFilters.length) return false;

            for (let i = 0; i < currentFilters.length; i++) {
                const f = currentFilters[i];
                if (Math.abs(p.frequencies[i] - f.frequency) > 1) return false; // 1Hz tol
                if (Math.abs(p.gains[i] - f.gain) > 0.1) return false; // 0.1dB tol
                if (Math.abs(p.qs[i] - f.q) > 0.01) return false; // 0.01 Q tol
            }
            return true;
        });
    }

    keys.forEach(key => {
        const option = document.createElement("option");
        option.value = key;
        option.innerText = key; // innerText often more reliable for display
        select.appendChild(option);
    });

    if (matchedPreset) {
        select.value = matchedPreset;
        // Also update input if matched
        const input = document.getElementById("presetNameInput");
        if (input && document.activeElement !== input) {
            input.value = matchedPreset;
        }
    } else {
        select.value = "";
    }

    // Also check Bass Boost (hardcoded)
    // Only if no custom preset matched? Or is Bass Boost stored as a preset?
    // Bass Boost is a "special" preset handled in SW via hardcoding, but user can save it too.
    // If it matches pure bass boost profile, we could show it? 
    // But dropdown doesn't have "Bass Boost" option usually, it's a separate button.
    // So ignore for now, focus on user presets.

    // Update input based on match
    const input = document.getElementById("presetNameInput");
    if (input) {
        if (matchedPreset) {
            input.value = matchedPreset;
            // Also ensure the placeholder is NOT selected if we found a match
            // The loop above sets selected=true, which deselects others.
            // But we need to make sure the placeholder isn't re-selected if no match found?
            // "Select preset" has 'selected' attribute in HTML string.
            // If matchedPreset found, setting option.selected = true will override.
            // If NOT found, placeholder remains selected. Correct.
        } else {
            // If no match, clear input? Or assume "dirty"?
            // User Request: "if non dirty preset, stay preset name selection...".
            // Implies if dirty -> clear selection?
            // Or at least show "Select preset".
            input.value = "";
        }
    }

    // Remove old listener to avoid duplicates if this is called multiple times? 
    // Actually, setting onchange property overwrites old one, which is safer here.
    select.onchange = () => {
        const key = select.value;
        if (onPresetClick) onPresetClick(key);

        // Update input box too?
        if (input) input.value = key;
    };
}

export async function exportPresets() {
    let presets = presetsCache;
    console.log("Exporting presets, cache:", presets);

    // Fallback if empty cache
    if (!presets || Object.keys(presets).length === 0) {
        try {
            // Access chrome storage directly?
            // This assumes "chrome" is available globally (it is in extension)
            if (typeof chrome !== 'undefined' && chrome.storage) {
                const data = await chrome.storage.sync.get(null);
                presets = {};
                for (let key in data) {
                    if (key.startsWith("PRESETS.")) {
                        presets[key.slice(8)] = data[key];
                    }
                }
            }
        } catch (e) {
            console.error("Error fetching presets for export:", e);
        }
    }

    if (!presets || Object.keys(presets).length === 0) {
        return false; // No presets
    }

    const blob = new Blob([JSON.stringify(presets, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "juraganaudio_presets.json";
    document.body.appendChild(a);
    a.click();

    // Cleanup with delay to ensure download starts
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);

    return true;
}

export function importPresets(file, callback) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const presets = JSON.parse(e.target.result);
            if (callback) callback(presets);
        } catch (err) {
            console.error("Error parsing presets file:", err);
        }
    };
    reader.readAsText(file);
}
