# Step 02 - Secured Access

## Prerequisites

Complete these tutorials first:

- `doc/DEPLOYMENT.md`
- `doc/ACCESS_CONTROL.md`

Expected endpoints up:

- `http://mp-data-service.127.0.0.1.nip.io:8080`
- `http://til-provider.127.0.0.1.nip.io:8080`
- `http://pap-provider.127.0.0.1.nip.io:8080`
- `http://keycloak-consumer.127.0.0.1.nip.io:8080`

Quick checks:

```sh
curl -s http://mp-data-service.127.0.0.1.nip.io:8080/.well-known/openid-configuration | jq '.token_endpoint'
curl -s http://mp-data-service.127.0.0.1.nip.io:8080/.well-known/data-space-configuration | jq '.supported_protocols'
```

## Trusted Issuer List configuration

From repo root:

```sh
export CONSUMER_DID=$(jq -r '.id' consumer-identity/did.json)
export PROVIDER_DID=$(jq -r '.id' provider-identity/did.json)
```

Allow `UserCredential` issued by consumer:

```sh
curl -s -X POST http://til-provider.127.0.0.1.nip.io:8080/issuer \
  -H 'Content-Type: application/json' \
  --data "{
    \"did\": \"$CONSUMER_DID\",
    \"credentials\": [{\"credentialsType\": \"UserCredential\"}]
  }" | jq
```

Allow `UserCredential` issued by provider:

```sh
curl -s -X POST http://til-provider.127.0.0.1.nip.io:8080/issuer \
  -H 'Content-Type: application/json' \
  --data "{
    \"did\": \"$PROVIDER_DID\",
    \"credentials\": [{\"credentialsType\": \"UserCredential\"}]
  }" | jq
```

Optional verification:

```sh
curl -s "http://til-provider.127.0.0.1.nip.io:8080/issuer/$CONSUMER_DID" | jq
curl -s "http://til-provider.127.0.0.1.nip.io:8080/issuer/$PROVIDER_DID" | jq
```

## Policy prerequisite

You need a PAP policy allowing `UserCredential` to read `AirQualityObserved`.
If you already ran `doc/ACCESS_CONTROL.md`, this is done.

Quick check:

```sh
curl -s http://pap-provider.127.0.0.1.nip.io:8080/policy | jq
```

## Populate broker (direct Scorpio request)

Before querying from the app, insert sample data directly into Scorpio.

From repo root, open a port-forward to provider Scorpio service:

```sh
kubectl -n provider port-forward svc/data-service-scorpio 9090:9090
```

In another terminal, create one entity:

```sh
curl -i -X POST 'http://localhost:9090/ngsi-ld/v1/entities' \
  -H 'Content-Type: application/ld+json' \
  --data '{
    "@context": ["https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"],
    "id":"urn:ngsi-ld:AirQualityObserved:demo-step2",
    "type":"AirQualityObserved",
    "name":{"type":"Property","value":"Demo step 2 station"},
    "location":{"type":"GeoProperty","value":{"type":"Point","coordinates":[-3.7038,40.4168]}},
    "NO2":{"type":"Property","value":18}
  }'
```

Optional direct verification against Scorpio:

```sh
curl -s 'http://localhost:9090/ngsi-ld/v1/entities?type=AirQualityObserved&limit=5' \
  -H 'Accept: application/json' | jq
```

## Get an access token

From repo root:

```sh
export USER_CREDENTIAL=$(./scripts/get_credential.sh \
  http://keycloak-consumer.127.0.0.1.nip.io:8080 \
  user-credential test-user)

export ACCESS_TOKEN=$(./scripts/get_access_token_oid4vp.sh \
  http://mp-data-service.127.0.0.1.nip.io:8080 \
  "$USER_CREDENTIAL" default)
```

Optional check:

```sh
curl -s 'http://mp-data-service.127.0.0.1.nip.io:8080/ngsi-ld/v1/entities?type=AirQualityObserved&limit=1' \
  -H 'Accept: application/json' \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" | jq
```

## Run

```sh
cd example-app/steps/02-secured
cp .env.example .env
# paste ACCESS_TOKEN into DATA_API_TOKEN
cd backend
npm install
npm run dev
```

Open `http://localhost:3000`.
