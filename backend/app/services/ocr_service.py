"""
LifeLane AI — Automated Licence OCR & Consistency Extraction Service
=====================================================================
Ground Rule: OCR can ONLY extract data and flag inconsistencies.
It can NEVER prove a licence is genuine. Never use the words "verified",
"valid", or "authentic" for OCR results. Automated extraction and
consistency checks assist human reviewers, who make the final decision.
"""

import os
import re
import shutil
import asyncio
from datetime import datetime, timezone
from typing import Dict, Any, List, Tuple, Optional
from PIL import Image, ImageOps, ImageFilter

from backend.app.core.config import settings

# Indian State & Union Territory 2-letter RTO Codes
VALID_INDIAN_STATE_CODES = {
    "AN", "AP", "AR", "AS", "BR", "CH", "CG", "DN", "DD", "DL",
    "GA", "GJ", "HR", "HP", "JK", "JH", "KA", "KL", "LA", "LD",
    "MP", "MH", "MN", "ML", "MZ", "NL", "OD", "OR", "PY", "PB",
    "RJ", "SK", "TN", "TS", "TR", "UP", "UK", "UA", "WB"
}

def normalize_licence_number(raw: str) -> str:
    """Normalize licence string by stripping punctuation/spaces and converting to uppercase."""
    if not raw:
        return ""
    return re.sub(r"[\s\-\/\.\:]+", "", raw).upper()

class OCRService:
    def __init__(self):
        self._rapidocr_engine = None
        self._rapidocr_available = self._check_rapidocr()
        self._tesseract_available = self._check_tesseract()

    def _check_rapidocr(self) -> bool:
        """Check if rapidocr_onnxruntime is available."""
        try:
            from rapidocr_onnxruntime import RapidOCR
            self._rapidocr_engine = RapidOCR()
            return True
        except Exception:
            return False

    def _check_tesseract(self) -> bool:
        """Check if pytesseract and tesseract executable are available on host OS."""
        try:
            import pytesseract
            if settings.TESSERACT_CMD and os.path.exists(settings.TESSERACT_CMD):
                pytesseract.pytesseract.tesseract_cmd = settings.TESSERACT_CMD
                return True
            # Check default path on Windows
            default_win = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
            if os.path.exists(default_win):
                pytesseract.pytesseract.tesseract_cmd = default_win
                return True
            # Check PATH
            which_cmd = shutil.which("tesseract")
            if which_cmd:
                pytesseract.pytesseract.tesseract_cmd = which_cmd
                return True
            return False
        except Exception:
            return False

    def is_ocr_engine_ready(self) -> bool:
        return self._rapidocr_available or self._tesseract_available

    def run_consistency_checks(
        self,
        form_name: str,
        form_number: str,
        extracted: Dict[str, Any],
        confidence: float,
        is_duplicate: bool = False,
        image_metrics: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, str]]:
        """
        Run automated consistency checks on extracted licence data vs form input.
        Each consistency check produces a flag with severity (info, warning, critical).
        """
        flags = []
        norm_form_number = normalize_licence_number(form_number)
        norm_ocr_number = normalize_licence_number(extracted.get("licence_number", ""))

        # 1. DUPLICATE_LICENCE check
        if is_duplicate:
            flags.append({
                "code": "DUPLICATE_LICENCE",
                "severity": "critical",
                "message": "This licence number is already registered in the municipal database."
            })

        # 2. NUMBER_FORMAT check
        if not norm_form_number:
            flags.append({
                "code": "NUMBER_FORMAT_MISSING",
                "severity": "critical",
                "message": "Licence number was not provided."
            })
        else:
            # Indian Driving Licence standard format: SS-RR-YYYY-NNNNNNN or similar (approx 13-16 chars)
            # e.g. KA0120150001234, DL0420201234567, MH1220190005432
            dl_regex = r"^[A-Z]{2}[0-9]{2}[0-9A-Z]{1,4}[0-9]{4,8}$"
            if not re.match(dl_regex, norm_form_number):
                flags.append({
                    "code": "NUMBER_FORMAT",
                    "severity": "warning",
                    "message": f"Submitted licence number '{norm_form_number}' does not match standard Indian DL format (State+RTO+Year+Serial)."
                })

            # 3. STATE_CODE_UNKNOWN check
            state_code = norm_form_number[:2]
            if state_code not in VALID_INDIAN_STATE_CODES:
                flags.append({
                    "code": "STATE_CODE_UNKNOWN",
                    "severity": "critical",
                    "message": f"State/UT code '{state_code}' is not recognized among valid Indian transport jurisdictions."
                })

        # 4. NUMBER_MISMATCH (when OCR extracted a candidate number)
        if norm_ocr_number:
            if norm_ocr_number != norm_form_number:
                # Check partial match / edit distance
                flags.append({
                    "code": "NUMBER_MISMATCH",
                    "severity": "warning",
                    "message": f"Automated extraction read licence number '{norm_ocr_number}', which differs from submitted number '{norm_form_number}'."
                })

        # 5. NAME_MISMATCH
        ocr_name = extracted.get("name", "").strip()
        if ocr_name and form_name:
            try:
                from rapidfuzz import fuzz
                score = fuzz.token_sort_ratio(form_name.lower(), ocr_name.lower())
                if score < 65:
                    flags.append({
                        "code": "NAME_MISMATCH",
                        "severity": "warning",
                        "message": f"Low match ({score:.0f}%) between submitted name ('{form_name}') and extracted name ('{ocr_name}')."
                    })
            except Exception:
                pass

        # 6. EXPIRED / EXPIRY_NOT_FOUND
        expiry_date = extracted.get("expiry_date")
        if expiry_date:
            try:
                exp_dt = datetime.strptime(expiry_date, "%Y-%m-%d").date()
                today = datetime.now(timezone.utc).date()
                if exp_dt < today:
                    flags.append({
                        "code": "EXPIRED",
                        "severity": "critical",
                        "message": f"Licence validity date ({expiry_date}) is in the past."
                    })
            except Exception:
                flags.append({
                    "code": "EXPIRY_NOT_FOUND",
                    "severity": "info",
                    "message": "Validity date format could not be verified automatically."
                })
        else:
            if extracted.get("raw_text_present"):
                flags.append({
                    "code": "EXPIRY_NOT_FOUND",
                    "severity": "info",
                    "message": "Automated extraction could not read an explicit validity/expiry date. Human review required."
                })

        # 7. ISSUE_DATE_IMPLAUSIBLE
        issue_date = extracted.get("issue_date")
        if issue_date:
            try:
                iss_dt = datetime.strptime(issue_date, "%Y-%m-%d").date()
                today = datetime.now(timezone.utc).date()
                if iss_dt > today:
                    flags.append({
                        "code": "ISSUE_DATE_IMPLAUSIBLE",
                        "severity": "critical",
                        "message": f"Issue date ({issue_date}) is in the future."
                    })
                elif iss_dt.year < 1960:
                    flags.append({
                        "code": "ISSUE_DATE_IMPLAUSIBLE",
                        "severity": "warning",
                        "message": f"Issue date ({issue_date}) precedes plausible range (year < 1960)."
                    })
            except Exception:
                pass

        # 8. LOW_CONFIDENCE / LOW_IMAGE_QUALITY
        if image_metrics:
            if image_metrics.get("is_low_res", False):
                flags.append({
                    "code": "LOW_IMAGE_QUALITY",
                    "severity": "warning",
                    "message": f"Image resolution is low ({image_metrics.get('width')}x{image_metrics.get('height')}). Please verify visually."
                })
        if 0.0 < confidence < 45.0:
            flags.append({
                "code": "LOW_CONFIDENCE",
                "severity": "info",
                "message": f"Automated extraction confidence is low ({confidence:.1f}%). Document requires closer human scrutiny."
            })

        return flags

    def parse_licence_text(
        self,
        text: str,
        form_name: str = "",
        form_number: str = "",
        lines: Optional[List[str]] = None
    ) -> Tuple[Dict[str, Any], float]:
        """
        Extract candidate fields from raw OCR text using regex heuristics,
        supporting both single-column and multi-column Indian Driving Licences.
        """
        extracted = {
            "licence_number": None,
            "name": None,
            "date_of_birth": None,
            "issue_date": None,
            "expiry_date": None,
            "raw_text_present": bool(text.strip())
        }
        if not text and not lines:
            return extracted, 0.0

        if lines is None:
            raw_lines = text.split("\n")
        else:
            raw_lines = lines
        lines_clean = [line.strip() for line in raw_lines if line.strip()]

        # 1. Licence number pattern
        clean_form_num = normalize_licence_number(form_number)
        dl_pattern = re.compile(r"([A-Z]{2}[0-9]{2}[0-9A-Z]{1,4}[0-9]{4,8})")

        for l in lines_clean:
            clean_line = normalize_licence_number(l)
            m = dl_pattern.search(clean_line)
            if m:
                extracted["licence_number"] = m.group(1)
                break
            elif clean_form_num and clean_form_num in clean_line:
                extracted["licence_number"] = clean_form_num
                break

        # Fuzzy fallback for licence number
        if not extracted["licence_number"] and clean_form_num:
            try:
                from rapidfuzz import fuzz
                for l in lines_clean:
                    c_line = re.sub(r"[^A-Z0-9]", "", l.upper())
                    if fuzz.ratio(clean_form_num, c_line) >= 80:
                        extracted["licence_number"] = clean_form_num
                        break
            except Exception:
                pass

        # 2. Name extraction
        # Priority: Check against form_name if provided
        cleaned_form_name = form_name.strip()
        best_name_score = 0
        best_name = None

        if cleaned_form_name:
            try:
                from rapidfuzz import fuzz
                for l in lines_clean:
                    l_up = l.upper()
                    # Skip common header labels
                    if any(w in l_up for w in ["GOVERNMENT", "INDIA", "UNION", "TRANSPORT", "AUTHORITY", "DRIVING", "LICENCE", "ADDRESS", "POST", "HOBLI", "DISTRICT"]):
                        continue
                    score = fuzz.token_sort_ratio(cleaned_form_name.lower(), l.lower())
                    if score >= 70 and score > best_name_score:
                        best_name_score = score
                        best_name = l.strip()
            except Exception:
                pass

        if best_name:
            extracted["name"] = best_name
        else:
            # Fallback heuristic: search lines after "NAME" or "HOLDER"
            for idx, line in enumerate(lines_clean):
                line_up = line.upper()
                if any(k in line_up for k in ["NAME", "HOLDER", "DRIVING LICENCE"]):
                    colon_split = re.split(r"[:\-]", line)
                    if len(colon_split) > 1 and len(colon_split[1].strip()) > 3:
                        candidate = colon_split[1].strip()
                        if not re.search(r"\d", candidate):
                            extracted["name"] = candidate
                            break
                    elif idx + 1 < len(lines_clean) and len(lines_clean[idx + 1]) > 3:
                        candidate = lines_clean[idx + 1].strip()
                        if not re.search(r"\d", candidate) and not any(k in candidate.upper() for k in ["DL", "NO", "DOB", "DATE", "ADDRESS"]):
                            extracted["name"] = candidate
                            break

        # 3. Date parsing helpers
        date_regex = re.compile(r"(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{4})")
        iso_regex = re.compile(r"(\d{4})[\/\-\.](\d{2})[\/\-\.](\d{2})")
        found_dates = []

        for l in lines_clean:
            for m in date_regex.finditer(l):
                d, mth, yr = m.groups()
                found_dates.append((f"{yr}-{mth}-{d}", int(yr), l))
            for m in iso_regex.finditer(l):
                yr, mth, d = m.groups()
                found_dates.append((f"{yr}-{mth}-{d}", int(yr), l))

        for d_str, yr, l in found_dates:
            l_up = l.upper()
            if any(k in l_up for k in ["DOI", "ISSUE", "ISSUED", "D.O.I"]):
                if not extracted["issue_date"]:
                    extracted["issue_date"] = d_str
            elif any(k in l_up for k in ["VALID", "EXP", "UPTO", "(NT)", "TILL", "EXPIRY"]):
                if not extracted["expiry_date"]:
                    extracted["expiry_date"] = d_str
            elif any(k in l_up for k in ["DOB", "BIRTH", "D.O.B"]):
                if not extracted["date_of_birth"]:
                    extracted["date_of_birth"] = d_str

        # Smart fallback assignment for dates that didn't have immediate keyword on the exact line
        unassigned_dates = [d for d in found_dates if d[0] not in [extracted["issue_date"], extracted["expiry_date"], extracted["date_of_birth"]]]
        for d_str, yr, _ in unassigned_dates:
            if not extracted["expiry_date"] and yr >= 2026:
                extracted["expiry_date"] = d_str
            elif not extracted["date_of_birth"] and 1940 <= yr <= 2008:
                extracted["date_of_birth"] = d_str
            elif not extracted["issue_date"] and 2010 <= yr <= 2026:
                extracted["issue_date"] = d_str

        # Confidence calculation
        key_fields = ["licence_number", "name", "date_of_birth", "issue_date", "expiry_date"]
        fields_found = sum(1 for k in key_fields if extracted[k])
        if fields_found == 0:
            confidence = 0.0
        else:
            confidence = min(98.0, 45.0 + (fields_found - 1) * 13.25)
            if extracted["licence_number"] and clean_form_num and extracted["licence_number"] == clean_form_num:
                confidence = min(98.0, confidence + 2.0)

        return extracted, confidence

    def process_image_sync(
        self,
        image_path: str,
        form_name: str,
        form_number: str,
        is_duplicate: bool = False
    ) -> Dict[str, Any]:
        """
        Synchronous processing worker meant to run inside asyncio.to_thread.
        Strips EXIF, analyzes image, runs OCR (or graceful fallback), and produces consistency flags.
        """
        image_metrics = {"is_low_res": False, "width": 0, "height": 0}
        raw_text = ""
        extracted = {
            "licence_number": None,
            "name": None,
            "date_of_birth": None,
            "issue_date": None,
            "expiry_date": None,
            "raw_text_present": False
        }
        confidence = 0.0
        flags = []

        try:
            with Image.open(image_path) as img:
                # Remove EXIF by converting / copying data without metadata
                img = ImageOps.exif_transpose(img)
                w, h = img.size
                image_metrics["width"] = w
                image_metrics["height"] = h
                if w < 400 or h < 300:
                    image_metrics["is_low_res"] = True

                # Preprocessing for OCR
                gray = img.convert("L")
                # Light contrast enhancement / thresholding
                preprocessed = gray.filter(ImageFilter.SHARPEN)

                # Primary engine: RapidOCR (high accuracy, ONNX CPU, no external system daemon required)
                if self._rapidocr_available:
                    try:
                        if not self._rapidocr_engine:
                            from rapidocr_onnxruntime import RapidOCR
                            self._rapidocr_engine = RapidOCR()
                        ocr_results, _ = self._rapidocr_engine(image_path)
                        if ocr_results:
                            lines = [item[1] for item in ocr_results if len(item) > 1 and item[1].strip()]
                            raw_text = "\n".join(lines)
                            extracted, confidence = self.parse_licence_text(
                                raw_text,
                                form_name=form_name,
                                form_number=form_number,
                                lines=lines
                            )
                    except Exception as rapid_err:
                        raw_text = ""

                # Fallback engine: Tesseract if available and RapidOCR did not produce raw_text
                if not raw_text and self._tesseract_available:
                    try:
                        import pytesseract
                        raw_text = pytesseract.image_to_string(preprocessed, timeout=10)
                        extracted, confidence = self.parse_licence_text(
                            raw_text,
                            form_name=form_name,
                            form_number=form_number
                        )
                    except Exception as ocr_err:
                        raw_text = ""
                        flags.append({
                            "code": "OCR_EXTRACTION_ERROR",
                            "severity": "warning",
                            "message": f"OCR processing encountered an exception ({str(ocr_err)[:80]}). Manual review required."
                        })

                if not self._rapidocr_available and not self._tesseract_available:
                    flags.append({
                        "code": "OCR_UNAVAILABLE",
                        "severity": "info",
                        "message": "Automated OCR engine is unavailable or binary not installed. Automated extraction skipped; manual review required."
                    })
        except Exception as img_err:
            flags.append({
                "code": "IMAGE_DECODE_ERROR",
                "severity": "critical",
                "message": f"Could not decode image file ({str(img_err)[:80]})."
            })

        # Run consistency checks
        check_flags = self.run_consistency_checks(
            form_name=form_name,
            form_number=form_number,
            extracted=extracted,
            confidence=confidence,
            is_duplicate=is_duplicate,
            image_metrics=image_metrics
        )
        flags.extend(check_flags)

        return {
            "raw_text": raw_text,
            "extracted": extracted,
            "confidence": confidence,
            "flags": flags
        }

    async def process_licence_image_async(
        self,
        image_path: str,
        form_name: str,
        form_number: str,
        is_duplicate: bool = False
    ) -> Dict[str, Any]:
        """Non-blocking async wrapper running heavy OCR and image math in a separate thread."""
        return await asyncio.to_thread(
            self.process_image_sync,
            image_path=image_path,
            form_name=form_name,
            form_number=form_number,
            is_duplicate=is_duplicate
        )

ocr_service = OCRService()
