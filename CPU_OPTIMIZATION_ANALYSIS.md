# 🔥 CPU Usage Optimization Analysis for bg.js

## Critical Issues (High CPU Impact)

### 1. **Sample Rate Check Creates New AudioContext Every Popup Open** ⚠️ CRITICAL
**Location**: Lines 170-186  
**Impact**: VERY HIGH CPU  
**Current Code**:
```javascript
X = function () {
    if (n) { return; }
    var e = re();  // Creates NEW AudioContext!
    var t = M.sampleRate && e.sampleRate && M.sampleRate != e.sampleRate;
    if (t) {
        console.log(e);
        console.log(M);
        n = true;
    }
    e.close();  // Creates and destroys every check
    if (t) {
        console.log("sampleRate changed... reloading AudioContext");
        ae();
    }
};
```

**Problem**: 
- Creating an `AudioContext` is **extremely expensive** (hundreds of ms)
- This function is called on every popup open (line 551)
- Creating/closing contexts causes GC pressure

**Solution**: 
- Remove entirely - sample rate rarely changes
- If needed, check only on `audiocontext.samplerate` event
- Use cached value instead

**Estimated CPU Savings**: 30-50%

---

### 2. **Excessive Filter Chain Reconnection** ⚠️ HIGH
**Location**: Lines 223-254 (function `o()`)  
**Impact**: HIGH CPU  
**Current Code**:
```javascript
function o() {
    var e = G;
    var t = false;
    for (var n = V.length - 1; n >= 0; n--) {
        if (V[n].gain.value != 0) {
            if (!a[n]) { t = true; }
            if (t) {
                D(n + " -> " + e.idx);
                V[n].disconnect();     // Disconnect/reconnect
                V[n].connect(e);       // every time!
            }
            // ...
        }
    }
    if (t) {
        D("preGain -> " + e.idx);
        B.disconnect();
        B.connect(e);
    }
}
```

**Problem**:
- Called on **every** filter modification (line 295)
- Disconnects and reconnects nodes even when not needed
- AudioNode graph manipulation is expensive

**Solution**:
- Only reconnect when chain actually changes
- Cache previous chain state
- Use bypass filters instead of disconnect

**Estimated CPU Savings**: 15-25%

---

### 3. **Frequent localStorage Operations** ⚠️ MEDIUM
**Location**: Multiple locations (lines 88-100, 277-281, 290-294, etc.)  
**Impact**: MEDIUM CPU + I/O blocking

**Problem**:
- Every filter change writes to localStorage (synchronous I/O)
- Multiple JSON.parse/stringify operations
- Blocks main thread

**Current Pattern**:
```javascript
localStorage[t] = JSON.stringify({
    f: f.frequency.value,
    g: f.gain.value,
    q: f.Q.value
});
```

**Solution**:
- Debounce writes (save after 500ms of no changes)
- Batch operations
- Use chrome.storage.local async API

**Estimated CPU Savings**: 10-15%

---

### 4. **Inefficient Message Handler** ⚠️ MEDIUM
**Location**: Lines 528-612  
**Impact**: MEDIUM CPU

**Problem**:
- 15+ `if` statements checked sequentially
- No early returns for common cases
- Calls expensive functions like `E()` unnecessarily

**Current Code**:
```javascript
$ = function (e, t, n) {
    if (e.type == "eqTab") { /* ... */ }
    if (e.type == "getCurrentTabStatus") { /* ... */ }
    if (e.type == "getWorkspaceStatus") { /* ... */ }
    // ... 12 more if statements
};
```

**Solution**:
- Use switch/case or object lookup
- Add early returns
- Avoid calling E() (full refresh) unless needed

**Estimated CPU Savings**: 5-10%

---

### 5. **FFT Array Conversion** ⚠️ MEDIUM
**Location**: Line 602  
**Impact**: MEDIUM CPU (when visualizer active)

**Problem**:
```javascript
Q.getFloatFrequencyData(i);
n({ type: "fft", fft: Array.from(i) });  // Copies entire array
```

**Solution**:
- Send Float32Array directly (structured clone)
- Or send only changed buckets
- Reduce fftSize if not needed (8192 -> 4096 or 2048)

**Estimated CPU Savings**: 5-10% (during visualization)

---

### 6. **Unnecessary setInterval** ⚠️ LOW
**Location**: Lines 626-636  
**Impact**: LOW CPU but wasteful

**Problem**:
- Runs every 1000ms **forever**
- Only needed when analyser is active

**Solution**:
- Clear interval when analyser disconnected
- Use setTimeout chain instead

**Estimated CPU Savings**: 2-5%

---

## Additional Issues

### 7. **Deprecated ScriptProcessor**
**Location**: Lines 191-201  
**Status**: Currently disabled (`t = null`) but code still exists

**Note**: If ever enabled, this would cause 25-40% CPU usage. Should be replaced with AudioWorklet.

---

### 8. **Multiple Full Refreshes**
**Function**: `E()` (lines 423-428)

Calls 4 functions every time:
```javascript
function E() {
    w();   // Get current tab status
    _();   // Send workspace status
    k();   // Send sample rate
    O();   // Send presets (async localStorage read!)
}
```

Called from: resetFilters, savePreset, deletePreset, importPresets, etc.

**Solution**: Only send what changed

---

### 9. **Redundant Object.keys() Calls**
**Location**: Lines 93, 95, 96, 451, 496, etc.

**Problem**:
```javascript
var a = Object.keys(r).length;
r[e] = t;
var o = Object.keys(r).length;
if (W && Object.keys(r) > W && o >= a) {  // 3rd call!
```

**Solution**: Cache the keys array

---

## Optimization Priority

| Priority | Issue | CPU Savings | Difficulty |
|----------|-------|-------------|------------|
| 🔴 P0 | Remove AudioContext creation in X() | 30-50% | Easy |
| 🔴 P1 | Optimize filter chain reconnection | 15-25% | Medium |
| 🟡 P2 | Debounce localStorage writes | 10-15% | Easy |
| 🟡 P3 | Optimize message handler | 5-10% | Easy |
| 🟡 P4 | Optimize FFT data transfer | 5-10% | Easy |
| 🟢 P5 | Fix setInterval cleanup | 2-5% | Easy |

**Total Potential Savings**: **60-90% CPU reduction**

---

## Recommended Implementation Order

1. **Quick Wins (1-2 hours)**:
   - Remove `X()` function entirely
   - Convert message handler to switch/case
   - Clean up setInterval

2. **Medium Effort (2-4 hours)**:
   - Implement localStorage debouncing
   - Optimize filter chain logic
   - Reduce FFT size/transfer

3. **Refactoring (4-8 hours)**:
   - Replace all localStorage with chrome.storage.local
   - Implement proper state management
   - Add performance monitoring

---

## Testing Strategy

Before/after measurements needed:
- Chrome Task Manager: CPU % while idle
- Chrome Task Manager: CPU % while playing audio
- Chrome Task Manager: CPU % while visualizer active
- Performance.now() timing for critical functions
