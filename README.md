<img width="150" height="150" align="right" style="float: right; margin: 0 10px 0 0;" alt="music_disc" src="public/imgs/logo/logo2.png">

# Music Disc 

<a href="https://github.com/hmes98318/Music-Disc/releases"><img alt="GitHub package.json version" src="https://img.shields.io/github/package-json/v/hmes98318/Music-Disc?style=for-the-badge"></a> 
<a href="https://discord.js.org/"><img src="https://img.shields.io/badge/Discord.JS-v14-blue?style=for-the-badge&logo=DISCORD" /></a> 
<a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.JS-v22-brightgreen?style=for-the-badge&logo=Node.js"></a> 
<a href="https://github.com/hmes98318/Music-Disc/blob/main/LICENSE"><img alt="GitHub" src="https://img.shields.io/github/license/hmes98318/Music-Disc?style=for-the-badge&color=brightgreen"></a>  

A discord music bot, supports **YouTube**, **Spotify**, **SoundCloud**, **Deezer** streams and web dashboard.  
Developed based on [**discord.js v14**](https://discord.js.org/#/), [**LavaShark**](https://lavashark.js.org/), [**Lavalink**](https://github.com/lavalink-devs/Lavalink/).  

### Features
* Stable
* Use Lavalink
* Web dashboard
* Local node
* Docker images

If you need the version of [**discord-player**](https://github.com/Androz2091/discord-player), please refer to this [**branch**](https://github.com/hmes98318/Music-Disc-discord-player).  

If you encounter any issues or would like to contribute to the community, please join our [Discord server](https://discord.gg/7rQEx7SPGr).  




## Deploying with node.js

### Clone the latest version of the repository
```
git clone https://github.com/hmes98318/Music-Disc.git
```
or [**click here**](https://github.com/hmes98318/Music-Disc/releases) to download  


### Install the dependencies
install all the dependencies from [**package.json**](./package.json)  
```
npm ci
```


### Add Lavalink node
At least one Lavalink node is required to operate.  
Edit the [`config.js`](./config.js) file to add the [Lavalink](https://github.com/lavalink-devs/Lavalink) node.  
Only supports Lavalink **v4** nodes, **v4.0.8** or higher is recommended.  
 * Use [public node](https://lavalink-list.darrennathanael.com/)  
 * or [host your own](https://blog.darrennathanael.com/post/how-to-lavalink/)  
 * or enable [local node setup](https://musicdisc.ggwp.tw/docs/Configuration-description#local-lavalink-node)  

Please refer to this [**documentation**](https://lavashark.js.org/docs/server-config) for detailed information.  

```js
nodeList: [
    {
        "id": "Node 1",
        "hostname": "localhost",
        "port": 2333,
        "password": "youshallnotpass"
    }
]
```


### Configure Bot
Edit the [`.env`](https://github.com/hmes98318/Music-Disc/blob/main/.env.example) file to set the bot token.  
```bash
# Discord Bot Token
BOT_TOKEN = "your_token"
```

Edit [`config.js`](https://github.com/hmes98318/Music-Disc/blob/main/config.js) to configure other parameters of the bot.  

* [**Env & config.js detailed description**](https://musicdisc.ggwp.tw/docs/Configuration-description)


### Running the script 
```
npm run start
```




## Deploying with Docker
**image link** : https://hub.docker.com/r/hmes98318/music-disc  

If you don't have any available nodes, you need to first start the server container using [Docker Compose](server/docker-compose.yml) in the server directory.  

### Start with Docker Compose
Please put your **token** into the `BOT_TOKEN` variable.  
Edit [`config.js`](https://github.com/hmes98318/Music-Disc/blob/main/config.js) to configure other parameters of the bot.  
* [**Env & config.js detailed description**](https://musicdisc.ggwp.tw/docs/Configuration-description)

```yml
services:
  music-disc:
    image: hmes98318/music-disc:latest
    container_name: music-disc
    restart: always
    environment:
      TZ: "Asia/Taipei"
      BOT_TOKEN: "your_token"
    volumes:
      - ./config.js:/bot/config.js              # Bot config
      - ./logs:/bot/logs                        # Bot logs
      - ./server:/bot/server                    # localnode configuration file
    ports:
      - 33333:33333
```

#### Start the docker compose  
```
docker compose up -d
```


### Start with Docker
Use the following command to start the container:  
Please put your **token** into the `BOT_TOKEN` variable.  
```
docker run -d \
  --name music-disc \
  --restart always \
  -e TZ="Asia/Taipei" \
  -e BOT_TOKEN="your_token" \
  -v $(pwd)/config.js:/bot/config.js \
  -v $(pwd)/logs:/bot/logs \
  -v $(pwd)/server:/bot/server \
  -p 33333:33333 \
  hmes98318/music-disc:latest
```

## Development

### Contributing
If you'd like to contribute to the development of Music Disc, please follow these steps:

1. Fork the repository
2. Create a new branch from the **dev** branch (all development work happens on the dev branch)
3. Make your changes
4. Submit a pull request to the **dev** branch

Please note that the main branch is only updated for releases.

### Translations
Music Disc supports multiple languages. If you want to contribute translations:

1. Read the translation guidelines in [src/locales/README.md](./src/locales/README.md)
2. Follow the IETF language tag format (e.g. `en-US`)
3. Ensure all translation keys from the default `en-US` templates are included
