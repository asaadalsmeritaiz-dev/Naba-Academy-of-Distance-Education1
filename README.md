<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/3facf87d-1663-4e64-b336-f1d7046e87ee

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Create a `.env.local` file and add:
   ```env
   GEMINI_API_KEY="your-gemini-api-key"
   SUPABASE_URL="https://<project-ref>.supabase.co"
   SUPABASE_ANON_KEY="your-anon-key"
   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   SUPABASE_PROJECT_ID="<project-ref>"
   JWT_SECRET="a-strong-random-secret"
   ```
3. Run the SQL in [supabase-schema.sql](supabase-schema.sql) inside the Supabase SQL Editor.
4. Verify the server can see Supabase:
   `curl http://localhost:3000/api/health`
5. Run the app:
   `npm run dev`

### Supabase notes
- The app will use Supabase for real database access once the environment values are set.
- If the values are missing or still use the placeholder example values, the app will stay in a non-configured mode and skip live database calls.
- For production, prefer storing the keys in the hosting platform environment variables instead of committing them to the repository.

## Deploy to Render

1. Push this repository to GitHub.
2. Create a new Web Service in Render and connect the GitHub repo.
3. Use the following build and start commands:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
4. Add these environment variables in Render:
   ```env
   NODE_ENV=production
   PORT=10000
   GEMINI_API_KEY=your-gemini-api-key
   SUPABASE_URL=https://<project-ref>.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   SUPABASE_PROJECT_ID=<project-ref>
   JWT_SECRET=your-strong-secret
   ```
5. After deployment, Render will provide a public URL that users can access.
