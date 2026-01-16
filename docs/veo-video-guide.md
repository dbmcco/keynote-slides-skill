# Veo Video Generation Guide

> Best practices for using Veo 3 to create embedded videos for keynote decks.

## Core Philosophy

**Generate short, focused videos that enhance specific slide moments.**

Videos work best for:
- **Motion demonstrations** — Showing how something works, flows, or transforms
- **Atmospheric backgrounds** — Subtle ambient motion for hero slides
- **Data visualizations** — Animated charts, flowing data, pulsing networks
- **Transitions** — Visual bridges between major sections
- **Product/concept reveals** — Building anticipation before key moments

**What NOT to use video for:**
- Static information that works better as an infographic
- Text-heavy explanations (use slides instead)
- Content requiring precise timing with audio narration
- Long-form content (keep videos under 8 seconds for slides)

---

## Video Embedding & Playback

### HTML Structure

```html
<!-- Basic video embed with controls -->
<video
  class="gen-media"
  controls
  muted
  loop
  playsinline
>
  <source src="resources/assets/workflow-animation.mp4" type="video/mp4" />
</video>

<!-- Auto-playing background video -->
<video
  class="gen-media background-video"
  autoplay
  muted
  loop
  playsinline
>
  <source src="resources/assets/ambient-bg.mp4" type="video/mp4" />
</video>

<!-- Video with generation attributes -->
<video
  data-gen="text-to-video"
  data-prompt="Your generation prompt here"
  class="gen-media"
  controls
  muted
>
  <source src="resources/assets/output.mp4" type="video/mp4" />
</video>
```

### Recommended Attributes

| Attribute | Purpose | When to Use |
|-----------|---------|-------------|
| `controls` | Show play/pause UI | Interactive content, user-paced viewing |
| `autoplay` | Start playing immediately | Background ambience, hero moments |
| `muted` | Silent playback | **Always** for autoplay; often for embeds |
| `loop` | Repeat continuously | Background videos, ambient motion |
| `playsinline` | Prevent fullscreen on mobile | **Always** for embedded videos |
| `poster="image.jpg"` | Show thumbnail before play | When video takes time to load |

### CSS for Video Elements

```css
/* Standard embedded video */
.media-frame video.gen-media {
  width: 100%;
  height: auto;
  border-radius: 12px;
  object-fit: cover;
}

/* Background video (fills container) */
.background-video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: -1;
  opacity: 0.6; /* Subtle, doesn't compete with content */
}

/* Video with overlay content */
.video-with-overlay {
  position: relative;
}
.video-with-overlay .content {
  position: relative;
  z-index: 1;
}
```

---

## Veo Prompting Best Practices

### Prompt Structure

```
[SHOT TYPE] of [SUBJECT] [ACTION/MOTION].
[CAMERA MOVEMENT].
[LIGHTING/ATMOSPHERE].
[STYLE/AESTHETIC].
```

### Shot Types (Film Grammar)

Veo understands standard cinematography terms:

| Term | Effect | Use For |
|------|--------|---------|
| **Wide shot** | Shows full scene/environment | Establishing context, systems overview |
| **Medium shot** | Subject fills ~50% of frame | Process demonstrations, balanced views |
| **Close-up** | Tight on subject/detail | Highlighting specific elements |
| **Extreme close-up** | Very tight detail | Technical details, emphasis moments |
| **Aerial/bird's eye** | Top-down perspective | Layouts, flow diagrams, systems |

### Camera Movements

| Movement | Effect | Use For |
|----------|--------|---------|
| **Dolly in/out** | Camera moves toward/away | Building focus, revealing scale |
| **Tracking shot** | Camera follows subject | Process flows, timelines |
| **Pan left/right** | Camera pivots horizontally | Revealing breadth, comparisons |
| **Tilt up/down** | Camera pivots vertically | Revealing hierarchy, scale |
| **Orbit** | Camera circles subject | 360° views, showcasing objects |
| **Crane up/down** | Vertical camera movement | Dramatic reveals, transitions |
| **Static** | No movement | Stability, focus on subject motion |
| **Rack focus** | Shift focus foreground↔background | Directing attention, transitions |

### Aspect Ratios

| Ratio | Dimensions | Use For |
|-------|------------|---------|
| **16:9** | 1920×1080 | Standard slides, wide content |
| **9:16** | 1080×1920 | Vertical/mobile content |
| **1:1** | 1080×1080 | Square embeds, social content |

---

## Video Types & Prompts

### Workflow/Process Animation

```
Tracking shot following a glowing data packet as it flows through
a stylized network of connected nodes. The packet enters from left,
passes through processing stations that light up as it passes, and
exits on the right transformed into organized information.

Camera: Smooth horizontal tracking, slight depth movement.
Style: Clean vector aesthetic, dark background with glowing elements,
cyan and amber accent colors. Modern tech visualization, not photorealistic.
```

### Ambient Background

```
Static wide shot of abstract geometric shapes slowly rotating and
pulsing with soft light. Minimal movement, hypnotic and calm.

Camera: Static, no movement.
Lighting: Soft gradients, gentle glow effects.
Style: Abstract, minimal, muted colors matching brand palette.
Duration: Loop-friendly with seamless start/end.
```

### Data Visualization Animation

```
Medium shot of a minimalist bar chart animating from zero to final
values. Bars grow upward sequentially from left to right with
satisfying easing. Small particle effects celebrate the highest bar.

Camera: Static, centered on chart.
Style: Flat vector, clean lines, brand colors (amber primary,
slate secondary). No 3D effects, keep it simple and readable.
```

### Concept Reveal

```
Extreme close-up slowly pulling back to reveal a complex network
visualization. Starting tight on a single glowing node, the camera
dollies out to show increasingly more connections until the full
ecosystem is visible.

Camera: Slow dolly out over 6 seconds.
Style: Glassmorphism aesthetic, translucent panels, soft depth of field.
Feeling: Discovery, revealing complexity, "aha" moment.
```

### Product/Feature Highlight

```
Orbit shot around a floating interface element showing key metrics.
The interface rotates slowly while data values animate and update.
Soft lighting from above, subtle reflection on surface below.

Camera: 180° orbit, smooth and steady.
Style: Clean UI mockup, isometric angle, minimal shadows.
Brand colors with white interface elements.
```

---

## Technical Specifications

### Generation Settings

```python
# Python CLI usage
from lib.media.veo import generate_video

result = generate_video(
    prompt="Your detailed prompt here",
    output_path="decks/my-deck/resources/assets/video.mp4",
    model="veo3",        # "veo3" (quality) or "veo3_fast" (speed)
    aspect_ratio="16:9"  # "16:9", "9:16", or "1:1"
)
```

### File Formats

- **Output format:** MP4 (H.264)
- **Resolution:** 720p default, can upscale to 1080p/4K
- **Duration:** 4-8 seconds per generation
- **Extended videos:** Chain generations using last frame as reference

### Image-to-Video

Use a generated infographic as the starting frame:

```python
from lib.media.veo import generate_video_from_image

result = generate_video_from_image(
    prompt="Animate this workflow diagram: data packets flow between nodes, "
           "connections pulse with activity, subtle particle effects.",
    image_path="decks/my-deck/resources/assets/workflow-static.png",
    output_path="decks/my-deck/resources/assets/workflow-animated.mp4",
    model="veo3",
    aspect_ratio="16:9"
)
```

---

## Claude Code CLI Evaluation

### Video Evaluation Criteria

**1. Motion Quality**
- Is the motion smooth and natural?
- Does it match the intended pace (energetic vs. calm)?
- Are there any jarring transitions or artifacts?

**2. Prompt Adherence**
- Does the video show what was requested?
- Are the specified camera movements present?
- Is the style/aesthetic correct?

**3. Loop Quality (if applicable)**
- Does the end connect smoothly to the start?
- Is there visible "seam" in looping playback?

**4. Embed Suitability**
- Will this work at the intended display size?
- Does it complement rather than compete with slide content?
- Is the duration appropriate for the context?

### Evaluation Workflow

```
1. Generate video with detailed prompt
2. Download and embed in test slide
3. Play in browser at actual display size
4. Assess against criteria above
5. Refine prompt (shot type, motion, style)
6. Regenerate if needed
```

### Common Issues & Fixes

**Video too busy/distracting:**
```
Add: "Minimal movement, subtle and calm.
Background element, should not compete for attention."
```

**Motion too fast:**
```
Add: "Slow, deliberate movement.
Camera moves at 50% normal speed. Meditative pace."
```

**Wrong aesthetic:**
```
Add: "STYLE: Clean flat vector, NOT photorealistic.
Think motion graphics, not live action.
Brand colors: [specific hex codes]."
```

**Doesn't loop well:**
```
Add: "Create seamless loop. End state should match
start state exactly. No dramatic changes in position."
```

---

## Audio Considerations

Veo 3 can generate native audio. For slide decks:

**Usually mute videos:**
- Most slide contexts work better silent
- Audio can conflict with presenter or music
- Use `muted` attribute on all `<video>` elements

**When audio might help:**
- Standalone presentations (no live presenter)
- Ambient soundscapes for mood
- Product demos with UI sounds

**Audio prompting:**
```
Add to prompt: "Ambient audio: soft electronic hum,
subtle data processing sounds. No music, no dialogue."

Or: "No audio. Silent video only."
```

---

## Checklist Before Generating

- [ ] Purpose defined (background, demonstration, reveal, etc.)
- [ ] Aspect ratio matches slide layout
- [ ] Duration appropriate (usually 4-6 seconds for embeds)
- [ ] Shot type specified (wide, medium, close-up, etc.)
- [ ] Camera movement described (or explicitly static)
- [ ] Style/aesthetic matches brand guidelines
- [ ] Color palette specified with hex codes
- [ ] Mood/feeling described
- [ ] Loop requirements stated if applicable
- [ ] Audio requirements stated (usually "muted" or "no audio")
