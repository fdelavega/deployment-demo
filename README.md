## Local deployment with MVN

Local deployment repo:
https://github.com/FIWARE/data-space-connector/blob/fix-local-deploy/doc/deployment-integration/local-deployment/LOCAL.MD


# Step by Step deployment

## Setup k3s

```sh
    cd base-cluster
    mvn clean deploy
    export KUBECONFIG=${PWD}/target/k3s.yaml

    # enable storage
    kubectl apply -f https://raw.githubusercontent.com/rancher/local-path-provisioner/v0.0.30/deploy/local-path-storage.yaml
```

## Deploy Trust Anchor

```sh
    helm repo add data-space-connector https://fiware.github.io/data-space-connector/
    cd trust-anchor
    helm template data-space-connector/trust-anchor --version 0.2.0 -f values.yaml --name-template=trust-anchor --namespace=trust-anchor --output-dir rendered
```

> :warning: Don´t forget to set the proper KUBECONFIG. You might deploy to an unwanted cluster elsewise.;)

Create namespace:
```sh
    kubectl create namespace trust-anchor
``` 

Use helm install:
```sh
    helm install trust-anchor data-space-connector/trust-anchor --version 0.2.0 -f values.yaml --namespace=trust-anchor
    watch kubectl get pods -n trust-anchor
```

Use kubectl apply:
```sh
    # if helm template was executed, this can be used to apply all files in the folder
    kubectl apply -R  -f rendered/    
    watch kubectl get pods -n trust-anchor
```

## Deploy consumer:

Create namespace:
```sh
    kubectl create namespace consumer
``` 

Create an identity for the consumer:

```shell
    mkdir consumer-identity

    # generate the private key - dont get confused about the curve, openssl uses the name `prime256v1` for `secp256r1`(as defined by P-256)
    openssl ecparam -name prime256v1 -genkey -noout -out consumer-identity/private-key.pem

    # generate corresponding public key
    openssl ec -in consumer-identity/private-key.pem -pubout -out consumer-identity/public-key.pem

    # create a (self-signed) certificate
    openssl req -new -x509 -key consumer-identity/private-key.pem -out consumer-identity/cert.pem -days 360

    # export the keystore
    openssl pkcs12 -export -inkey consumer-identity/private-key.pem -in consumer-identity/cert.pem -out consumer-identity/cert.pfx -name didPrivateKey

    # check the contents
    keytool -v -keystore consumer-identity/cert.pfx -list -alias didPrivateKey

    # generate did from the keystore
    wget https://github.com/wistefan/did-helper/releases/download/0.1.1/did-helper
    chmod +x did-helper
    ./did-helper -keystorePath ./consumer-identity/cert.pfx -keystorePassword=test

    ----
    docker run -v $(pwd)/consumer-identity:/cert -e KEY_ALIAS=didPrivateKey -e STORE_PASS=test -e COUNTRY=ES -e STATE=Madrid -e LOCALITY=Madrid -e ORGANIZATION=FICODES -e COMMON_NAME=ficodes.com quay.io/wi_stefan/did-helper
```

Register the consumer at the trust-anchor:

```shell
  curl -X POST http://til.127.0.0.1.nip.io:8080/issuer \
    --header 'Content-Type: application/json' \
    --data '{
      "did": "did:key:zDnaezsg9Q7KuJyoxhdLNnQRU9XZHN3MxvLhSnA79QaNvXkSB",
      "credentials": []
    }'
```

Get a list of the issuers:

```shell
    curl -X GET http://tir.127.0.0.1.nip.io:8080/v4/issuers
```

Deploy the key to the cluster

```shell
    kubectl create secret generic consumer-identity --from-file=consumer-identity/cert.pfx -n consumer
```

Use helm install:
```sh
    helm install consumer-dsc data-space-connector/data-space-connector --version 7.37.4 -f consumer/values.yaml --namespace=consumer
    watch kubectl get pods -n consumer
```

Access the issuer: http://keycloak-consumer.127.0.0.1.nip.io:8080/realms/test-realm/account/oid4vci

Decode at https://jwt.io/

### Verify its working

Get a credential from the consumer:
```shell
    export USER_CREDENTIAL=$(./scripts/get_credential_for_consumer.sh http://keycloak-consumer.127.0.0.1.nip.io:8080 operator-credential); echo ${USER_CREDENTIAL}
```

## Deploy provider

Create an identity for the provider:

```shell
    mkdir provider-identity

    # generate the private key - dont get confused about the curve, openssl uses the name `prime256v1` for `secp256r1`(as defined by P-256)
    openssl ecparam -name prime256v1 -genkey -noout -out provider-identity/private-key.pem

    # generate corresponding public key
    openssl ec -in provider-identity/private-key.pem -pubout -out provider-identity/public-key.pem

    # create a (self-signed) certificate
    openssl req -new -x509 -key provider-identity/private-key.pem -out provider-identity/cert.pem -days 360

    # export the keystore
    openssl pkcs12 -export -inkey provider-identity/private-key.pem -in provider-identity/cert.pem -out provider-identity/cert.pfx -name didPrivateKey

    # check the contents
    keytool -v -keystore provider-identity/cert.pfx -list -alias didPrivateKey

    # generate did from the keystore
    wget https://github.com/wistefan/did-helper/releases/download/0.1.1/did-helper
    chmod +x did-helper
    ./did-helper -keystorePath ./provider-identity/cert.pfx -keystorePassword=test


    ---
    docker run -v $(pwd)/provider-identity:/cert -e KEY_ALIAS=didPrivateKey -e STORE_PASS=test -e COUNTRY=ES -e STATE=Madrid -e LOCALITY=Madrid -e ORGANIZATION=Seamware -e COMMON_NAME=seamware.com quay.io/wi_stefan/did-helper
```

Create namespace:
```sh
    kubectl create namespace provider
```

Deploy the key to the cluster

```shell
    kubectl create secret generic provider-identity --from-file=provider-identity/cert.pfx -n provider
```

Use helm install:
```sh
    helm install provider-dsc data-space-connector/data-space-connector --version 7.37.4 -f provider/values.yaml --namespace=provider
    watch kubectl get pods -n provider
```

Register the provider at the trust-anchor:

```shell
  curl -X POST http://til.127.0.0.1.nip.io:8080/issuer \
    --header 'Content-Type: application/json' \
    --data '{
      "did": "did:key:zDnaeXsnUjv4jR5RBN4whuVKqWXY6w8dgpPxcSVeLCBvZiH8e",
      "credentials": []
    }'
```

### Verify its working

Get dataspace config:
```shell
    curl http://mp-data-service.127.0.0.1.nip.io:8080/.well-known/data-space-configuration
```

Get the openid-config:
```shell
    curl http://mp-data-service.127.0.0.1.nip.io:8080/.well-known/openid-configuration
```

Configure the trusted-issuers-list:
```shell
    curl -X POST http://til-provider.127.0.0.1.nip.io:8080/issuer \
    --header 'Content-Type: application/json' \
    --data '{
        "did": "did:key:zDnaezsg9Q7KuJyoxhdLNnQRU9XZHN3MxvLhSnA79QaNvXkSB",
        "credentials": [
            {
                "credentialsType": "OperatorCredential"
            }
        ]
    }'
```


Unauthorized access not allowed:
```shell
    curl -s -X GET 'http://mp-data-service.127.0.0.1.nip.io:8080/ngsi-ld/v1/entities'
```

Prepare wallet-identity:
```shell
    mkdir wallet-identity
    chmod o+rw wallet-identity
    docker run -v $(pwd)/wallet-identity:/cert quay.io/wi_stefan/did-helper:0.1.1
```

Get an access token for the consumer:
```shell
    export ACCESS_TOKEN=$(./scripts/get_access_token_oid4vp_mac.sh http://mp-data-service.127.0.0.1.nip.io:8080 $USER_CREDENTIAL operator); echo $ACCESS_TOKEN
```

Access the data-service:

```shell
    curl -s -X GET 'http://mp-data-service.127.0.0.1.nip.io:8080/ngsi-ld/v1/entities?type=EnergyReport' \
    --header 'Accept: application/json' \
    --header "Authorization: Bearer ${ACCESS_TOKEN}"
```

Add policy:

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
            "@id": "https://mp-operation.org/policy/common/type",
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
                    "odrl:rightOperand": "EnergyReport"
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

# Access control management

Access as an admin to the Keycloak console

```shell
kubectl get secret -n consumer -o json issuance-secret | jq '.data."keycloak-admin"' -r | base64 --decode
```

Access the admin console as keycloak-admin: http://keycloak-consumer.127.0.0.1.nip.io:8080

Create new role
Assign new role

```shell
curl -s -X 'GET' http://pap-provider.127.0.0.1.nip.io:8080/policy
```

```shell
curl -s -X 'DELETE' http://pap-provider.127.0.0.1.nip.io:8080/policy/tqjwzeldun
```


Allow users with OperatorCredential to read entities of type EnergyReport

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
            "@id": "https://mp-operation.org/policy/common/type",
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
                    "odrl:rightOperand": "EnergyReport"
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
                      "@value": "OperatorCredential",
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

Allow users with OperatorCredential role to read entities of type EnergyReport

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
            "@id": "https://mp-operation.org/policy/common/type",
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
                    "odrl:rightOperand": "EnergyReport"
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
                          "@value": "OPERATOR",
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
                          "@value": "OperatorCredential",
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

```shell
    curl -s -X GET 'http://mp-data-service.127.0.0.1.nip.io:8080/ngsi-ld/v1/entities?type=EnergyReport' \
    --header 'Accept: application/json' \
    --header "Authorization: Bearer ${ACCESS_TOKEN}"
```

Allow users with the role DEVOPS to create entities of type K8SCluster

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
              "@id": "https://mp-operation.org/policy/common/type",
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
                      "odrl:rightOperand": "K8SCluster"
                    }
                  ]
                },
                "odrl:assignee": {
                  "@type": "odrl:PartyCollection",
                  "odrl:source": "urn:user",
                  "odrl:refinement": [
                      {
                        "@type": "odrl:Constraint",
                        "odrl:leftOperand": {
                          "@id": "vc:type"
                        },
                        "odrl:operator": {
                          "@id": "odrl:hasPart"
                        },
                        "odrl:rightOperand": {
                          "@value": "OperatorCredential",
                          "@type": "xsd:string"
                        }
                      }
                  ]
                },
                "odrl:action": {
                  "@id": "odrl:use"
                }
              }
            }'
```


Get a credential from the devops user:
```shell
    export DEVOPS_USER_CREDENTIAL=$(./scripts/get_credential_for_user.sh http://keycloak-consumer.127.0.0.1.nip.io:8080 operator-credential fdelavega); echo ${DEVOPS_USER_CREDENTIAL}
```

Get devops access token
```shell
export DEVOPS_ACCESS_TOKEN=$(./scripts/get_access_token_oid4vp_mac.sh http://mp-data-service.127.0.0.1.nip.io:8080 $DEVOPS_USER_CREDENTIAL operator); echo $DEVOPS_ACCESS_TOKEN
```


Create new K8SEntity
```shell
curl -X POST http://mp-data-service.127.0.0.1.nip.io:8080/ngsi-ld/v1/entities \
    -H 'Accept: */*' \
    -H 'Content-Type: application/json' \
    -H "Authorization: Bearer ${DEVOPS_ACCESS_TOKEN}" \
    -d '{
      "id": "urn:ngsi-ld:K8SCluster:consumer",
      "type": "K8SCluster",
      "name": {
        "type": "Property",
        "value": "Consumer cluster"
      },
      "numNodes": {
        "type": "Property",
        "value": "3"
      },
      "k8sVersion": {
        "type": "Property",
        "value": "1.26.0"        
      }
    }'
```

```shell
    curl -s -X GET 'http://mp-data-service.127.0.0.1.nip.io:8080/ngsi-ld/v1/entities?type=K8SCluster' \
    --header 'Accept: application/json' \
    --header "Authorization: Bearer ${DEVOPS_ACCESS_TOKEN}"
```
