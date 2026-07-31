# ARC One — Sound, Shaped.

A scroll-driven UX/UI case study website for **ARC One**, a fictional concept over-ear headphone by ARC Audio. Built as a fully coded, single-page experience in the spirit of Apple's product pages.

## Highlights

- **Scroll-scrubbed 360° product rotation** — 73-frame canvas image sequence driven by scroll progress, with informational callouts (acoustics, enclosure, controls, fit)
- **Exploded-view anatomy section** — the headphone breaks apart into its real components and reassembles as you scroll, using a second scrubbed frame sequence
- **ANC "silence" interlude** — the page dims to dark as sound waves flatten and a dB counter winds down, then returns to light
- **Battery ring, animated counters, hand-coded companion-app mockup, horizontal gallery, staggered spec table**

## Tech

- Plain HTML / CSS / vanilla JS — no framework, no build step
- [GSAP](https://gsap.com) + ScrollTrigger for all scroll animation (pinning, scrubbing, staggers, counters)
- [Lenis](https://lenis.darkroom.engineering) smooth scroll, synced to the GSAP ticker
- Canvas-based video-frame scrubbing (the "AirPods Max technique") for the rotation and exploded-view sections
- Product renders and motion generated with **Higgsfield AI** (image, video, upscale pipelines), frames extracted with ffmpeg
- Type: Cabinet Grotesk / Switzer / Fragment Mono

## Run locally

```bash
python3 -m http.server 8742
```

Then open http://localhost:8742 — a local server is needed because the frame sequences load over HTTP.
