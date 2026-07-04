# FUNCTIONS — parse_pdf(), parse_docx(), parse_txt()
import fitz  # type: ignore[import-untyped]  # PyMuPDF
import docx


def parse_pdf(file_path: str) -> str:
    """Extracts text content from a PDF file using PyMuPDF."""
    text_content: list[str] = []
    with fitz.open(file_path) as doc:
        for page in doc:
            text: str = page.get_text()  # type: ignore[assignment]
            if text:
                text_content.append(text)
    return "\n".join(text_content)


def parse_docx(file_path: str) -> str:
    """Extracts text content from a DOCX file using python-docx."""
    doc = docx.Document(file_path)
    return "\n".join([paragraph.text for paragraph in doc.paragraphs if paragraph.text])


def parse_txt(file_path: str) -> str:
    """Extracts text content from a plain text file."""
    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        return f.read()