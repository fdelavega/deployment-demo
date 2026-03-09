# Step 01 - Baseline

## Start Scorpio + PostGIS (Docker Compose)

```sh
cd example-app/steps/01-baseline
docker compose up -d
docker compose ps
```

Scorpio will be available at `http://localhost:9090`.

Optional quick check:

```sh
curl -s 'http://localhost:9090/ngsi-ld/v1/entities?type=AirQualityObserved&limit=1' -H 'Accept: application/json'
```

Optional seed data (single entity):

```sh
curl -i -X POST 'http://localhost:9090/ngsi-ld/v1/entities' \
  -H 'Content-Type: application/json' \
  --data '{
    "id":"urn:ngsi-ld:AirQualityObserved:demo-1",
    "type":"AirQualityObserved",
    "name":{"type":"Property","value":"Demo station"},
    "location":{"type":"GeoProperty","value":{"type":"Point","coordinates":[-3.7038,40.4168]}},
    "NO2":{"type":"Property","value":22}
  }'
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

## Stop services

```sh
cd example-app/steps/01-baseline
docker compose down
```
