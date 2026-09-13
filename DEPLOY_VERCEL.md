# Deploy this exact project to Vercel

GitHub Pages alone cannot run the AI API.

Use:
1. Push repo to GitHub.
2. Vercel -> Add New Project -> Import Git Repository.
3. Deploy with the repository root.
4. Settings -> Environment Variables.
5. Add OPENAI_API_KEY.
6. Add OPENAI_MODEL if desired.
7. Redeploy.
8. Open the Vercel URL and test /api/health.

Keep the API key server-side.
