"use client";

import {
  ChangeEvent,
  DragEvent,
  PointerEvent,
  useEffect,
  useRef,
  useState
} from "react";

type Stage = "idle" | "uploading" | "removing" | "done" | "error";

const maxImageUploadBytes = 12 * 1024 * 1024;
const maxVideoUploadBytes = 80 * 1024 * 1024;
const busyStages: Stage[] = ["uploading", "removing"];
const acceptedMediaTypes = [
  "image/*",
  "video/mp4",
  "video/quicktime",
  "video/webm",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".heic",
  ".heif",
  ".avif",
  ".bmp",
  ".tif",
  ".tiff",
  ".mp4",
  ".mov",
  ".webm"
].join(",");
const acceptedImageExtensions = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp",
  "heic",
  "heif",
  "avif",
  "bmp",
  "tif",
  "tiff"
]);
const acceptedVideoExtensions = new Set(["mp4", "mov", "webm"]);

export default function Home() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const visualRef = useRef<HTMLDivElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isDraggingReveal, setIsDraggingReveal] = useState(false);
  const [reveal, setReveal] = useState(62);

  const isBusy = busyStages.includes(stage);
  const hasResult = Boolean(previewUrl && resultUrl);
  const isVideo = file ? isVideoFile(file) : false;

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
    };
  }, [previewUrl, resultUrl]);

  async function handleFile(nextFile: File) {
    if (!isSupportedMedia(nextFile)) {
      setError("Please choose an image or video file.");
      setStage("error");
      return;
    }
    const video = isVideoFile(nextFile);
    const maxUploadBytes = video ? maxVideoUploadBytes : maxImageUploadBytes;
    if (nextFile.size > maxUploadBytes) {
      setError(
        video ? "Video is larger than 80MB." : "Image is larger than 12MB."
      );
      setStage("error");
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);

    setFile(nextFile);
    setPreviewUrl(URL.createObjectURL(nextFile));
    setResultUrl(null);
    setError(null);
    setReveal(100);
    setStage("uploading");

    try {
      setStage("removing");
      const removeResponse = await fetch(
        video
          ? "/api/remove-video-background?format=webm"
          : "/api/remove-background",
        {
          method: "POST",
          headers: {
            "content-type": nextFile.type || "application/octet-stream"
          },
          body: await nextFile.arrayBuffer()
        }
      );

      if (!removeResponse.ok) {
        const payload = await safeJson(removeResponse);
        throw new Error(payload?.error ?? "Remove background failed.");
      }

      const output = await removeResponse.blob();
      setResultUrl(URL.createObjectURL(output));
      setReveal(54);

      setStage("done");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong.");
      setStage("error");
    }
  }

  function onInputChange(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0];
    if (nextFile) void handleFile(nextFile);
    event.target.value = "";
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDraggingFile(false);
    const nextFile = event.dataTransfer.files?.[0];
    if (nextFile) void handleFile(nextFile);
  }

  function updateReveal(clientX: number) {
    const rect = visualRef.current?.getBoundingClientRect();
    if (!rect) return;
    const next = ((clientX - rect.left) / rect.width) * 100;
    setReveal(Math.max(4, Math.min(96, next)));
  }

  function onRevealPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!hasResult) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDraggingReveal(true);
    updateReveal(event.clientX);
  }

  function onRevealPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!isDraggingReveal || !hasResult) return;
    updateReveal(event.clientX);
  }

  function onRevealPointerEnd(event: PointerEvent<HTMLDivElement>) {
    if (!hasResult) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    setIsDraggingReveal(false);
  }

  return (
    <main
      className={[
        "min-h-screen overflow-hidden",
        isDraggingFile ? "ring-2 ring-inset ring-gold" : ""
      ].join(" ")}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDraggingFile(true);
      }}
      onDragLeave={() => setIsDraggingFile(false)}
      onDrop={onDrop}
    >
      <section className="relative flex min-h-screen items-center justify-center p-4 sm:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(208,160,46,0.18),transparent_34rem)]" />
        <div className="relative flex w-full max-w-4xl flex-col">
          <div className="flex flex-1 items-center">
              <div
                ref={visualRef}
                className={[
                  "relative flex h-[62vh] max-h-[620px] min-h-[340px] w-full touch-none select-none items-center justify-center overflow-hidden rounded-[8px] bg-paper shadow-soft",
                  hasResult ? "cursor-ew-resize" : "cursor-pointer",
                  isBusy ? "processing-card" : ""
                ].join(" ")}
                onPointerDown={onRevealPointerDown}
                onPointerMove={onRevealPointerMove}
                onPointerUp={onRevealPointerEnd}
                onPointerCancel={onRevealPointerEnd}
                onClick={() => {
                  if (!previewUrl) inputRef.current?.click();
                }}
              >
                <div className="absolute inset-0 checkerboard opacity-80" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(255,255,255,0.8),transparent_28rem)]" />

                {resultUrl ? (
                  isVideo ? (
                    <video
                      src={resultUrl}
                      className="result-pop relative z-10 max-h-[78%] max-w-[78%] object-contain drop-shadow-[0_20px_30px_rgba(32,33,31,0.18)]"
                      autoPlay
                      loop
                      muted
                      playsInline
                      controls
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={resultUrl}
                      alt="Removed background result"
                      className="result-pop relative z-10 max-h-[78%] max-w-[78%] object-contain drop-shadow-[0_20px_30px_rgba(32,33,31,0.18)]"
                      draggable={false}
                    />
                  )
                ) : null}

                {previewUrl ? (
                  <div
                    className="absolute inset-0 z-20 flex items-center justify-center overflow-hidden bg-[#e6e6de]"
                    style={{
                      clipPath: hasResult
                        ? `inset(0 ${100 - reveal}% 0 0)`
                        : "inset(0 0 0 0)"
                    }}
                  >
                    {isVideo ? (
                      <video
                        src={previewUrl}
                        className="max-h-[78%] max-w-[78%] object-contain drop-shadow-[0_16px_24px_rgba(32,33,31,0.16)]"
                        autoPlay
                        loop
                        muted
                        playsInline
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={previewUrl}
                        alt="Selected source"
                        className="max-h-[78%] max-w-[78%] object-contain drop-shadow-[0_16px_24px_rgba(32,33,31,0.16)]"
                        draggable={false}
                      />
                    )}
                    {isBusy ? <div className="absolute inset-0 processing-sweep" /> : null}
                  </div>
                ) : (
                  <div className="relative z-10 text-center">
                    <button
                      type="button"
                      onClick={() => inputRef.current?.click()}
                      className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-ink text-2xl font-light text-white shadow-sm transition hover:bg-black"
                    >
                      +
                    </button>
                    <p className="mt-5 text-lg font-semibold text-ink">
                      Upload media
                    </p>
                  </div>
                )}

                {hasResult ? (
                  <div
                    className="absolute inset-y-0 z-30 w-px bg-white shadow-[0_0_8px_rgba(32,33,31,0.22)]"
                    style={{ left: `${reveal}%` }}
                  />
                ) : null}

                {isBusy ? (
                  <div className="absolute inset-x-6 bottom-6 z-40 overflow-hidden rounded-full bg-white/80 p-1 shadow-sm">
                    <div className="progress-runner h-2 rounded-full bg-ink" />
                  </div>
                ) : null}
              </div>
          </div>

          <footer className="flex min-h-16 items-center justify-center gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="rounded-full bg-ink px-4 py-2.5 text-xs font-bold text-white shadow-soft transition hover:bg-black disabled:cursor-not-allowed disabled:bg-ink/40"
                  disabled={isBusy}
                >
                  {file ? "Choose another" : "Upload"}
                </button>
                {resultUrl ? (
                  <a
                    href={resultUrl}
                    download={
                      isVideo ? "remove-bg-video.webm" : "remove-bg-image.png"
                    }
                    className="rounded-full bg-white px-4 py-2.5 text-xs font-bold text-ink shadow-sm transition hover:bg-white/80"
                  >
                    {isVideo ? "Download WebM" : "Download PNG"}
                  </a>
                ) : null}
              <input
                ref={inputRef}
                className="hidden"
                type="file"
                accept={acceptedMediaTypes}
                onChange={onInputChange}
              />
          </footer>
        </div>
        {error ? (
          <div className="fixed inset-x-5 bottom-24 z-50 mx-auto max-w-md rounded-[8px] bg-red-950 px-5 py-4 text-sm font-bold text-white shadow-soft">
            {error}
          </div>
        ) : null}
      </section>
    </main>
  );
}

async function safeJson(response: Response): Promise<{ error?: string } | null> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function isSupportedMedia(file: File) {
  if (file.type.startsWith("image/")) return true;
  if (file.type.startsWith("video/")) return true;
  const extension = file.name.split(".").pop()?.toLowerCase();
  return Boolean(
    extension &&
      (acceptedImageExtensions.has(extension) ||
        acceptedVideoExtensions.has(extension))
  );
}

function isVideoFile(file: File) {
  if (file.type.startsWith("video/")) return true;
  const extension = file.name.split(".").pop()?.toLowerCase();
  return Boolean(extension && acceptedVideoExtensions.has(extension));
}
