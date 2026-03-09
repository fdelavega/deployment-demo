# Example App - Live Coding Tutorial

This tutorial is organized as **3 independent apps**, one per step, so you can code live with copy/paste and keep each milestone clear.

## Why this format

- No hidden logic from future steps
- Easy to demo progress to the audience
- Each step can be run and validated independently

## Steps

1. `steps/01-baseline`
- Map app reading NGSI-LD data (no DSC security)

2. `steps/02-secured`
- Same app but backend calls DSC-protected `mp-data-service` with bearer token

3. `steps/03-vc-login`
- GUI login with FIWARE Verifier (OIDC authorization code flow + QR)

## Tutorial docs

- `tutorials/01-baseline-map.md`
- `tutorials/02-secure-context-broker.md`
- `tutorials/03-vc-login-with-verifier.md`

## Prerequisites

Complete:

- `doc/DEPLOYMENT.md`
- `doc/ACCESS_CONTROL.md`
