// SCRIPT PARA EFECTOS DE SONIDO MUSICALES (ACCESIBILIDAD)

console.log("SFX Module Loaded");

window.SFX = {
    ctx: null,

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
        }
    },

    // Función auxiliar para tocar una nota pura
    playTone(freq, startTime, duration, vol = 0.3) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "sine";
        osc.frequency.value = freq;

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(vol, startTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration);
    },

    playClickSuccess() {
        this.init();
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const t = this.ctx.currentTime;
        
        this.playTone(493.88, t, 0.1, 0.4); 
        this.playTone(622.25, t + 0.08, 0.2, 0.4);
    },

    playTaskComplete() {
        this.init();
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const t = this.ctx.currentTime;
        const vol = 0.3;

        this.playTone(523.25, t, 0.3, vol);
        this.playTone(659.25, t + 0.15, 0.3, vol);
        this.playTone(783.99, t + 0.30, 0.3, vol);
        this.playTone(1046.50, t + 0.45, 0.8, vol);
    },

    playPop() {
        this.init();
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.linearRampToValueAtTime(400, t + 0.1);

        gain.gain.setValueAtTime(0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.1);
    }
};