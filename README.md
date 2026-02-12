# Photo Diary - Recovery Project

This project has been recovered from a Vercel backup structure.

## Quick Start

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Environment Setup**
    Copy `.env.example` to `.env.local` and fill in the required values:
    ```bash
    cp .env.example .env.local
    ```
    Required variables:
    - `VITE_SUPABASE_URL`
    - `VITE_SUPABASE_ANON_KEY`

3.  **Development**
    ```bash
    npm run dev
    ```

4.  **Build**
    ```bash
    npm run build
    ```

## Recovery Details

The following steps were taken to restore the project integrity:
- **Configuration Restoration**: Recreated `package.json`, `tsconfig.json`, `vite.config.ts`, and `.gitignore`.
- **Dependency Locking**: Generated `package-lock.json` with compatible versions (React 18, Vite 6).
- **Code Quality**: Added ESLint configuration and fixed build errors.
- **CI/CD**: Added GitHub Actions workflows for CI (`.github/workflows/ci.yml`) and Weekly Backups (`.github/workflows/backup.yml`).

## Branch Strategy

- **main**: Protected branch. Deploys to Production.
- **vercel-recovery**: Initial recovery branch.
- **feature/*** : For new features.

## Deployment

### GitHub Setup
Since the automated tool could not create the repository, please follow these steps:

1.  Create a new repository on GitHub named `project-recovery`.
2.  Push the local code:
    ```bash
    git remote add origin https://github.com/YOUR_USERNAME/project-recovery.git
    git branch -M main
    git push -u origin main
    ```

### Vercel Integration
1.  Import the `project-recovery` repository in Vercel.
2.  Configure Environment Variables in Vercel Settings.
3.  Deploy.

## Rollback
To rollback to a previous version, use the Vercel Dashboard "Instant Rollback" feature or revert the commit in GitHub and wait for the CI/CD pipeline to redeploy.
