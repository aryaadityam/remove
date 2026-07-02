# Server

FastAPI server designed for Google Colab GPU.

Run from Colab:

```python
!pip uninstall -y -q onnxruntime onnxruntime-gpu
!pip install -q -r requirements-colab.txt

from getpass import getpass

NGROK_TOKEN = getpass("NGROK_TOKEN: ")
NGROK_DOMAIN = "your-ngrok-domain.ngrok-free.dev"

!python app.py \
  --model birefnet-general \
  --tunnel ngrok \
  --ngrok-token {NGROK_TOKEN} \
  --ngrok-domain {NGROK_DOMAIN}
```

Images use rembg/BiRefNet. Videos use Robust Video Matting TorchScript.
