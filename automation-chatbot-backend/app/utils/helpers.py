"""
Utility helper functions for the application.

This module contains common utility functions used throughout the application
for data processing, validation, and other helper operations.
"""

import json
import uuid
import hashlib
import re
from typing import Any, Dict, List, Optional, Union
from datetime import datetime, timezone
from urllib.parse import urlparse
import logging

logger = logging.getLogger(__name__)


def generate_uuid() -> str:
    """
    Generate a new UUID string.
    
    Returns:
        str: UUID string
    """
    return str(uuid.uuid4())


def generate_short_id(length: int = 8) -> str:
    """
    Generate a short random ID.
    
    Args:
        length: Length of the ID to generate
        
    Returns:
        str: Short random ID
    """
    return str(uuid.uuid4()).replace('-', '')[:length]


def get_current_timestamp() -> str:
    """
    Get current timestamp in ISO format.
    
    Returns:
        str: Current timestamp in ISO format
    """
    return datetime.now(timezone.utc).isoformat()


def validate_email(email: str) -> bool:
    """
    Validate email address format.
    
    Args:
        email: Email address to validate
        
    Returns:
        bool: True if email is valid
    """
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def validate_url(url: str) -> bool:
    """
    Validate URL format.
    
    Args:
        url: URL to validate
        
    Returns:
        bool: True if URL is valid
    """
    try:
        result = urlparse(url)
        return all([result.scheme, result.netloc])
    except Exception:
        return False


def sanitize_string(text: str, max_length: Optional[int] = None) -> str:
    """
    Sanitize string input by removing dangerous characters.
    
    Args:
        text: Text to sanitize
        max_length: Maximum length to truncate to
        
    Returns:
        str: Sanitized text
    """
    if not isinstance(text, str):
        text = str(text)
    
    # Remove null bytes and control characters
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text)
    
    # Strip whitespace
    text = text.strip()
    
    # Truncate if needed
    if max_length and len(text) > max_length:
        text = text[:max_length]
    
    return text


def hash_string(text: str, algorithm: str = "sha256") -> str:
    """
    Hash a string using the specified algorithm.
    
    Args:
        text: Text to hash
        algorithm: Hash algorithm to use
        
    Returns:
        str: Hexadecimal hash string
    """
    if algorithm == "md5":
        return hashlib.md5(text.encode()).hexdigest()
    elif algorithm == "sha1":
        return hashlib.sha1(text.encode()).hexdigest()
    elif algorithm == "sha256":
        return hashlib.sha256(text.encode()).hexdigest()
    else:
        raise ValueError(f"Unsupported hash algorithm: {algorithm}")


def safe_json_loads(json_str: str, default: Any = None) -> Any:
    """
    Safely parse JSON string with fallback.
    
    Args:
        json_str: JSON string to parse
        default: Default value if parsing fails
        
    Returns:
        Any: Parsed JSON or default value
    """
    try:
        return json.loads(json_str)
    except (json.JSONDecodeError, TypeError) as e:
        logger.warning(f"Failed to parse JSON: {e}")
        return default


def safe_json_dumps(obj: Any, default: str = "{}") -> str:
    """
    Safely serialize object to JSON string.
    
    Args:
        obj: Object to serialize
        default: Default JSON string if serialization fails
        
    Returns:
        str: JSON string
    """
    try:
        return json.dumps(obj, default=str, ensure_ascii=False)
    except (TypeError, ValueError) as e:
        logger.warning(f"Failed to serialize to JSON: {e}")
        return default


def deep_merge_dicts(dict1: Dict[str, Any], dict2: Dict[str, Any]) -> Dict[str, Any]:
    """
    Deep merge two dictionaries.
    
    Args:
        dict1: First dictionary
        dict2: Second dictionary (takes precedence)
        
    Returns:
        Dict[str, Any]: Merged dictionary
    """
    result = dict1.copy()
    
    for key, value in dict2.items():
        if key in result and isinstance(result[key], dict) and isinstance(value, dict):
            result[key] = deep_merge_dicts(result[key], value)
        else:
            result[key] = value
    
    return result


def flatten_dict(d: Dict[str, Any], parent_key: str = '', sep: str = '.') -> Dict[str, Any]:
    """
    Flatten a nested dictionary.
    
    Args:
        d: Dictionary to flatten
        parent_key: Parent key prefix
        sep: Separator for nested keys
        
    Returns:
        Dict[str, Any]: Flattened dictionary
    """
    items = []
    for k, v in d.items():
        new_key = f"{parent_key}{sep}{k}" if parent_key else k
        if isinstance(v, dict):
            items.extend(flatten_dict(v, new_key, sep=sep).items())
        else:
            items.append((new_key, v))
    return dict(items)


def extract_domain_from_url(url: str) -> Optional[str]:
    """
    Extract domain from URL.
    
    Args:
        url: URL to extract domain from
        
    Returns:
        Optional[str]: Domain or None if invalid URL
    """
    try:
        parsed = urlparse(url)
        return parsed.netloc.lower()
    except Exception:
        return None


def truncate_text(text: str, max_length: int, suffix: str = "...") -> str:
    """
    Truncate text to maximum length with suffix.
    
    Args:
        text: Text to truncate
        max_length: Maximum length including suffix
        suffix: Suffix to add when truncating
        
    Returns:
        str: Truncated text
    """
    if len(text) <= max_length:
        return text
    
    return text[:max_length - len(suffix)] + suffix


def normalize_platform_name(platform: str) -> str:
    """
    Normalize platform name to standard format.
    
    Args:
        platform: Platform name to normalize
        
    Returns:
        str: Normalized platform name
    """
    platform = platform.lower().strip()
    
    # Handle common variations
    platform_mapping = {
        "integromat": "make",
        "make.com": "make",
        "zapier.com": "zapier",
        "n8n.io": "n8n"
    }
    
    return platform_mapping.get(platform, platform)


def extract_app_names_from_text(text: str) -> List[str]:
    """
    Extract potential app names from text using common patterns.
    
    Args:
        text: Text to analyze
        
    Returns:
        List[str]: List of potential app names
    """
    # Common app name patterns
    app_patterns = [
        r'\b(gmail|google\s+mail)\b',
        r'\b(slack)\b',
        r'\b(trello)\b',
        r'\b(asana)\b',
        r'\b(notion)\b',
        r'\b(airtable)\b',
        r'\b(hubspot)\b',
        r'\b(salesforce)\b',
        r'\b(mailchimp)\b',
        r'\b(shopify)\b',
        r'\b(stripe)\b',
        r'\b(paypal)\b',
        r'\b(discord)\b',
        r'\b(twitter|x\.com)\b',
        r'\b(linkedin)\b',
        r'\b(facebook)\b',
        r'\b(instagram)\b',
        r'\b(youtube)\b',
        r'\b(dropbox)\b',
        r'\b(google\s+drive)\b',
        r'\b(onedrive)\b',
        r'\b(zoom)\b',
        r'\b(microsoft\s+teams)\b',
        r'\b(calendly)\b',
        r'\b(typeform)\b',
        r'\b(jotform)\b',
        r'\b(google\s+forms)\b',
        r'\b(google\s+sheets)\b',
        r'\b(excel)\b',
        r'\b(jira)\b',
        r'\b(github)\b',
        r'\b(gitlab)\b',
        r'\b(bitbucket)\b'
    ]
    
    found_apps = []
    text_lower = text.lower()
    
    for pattern in app_patterns:
        matches = re.findall(pattern, text_lower, re.IGNORECASE)
        for match in matches:
            # Normalize the match
            normalized = re.sub(r'\s+', '-', match.strip())
            if normalized not in found_apps:
                found_apps.append(normalized)
    
    return found_apps


def extract_trigger_keywords(text: str) -> List[str]:
    """
    Extract potential trigger keywords from text.
    
    Args:
        text: Text to analyze
        
    Returns:
        List[str]: List of trigger keywords
    """
    trigger_patterns = [
        r'\b(when|whenever)\s+(\w+)',
        r'\b(new|updated|created|deleted)\s+(\w+)',
        r'\b(receives?|gets?)\s+(\w+)',
        r'\b(submits?|sends?)\s+(\w+)',
        r'\b(schedule[ds]?|daily|weekly|monthly)\b',
        r'\b(webhook|api\s+call)\b',
        r'\b(email|message|notification)\b',
        r'\b(form|survey|response)\b',
        r'\b(file|document|upload)\b',
        r'\b(task|project|issue)\b'
    ]
    
    triggers = []
    text_lower = text.lower()
    
    for pattern in trigger_patterns:
        matches = re.findall(pattern, text_lower, re.IGNORECASE)
        for match in matches:
            if isinstance(match, tuple):
                triggers.extend([m.strip() for m in match if m.strip()])
            else:
                triggers.append(match.strip())
    
    return list(set(triggers))


def extract_action_keywords(text: str) -> List[str]:
    """
    Extract potential action keywords from text.
    
    Args:
        text: Text to analyze
        
    Returns:
        List[str]: List of action keywords
    """
    action_patterns = [
        r'\b(send|create|update|delete|add|remove)\s+(\w+)',
        r'\b(notify|alert|inform)\b',
        r'\b(save|store|record)\s+(\w+)',
        r'\b(post|publish|share)\s+(\w+)',
        r'\b(assign|move|copy)\s+(\w+)',
        r'\b(format|transform|convert)\s+(\w+)',
        r'\b(calculate|process|analyze)\s+(\w+)'
    ]
    
    actions = []
    text_lower = text.lower()
    
    for pattern in action_patterns:
        matches = re.findall(pattern, text_lower, re.IGNORECASE)
        for match in matches:
            if isinstance(match, tuple):
                actions.extend([m.strip() for m in match if m.strip()])
            else:
                actions.append(match.strip())
    
    return list(set(actions))


def calculate_text_similarity(text1: str, text2: str) -> float:
    """
    Calculate simple text similarity using word overlap.
    
    Args:
        text1: First text
        text2: Second text
        
    Returns:
        float: Similarity score between 0 and 1
    """
    if not text1 or not text2:
        return 0.0
    
    # Simple word-based similarity
    words1 = set(text1.lower().split())
    words2 = set(text2.lower().split())
    
    if not words1 or not words2:
        return 0.0
    
    intersection = words1.intersection(words2)
    union = words1.union(words2)
    
    return len(intersection) / len(union) if union else 0.0


def format_duration(seconds: int) -> str:
    """
    Format duration in seconds to human-readable string.
    
    Args:
        seconds: Duration in seconds
        
    Returns:
        str: Formatted duration string
    """
    if seconds < 60:
        return f"{seconds}s"
    elif seconds < 3600:
        minutes = seconds // 60
        remaining_seconds = seconds % 60
        if remaining_seconds == 0:
            return f"{minutes}m"
        return f"{minutes}m {remaining_seconds}s"
    else:
        hours = seconds // 3600
        remaining_minutes = (seconds % 3600) // 60
        if remaining_minutes == 0:
            return f"{hours}h"
        return f"{hours}h {remaining_minutes}m"


def validate_json_schema(data: Dict[str, Any], required_fields: List[str]) -> Dict[str, Any]:
    """
    Validate that JSON data contains required fields.
    
    Args:
        data: JSON data to validate
        required_fields: List of required field names
        
    Returns:
        Dict[str, Any]: Validation result with errors
    """
    errors = []
    warnings = []
    
    for field in required_fields:
        if field not in data:
            errors.append(f"Missing required field: {field}")
        elif data[field] is None:
            warnings.append(f"Field '{field}' is null")
        elif isinstance(data[field], str) and not data[field].strip():
            warnings.append(f"Field '{field}' is empty")
    
    return {
        "is_valid": len(errors) == 0,
        "errors": errors,
        "warnings": warnings
    }
