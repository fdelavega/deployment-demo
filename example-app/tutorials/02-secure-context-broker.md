# 02 - Secure Context Broker Through DSC

## Objective

Take the baseline app and secure it using provider DSC data service.

Use code from:

- `example-app/steps/02-secured`

## First: prove unauthorized access fails

```sh
curl -i -s 'http://mp-data-service.127.0.0.1.nip.io:8080/ngsi-ld/v1/entities?type=AirQualityObserved' \
  -H 'Accept: application/json'
```

Expected: `401` or `403`.

## Generate access token (CLI helper)

```sh
export USER_CREDENTIAL=$(./scripts/get_credential.sh \
  http://keycloak-consumer.127.0.0.1.nip.io:8080 \
  user-credential test-user)

export ACCESS_TOKEN=$(./scripts/get_access_token_oid4vp.sh \
  http://mp-data-service.127.0.0.1.nip.io:8080 \
  "$USER_CREDENTIAL" default)
```

## Run step-02 app

```sh
cd example-app/steps/02-secured
cp .env.example .env
# paste ACCESS_TOKEN into DATA_API_TOKEN
cd backend
npm install
npm run dev
```

Open `http://localhost:3000`.

## Live Coding Message

Integration is small: replace the datasource URL and add bearer token at backend call.
