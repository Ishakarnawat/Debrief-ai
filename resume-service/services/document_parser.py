import io
import re
from dataclasses import dataclass, field
from typing import Dict, Any, Optional, List, Tuple
import pdfplumber
import docx

from services.sanitizer import sanitize_text

# Regex patterns for contact information extraction
EMAIL_REGEX = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,7}\b")
PHONE_REGEX = re.compile(
    r"(?:\+?\d{1,3}[\s.-]*)?(?:\(?\d{2,5}\)?[\s.-]*)?\d{3,5}[\s.-]?\d{3,5}(?:[\s.-]?\d{1,4})?"
)
URL_REGEX = re.compile(r"https?://\S+|www\.\S+|linkedin\.com/\S+|github\.com/\S+", re.IGNORECASE)

# Stop phrases that are NOT candidate names
NAME_STOP_WORDS = {
    "resume", "curriculum vitae", "cv", "profile", "summary", "experience",
    "education", "skills", "contact", "projects", "certifications", "page",
    "personal information", "references", "portfolio"
}


@dataclass
class ParsedDocument:
    file_name: str
    file_type: str
    file_size_bytes: int
    page_count: int
    word_count: int
    char_count: int
    candidate_name: Optional[str]
    candidate_email: Optional[str]
    candidate_phone: Optional[str]
    extracted_text: str
    sanitization_report: Dict[str, Any] = field(default_factory=dict)


class DocumentParser:
    """
    Production-grade document parser supporting .pdf, .docx, and .txt resumes.
    Features:
    - Multi-column text flow ordering for PDF layouts.
    - Embedded table extraction.
    - Document sanitization and prompt injection defense.
    - Heuristic contact metadata extraction (name, email, phone).
    """

    @classmethod
    def parse_document(cls, file_bytes: bytes, file_name: str) -> ParsedDocument:
        """Main entrypoint: parses file by extension, sanitizes text, extracts metadata."""
        ext = cls._get_extension(file_name)
        file_size = len(file_bytes)

        if ext == ".pdf":
            raw_text, page_count = cls.parse_pdf(file_bytes)
        elif ext == ".docx":
            raw_text, page_count = cls.parse_docx(file_bytes)
        elif ext == ".txt":
            raw_text, page_count = cls.parse_txt(file_bytes)
        else:
            raise ValueError(f"Unsupported file format '{ext}'. Allowed: .pdf, .docx, .txt")

        # Sanitize text
        clean_text, sanitization_report = sanitize_text(raw_text)

        # Extract contact information
        email = cls.extract_email(clean_text)
        phone = cls.extract_phone(clean_text)
        name = cls.extract_name(clean_text, file_name)

        # Calculate statistics
        words = clean_text.split()
        word_count = len(words)
        char_count = len(clean_text)

        return ParsedDocument(
            file_name=file_name,
            file_type=ext.lstrip(".").lower(),
            file_size_bytes=file_size,
            page_count=page_count,
            word_count=word_count,
            char_count=char_count,
            candidate_name=name,
            candidate_email=email,
            candidate_phone=phone,
            extracted_text=clean_text,
            sanitization_report=sanitization_report
        )

    @classmethod
    def parse_pdf(cls, file_bytes: bytes) -> Tuple[str, int]:
        """
        Parses PDF bytes using pdfplumber with multi-column awareness.
        Preserves column reading order (left column first, then right column).
        """
        extracted_pages: List[str] = []
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            page_count = len(pdf.pages)
            for page in pdf.pages:
                page_text = cls._process_pdf_page(page)
                if page_text:
                    extracted_pages.append(page_text)

        full_text = "\n\n".join(extracted_pages)
        return full_text, page_count

    @classmethod
    def _process_pdf_page(cls, page: pdfplumber.page.Page) -> str:
        """
        Extracts text from a single PDF page with multi-column detection and table handling.
        """
        # 1. First extract embedded tables
        table_texts = []
        try:
            tables = page.extract_tables()
            if tables:
                for tbl in tables:
                    formatted_rows = []
                    for row in tbl:
                        cleaned_row = [str(c).replace("\n", " ").strip() if c else "" for c in row]
                        if any(cleaned_row):
                            formatted_rows.append(" | ".join(cleaned_row))
                    if formatted_rows:
                        table_texts.append("\n" + "\n".join(formatted_rows) + "\n")
        except Exception:
            table_texts = []

        # 2. Extract words with bounding box info for layout analysis
        words = page.extract_words(keep_blank_chars=False, x_tolerance=3, y_tolerance=3)
        if not words:
            # Fallback to simple extraction
            simple_text = page.extract_text(layout=True) or ""
            return simple_text + ("\n".join(table_texts) if table_texts else "")

        page_width = float(page.width)
        page_height = float(page.height)

        # 3. Detect 2-column layout: look for a gutter between 25% and 65% of width
        gutter = cls._detect_column_gutter(words, page_width)

        if gutter is not None:
            # Find the top boundary where two columns co-exist
            left_words_tops = [w["top"] for w in words if w["x1"] <= gutter]
            right_words_tops = [w["top"] for w in words if w["x0"] >= gutter]

            header_cutoff = page_height * 0.15
            if left_words_tops and right_words_tops:
                # The 2-column split begins where the left column begins below the top header
                left_start = min(left_words_tops)
                if left_start > 20:
                    header_cutoff = left_start - 2.0

            header_words = []
            col1_words = []
            col2_words = []

            for w in words:
                # If word is in top header area (above column split)
                if w["top"] < header_cutoff:
                    header_words.append(w)
                elif w["x1"] <= gutter:
                    col1_words.append(w)
                elif w["x0"] >= gutter:
                    col2_words.append(w)
                else:
                    # Spans across gutter below header: assign to majority side
                    mid = (w["x0"] + w["x1"]) / 2.0
                    if mid < gutter:
                        col1_words.append(w)
                    else:
                        col2_words.append(w)

            # Sort words reading order: header first, then left column, then right column
            header_text = cls._words_to_text(header_words)
            col1_text = cls._words_to_text(col1_words)
            col2_text = cls._words_to_text(col2_words)

            sections = [s for s in [header_text, col1_text, col2_text] if s.strip()]
            page_text = "\n\n".join(sections)
        else:
            # Single-column layout: layout-preserving extraction
            layout_text = page.extract_text(layout=False) or cls._words_to_text(words)
            page_text = layout_text

        if table_texts:
            page_text += "\n" + "\n".join(table_texts)

        return page_text

    @classmethod
    def _detect_column_gutter(cls, words: List[Dict[str, Any]], page_width: float) -> Optional[float]:
        """
        Detects a vertical gutter (whitespace corridor) separating 2 columns.
        Returns the x-coordinate of the gutter, or None if single-column.
        """
        if len(words) < 30:
            return None

        # Sample gutter candidates between 30% and 65% of page width
        start_x = page_width * 0.30
        end_x = page_width * 0.65
        step = 5.0

        best_gutter = None
        min_overlaps = float("inf")

        current_x = start_x
        while current_x <= end_x:
            # Check a narrow corridor of width 10 points
            gutter_left = current_x - 5.0
            gutter_right = current_x + 5.0

            # Count words whose bounding boxes intersect this gutter corridor
            overlaps = sum(1 for w in words if not (w["x1"] < gutter_left or w["x0"] > gutter_right))
            
            # Words strictly on the left and right of this gutter
            left_count = sum(1 for w in words if w["x1"] <= gutter_left)
            right_count = sum(1 for w in words if w["x0"] >= gutter_right)

            # A valid multi-column split requires substantial content on both sides
            if left_count >= 15 and right_count >= 15:
                if overlaps < min_overlaps:
                    min_overlaps = overlaps
                    best_gutter = current_x

            current_x += step

        # Gutter is valid if very few words intersect it relative to total words (< 5%)
        if best_gutter is not None and (min_overlaps / len(words)) < 0.05:
            return best_gutter

        return None

    @classmethod
    def _words_to_text(cls, words: List[Dict[str, Any]]) -> str:
        """Converts word bounding boxes to structured line text by clustering on vertical position."""
        if not words:
            return ""

        # Sort by vertical top, then horizontal x0
        sorted_words = sorted(words, key=lambda w: (w["top"], w["x0"]))
        lines: List[List[Dict[str, Any]]] = []
        
        current_line: List[Dict[str, Any]] = [sorted_words[0]]
        current_top = sorted_words[0]["top"]

        for w in sorted_words[1:]:
            # If word top is within 4 points, consider it the same line
            if abs(w["top"] - current_top) <= 4.0:
                current_line.append(w)
            else:
                lines.append(sorted(current_line, key=lambda x: x["x0"]))
                current_line = [w]
                current_top = w["top"]
        if current_line:
            lines.append(sorted(current_line, key=lambda x: x["x0"]))

        result_lines = []
        for line_words in lines:
            line_str = " ".join(w["text"] for w in line_words if w["text"].strip())
            if line_str.strip():
                result_lines.append(line_str)

        return "\n".join(result_lines)

    @classmethod
    def parse_docx(cls, file_bytes: bytes) -> Tuple[str, int]:
        """Parses DOCX document paragraphs and tables using python-docx."""
        doc = docx.Document(io.BytesIO(file_bytes))
        paragraphs = []

        # Extract paragraphs
        for p in doc.paragraphs:
            text = p.text.strip()
            if text:
                # Detect bullet points or headings
                if p.style and "List" in p.style.name:
                    paragraphs.append(f"- {text}")
                elif p.style and "Heading" in p.style.name:
                    paragraphs.append(f"\n## {text}\n")
                else:
                    paragraphs.append(text)

        # Extract tables
        for table in doc.tables:
            table_rows = []
            for row in table.rows:
                cells = [c.text.replace("\n", " ").strip() for c in row.cells]
                # Filter duplicate merged cells
                cleaned_cells = []
                for cell in cells:
                    if not cleaned_cells or cell != cleaned_cells[-1]:
                        cleaned_cells.append(cell)
                if any(cleaned_cells):
                    table_rows.append(" | ".join(cleaned_cells))
            if table_rows:
                paragraphs.append("\n" + "\n".join(table_rows) + "\n")

        full_text = "\n\n".join(paragraphs)
        # Word documents don't have explicit pages without layout rendering; approximate page count
        approx_pages = max(1, (len(full_text.split()) // 400) + 1)
        return full_text, approx_pages

    @classmethod
    def parse_txt(cls, file_bytes: bytes) -> Tuple[str, int]:
        """Parses plain text with multi-encoding fallback."""
        encodings = ["utf-8", "utf-16", "latin-1", "cp1252"]
        decoded_text = ""
        for enc in encodings:
            try:
                decoded_text = file_bytes.decode(enc)
                break
            except UnicodeDecodeError:
                continue

        if not decoded_text and file_bytes:
            decoded_text = file_bytes.decode("utf-8", errors="replace")

        approx_pages = max(1, (len(decoded_text.split()) // 400) + 1)
        return decoded_text, approx_pages

    @classmethod
    def extract_email(cls, text: str) -> Optional[str]:
        """Extracts primary candidate email address."""
        match = EMAIL_REGEX.search(text)
        return match.group(0) if match else None

    @classmethod
    def extract_phone(cls, text: str) -> Optional[str]:
        """Extracts primary candidate phone number (7+ digits with common separators)."""
        matches = PHONE_REGEX.finditer(text)
        for m in matches:
            val = m.group(0).strip()
            digits = re.sub(r"\D", "", val)
            # Valid phone numbers usually have 7 to 15 digits
            if 7 <= len(digits) <= 15:
                # Filter out zip codes or year strings like '2019-2023'
                if not re.match(r"^(19|20)\d{2}[\s.-]+(19|20)\d{2}$", val):
                    return val
        return None

    @classmethod
    def extract_name(cls, text: str, file_name: str) -> Optional[str]:
        """
        Extracts candidate name using top-lines heuristic:
        Inspects first 5 non-empty lines for a capitalized person name.
        """
        lines = [line.strip() for line in text.split("\n") if line.strip()]
        for line in lines[:5]:
            clean_line = URL_REGEX.sub("", line).strip()
            if not clean_line:
                continue
            lower = clean_line.lower()
            if any(stop in lower for stop in NAME_STOP_WORDS):
                continue
            if ":" in clean_line or ";" in clean_line or "=" in clean_line:
                continue
            if EMAIL_REGEX.search(clean_line) or PHONE_REGEX.search(clean_line):
                continue
            if len(clean_line) > 50 or len(clean_line) < 3:
                continue
            # Look for 2-4 words, starting with capital letters
            words = clean_line.split()
            if 2 <= len(words) <= 4:
                if all(w[0].isupper() or w in {"von", "van", "de", "da"} for w in words if w):
                    # Filter out common section titles that happen to be Title Case
                    if not any(token in lower for token in ["summary", "engineer", "developer", "curriculum", "resume", "programming", "software", "analyst"]):
                        return clean_line

        # Fallback: parse name from filename (e.g. "John_Doe_Resume.pdf")
        base = file_name.rsplit(".", 1)[0]
        base_clean = re.sub(r"(?i)[-_]?(resume|cv|curriculum|vitae)[-_]?", " ", base)
        base_clean = re.sub(r"[_\-\d]+", " ", base_clean).strip()
        words = base_clean.split()
        if 2 <= len(words) <= 4:
            return " ".join(w.capitalize() for w in words)

        return None

    @staticmethod
    def _get_extension(filename: str) -> str:
        if "." not in filename:
            return ""
        return "." + filename.rsplit(".", 1)[1].lower()
