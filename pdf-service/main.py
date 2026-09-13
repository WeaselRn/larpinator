"""Larpinator PDF extraction service.

Stateless FastAPI service that extracts text from uploaded CV/resume PDFs
using PyMuPDF. The Next.js app calls POST /extract — the browser never talks
to this service directly.
"""

try:
    import pymupdf  # PyMuPDF >= 1.24.3 (preferred import name)
except ImportError:  # pragma: no cover - older PyMuPDF
    import fitz as pymupdf
from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse

app = FastAPI(title="Larpinator PDF Service", version="1.0.0")

MAX_BYTES = 10 * 1024 * 1024  # 10 MB
MIN_TEXT_CHARS = 80  # below this we treat the PDF as unreadable (likely scanned)


@app.get("/health")
def health() -> dict:
    return {"ok": True}


@app.post("/extract")
async def extract(file: UploadFile = File(...)) -> JSONResponse:
    data = await file.read()

    if not data:
        return JSONResponse({"success": False, "error": "Empty upload."})

    if len(data) > MAX_BYTES:
        return JSONResponse(
            {"success": False, "error": "File too large. Maximum size is 10MB."}
        )

    if not data.startswith(b"%PDF"):
        return JSONResponse({"success": False, "error": "That file is not a valid PDF."})

    try:
        doc = pymupdf.open(stream=data, filetype="pdf")
    except Exception:
        return JSONResponse(
            {"success": False, "error": "Could not read this PDF. It may be corrupted."}
        )

    try:
        if doc.needs_pass:
            return JSONResponse(
                {"success": False, "error": "This PDF is password-protected."}
            )

        page_count = len(doc)
        text = "\n".join(page.get_text() for page in doc)
    except Exception:
        return JSONResponse(
            {"success": False, "error": "Failed to extract text from this PDF."}
        )
    finally:
        doc.close()

    cleaned = text.strip()

    if len(cleaned) < MIN_TEXT_CHARS:
        return JSONResponse(
            {
                "success": False,
                "error": (
                    "Could not extract readable text from this PDF. "
                    "It may be a scanned image — try uploading a screenshot or pasting the text."
                ),
            }
        )

    return JSONResponse({"success": True, "text": cleaned, "page_count": page_count})
