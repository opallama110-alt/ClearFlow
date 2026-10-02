import argparse
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / ".tools" / "python"))

from faster_whisper import WhisperModel


def timestamp(seconds: float, vtt: bool = False) -> str:
    milliseconds = round(seconds * 1000)
    hours, remainder = divmod(milliseconds, 3_600_000)
    minutes, remainder = divmod(remainder, 60_000)
    secs, millis = divmod(remainder, 1_000)
    separator = "." if vtt else ":"
    if vtt:
        return f"{hours:02d}:{minutes:02d}:{secs:02d}{separator}{millis:03d}"
    return f"{hours * 60 + minutes:02d}:{secs:02d}"


parser = argparse.ArgumentParser(description="Transcribe an Indonesian ClearFlow mentoring recording.")
parser.add_argument(
    "source",
    nargs="?",
    default=str(ROOT / "analysis" / "bimbingan-1-enhanced.wav"),
    help="Path to the enhanced WAV/audio file.",
)
parser.add_argument(
    "--output-stem",
    default="bimbingan-1",
    help="Output filename stem inside the analysis directory.",
)
args = parser.parse_args()

source = Path(args.source).resolve()
output_dir = ROOT / "analysis"
output_dir.mkdir(parents=True, exist_ok=True)

model = WhisperModel(
    "small",
    device="cpu",
    compute_type="int8",
    download_root=str(ROOT / ".tools" / "models"),
)

segments, info = model.transcribe(
    str(source),
    language="id",
    beam_size=5,
    vad_filter=False,
    no_speech_threshold=0.9,
    condition_on_previous_text=True,
    initial_prompt=(
        "Rekaman bimbingan proyek ClearFlow.AI untuk lomba ImpactPreneur. "
        "Topik mencakup UMKM, pembukuan, transaksi, proposal, presentasi, demo aplikasi, dan Firebase."
    ),
)

rows = []
vtt_rows = ["WEBVTT", ""]
for index, segment in enumerate(segments, start=1):
    text = segment.text.strip()
    if not text:
        continue
    rows.append(f"[{timestamp(segment.start)}–{timestamp(segment.end)}] {text}")
    vtt_rows.extend([
        str(index),
        f"{timestamp(segment.start, True)} --> {timestamp(segment.end, True)}",
        text,
        "",
    ])
    if index % 10 == 0:
        print(f"Transcribed through {timestamp(segment.end)}", flush=True)

(output_dir / f"{args.output_stem}-transcript.txt").write_text("\n".join(rows) + "\n", encoding="utf-8")
(output_dir / f"{args.output_stem}-transcript.vtt").write_text("\n".join(vtt_rows), encoding="utf-8")
print(f"Language: {info.language} ({info.language_probability:.3f})", flush=True)
print(f"Segments: {len(rows)}", flush=True)
