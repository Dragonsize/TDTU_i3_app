# TDTU_i3_app Deployment TODO
Status: In Progress

## Approved Plan Steps (Vercel FE + Render BE)

### 1. [IN PROGRESS] Local Verification & Testing
- ✅ FE deps & lint/build test: `npm install && npm run test:frontend` (passed)
- 🔄 BE deps install: pip (heavy deps → ~90%, awaiting completion)
- ⏳ BE tests: backend/scripts/test.sh | pytest (pending)
- ✅ Vercel CLI: v50.37.3 ready
- ✅ GitHub repo: Dragonsize/TDTU_i3_app.git confirmed
- ❌ FE dev: Node PATH issue ('next' not found) → using npx next dev
- Next: Local dev servers (npx next dev + uvicorn), git push, Vercel deploy

### 2. Frontend Deploy (Vercel)
- Install Vercel CLI: `npm i -g vercel`
- `vercel login` & `vercel` (link project, set env vars)
- `vercel --prod`

### 3. Backend Deploy (Render)
- Ensure GitHub repo exists/push code
- Render: New Web Service → GitHub → Python → Build: `pip install -r backend/api/requirements.txt` → Start: `uvicorn backend.api.index:app --host 0.0.0.0 --port $PORT`
- Set env vars (SUPABASE_*, JWT_SECRET_KEY)

### 4. Post-Deploy Verification
- Update vercel.json with new BE URL
- `vercel deploy --prod`
- Test: Health check, auth flow, project CRUD

### 5. [PENDING] Completion
- Live URLs
- attempt_completion

**Notes:** User confirmed "deploy be fe" → proceeding with existing platforms. Assumes env vars ready (Supabase keys)."
</xai:function_call



<xai:function_call name="execute_command">
<parameter name="command">npm install && npm run test:frontend
