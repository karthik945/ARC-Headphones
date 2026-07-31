/* ================================================================
   ARC One — scroll experience
   Lenis (smooth scroll) + GSAP ScrollTrigger (scrub/pin)
   ================================================================ */

gsap.registerPlugin(ScrollTrigger);

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------------------------------------------------------------
   Lenis ↔ ScrollTrigger sync
--------------------------------------------------------------- */
let lenis = null;
if (!reduceMotion) {
  lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* ---------------------------------------------------------------
   Loader → hero intro
--------------------------------------------------------------- */
const loader = document.getElementById('loader');
const loaderFill = document.getElementById('loaderFill');

window.addEventListener('load', () => {
  gsap.to(loaderFill, {
    width: '100%',
    duration: 0.7,
    ease: 'power2.inOut',
    onComplete: () => {
      loader.classList.add('is-done');
      introTimeline();
    },
  });
});

function introTimeline() {
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  tl.from('.hero__img', { y: 80, opacity: 0, scale: 0.94, duration: 1.2 })
    .from('.hero__word--l', { x: -60, opacity: 0, duration: 0.9 }, '-=0.7')
    .from('.hero__word--r', { x: 60, opacity: 0, duration: 0.9 }, '<')
    .from('.hero__sub', { y: 24, opacity: 0, duration: 0.7 }, '-=0.5')
    .from('.hero__scrollcue', { opacity: 0, duration: 0.6 }, '-=0.3')
    .to('#nav', { opacity: 1, y: 0, duration: 0.6 }, '-=0.4');
}

/* ---------------------------------------------------------------
   Nav solidity
--------------------------------------------------------------- */
ScrollTrigger.create({
  start: 'top -80',
  onUpdate: (self) => {
    document.getElementById('nav').classList.toggle('is-solid', self.scroll() > 80);
  },
});

/* Anchor links via Lenis */
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target, { offset: 0 });
    else target.scrollIntoView({ behavior: 'smooth' });
  });
});

/* ---------------------------------------------------------------
   Hero — words drift apart, product scales slightly as you leave
--------------------------------------------------------------- */
if (!reduceMotion) {
  gsap.timeline({
    scrollTrigger: {
      trigger: '#hero',
      start: 'top top',
      end: 'bottom top',
      scrub: true,
    },
  })
    .to('.hero__word--l', { xPercent: -36, ease: 'none' }, 0)
    .to('.hero__word--r', { xPercent: 36, ease: 'none' }, 0)
    .to('.hero__product', { y: -60, scale: 1.06, ease: 'none' }, 0)
    .to('.hero__sub, .hero__scrollcue', { opacity: 0, ease: 'none' }, 0);
}

/* ---------------------------------------------------------------
   Manifesto — lines rise from masks
--------------------------------------------------------------- */
gsap.utils.toArray('.mline').forEach((line, i) => {
  gsap.from(line.parentNode ? line : line, {});
  gsap.fromTo(
    line,
    { yPercent: 110 },
    {
      yPercent: 0,
      ease: 'power3.out',
      duration: 1,
      delay: i * 0.06,
      scrollTrigger: {
        trigger: line,
        start: 'top 88%',
        toggleActions: 'play none none reverse',
      },
    }
  );
});

/* ---------------------------------------------------------------
   03 · Rotation — scroll scrubs through orbit video frames
   (Higgsfield turntable video → jpg sequence → canvas)
--------------------------------------------------------------- */
const FRAME_COUNT = 73;
const framePath = (i) => `assets/images/orbit/frame_${String(i + 1).padStart(3, '0')}.jpg`;

function preloadFrames() {
  const images = [];
  let loaded = 0;
  return new Promise((resolve) => {
    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image();
      img.onload = img.onerror = () => { if (++loaded === FRAME_COUNT) resolve(images); };
      img.src = framePath(i);
      images.push(img);
    }
  });
}

function setupRotateSection(frames) {
  const canvas = document.getElementById('rotateCanvas');
  const ctx = canvas.getContext('2d');
  const callouts = gsap.utils.toArray('.rotate__callout');

  const draw = (index) => {
    const img = frames[gsap.utils.clamp(0, FRAME_COUNT - 1, index)];
    if (img && img.complete && img.naturalWidth) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }
  };
  draw(0);

  ScrollTrigger.create({
    trigger: '#rotate',
    start: 'top top',
    end: '+=250%',
    pin: '#rotatePin',
    scrub: true,
    onUpdate: (self) => {
      const p = self.progress;
      draw(Math.round(p * (FRAME_COUNT - 1)));

      // Callouts appear near their scrub position, fade after
      callouts.forEach((c) => {
        const at = parseFloat(c.dataset.progress);
        const d = Math.abs(p - at);
        const vis = gsap.utils.clamp(0, 1, 1 - d / 0.12);
        gsap.set(c, { opacity: vis, visibility: vis > 0.02 ? 'visible' : 'hidden', y: (1 - vis) * 14 });
      });
    },
  });
}

/* ---------------------------------------------------------------
   04 · Anatomy — explode ➝ hold ➝ reattach
   Scrubs an exploded-view video frame sequence: forward = apart,
   mirrored on the back half = reassemble.
--------------------------------------------------------------- */
const ANATOMY_FRAME_COUNT = 73;
const anatomyFramePath = (i) => `assets/images/anatomy/frame_${String(i + 1).padStart(3, '0')}.jpg`;

function preloadAnatomyFrames() {
  const images = [];
  let loaded = 0;
  return new Promise((resolve) => {
    for (let i = 0; i < ANATOMY_FRAME_COUNT; i++) {
      const img = new Image();
      img.onload = img.onerror = () => { if (++loaded === ANATOMY_FRAME_COUNT) resolve(images); };
      img.src = anatomyFramePath(i);
      images.push(img);
    }
  });
}

function setupAnatomy(frames) {
  const canvas = document.getElementById('anatomyCanvas');
  const ctx = canvas.getContext('2d');
  const labels = gsap.utils.toArray('.anatomy__label');
  const HOLD_START = 0.42, HOLD_END = 0.58; // parts hang suspended here

  // Source video plays exploded → assembled, so explosion amount t
  // maps to frames in reverse: t=0 shows the final (assembled) frame.
  // ZOOM crops source padding when needed; 1 = draw full frame.
  const ZOOM = 1;
  const draw = (index) => {
    const img = frames[gsap.utils.clamp(0, ANATOMY_FRAME_COUNT - 1, index)];
    if (img && img.complete && img.naturalWidth) {
      const sw = img.naturalWidth / ZOOM, sh = img.naturalHeight / ZOOM;
      const sx = (img.naturalWidth - sw) / 2, sy = (img.naturalHeight - sh) / 2;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    }
  };
  const drawAtExplosion = (t) => draw(Math.round((1 - t) * (ANATOMY_FRAME_COUNT - 1)));
  drawAtExplosion(0);

  ScrollTrigger.create({
    trigger: '#anatomy',
    start: 'top top',
    end: '+=300%',
    pin: '#anatomyPin',
    scrub: true,
    onUpdate: (self) => {
      const p = self.progress;

      // title clears out before parts reach it
      gsap.set('.anatomy__title', { opacity: 1 - gsap.utils.clamp(0, 1, p / 0.22) });

      // explode (0→HOLD_START), hold, reassemble (HOLD_END→1, mirrored)
      let t;
      if (p < HOLD_START) t = p / HOLD_START;
      else if (p < HOLD_END) t = 1;
      else t = 1 - (p - HOLD_END) / (1 - HOLD_END);
      drawAtExplosion(t);

      // labels visible around the hold
      const labelVis = gsap.utils.clamp(0, 1, 1 - Math.abs(p - 0.5) / 0.16);
      labels.forEach((l, i) => {
        const v = gsap.utils.clamp(0, 1, labelVis * 1.4 - i * 0.06);
        gsap.set(l, { opacity: v, visibility: v > 0.02 ? 'visible' : 'hidden', x: 0 });
      });
    },
  });
}

/* ---------------------------------------------------------------
   05 · Silence — light ➝ dark ➝ light + waves flatten + dB drops
--------------------------------------------------------------- */
function wavePath(amp, freq, phase) {
  // Build a sine-ish path across the 1200x400 viewBox
  let d = 'M 0 200';
  for (let x = 0; x <= 1200; x += 12) {
    const y = 200 + Math.sin((x / 1200) * Math.PI * 2 * freq + phase) * amp;
    d += ` L ${x} ${y.toFixed(1)}`;
  }
  return d;
}

function setupSilence() {
  const waves = [
    { el: document.querySelector('.swave--1'), amp: 90, freq: 3.2, phase: 0 },
    { el: document.querySelector('.swave--2'), amp: 65, freq: 4.1, phase: 1.4 },
    { el: document.querySelector('.swave--3'), amp: 45, freq: 5.3, phase: 2.8 },
    { el: document.querySelector('.swave--4'), amp: 28, freq: 6.7, phase: 4.1 },
  ];
  const dbEl = document.getElementById('silenceDb');
  const section = document.getElementById('silence');

  waves.forEach((w) => w.el.setAttribute('d', wavePath(w.amp, w.freq, w.phase)));

  ScrollTrigger.create({
    trigger: '#silence',
    start: 'top top',
    end: '+=250%',
    pin: '#silencePin',
    scrub: true,
    onUpdate: (self) => {
      const p = self.progress;

      // Waves flatten as p → .65, tremble slightly after
      const flat = gsap.utils.clamp(0, 1, p / 0.65);
      waves.forEach((w, i) => {
        const amp = w.amp * (1 - flat) + (i === 0 ? 2 : 0.5);
        w.el.setAttribute('d', wavePath(amp, w.freq, w.phase + p * 2));
      });

      // dB: 74 → 8
      dbEl.textContent = Math.round(74 - flat * 66);

      // Background: bone → near-black → bone
      // dark zone between .25 and .8
      let darkness = 0;
      if (p > 0.15 && p < 0.85) {
        const t = (p - 0.15) / 0.7; // 0..1 inside dark zone
        darkness = Math.sin(t * Math.PI); // in-out
      }
      const bg = gsap.utils.interpolate('#f4f1ec', '#141416', darkness);
      document.body.style.backgroundColor = bg;
      section.classList.toggle('is-dark', darkness > 0.45);
      document.getElementById('nav').classList.toggle('is-dark', darkness > 0.45);
    },
    onLeave: () => { document.body.style.backgroundColor = ''; },
    onLeaveBack: () => { document.body.style.backgroundColor = ''; },
  });
}

/* ---------------------------------------------------------------
   06 · Power — ring draws, numbers count
--------------------------------------------------------------- */
function setupPower() {
  const ring = document.getElementById('powerRing');
  const circumference = 653.45;

  ScrollTrigger.create({
    trigger: '#power',
    start: 'top 65%',
    onEnter: () => {
      gsap.to(ring, {
        strokeDashoffset: circumference * (1 - 40 / 48), // 40h of a 48h dial
        duration: 1.6,
        ease: 'power2.out',
      });
      gsap.fromTo('#powerCount', { textContent: 0 }, {
        textContent: 40,
        duration: 1.6,
        ease: 'power2.out',
        snap: { textContent: 1 },
      });
      gsap.utils.toArray('.pstat__num').forEach((el) => {
        gsap.fromTo(el, { textContent: 0 }, {
          textContent: parseInt(el.dataset.count, 10),
          duration: 1.4,
          ease: 'power2.out',
          snap: { textContent: 1 },
        });
      });
    },
    once: true,
  });
}

/* ---------------------------------------------------------------
   07 · ARC App — phone rises, UI staggers in, EQ bars live
--------------------------------------------------------------- */
function setupAppSection() {
  const bars = gsap.utils.toArray('#eqBars span');

  ScrollTrigger.create({
    trigger: '#app',
    start: 'top 65%',
    once: true,
    onEnter: () => {
      gsap.from('#appPhone', { y: 90, opacity: 0, duration: 1, ease: 'power3.out' });
      gsap.from('.appsec__copy > *', { y: 34, opacity: 0, stagger: 0.09, duration: 0.8, ease: 'power2.out' });
      gsap.fromTo('#phoneBatteryFill', { width: '0%' }, { width: '82%', duration: 1.4, ease: 'power2.out', delay: 0.5 });
      gsap.fromTo('#phoneBatteryNum', { textContent: 0 }, { textContent: 38, snap: { textContent: 1 }, duration: 1.4, delay: 0.5 });

      // EQ curve idles forever — each bar breathes around its own profile height
      const profile = [28, 42, 58, 74, 66, 52, 60, 78, 88, 70, 48, 34];
      bars.forEach((bar, i) => {
        gsap.set(bar, { height: `${profile[i]}%` });
        gsap.to(bar, {
          height: `${Math.max(12, profile[i] - 14 - Math.random() * 14)}%`,
          duration: 0.5 + Math.random() * 0.7,
          yoyo: true,
          repeat: -1,
          ease: 'sine.inOut',
          delay: Math.random() * 0.5,
        });
      });
    },
  });
}

/* ---------------------------------------------------------------
   08 · Gallery — vertical scroll drives horizontal strip
--------------------------------------------------------------- */
function setupGallery() {
  const track = document.getElementById('galleryTrack');
  const getDistance = () => track.scrollWidth - window.innerWidth;

  gsap.to(track, {
    x: () => -getDistance(),
    ease: 'none',
    scrollTrigger: {
      trigger: '#gallery',
      start: 'top top',
      end: () => `+=${getDistance()}`,
      pin: '#galleryPin',
      scrub: true,
      invalidateOnRefresh: true,
    },
  });
}

/* ---------------------------------------------------------------
   08 · Specs — rows stagger in
--------------------------------------------------------------- */
gsap.utils.toArray('.spec').forEach((row, i) => {
  gsap.from(row, {
    y: 36,
    opacity: 0,
    duration: 0.7,
    ease: 'power2.out',
    scrollTrigger: {
      trigger: row,
      start: 'top 88%',
      toggleActions: 'play none none reverse',
    },
  });
});

/* ---------------------------------------------------------------
   09 · CTA
--------------------------------------------------------------- */
gsap.from('.cta__inner > *', {
  y: 40,
  opacity: 0,
  stagger: 0.12,
  duration: 0.9,
  ease: 'power3.out',
  scrollTrigger: {
    trigger: '.cta',
    start: 'top 70%',
  },
});

/* ---------------------------------------------------------------
   Boot
--------------------------------------------------------------- */
(async function boot() {
  if (!reduceMotion) {
    const [frames, anatomyFrames] = await Promise.all([preloadFrames(), preloadAnatomyFrames()]);
    setupRotateSection(frames);
    setupAnatomy(anatomyFrames);
    setupSilence();
  } else {
    // static first frame for reduced motion
    const canvas = document.getElementById('rotateCanvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    img.src = framePath(0);
  }
  setupPower();
  setupAppSection();
  if (!reduceMotion) setupGallery();

  ScrollTrigger.refresh();
})();
