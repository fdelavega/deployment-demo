# Step 03 - VC Login (GUI OIDC Flow)

This step demonstrates browser login with verifier:

1. User clicks login in the app
2. Backend redirects browser to verifier authorization endpoint with:
   - `client_id`
   - `redirect_uri`
   - `scope` (from `OIDC_AUTH_SCOPE`)
   - `state`
   - `nonce`
   - `response_type=code`
3. Verifier shows QR and wallet presents credentials
4. Verifier redirects back with `state` and authorization `code`
5. Backend exchanges code at token endpoint and stores access token in session

## Run

```sh
cd example-app/steps/03-vc-login
cp .env.example .env
cd backend
npm install
npm run dev
```

If your verifier requires a fixed login endpoint like:
`https://verifier.seamware.io/api/v2/loginQR?...`
set `OIDC_AUTHORIZATION_ENDPOINT` in `.env`.
Set `OIDC_AUTH_SCOPE` in `.env` to the verifier scope you want (for example `operator`).

Open `http://localhost:3000` and click **Login (VC)**.

After successful login, the UI shows:

- masked access token preview
- token subject (`sub`)
- token scope
- token expiration (`exp`)
