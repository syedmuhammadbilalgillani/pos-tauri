let audioCtx: AudioContext | null = null;

export async function playNewOrderTone() {
  try {
    const Ctx = (window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext) as typeof AudioContext | undefined;
    if (!Ctx) return;

    audioCtx = audioCtx ?? new Ctx();

    // Some browsers require a user gesture to start audio.
    if (audioCtx.state === "suspended") {
      await audioCtx.resume();
    }

    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();

    o.type = "square"
    o.frequency.value = 1000; // A5
    g.gain.value = 1; // quiet

    o.connect(g);
    g.connect(audioCtx.destination);

    o.start();
    setTimeout(() => {
      o.stop();
      o.disconnect();
      g.disconnect();
    }, 180);
  } catch {
    // ignore audio failures
  }
}
