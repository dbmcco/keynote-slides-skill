<!-- ABOUTME: Gemini nano banana media notes for the keynote-slides deck generator. -->
<!-- ABOUTME: Summarizes image and video endpoints and payload shapes used in the template. -->
# Gemini Media Reference

## API key handling

- Use `GEMINI_API_KEY` or `NANO_BANANA_API_KEY`.
- The deck template stores keys in `localStorage` for local use only.

## Text-to-image (nano banana)

Model: `gemini-2.5-flash-image` (nano banana)

- Override via `NANO_BANANA_IMAGE_MODEL` (or `KEYNOTE_IMAGE_MODEL` in localStorage).

Endpoint:
`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent`

Payload (text only):
```json
{
  "contents": [
    {
      "role": "user",
      "parts": [{ "text": "Prompt text here" }]
    }
  ],
  "generationConfig": { "temperature": 0.2 }
}
```

## Image-to-image (nano banana)

Payload (image + prompt):
```json
{
  "contents": [
    {
      "role": "user",
      "parts": [
        {
          "inline_data": {
            "mime_type": "image/png",
            "data": "BASE64_IMAGE"
          }
        },
        { "text": "Restyle prompt here" }
      ]
    }
  ],
  "generationConfig": { "temperature": 0.2 }
}
```

## Text-to-video (Veo)

Model: `veo-3.1-generate-preview` (or `veo-3.0-generate-preview`)

Endpoint:
`https://generativelanguage.googleapis.com/v1beta/models/veo-3.1-generate-preview:predictLongRunning`

Payload (text only):
```json
{
  "instances": [{ "prompt": "Prompt text here" }],
  "parameters": {
    "aspectRatio": "16:9",
    "durationSeconds": 6,
    "resolution": "720p",
    "personGeneration": "allow_adult"
  }
}
```

Poll the returned `name` field via:
`GET https://generativelanguage.googleapis.com/v1beta/{operationName}`

Download the `video.uri` from the completed operation response.

## Image-to-video (Veo)

Payload (image + prompt):
```json
{
  "instances": [
    {
      "prompt": "Prompt text here",
      "image": {
        "bytesBase64Encoded": "BASE64_IMAGE",
        "mimeType": "image/png"
      }
    }
  ],
  "parameters": {
    "aspectRatio": "16:9",
    "durationSeconds": 6,
    "resolution": "720p"
  }
}
```

## Prompt tips

- Call out lighting, lens, and texture explicitly.
- Mention the brand palette and layout geometry.
- For diagrams, use "clean linework, soft gradient fill, high contrast labels".
