/* One reusable, gesture-unlocked Web Audio context, including iOS interruptions. */
const Sound = (() => {
  let context = null, master = null, enabled = true, unlocked = false, active = new Set(), revision = 0;
  try { enabled = localStorage.getItem('science3-sound-v1') !== 'off'; } catch (_) {}
  const tunes = {
    tap: [[520,0,.055,.14]],
    start: [[392,0,.10,.21],[523,.10,.10,.22],[659,.20,.18,.22]],
    success: [[523,0,.09,.22],[659,.10,.09,.22],[784,.20,.18,.23]],
    error: [[260,0,.15,.18],[196,.16,.20,.16]],
    star: [[1047,0,.08,.15],[1319,.09,.08,.15],[1568,.18,.22,.14]],
    finish: [[523,0,.12,.20],[659,.13,.12,.20],[784,.26,.12,.20],[1047,.40,.28,.21]]
  };
  function status() {
    const button = document.getElementById('sound-toggle');
    if (button) {
      button.textContent = enabled ? '🔊 الصوت مفعّل' : '🔇 الصوت مكتوم';
      button.setAttribute('aria-pressed', String(enabled));
      button.setAttribute('aria-label', enabled ? 'كتم المؤثرات الصوتية' : 'تشغيل المؤثرات الصوتية');
    }
    const label = document.getElementById('sound-state');
    if (label) {
      label.textContent = !enabled ? 'تقدرين تشغّلين الصوت بأي وقت' : !context ? 'الصوت يبدأ مع أول ضغطة' : context.state === 'running' ? 'المؤثرات جاهزة · جرّبي الصوت' : 'اضغطي لتفعيل الصوت';
      label.dataset.state = !enabled ? 'muted' : context ? context.state : 'waiting';
    }
  }
  function stop() {
    revision++;
    for (const source of active) { try { source.stop(); } catch (_) {} }
    active.clear();
  }
  function unlock() {
    if (!enabled) return Promise.resolve(false);
    try {
      if (!context || context.state === 'closed') {
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (!Audio) { status(); return Promise.resolve(false); }
        context = new Audio();
        master = context.createGain(); master.gain.value = .34; master.connect(context.destination);
        context.onstatechange = status;
      }
      // resume is called synchronously inside the gesture, before any await.
      const resumed = context.state !== 'running' ? context.resume() : Promise.resolve();
      if (!unlocked) {
        const source = context.createBufferSource();
        source.buffer = context.createBuffer(1, 1, context.sampleRate);
        source.connect(master); source.onended = () => source.disconnect(); source.start(0);
        unlocked = true;
      }
      return Promise.resolve(resumed).then(() => { status(); return context.state === 'running'; }).catch(() => { status(); return false; });
    } catch (_) { status(); return Promise.resolve(false); }
  }
  function notes(name, delay = 0) {
    if (!enabled || !context || context.state !== 'running' || document.hidden) return;
    const base = context.currentTime + .012 + delay;
    for (const [frequency, offset, duration, volume] of tunes[name] || tunes.tap) {
      const oscillator = context.createOscillator(), gain = context.createGain();
      oscillator.type = name === 'error' ? 'triangle' : 'sine'; oscillator.frequency.value = frequency;
      const time = base + offset;
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(volume, time + .012);
      gain.gain.exponentialRampToValueAtTime(.0001, time + duration);
      oscillator.connect(gain); gain.connect(master); active.add(oscillator);
      oscillator.onended = () => { active.delete(oscillator); oscillator.disconnect(); gain.disconnect(); };
      oscillator.start(time); oscillator.stop(time + duration + .025);
    }
  }
  async function play(name, stars = 0) {
    // Cancels pending sounds on fast navigation and keeps effects short.
    const ready = unlock(); stop(); const request = revision;
    if (await ready && request === revision) {
      notes(name);
      if (name === 'finish' && stars > 0) notes('star', .85);
    }
  }
  function toggle() {
    enabled = !enabled; stop();
    try { localStorage.setItem('science3-sound-v1', enabled ? 'on' : 'off'); } catch (_) {}
    status(); if (enabled) void play('star');
  }
  for (const event of ['pointerdown', 'touchend', 'click', 'keydown']) {
    document.addEventListener(event, e => {
      if (event !== 'keydown' || ['Enter', ' '].includes(e.key)) void unlock();
    }, { capture: true, passive: true });
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) { stop(); if(context && context.state === 'running') context.suspend().catch(()=>{}); } status(); });
  return { play, toggle, stop, status };
})();
