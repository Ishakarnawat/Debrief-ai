import unittest
import io
from fastapi import UploadFile, HTTPException
from core.file_validator import validate_upload_file, PDF_MAGIC, DOCX_MAGIC


class TestFileValidator(unittest.TestCase):
    def test_valid_pdf_file(self):
        content = PDF_MAGIC + b" sample pdf content"
        upload = UploadFile(filename="resume.pdf", file=io.BytesIO(content))
        import asyncio
        result = asyncio.run(validate_upload_file(upload))
        self.assertEqual(result, content)

    def test_valid_docx_file(self):
        content = DOCX_MAGIC + b" sample docx zip archive"
        upload = UploadFile(filename="cv.docx", file=io.BytesIO(content))
        import asyncio
        result = asyncio.run(validate_upload_file(upload))
        self.assertEqual(result, content)

    def test_valid_txt_file(self):
        content = b"John Doe\nSoftware Engineer\njohn@example.com"
        upload = UploadFile(filename="profile.txt", file=io.BytesIO(content))
        import asyncio
        result = asyncio.run(validate_upload_file(upload))
        self.assertEqual(result, content)

    def test_reject_unsupported_extension(self):
        content = b"random binary"
        upload = UploadFile(filename="malicious.exe", file=io.BytesIO(content))
        import asyncio
        with self.assertRaises(HTTPException) as ctx:
            asyncio.run(validate_upload_file(upload))
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("Unsupported file format", ctx.exception.detail)

    def test_reject_spoofed_pdf(self):
        # A file named resume.pdf but lacking the %PDF- header
        content = b"MZ\x90\x00\x03\x00\x00\x00 this is a binary executable"
        upload = UploadFile(filename="resume.pdf", file=io.BytesIO(content))
        import asyncio
        with self.assertRaises(HTTPException) as ctx:
            asyncio.run(validate_upload_file(upload))
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("lacks a valid PDF header signature", ctx.exception.detail)

    def test_reject_spoofed_docx(self):
        content = b"Not a real docx archive"
        upload = UploadFile(filename="resume.docx", file=io.BytesIO(content))
        import asyncio
        with self.assertRaises(HTTPException) as ctx:
            asyncio.run(validate_upload_file(upload))
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("lacks a valid DOCX/ZIP header signature", ctx.exception.detail)

    def test_reject_spoofed_txt_with_null_bytes(self):
        content = b"Plain looking text\x00\x00\x00 binary payload"
        upload = UploadFile(filename="notes.txt", file=io.BytesIO(content))
        import asyncio
        with self.assertRaises(HTTPException) as ctx:
            asyncio.run(validate_upload_file(upload))
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("contains binary null bytes", ctx.exception.detail)

    def test_reject_empty_file(self):
        upload = UploadFile(filename="empty.pdf", file=io.BytesIO(b""))
        import asyncio
        with self.assertRaises(HTTPException) as ctx:
            asyncio.run(validate_upload_file(upload))
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("is empty", ctx.exception.detail)

    def test_reject_oversized_file(self):
        # Limit to 100 bytes for test
        content = PDF_MAGIC + b"a" * 200
        upload = UploadFile(filename="large.pdf", file=io.BytesIO(content))
        import asyncio
        with self.assertRaises(HTTPException) as ctx:
            asyncio.run(validate_upload_file(upload, max_size_bytes=100))
        self.assertEqual(ctx.exception.status_code, 413)
        self.assertIn("exceeds the maximum upload limit", ctx.exception.detail)


if __name__ == "__main__":
    unittest.main()
