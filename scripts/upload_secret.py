#!/usr/bin/env python3
"""B1 — Upload a GSC service-account JSON key to Google Secret Manager.

Usage:
    python scripts/upload_secret.py <path-to-key.json>

Requires:
    - GCP_PROJECT_ID env var (or set in .env)
    - GSC_SECRET_NAME env var (default: gsc-service-account-key)
    - gcloud CLI authenticated with Secret Manager Admin role
"""

import os
import sys

from dotenv import load_dotenv
from google.cloud import secretmanager

load_dotenv()

PROJECT_ID = os.getenv("GCP_PROJECT_ID")
SECRET_ID = os.getenv("GSC_SECRET_NAME", "gsc-service-account-key")


def upload_secret(key_path: str) -> None:
    if not PROJECT_ID:
        sys.exit("Error: GCP_PROJECT_ID is not set. Add it to .env or export it.")

    if not os.path.isfile(key_path):
        sys.exit(f"Error: File not found — {key_path}")

    with open(key_path, "rb") as f:
        payload = f.read()

    client = secretmanager.SecretManagerServiceClient()
    parent = f"projects/{PROJECT_ID}"
    secret_path = f"{parent}/secrets/{SECRET_ID}"

    # Create the secret if it doesn't exist yet.
    try:
        client.get_secret(request={"name": secret_path})
        print(f"Secret '{SECRET_ID}' already exists — adding new version.")
    except Exception:
        client.create_secret(
            request={
                "parent": parent,
                "secret_id": SECRET_ID,
                "secret": {"replication": {"automatic": {}}},
            }
        )
        print(f"Created secret '{SECRET_ID}'.")

    # Add a new version with the key file contents.
    version = client.add_secret_version(
        request={"parent": secret_path, "payload": {"data": payload}}
    )
    print(f"Added secret version: {version.name}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(f"Usage: {sys.argv[0]} <path-to-service-account-key.json>")
    upload_secret(sys.argv[1])
