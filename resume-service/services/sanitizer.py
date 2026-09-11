import re
import unicodedata
from typing import Dict, Any, Tuple, List

# Regex for invisible, zero-width, and formatting override Unicode characters
INVISIBLE_UNICODE_PATTERN = re.compile(
    r"[\u200B-\u200D"  # Zero-width space, ZWNJ, ZWJ
    r"\uFEFF"          # Zero-width no-break space / Byte order mark
    r"\u2060"          # Word joiner
    r"\u180E"          # Mongolian vowel separator
    r"\u00AD"          # Soft hyphen
    r"\u200E\u200F"    # Directional marks
    r"\u202A-\u202E"   # Bidi overrides
    r"\u2066-\u2069"   # Isolate controls
    r"]"
)

# Control characters except standard whitespace (\t, \n, \r)
CONTROL_CHAR_PATTERN = re.compile(r"[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]")

# Known adversarial prompt injection / jailbreak patterns targeting ATS LLMs
PROMPT_INJECTION_PATTERNS = [
    (r"(?i)\bignore\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|rules|commands)\b", "Instruction override attempt"),
    (r"(?i)\bdisregard\s+(all\s+)?(previous|prior|above)\s+(instructions|context|text)\b", "Disregard prior context attempt"),
    (r"(?i)\b(system\s*:\s*|system\s+prompt\s*(override|injection)?)", "System prompt impersonation"),
    (r"(?i)\b(give|award|assign)\s+(this\s+candidate|me|the\s+applicant)\s+(a\s+)?(score\s+of\s+)?(100%?|perfect\s+score|maximum\s+score)\b", "Arbitrary score manipulation attempt"),
    (r"(?i)\b(you\s+are\s+now|act\s+as)\s+(an?\s+)?(unrestricted|evil|admin|evaluator\s+who\s+must\s+give\s+100)\b", "Role hijacking / jailbreak attempt"),
    (r"(?i)\b(new\s+instruction|prompt\s*injection)\s*:\s*", "New instruction delimiter injection"),
    (r"(?i)\bdo\s+not\s+follow\s+the\s+original\s+rubric\b", "Rubric bypass attempt"),
    (r"(?i)\boutput\s+only\s+(the\s+following|json)\s+and\s+set\s+(overall_score|match)\s+to\s+100\b", "Output tampering attempt")
]

# Hidden HTML/XML tags and comment structures
HTML_COMMENT_PATTERN = re.compile(r"<!--.*?-->", re.DOTALL)
SCRIPT_STYLE_PATTERN = re.compile(r"<(script|style).*?>.*?</\1>", re.DOTALL | re.IGNORECASE)
HTML_TAG_PATTERN = re.compile(r"<[^>]+>")


def sanitize_text(raw_text: str) -> Tuple[str, Dict[str, Any]]:
    """
    Sanitizes raw extracted text from resumes:
    1. Normalizes unicode (NFKC) and non-breaking spaces.
    2. Strips zero-width and invisible characters.
    3. Strips unprintable control characters.
    4. Strips hidden HTML tags, script blocks, and comments.
    5. Detects and neutralizes prompt injection attempts.
    6. Collapses excessive whitespaces and excessive blank lines.

    Returns:
        Tuple of (clean_text, sanitization_report)
    """
    if not raw_text:
        return "", {
            "original_length": 0,
            "clean_length": 0,
            "invisible_chars_removed": 0,
            "flagged_injections": [],
            "is_suspicious": False
        }

    original_length = len(raw_text)

    # 1. Unicode Normalization
    text = unicodedata.normalize("NFKC", raw_text)
    # Replace non-breaking space with normal space
    text = text.replace("\u00A0", " ")

    # 2. Count and strip invisible characters
    invisible_matches = len(INVISIBLE_UNICODE_PATTERN.findall(text))
    text = INVISIBLE_UNICODE_PATTERN.sub("", text)

    # 3. Strip control characters
    text = CONTROL_CHAR_PATTERN.sub("", text)

    # 4. Remove HTML/Script/Comments
    text = SCRIPT_STYLE_PATTERN.sub(" ", text)
    text = HTML_COMMENT_PATTERN.sub(" ", text)
    text = HTML_TAG_PATTERN.sub(" ", text)

    # 5. Detect and Neutralize Prompt Injections
    flagged_injections: List[str] = []
    for pattern, description in PROMPT_INJECTION_PATTERNS:
        matches = list(re.finditer(pattern, text))
        if matches:
            flagged_injections.append(f"{description} (count: {len(matches)})")
            # Neutralize the match to prevent downstream LLM execution
            text = re.sub(pattern, "[REDACTED_SECURITY_PAYLOAD]", text)

    # 6. Normalize Whitespaces and Linebreaks
    # Convert carriage returns
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    # Replace tabs with two spaces
    text = text.replace("\t", "  ")
    # Collapse multiple inline spaces
    text = re.sub(r"[ ]{3,}", "  ", text)
    # Strip trailing whitespace on each line
    lines = [line.strip() for line in text.split("\n")]
    # Remove excessive blank lines (max 2 consecutive newlines)
    cleaned_lines = []
    blank_count = 0
    for line in lines:
        if not line:
            blank_count += 1
            if blank_count <= 1:
                cleaned_lines.append(line)
        else:
            blank_count = 0
            cleaned_lines.append(line)

    clean_text = "\n".join(cleaned_lines).strip()

    is_suspicious = bool(flagged_injections) or (invisible_matches > 10)

    report = {
        "original_length": original_length,
        "clean_length": len(clean_text),
        "invisible_chars_removed": invisible_matches,
        "flagged_injections": flagged_injections,
        "is_suspicious": is_suspicious
    }

    return clean_text, report
