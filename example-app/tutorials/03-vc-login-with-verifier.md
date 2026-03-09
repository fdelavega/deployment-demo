# 03 - VC Login with FIWARE Verifier (GUI Flow)

## Objective

Replace command-line token handling with browser login through verifier + wallet.

Use code from:

- `example-app/steps/03-vc-login`

## Login flow shown in the demo

1. User clicks login button
2. Browser is redirected to verifier authorization page
3. Verifier shows QR
4. Wallet presents credentials to verifier
5. Verifier redirects back with `state` and `code`
6. Backend exchanges `code` at token endpoint and stores `access_token` in session
7. Backend calls `mp-data-service` with that token

## Run

```sh
cd example-app/steps/03-vc-login
cp .env.example .env
cd backend
npm install
npm run dev
```

Open `http://localhost:3000` and click **Login (VC)**.

## Validate

Before login:

```sh
curl -i -s http://localhost:3000/api/entities
```

Expected: `401`.

After login in browser:

```sh
curl -s http://localhost:3000/api/auth/me | jq
curl -s http://localhost:3000/api/entities | jq '.items[0]'
```

Expected: authenticated session and data.

## Live Coding Message

This is the only additional complexity: two auth endpoints (`/start`, `/callback`) and one token exchange on backend.
