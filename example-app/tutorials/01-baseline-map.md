# 01 - Baseline Map App (No DSC Security)

## Objective

Build a minimal map app that reads `AirQualityObserved` entities with no DSC security.

Use code from:

- `example-app/steps/01-baseline`

## Start local broker

```sh
cd example-app/steps/01-baseline
docker compose up -d
```

## Run

```sh
cd example-app/steps/01-baseline
cp .env.example .env
cd backend
npm install
npm run dev
```

Open `http://localhost:3000`.

## Validation

```sh
curl -s http://localhost:3000/api/entities | jq '.items[0]'
```

Expected: first entity with `lat` and `lon`.

## Live Coding Message

At this point, the app is a normal existing app: just frontend + backend + NGSI-LD calls.
