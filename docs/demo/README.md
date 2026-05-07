# Demo Assets

## Current demos

| File | Description |
|------|-------------|
| `chat-demo.mp4` | Text chat — AI response streaming, robot commands firing, radar environment scan |

## Adding more demos

GitHub renders committed `.mp4` files inline in README via `<video>` tags.
Record with any screen recorder and drop the file here, then update `README.md`:

```markdown
<video src="docs/demo/your-demo.mp4" autoplay muted loop playsinline width="100%"></video>
```

### Convert MP4 → GIF (optional, for animated previews in comments/issues)

```bash
ffmpeg -i recording.mp4 \
  -vf "fps=15,scale=800:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" \
  -loop 0 output.gif
```

### Tips

- Keep videos under 50 MB for fast GitHub loading
- Use a dark background — matches the app theme and reads well on both GitHub light/dark
- Script the demo: new chat → type message → watch avatar animate → robot command fires → radar scan appears
