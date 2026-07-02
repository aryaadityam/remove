# Remove BG

Open-source background-removal demo with a Colab GPU server and a Next.js
frontend.

## Structure

```text
server/   FastAPI server for Colab + ngrok
nextjs/   Next.js frontend for local use or Vercel
```

## What It Does

- Images use `rembg` with `birefnet-general` by default.
- Videos use Robust Video Matting TorchScript by default.
- Image output is transparent PNG.
- Video output is transparent WebM by default.
- No API key is stored in this repo.

## Colab Server

Open a new Google Colab notebook, then set:

```text
Runtime > Change runtime type > T4 GPU
```

Run these cells:

```python
!git clone https://github.com/aryaadityam/remove.git
%cd remove/server
```

```python
!pip uninstall -y -q onnxruntime onnxruntime-gpu
!pip install -q -r requirements-colab.txt
```

Start the server with ngrok:

```python
from getpass import getpass

NGROK_TOKEN = getpass("NGROK_TOKEN: ")
NGROK_DOMAIN = "your-ngrok-domain.ngrok-free.dev"
MODEL = "birefnet-general"

!python app.py \
  --model {MODEL} \
  --tunnel ngrok \
  --ngrok-token {NGROK_TOKEN} \
  --ngrok-domain {NGROK_DOMAIN}
```

Expected log:

```text
ngrok public URL: https://your-ngrok-domain.ngrok-free.dev
Uvicorn running on http://0.0.0.0:8787
```

## Server Defaults

```bash
MAX_PROCESS_SIDE=2048
MAX_UPLOAD_BYTES=12582912
MAX_VIDEO_UPLOAD_BYTES=83886080
MAX_VIDEO_SECONDS=25
MAX_VIDEO_FPS=30
MAX_VIDEO_SIDE=720
RVM_MODEL=mobilenetv3
RVM_DOWNSAMPLE_RATIO=auto
```

Override defaults when starting the server:

```python
!MAX_VIDEO_SECONDS=10 MAX_VIDEO_FPS=24 MAX_VIDEO_SIDE=720 python app.py \
  --model {MODEL} \
  --tunnel ngrok \
  --ngrok-token {NGROK_TOKEN} \
  --ngrok-domain {NGROK_DOMAIN}
```

## API

```text
GET  /health
POST /remove-background
POST /remove-video-background?format=webm
POST /remove-video-background?format=mp4&background=white
```

Use WebM for real transparency. MP4 output is flattened onto a solid
background because normal MP4 does not preserve alpha.

## Next.js Frontend

Run locally:

```bash
cd nextjs
npm install
CAPWORDS_BG_SERVER_URL=https://your-ngrok-domain.ngrok-free.dev npm run dev
```

For Vercel, set this environment variable:

```text
CAPWORDS_BG_SERVER_URL=https://your-ngrok-domain.ngrok-free.dev
```

Then deploy `nextjs/` as the Vercel project root.

## Notes

- First video request downloads the RVM TorchScript model.
- First image request downloads the selected rembg model.
- Colab sessions stop when the runtime disconnects.
- Keep your ngrok token private.
