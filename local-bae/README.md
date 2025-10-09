
# LOCAL BAE

Start TMForum

```sh
cd apis/scorpio/
docker compose up -d
cd ..
cd tmforum
docker compose up -d
```

Start IDM

```sh
cd idm
docker compose up -d 
```

Available at http://host.docker.internal:3000/

Users:
user: provider@email.com
passwd: 1234

user: customer@email.com
passwd: 1234

Start Marketplace

```sh
cd bae
docker compose up -d 
```

Available at http://host.docker.internal:8004/
