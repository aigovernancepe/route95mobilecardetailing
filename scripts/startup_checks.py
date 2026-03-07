#!/usr/bin/env python3
"""Startup checks for GSC service-account credentials.

Usage:
    python scripts/startup_checks.py

Exit codes:
    0 — all checks passed
    1 — one or more checks failed
"""

import json
import os
import sys

from dotenv import load_dotenv

load_dotenv()


def check_gsc_credentials() -> dict:
    """Verify that GSC credentials are configured and can authenticate.

    Returns a dict with:
        status: "ok" | "error"
        message: human-readable explanation
    """
    # 1. Check GSC_PROPERTY is set.
    gsc_property = os.getenv("GSC_PROPERTY")
    if not gsc_property:
        return {
            "status": "error",
            "message": "GSC_PROPERTY env var is not set. "
            "Set it to your verified property URL "
            '(e.g. "https://example.com/" or "sc-domain:example.com").',
        }

    # 2. Locate credentials.
    creds_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if not creds_path or not os.path.isfile(creds_path):
        return {
            "status": "error",
            "message": f"Credentials file not found at "
            f"GOOGLE_APPLICATION_CREDENTIALS={creds_path!r}. "
            "Download the service-account JSON key and set the path.",
        }

    # 3. Validate the JSON structure.
    try:
        with open(creds_path) as f:
            key_data = json.load(f)
    except (json.JSONDecodeError, OSError) as exc:
        return {
            "status": "error",
            "message": f"Failed to read credentials file: {exc}",
        }

    required_fields = {"type", "project_id", "client_email", "private_key"}
    missing = required_fields - key_data.keys()
    if missing:
        return {
            "status": "error",
            "message": f"Credentials JSON is missing required fields: {missing}",
        }

    if key_data.get("type") != "service_account":
        return {
            "status": "error",
            "message": f"Expected type 'service_account', got '{key_data.get('type')}'.",
        }

    # 4. Try authenticating and listing the GSC property.
    try:
        from google.oauth2 import service_account
        from googleapiclient.discovery import build

        credentials = service_account.Credentials.from_service_account_file(
            creds_path,
            scopes=["https://www.googleapis.com/auth/webmasters.readonly"],
        )
        service = build("searchconsole", "v1", credentials=credentials)
        sites = service.sites().list().execute()

        verified_sites = [
            s["siteUrl"]
            for s in sites.get("siteEntry", [])
            if s.get("permissionLevel") in ("siteOwner", "siteFullUser")
        ]

        if gsc_property not in verified_sites:
            return {
                "status": "error",
                "message": f"Property '{gsc_property}' not found in accessible sites. "
                f"Accessible sites: {verified_sites}. "
                "Ensure the service account email is added as Owner/Full user "
                "in GSC → Settings → Users.",
            }

        return {
            "status": "ok",
            "message": f"GSC credentials valid. "
            f"Service account '{key_data['client_email']}' "
            f"has access to '{gsc_property}'.",
        }

    except ImportError:
        return {
            "status": "error",
            "message": "Missing dependencies. Run: pip install -r requirements.txt",
        }
    except Exception as exc:
        return {
            "status": "error",
            "message": f"GSC API call failed: {exc}",
        }


def main() -> int:
    print("=" * 60)
    print("Startup Checks")
    print("=" * 60)

    result = check_gsc_credentials()
    status_icon = "PASS" if result["status"] == "ok" else "FAIL"
    print(f"\n[{status_icon}] GSC Credentials")
    print(f"  status:  {result['status']}")
    print(f"  message: {result['message']}")

    if result["status"] != "ok":
        print("\n--- Manual Setup Steps ---")
        print("1. Go to Google Cloud Console → IAM → Service Accounts")
        print("2. Create or identify the service account for Search Console")
        print("3. Download the JSON key file")
        print("4. In Google Search Console → Settings → Users →")
        print("   add the service account email as Owner or Full user")
        print("5. Upload the JSON to Secret Manager:")
        print("     python scripts/upload_secret.py <path-to-key.json>")
        print("6. Set environment variables (see .env.example):")
        print("     GSC_PROPERTY=https://your-site.com/")
        print("     GOOGLE_APPLICATION_CREDENTIALS=./gsc-service-account.json")
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
