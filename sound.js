/* One reusable, gesture-unlocked Web Audio context, including iOS interruptions. */
const Sound = (() => {
  let context = null, master = null, enabled = true, unlocked = false, active = new Set(), revision = 0;
  try { enabled = localStorage.getItem('science3-sound-v1') !== 'off'; } catch (_) {}
  const tunes = {
    tap: [[520,0,.055,.14]],
    start: [[392,0,.10,.21],[523,.10,.10,.22],[659,.20,.18,.22]],
    success: [[523,0,.09,.22],[659,.10,.09,.22],[784,.20,.18,.23]],
    error: [[330,0,.22,.16],[660,0,.12,.05],[247,.22,.24,.13]],
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
      label.textContent = !enabled ? 'تقدرين تشغّلين الصوت بأي وقت' : !context ? 'الصوت يبدأ مع أول ضغطة' : context.state === 'running' ? 'صوت التشجيع جاهز' : 'اضغطي لتفعيل الصوت';
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
        context = new Audio(); unlocked = false;
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
    if (name === 'clap') { applause(delay); return; }
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
  function applause(delay = 0) {
    if (!enabled || !context || context.state !== 'running' || document.hidden) return;
    // Short, softened noise bursts: an original synthesized applause effect.
    const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * .085), context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i=0; i<data.length; i++) data[i]=(Math.random()*2-1)*Math.exp(-i/(context.sampleRate*.02));
    for (let i=0; i<10; i++) {
      const source=context.createBufferSource(), gain=context.createGain(), filter=context.createBiquadFilter();
      source.buffer=buffer;filter.type='bandpass';filter.frequency.value=1250+(i%3)*280;filter.Q.value=.7;
      gain.gain.value=.22;source.connect(filter);filter.connect(gain);gain.connect(master);active.add(source);
      source.onended=()=>{active.delete(source);source.disconnect();filter.disconnect();gain.disconnect()};
      const time=context.currentTime+.015+delay+i*.092+(i%2)*.017;source.start(time);source.stop(time+.1);
    }
  }
  async function play(name, stars = 0) {
    // Cancels pending sounds on fast navigation and keeps effects short.
    const ready = unlock(); stop(); const request = revision;
    if (await ready && request === revision) {
      notes(name);
      if (name === 'finish' && stars > 0) { applause(.72); notes('star', 1.9); }
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
