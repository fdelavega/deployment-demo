# Access control management

```shell
curl -s -X 'GET' http://pap-provider.127.0.0.1.nip.io:8080/policy | python3 -m json.tool
```

```shell
curl -s -X 'DELETE' http://pap-provider.127.0.0.1.nip.io:8080/policy/ojkjdlvojp
```

Data request
```sh
export ACCESS_TOKEN=$(./scripts/get_access_token_oid4vp.sh http://mp-data-service.127.0.0.1.nip.io:8080 $USER_CREDENTIAL default); echo $ACCESS_TOKEN
curl -s -X GET 'http://mp-data-service.127.0.0.1.nip.io:8080/ngsi-ld/v1/entities?type=AirQualityObserved' \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer ${ACCESS_TOKEN}"
```

Provider data request
```sh
export PROVIDER_CREDENTIAL=$(./scripts/get_credential.sh http://keycloak-provider.127.0.0.1.nip.io:8080 user-credential city-user); echo ${PROVIDER_CREDENTIAL}
export PROVIDER_ACCESS_TOKEN=$(./scripts/get_access_token_oid4vp.sh http://mp-data-service.127.0.0.1.nip.io:8080 $PROVIDER_CREDENTIAL default); echo $PROVIDER_ACCESS_TOKEN
curl -s -X GET 'http://mp-data-service.127.0.0.1.nip.io:8080/ngsi-ld/v1/entities?type=AirQualityObserved' \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer ${PROVIDER_ACCESS_TOKEN}"
```


Allow users with UserCredential to read entities of type AirQualityObserved

```shell
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
            "@id": "https://mp-operation.org/policy/common/userCred",
            "@type": "odrl:Policy",
            "odrl:uid": "https://mp-operation.org/policy/common/userCred",
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
                    "odrl:leftOperand": "ngsi-ld:entityType",
                    "odrl:operator": {
                      "@id": "odrl:eq"
                    },
                    "odrl:rightOperand": "AirQualityObserved"
                  }
                ]
              },
              "odrl:assignee": {
                "@type": "odrl:PartyCollection",
                  "odrl:source": "urn:user",
                  "odrl:refinement": {
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
              },
              "odrl:action": {
                "@id": "odrl:read"
              }
            }
          }'
```

Allow users with RESEARCHER role to read entities of type AirQualityObserved

```shell
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
            "@id": "https://mp-operation.org/policy/common/viewer",
            "odrl:uid": "https://mp-operation.org/policy/common/viewer",
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
                    "odrl:leftOperand": "ngsi-ld:entityType",
                    "odrl:operator": {
                      "@id": "odrl:eq"
                    },
                    "odrl:rightOperand": "AirQualityObserved"
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
                          "@value": "RESEARCHER",
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
                "@id": "odrl:read"
              }
            }
          }'
```

Access as an admin to the Keycloak console

```shell
kubectl get secret -n consumer -o json issuance-secret | jq '.data."keycloak-admin"' -r | base64 --decode
```

Access the admin console as keycloak-admin: http://keycloak-consumer.127.0.0.1.nip.io:8080

Create new role
Assign new role

New user credential
```sh
export USER_CREDENTIAL=$(./scripts/get_credential.sh http://keycloak-consumer.127.0.0.1.nip.io:8080 user-credential test-user); echo ${USER_CREDENTIAL}
```

```shell
    export ACCESS_TOKEN=$(./scripts/get_access_token_oid4vp.sh http://mp-data-service.127.0.0.1.nip.io:8080 $USER_CREDENTIAL default); echo $ACCESS_TOKEN
    curl -s -X GET 'http://mp-data-service.127.0.0.1.nip.io:8080/ngsi-ld/v1/entities?type=AirQualityObserved' \
    --header 'Accept: application/json' \
    --header "Authorization: Bearer ${ACCESS_TOKEN}"
```

Allow users with the role DATA_OWNER to create entities of type AirQualityObserved

```shell
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
            "@id": "https://mp-operation.org/policy/common/owner",
            "odrl:uid": "https://mp-operation.org/policy/common/owner",
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
                    "odrl:leftOperand": "ngsi-ld:entityType",
                    "odrl:operator": {
                      "@id": "odrl:eq"
                    },
                    "odrl:rightOperand": "AirQualityObserved"
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
                          "@value": "DATA_OWNER",
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
                "@id": "odrl:use"
              }
            }
          }'
```


Create new AirQualityObserved entity
```shell
export ACCESS_TOKEN=$(./scripts/get_access_token_oid4vp.sh http://mp-data-service.127.0.0.1.nip.io:8080 $USER_CREDENTIAL default); echo $ACCESS_TOKEN
curl -X POST http://mp-data-service.127.0.0.1.nip.io:8080/ngsi-ld/v1/entities?type=AirQualityObserved \
    -H 'Accept: */*' \
    -H 'Content-Type: application/json' \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    -d '{
      "id": "urn:ngsi-ld:AirQualityObserved:1",
      "type": "AirQualityObserved",
      "airQualityLevel": {
        "type": "Property",
        "value": "good"
      },
      "CO": {
        "type": "Property",
        "value": "500"
      },
      "NO2": {
        "type": "Property",
        "value": "45"
      }
    }'
```
