# Marketplace

In this case we are going to reuse the trust-anchor and identities from the DEPLOYMENT
Follow the steps of DEPLOYMENT for running the trust anchor.

Create namespaces:
```sh
    kubectl create namespace consumer
    kubectl create namespace provider
```

Deploy customer connector
```shell
  export CONSUMER_DID=$(cat ./consumer-identity/did.json | jq .id -r); echo $CONSUMER_DID
  export PROVIDER_DID=$(cat ./provider-identity/did.json | jq .id -r); echo $PROVIDER_DID

  sed -e "s|DID_PROVIDER|$PROVIDER_DID|g" \
      -e "s|DID_CONSUMER|$CONSUMER_DID|g" \
      consumer-market/values.yaml-template > consumer-market/values.yaml
```

Deploy the consumer-key to the cluster

```shell
  kubectl create secret generic consumer-identity --from-file=consumer-identity/cert.pfx -n consumer
```

```sh
  helm install consumer-dsc data-space-connector/data-space-connector --version 8.2.22 -f consumer-market/values.yaml --namespace=consumer
  watch kubectl get pods -n consumer
```

Register the consumer at the trust-anchor:

```shell
  curl -X POST http://til.127.0.0.1.nip.io:8080/issuer \
    --header 'Content-Type: application/json' \
    --data "{
      \"did\": \"$CONSUMER_DID\",
      \"credentials\": []
    }"
```


Install provider with basic marketplace features enabled: tmforum API, and contract management

```shell
  export CONSUMER_DID=$(cat ./consumer-identity/did.json | jq .id -r); echo $CONSUMER_DID
  export PROVIDER_DID=$(cat ./provider-identity/did.json | jq .id -r); echo $PROVIDER_DID

  sed -e "s|DID_PROVIDER|$PROVIDER_DID|g" \
      -e "s|DID_CONSUMER|$CONSUMER_DID|g" \
      provider-market/values.yaml-template > provider-market/values.yaml
```

Deploy the key to the cluster

```shell
  kubectl create secret generic provider-identity --from-file=provider-identity/cert.pfx -n provider
```

```sh
  helm install provider-dsc data-space-connector/data-space-connector --version 8.2.22 -f provider-market/values.yaml --namespace=provider
  watch kubectl get pods -n provider
```

Register the provider at the trust-anchor:

```shell
curl -X POST http://til.127.0.0.1.nip.io:8080/issuer \
  --header 'Content-Type: application/json' \
  --data "{
    \"did\": \"$PROVIDER_DID\",
    \"credentials\": []
  }"
```


Populate trusted issuers list
```sh
curl -X POST http://til-provider.127.0.0.1.nip.io:8080/issuer \
  --header 'Content-Type: application/json' \
  --data "{
      \"did\": \"$CONSUMER_DID\",
      \"credentials\": [
          {
              \"credentialsType\": \"UserCredential\"
          }
      ]
  }"
```

## Provider

Allow every authenticated participant to read offerings

```sh
  curl -s -X 'POST' http://pap-provider.127.0.0.1.nip.io:8080/policy \
    -H 'Content-Type: application/json' \
    -d  '{
          "@context": {
            "dc": "http://purl.org/dc/elements/1.1/",
            "dct": "http://purl.org/dc/terms/",
            "owl": "http://www.w3.org/2002/07/owl#",
            "odrl": "http://www.w3.org/ns/odrl/2/",
            "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
            "skos": "http://www.w3.org/2004/02/skos/core#"
          },
          "@id": "https://mp-operation.org/policy/common/offering",
          "odrl:uid": "https://mp-operation.org/policy/common/offering",
          "@type": "odrl:Policy",
          "odrl:permission": {
            "odrl:assigner": {
              "@id": "https://www.mp-operation.org/"
            },
            "odrl:target": {
              "@type": "odrl:AssetCollection",
              "odrl:source": "urn:asset",
              "odrl:refinement": [
                {
                  "@type": "odrl:Constraint",
                  "odrl:leftOperand": "tmf:resource",
                  "odrl:operator": {
                    "@id": "odrl:eq"
                  },
                  "odrl:rightOperand": "productOffering"
                }
              ]
            },
            "odrl:assignee": {
              "@id": "vc:any"
            },
            "odrl:action": {
              "@id": "odrl:read"
            }
          }
        }'
```

Allow 'LEAR' of authenticated participants to register as customer at M&P Operations

```sh
  curl -s -X 'POST' http://pap-provider.127.0.0.1.nip.io:8080/policy \
    -H 'Content-Type: application/json' \
    -d  '{
          "@context": {
            "dc": "http://purl.org/dc/elements/1.1/",
            "dct": "http://purl.org/dc/terms/",
            "owl": "http://www.w3.org/2002/07/owl#",
            "odrl": "http://www.w3.org/ns/odrl/2/",
            "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
            "skos": "http://www.w3.org/2004/02/skos/core#"
          },
          "@id": "https://mp-operation.org/policy/common/selfRegistration",
          "odrl:uid": "https://mp-operation.org/policy/common/selfRegistration",
          "@type": "odrl:Policy",
          "odrl:permission": {
            "odrl:assigner": {
              "@id": "https://www.mp-operation.org/"
            },
            "odrl:target": {
              "@type": "odrl:AssetCollection",
              "odrl:source": "urn:asset",
              "odrl:refinement": [
                {
                  "@type": "odrl:Constraint",
                  "odrl:leftOperand": "tmf:resource",
                  "odrl:operator": {
                    "@id": "odrl:eq"
                  },
                  "odrl:rightOperand": "organization"
                }
              ]
            },
            "odrl:assignee": {
              "@type": "odrl:PartyCollection",
              "odrl:source": "urn:user",
              "odrl:refinement": {
                "@type": "odrl:LogicalConstraint",
                "odrl:and": [
                  {
                    "@type": "odrl:Constraint",
                    "odrl:leftOperand": {
                      "@id": "vc:role"
                    },
                    "odrl:operator": {
                      "@id": "odrl:hasPart"
                    },
                    "odrl:rightOperand": {
                      "@value": "LEAR",
                      "@type": "xsd:string"
                    }
                  },
                  {
                    "@type": "odrl:Constraint",
                    "odrl:leftOperand": {
                      "@id": "vc:type"
                    },
                    "odrl:operator": {
                      "@id": "odrl:hasPart"
                    },
                    "odrl:rightOperand": {
                      "@value": "UserCredential",
                      "@type": "xsd:string"
                    }
                  }
                ]
              }
            },
            "odrl:action": {
              "@id": "tmf:create"
            }
          }
        }'
```

Allow 'LEAR' to order products

```sh
    curl -s -X 'POST' http://pap-provider.127.0.0.1.nip.io:8080/policy \
    -H 'Content-Type: application/json' \
    -d  '{
          "@context": {
            "dc": "http://purl.org/dc/elements/1.1/",
            "dct": "http://purl.org/dc/terms/",
            "owl": "http://www.w3.org/2002/07/owl#",
            "odrl": "http://www.w3.org/ns/odrl/2/",
            "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
            "skos": "http://www.w3.org/2004/02/skos/core#"
          },
          "@id": "https://mp-operation.org/policy/common/ordering",
          "odrl:uid": "https://mp-operation.org/policy/common/ordering",
          "@type": "odrl:Policy",
          "odrl:permission": {
            "odrl:assigner": {
              "@id": "https://www.mp-operation.org/"
            },
            "odrl:target": {
              "@type": "odrl:AssetCollection",
              "odrl:source": "urn:asset",
              "odrl:refinement": [
                {
                  "@type": "odrl:Constraint",
                  "odrl:leftOperand": "tmf:resource",
                  "odrl:operator": {
                    "@id": "odrl:eq"
                  },
                  "odrl:rightOperand": "productOrder"
                }
              ]
            },
            "odrl:assignee": {
              "@type": "odrl:PartyCollection",
              "odrl:source": "urn:user",
              "odrl:refinement": {
                "@type": "odrl:LogicalConstraint",
                "odrl:and": [
                  {
                    "@type": "odrl:Constraint",
                    "odrl:leftOperand": {
                      "@id": "vc:role"
                    },
                    "odrl:operator": {
                      "@id": "odrl:hasPart"
                    },
                    "odrl:rightOperand": {
                      "@value": "LEAR",
                      "@type": "xsd:string"
                    }
                  },
                  {
                    "@type": "odrl:Constraint",
                    "odrl:leftOperand": {
                      "@id": "vc:type"
                    },
                    "odrl:operator": {
                      "@id": "odrl:hasPart"
                    },
                    "odrl:rightOperand": {
                      "@value": "UserCredential",
                      "@type": "xsd:string"
                    }
                  }
                ]
              }
            },
            "odrl:action": {
              "@id": "tmf:create"
            }
          }
        }'
```

Create product specification

```sh
export PRODUCT_SPEC_FULL_ID=$(curl -X 'POST' http://tm-forum-api.127.0.0.1.nip.io:8080/tmf-api/productCatalogManagement/v4/productSpecification \
  -H 'Content-Type: application/json;charset=utf-8' \
  -d "{
    \"brand\": \"M&P Operations\",
    \"version\": \"1.0.0\",
    \"lifecycleStatus\": \"ACTIVE\",
    \"name\": \"M&P K8S\",
    \"productSpecCharacteristic\": [
      {
        \"id\": \"credentialsConfig\",
        \"name\": \"Credentials Config\",
        \"@schemaLocation\": \"https://raw.githubusercontent.com/FIWARE/contract-management/refs/heads/main/schemas/credentials/credentialConfigCharacteristic.json\",
        \"valueType\": \"credentialsConfiguration\",
        \"productSpecCharacteristicValue\": [
          {
            \"isDefault\": true,
            \"value\": {
              \"credentialsType\": \"OperatorCredential\",
              \"claims\": [
                {
                  \"name\": \"roles\",
                  \"path\": \"$.roles[?(@.target==\\\"${PROVIDER_DID}\\\")].names[*]\",
                  \"allowedValues\": [
                    \"OPERATOR\"
                  ]
                }
              ]
            }
          }
        ]
      },
      {
        \"id\": \"policyConfig\",
        \"name\": \"Policy for creation of K8S clusters.\",
        \"@schemaLocation\": \"https://raw.githubusercontent.com/FIWARE/contract-management/refs/heads/policy-support/schemas/odrl/policyCharacteristic.json\",
        \"valueType\": \"authorizationPolicy\",
        \"productSpecCharacteristicValue\": [
          {
            \"isDefault\": true,
            \"value\": {
              \"@context\": {
                \"odrl\": \"http://www.w3.org/ns/odrl/2/\"
              },
              \"@id\": \"https://mp-operation.org/policy/common/k8s-full\",
              \"odrl:uid\": \"https://mp-operation.org/policy/common/k8s-full\",
              \"@type\": \"odrl:Policy\",
              \"odrl:permission\": {
                \"odrl:assigner\": \"https://www.mp-operation.org/\",
                \"odrl:target\": {
                  \"@type\": \"odrl:AssetCollection\",
                  \"odrl:source\": \"urn:asset\",
                  \"odrl:refinement\": [
                    {
                      \"@type\": \"odrl:Constraint\",
                      \"odrl:leftOperand\": \"ngsi-ld:entityType\",
                      \"odrl:operator\": \"odrl:eq\",
                      \"odrl:rightOperand\": \"K8SCluster\"
                    }
                  ]
                },
                \"odrl:assignee\": {
                  \"@type\": \"odrl:PartyCollection\",
                  \"odrl:source\": \"urn:user\",
                  \"odrl:refinement\": {
                    \"@type\": \"odrl:LogicalConstraint\",
                    \"odrl:and\": [
                      {
                        \"@type\": \"odrl:Constraint\",
                        \"odrl:leftOperand\": \"vc:role\",
                        \"odrl:operator\": \"odrl:hasPart\",
                        \"odrl:rightOperand\": {
                          \"@value\": \"OPERATOR\",
                          \"@type\": \"xsd:string\"
                        }
                      },
                      {
                        \"@type\": \"odrl:Constraint\",
                        \"odrl:leftOperand\": \"vc:type\",
                        \"odrl:operator\": \"odrl:hasPart\",
                        \"odrl:rightOperand\": {
                          \"@value\": \"OperatorCredential\",
                          \"@type\": \"xsd:string\"
                        }
                      }
                    ]
                  }
                },
                \"odrl:action\": \"odrl:read\"
              }
            }
          }
        ]
      }
    ]
  }" | jq '.id' -r ); echo ${PRODUCT_SPEC_FULL_ID}
```

Create full product offering

```sh
export PRODUCT_OFFERING_FULL_ID=$(curl -X 'POST' http://tm-forum-api.127.0.0.1.nip.io:8080/tmf-api/productCatalogManagement/v4/productOffering \
  -H 'Content-Type: application/json;charset=utf-8' \
  -d "{
    \"version\": \"1.0.0\",
    \"lifecycleStatus\": \"ACTIVE\",
    \"name\": \"M&P K8S Offering\",
    \"productSpecification\": {
      \"id\": \"${PRODUCT_SPEC_FULL_ID}\"
    }
  }"| jq '.id' -r ); echo ${PRODUCT_OFFERING_FULL_ID}
```


## Customer

Get Access token for consumer
```shell
  export USER_CREDENTIAL=$(./scripts/get_credential.sh http://keycloak-consumer.127.0.0.1.nip.io:8080 user-credential test-user); echo ${USER_CREDENTIAL}
  export ACCESS_TOKEN=$(./scripts/get_access_token_oid4vp.sh http://mp-data-service.127.0.0.1.nip.io:8080 $USER_CREDENTIAL default); echo $ACCESS_TOKEN
```

Access as an admin to the Keycloak console

```shell
kubectl get secret -n consumer -o json issuance-secret | jq '.data."keycloak-admin"' -r | base64 --decode
```

Access the admin console as keycloak-admin: http://keycloak-consumer.127.0.0.1.nip.io:8080

Register organization in TMFAPI
```shell
  export FANCY_MARKETPLACE_ID=$(curl -X POST http://mp-tmf-api.127.0.0.1.nip.io:8080/tmf-api/party/v4/organization \
    -H 'Accept: */*' \
    -H 'Content-Type: application/json' \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    -d "{
      \"name\": \"Fancy Marketplace Inc.\",
      \"partyCharacteristic\": [
        {
          \"name\": \"did\",
          \"value\": \"${CONSUMER_DID}\" 
        }
      ]
    }" | jq '.id' -r); echo ${FANCY_MARKETPLACE_ID}
```

List offerings
```sh
  curl -X GET http://mp-tmf-api.127.0.0.1.nip.io:8080/tmf-api/productCatalogManagement/v4/productOffering -H "Authorization: Bearer ${ACCESS_TOKEN}" | jq .
```

Try to access K8SCluster entities
```sh
export OPERATOR_CREDENTIAL=$(./scripts/get_credential.sh http://keycloak-consumer.127.0.0.1.nip.io:8080 operator-credential operator); echo ${OPERATOR_CREDENTIAL}
export OPERATOR_ACCESS_TOKEN=$(./scripts/get_access_token_oid4vp.sh http://mp-data-service.127.0.0.1.nip.io:8080 $OPERATOR_CREDENTIAL operator); echo $OPERATOR_ACCESS_TOKEN

curl -X GET http://mp-data-service.127.0.0.1.nip.io:8080/ngsi-ld/v1/entities?type=K8SCluster \
    -H 'Accept: */*' \
    -H "Authorization: Bearer ${OPERATOR_ACCESS_TOKEN}"
````

Create a product order
```sh
export ORDER_ID=$(curl -X POST http://mp-tmf-api.127.0.0.1.nip.io:8080/tmf-api/productOrderingManagement/v4/productOrder \
  -H 'Accept: */*' \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -d "{
      \"productOrderItem\": [
        {
          \"id\": \"random-order-id\",
          \"action\": \"add\",
          \"productOffering\": {
            \"id\" :  \"${PRODUCT_OFFERING_FULL_ID}\"
          }
        }  
      ],
      \"relatedParty\": [
        {
          \"id\": \"${FANCY_MARKETPLACE_ID}\"
        }
      ]}" | jq '.id' -r); echo ${ORDER_ID}
```

Complete the product order
```sh
curl -X 'PATCH' \
      -H "Authorization: Bearer ${ACCESS_TOKEN}" \
      http://tm-forum-api.127.0.0.1.nip.io:8080/tmf-api/productOrderingManagement/v4/productOrder/${ORDER_ID} \
      -H 'accept: application/json;charset=utf-8' \
      -H 'Content-Type: application/json;charset=utf-8' \
      -d "{
              \"state\": \"completed\"
          }" | jq .
```

Check the new policy has been created
```sh
  curl -s -X 'GET' http://pap-provider.127.0.0.1.nip.io:8080/policy | python3 -m json.tool
```

```shell
curl -X GET http://til-provider.127.0.0.1.nip.io:8080/issuer/${CONSUMER_DID} | python3 -m json.tool
```


Get an operator credential
```sh
  export OPERATOR_CREDENTIAL=$(./scripts/get_credential.sh http://keycloak-consumer.127.0.0.1.nip.io:8080 operator-credential operator); echo ${OPERATOR_CREDENTIAL}
  export OPERATOR_ACCESS_TOKEN=$(./scripts/get_access_token_oid4vp.sh http://mp-data-service.127.0.0.1.nip.io:8080 $OPERATOR_CREDENTIAL operator); echo $OPERATOR_ACCESS_TOKEN
```

Access the acquired data
```sh
curl -X GET http://mp-data-service.127.0.0.1.nip.io:8080/ngsi-ld/v1/entities?type=K8SCluster \
    -H 'Accept: */*' \
    -H "Authorization: Bearer ${OPERATOR_ACCESS_TOKEN}"
```

