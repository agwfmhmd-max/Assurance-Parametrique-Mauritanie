/* ============================================================
   مؤثر صوتي ساخر قصير (بدون ملف خارجي)
   - يُولَّد عبر Web Audio API مباشرة في المتصفح.
   - يُشغَّل فقط كاستجابة لحدث نقرة من المستخدم (سياسات autoplay).
   - لا حاجة لملف mp3/ogg، ولا اتصال بالإنترنت.
   ============================================================ */

let sharedCtx = null;
function getCtx() {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!sharedCtx) sharedCtx = new AC();
  if (sharedCtx.state === "suspended") sharedCtx.resume();
  return sharedCtx;
}

/**
 * يشغّل مقطعًا صوتيًا قصيرًا يشبه "ضحكة/هَمهَمة فاشلة" مكوّنًا من ثلاث نبرات
 * متتالية متذبذبة الطبقة. يجب استدعاؤها داخل معالج حدث نقرة (onClick/onSubmit).
 */
export function playLaughSound(muted = false) {
  if (muted) return;
  try {
    const ctx = getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [
      { start: 0, freq: 420, dur: 0.16 },
      { start: 0.15, freq: 340, dur: 0.16 },
      { start: 0.3, freq: 260, dur: 0.22 },
    ];
    notes.forEach(({ start, freq, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now + start);
      osc.frequency.exponentialRampToValueAtTime(Math.max(60, freq * 0.55), now + start + dur);
      gain.gain.setValueAtTime(0.0001, now + start);
      gain.gain.exponentialRampToValueAtTime(0.18, now + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + start + dur + 0.02);
    });
  } catch {
    /* silencieux si Web Audio indisponible */
  }
}
