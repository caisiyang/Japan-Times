# Security Maintenance & Key Revocation Guide

## 1. Revoking Keys
If you accidentally commit a key, you must revoke it immediately.

### GitHub Tokens
1. Go to **Settings** -> **Developer settings** -> **Personal access tokens**.
2. Find the compromised token and click **Revoke**.

### Cloudflare API Tokens
1. Go to Cloudflare Dashboard -> **My Profile** -> **API Tokens**.
2. Click the three dots next to the token -> **Roll** (to generate new) or **Delete**.

### Other Services
- **Google Cloud**: IAM & Admin -> Service Accounts -> Keys -> Delete.
- **AWS**: IAM -> Users -> Security credentials -> Access keys -> Deactivate/Delete.

## 2. Cleaning Git History (BFG Repo Cleaner)
If a secret is in your git history, simply deleting the file in a new commit is **NOT** enough. You must rewrite history.

**WARNING**: This is a destructive operation. Backup your repo first.

1.  **Download BFG**: [https://rtyley.github.io/bfg-repo-cleaner/](https://rtyley.github.io/bfg-repo-cleaner/)
2.  **Run BFG**:
    ```bash
    # Delete a specific file from history
    java -jar bfg.jar --delete-files YOUR_SECRET_FILE.json my-repo.git
    
    # Replace text in files (e.g., replace a specific key string)
    # Create a file named replacements.txt with "password" ==> "***REMOVED***"
    java -jar bfg.jar --replace-text replacements.txt my-repo.git
    ```
3.  **Push Changes**:
    ```bash
    cd my-repo.git
    git reflog expire --expire=now --all && git gc --prune=now --aggressive
    git push --force
    ```

## 3. Using Secrets in GitHub Actions
Never hardcode secrets. Use GitHub Secrets.

1.  Go to Repo **Settings** -> **Secrets and variables** -> **Actions**.
2.  Click **New repository secret**.
3.  Name it (e.g., `API_KEY`) and paste the value.
4.  Use in workflow:
    ```yaml
    env:
      API_KEY: ${{ secrets.API_KEY }}
    ```
