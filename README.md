# identicore-web
> Demo web application to show face recognition and similarity comparison capabilities using [Identicore](https://github.com/Em0k1ds-Studio/identicore)

## Getting Started
```shell
git clone https://github.com/Em0k1ds-Studio/identicore-web
cd ./identicore-web
```

### *via `docker-compose.yaml`*
```shell
sudo docker-compose up --build -d
```

### *via `Dockerfiles`*
* #### Build
```shell
sudo docker build --tag identicore/web web
sudo docker build --tag identicore/api api
```

* #### Running
```shell
sudo docker run --rm -d -p 80:80 identicore/web
sudo docker run --rm -d -p 8000:8000 identicore/api
```

## Development
### Backend
* #### Build
```shell
cd ./api
python3 -m venv .venv
source ./.venv/bin/activate
pip3 install -r requirements.txt
```

* #### Running
```shell
uvicorn src.main:app --reload
```

### Frontend
* #### Build
```shell
cd ./web
bun install
```

* #### Running
```shell
bun run dev
```

## License
`identicore-web` is distributed under the terms of the [MIT](https://spdx.org/licenses/MIT.html) license.