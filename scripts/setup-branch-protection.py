#!/usr/bin/env python3
"""
Setup Branch Protection Rules for GitHub Repository

This script applies branch protection rules to the main branch
using the GitHub REST API.

Prerequisites:
- Python 3.8+
- requests library: pip install requests
- GitHub Personal Access Token with 'repo' scope

Usage:
    export GITHUB_TOKEN="your_personal_access_token"
    export GITHUB_OWNER="bdt652"
    export GITHUB_REPO="nextgentra-lms"
    python scripts/setup-branch-protection.py

Or with command line arguments:
    python scripts/setup-branch-protection.py --token YOUR_TOKEN --owner bdt652 --repo nextgentra-lms
"""

import argparse
import os
import sys
from typing import Dict, Any

import requests


def get_github_token() -> str:
    """Get GitHub token from environment or argument."""
    token = os.getenv("GITHUB_TOKEN") or os.getenv("GH_TOKEN")
    if not token:
        raise ValueError(
            "GitHub token not found. Set GITHUB_TOKEN environment variable "
            "or pass via --token argument."
        )
    return token


def get_repo_info(owner: str, repo: str) -> str:
    """Get repository full name."""
    return f"{owner}/{repo}"


def apply_branch_protection(
    owner: str,
    repo: str,
    branch: str = "main",
    dry_run: bool = False,
) -> Dict[str, Any]:
    """
    Apply branch protection rules to a branch.

    Args:
        owner: GitHub repository owner/organization
        repo: Repository name
        branch: Branch name to protect (default: main)
        dry_run: If True, only print the config without applying

    Returns:
        API response as dictionary
    """
    token = get_github_token()
    repo_full = get_repo_info(owner, repo)
    url = f"https://api.github.com/repos/{repo_full}/branches/{branch}/protection"

    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }

    # Branch protection configuration
    protection_config = {
        "required_pull_request_reviews": {
            "required_approving_review_count": 1,
            "dismiss_stale_reviews": True,
            "require_code_owner_reviews": True,
            "dismiss_bans": False,
            "restrictions": None,
            "dismissal_restrictions": None,
        },
        "enforce_admins": False,  # Admins must follow same rules
        "required_status_checks": {
            "strict": True,  # Branch must be up-to-date with base
            "contexts": [
                "Backend (Python FastAPI)",
                "Student Portal (Next.js)",
                "Teacher Portal (Next.js)",
            ],
        },
        "restrictions": None,  # Who can push (null = no additional restrictions beyond required reviews)
        "allow_force_pushes": False,
        "allow_deletions": False,
        "block_creations": False,
        "required_conversation_resolution": False,
        "lock_branch": False,
        "allow_fork_syncing": False,
    }

    if dry_run:
        print(f"\n🔍 DRY RUN - Would apply to {repo_full}/{branch}:")
        print("-" * 60)
        import json

        print(json.dumps(protection_config, indent=2))
        print("-" * 60)
        print("✅ Dry run complete. No changes made.")
        return {"dry_run": True}

    response = requests.put(url, headers=headers, json=protection_config)

    if response.status_code == 200:
        print(f"✅ Branch protection applied to {repo_full}/{branch}")
        return response.json()
    else:
        error_msg = f"Failed to apply branch protection: {response.status_code}"
        try:
            error_data = response.json()
            error_msg += f"\n{error_data.get('message', 'Unknown error')}"
        except:
            error_msg += f"\n{response.text}"
        raise RuntimeError(error_msg)


def get_branch_protection(owner: str, repo: str, branch: str = "main") -> Dict[str, Any]:
    """Get current branch protection rules."""
    token = get_github_token()
    repo_full = get_repo_info(owner, repo)
    url = f"https://api.github.com/repos/{repo_full}/branches/{branch}/protection"

    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github+json",
    }

    response = requests.get(url, headers=headers)

    if response.status_code == 200:
        return response.json()
    elif response.status_code == 404:
        print(f"⚠️  No branch protection found for {repo_full}/{branch}")
        return {}
    else:
        raise RuntimeError(f"Failed to get branch protection: {response.status_code}")


def delete_branch_protection(owner: str, repo: str, branch: str = "main") -> None:
    """Delete branch protection rules."""
    token = get_github_token()
    repo_full = get_repo_info(owner, repo)
    url = f"https://api.github.com/repos/{repo_full}/branches/{branch}/protection"

    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github+json",
    }

    response = requests.delete(url, headers=headers)

    if response.status_code == 204:
        print(f"✅ Branch protection removed from {repo_full}/{branch}")
    else:
        raise RuntimeError(f"Failed to delete branch protection: {response.status_code}")


def main():
    parser = argparse.ArgumentParser(
        description="Apply branch protection rules to GitHub repository"
    )
    parser.add_argument(
        "--owner", default=os.getenv("GITHUB_OWNER", "bdt652"), help="GitHub repository owner"
    )
    parser.add_argument(
        "--repo", default=os.getenv("GITHUB_REPO", "nextgentra-lms"), help="Repository name"
    )
    parser.add_argument(
        "--branch", default="main", help="Branch name to protect (default: main)"
    )
    parser.add_argument(
        "--token", help="GitHub Personal Access Token (overrides GITHUB_TOKEN env)"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be applied without making changes",
    )
    parser.add_argument(
        "--get", action="store_true", help="Get current branch protection rules"
    )
    parser.add_argument(
        "--delete", action="store_true", help="Remove branch protection rules"
    )

    args = parser.parse_args()

    # Set token if provided via argument
    if args.token:
        os.environ["GITHUB_TOKEN"] = args.token

    try:
        if args.get:
            protection = get_branch_protection(args.owner, args.repo, args.branch)
            if protection:
                import json

                print(f"\n🔍 Current protection for {args.owner}/{args.repo}/{args.branch}:")
                print(json.dumps(protection, indent=2))
        elif args.delete:
            confirm = input(f"⚠️  Are you sure you want to delete branch protection for {args.owner}/{args.repo}/{args.branch}? (yes/no): ")
            if confirm.lower() == "yes":
                delete_branch_protection(args.owner, args.repo, args.branch)
            else:
                print("Cancelled.")
        else:
            apply_branch_protection(args.owner, args.repo, args.branch, args.dry_run)

            if not args.dry_run:
                print("\n📝 Next steps:")
                print("1. Verify branch protection in GitHub UI: Settings → Branches")
                print("2. Ensure .github/CODEOWNERS file exists and is correctly configured")
                print("3. Test by trying to push directly to the protected branch")
                print("4. Open a test PR to verify required reviews and status checks")

    except ValueError as e:
        print(f"❌ Error: {e}", file=sys.stderr)
        print("\nTo get a GitHub token:", file=sys.stderr)
        print("1. Go to https://github.com/settings/tokens", file=sys.stderr)
        print("2. Click 'Generate new token' → 'Fine-grained tokens' or 'Classic'", file=sys.stderr)
        print("3. Select 'repo' scope", file=sys.stderr)
        print("4. Copy the token and set: export GITHUB_TOKEN=your_token", file=sys.stderr)
        sys.exit(1)
    except RuntimeError as e:
        print(f"❌ Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
