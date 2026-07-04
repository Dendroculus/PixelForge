import os
from typing import Tuple

def get_result_filename(job_id: str) -> str:
    """Standardizes the output filename format."""
    return f"{os.path.basename(job_id)}.png"

def get_upload_filename(job_id: str, ext: str) -> str:
    """Standardizes the raw upload filename format."""
    return f"{os.path.basename(job_id)}.{ext}"

def get_marker_filename(job_id: str) -> str:
    """Standardizes the failure marker filename format."""
    return f"failed/{os.path.basename(job_id)}.txt"

def parse_azure_credentials(connection_string: str) -> Tuple[str, str]:
    """Extracts account_name and account_key from an Azure Connection String."""
    parts = {k.lower(): v for k, v in (item.split("=", 1) for item in connection_string.split(";") if "=" in item)}
    return parts.get("accountname"), parts.get("accountkey")