export interface PdfExtraction {
  text: string;
  pageCount: number;
}

/**
 * Sends a PDF to the local Python PyMuPDF service and returns extracted text.
 * The Next.js runtime never imports PyMuPDF itself.
 */
export async function extractPdfText(data: ArrayBuffer, filename: string): Promise<PdfExtraction> {
  const baseUrl = (process.env.PDF_SERVICE_URL ?? "http://localhost:8000").replace(/\/$/, "");

  const form = new FormData();
  form.append("file", new Blob([data], { type: "application/pdf" }), filename);

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/extract`, {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(45_000),
    });
  } catch {
    throw new Error(
      "PDF service is not reachable. Start it with: cd pdf-service && uvicorn main:app --port 8000",
    );
  }

  let payload: { success?: boolean; text?: string; page_count?: number; error?: string };
  try {
    payload = await response.json();
  } catch {
    throw new Error("PDF service returned an invalid response.");
  }

  if (!payload.success || !payload.text) {
    throw new Error(payload.error ?? "Could not extract text from this PDF.");
  }

  return { text: payload.text, pageCount: payload.page_count ?? 0 };
}
