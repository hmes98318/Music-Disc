<img width="150" height="150" align="right" style="float: right; margin: 0 10px 0 0;" alt="music_disc" src="public/imgs/logo/logo2.png">

# Music Disc 

<a href="https://github.com/hmes98318/Music-Disc/releases"><img alt="GitHub package.json version" src="https://img.shields.io/github/package-json/v/hmes98318/Music-Disc?style=for-the-badge"></a> 
<a href="https://discord.js.org/"><img src="https://img.shields.io/badge/Discord.JS-v14-blue?style=for-the-badge&logo=DISCORD" /></a> 
<a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.JS->=18.x-brightgreen?style=for-the-badge&logo=Node.js"></a> 
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
git clone -b v3.0.0 https://github.com/hmes98318/Music-Disc.git
```
or [**click here**](https://github.com/hmes98318/Music-Disc/releases) to download  


### Install the dependencies
install all the dependencies from [**package.json**](./package.json)  
```
npm ci
```


### Add Lavalink node
Edit the [`nodelist.json`](./nodelist.json) file to add a [Lavalink](https://github.com/lavalink-devs/Lavalink) node.  
Only supports Lavalink **v4** nodes, **v4.0.8** or higher is recommended.  
 * Use [public node](https://lavalink-list.darrennathanael.com/)  
 * or [host your own](https://blog.darrennathanael.com/post/how-to-lavalink/)  
 * or enable [local node setup](https://musicdisc.ggwp.tw/docs/Environment-variables-description#local-node)  

Please refer to this [**documentation**](https://lavashark.js.org/docs/server-config) for detailed information.  

```json
[
    {
        "id": "Node 1",
        "hostname": "localhost",
        "port": 2333,
        "password": "youshallnotpass"
    }
]
```


### Configure environment
Refer to [**.env.example**](./.env.example) and edit the **.env** fileEdit the file.  
```env
# Discord Bot Token
BOT_TOKEN = "your_token"

# Admin of the bot (User ID)
# OAUTH2 mode requires setting BOT_ADMIN, BOT_CLIENT_SECRET value
BOT_ADMIN = ""              
BOT_CLIENT_SECRET = ""

# Bot settings
BOT_NAME = "Music Disc"
BOT_PREFIX = "+"
BOT_STATUS = "online"
BOT_PLAYING = "+help | music"
BOT_EMBEDS_COLOR = "#FFFFFF"
BOT_SLASH_COMMAND = true


# Volume settings
DEFAULT_VOLUME = 50
MAX_VOLUME = 100

# Auto leave channel settings
AUTO_LEAVE = true
AUTO_LEAVE_COOLDOWN = 5000

# Show voice channel updates
DISPLAY_VOICE_STATE = true


# Web dashboard settings
ENABLE_SITE = true
SITE_PORT = 33333
SITE_LOGIN_TYPE = "USER"   # "USER" | "OAUTH2"

# USER mode settings
SITE_USERNAME = "admin"
SITE_PASSWORD = "000"

# OAUTH2 mode settings
SITE_OAUTH2_LINK = ""   # Your OAuth2 authentication link
SITE_OAUTH2_REDIRECT_URI = "http://localhost:33333/login"   # Redirect link after OAuth2 authentication is complete


# Local Lavalink node
ENABLE_LOCAL_NODE = false
LOCAL_NODE_AUTO_RESTART = true
# LOCAL_NODE_DOWNLOAD_LINK = ""
```

* [**Environment variables detailed description**](https://musicdisc.ggwp.tw/docs/Environment-variables-description)


### Running the script 
```
npm run start
```




## Deploying with Docker
**image link** : https://hub.docker.com/r/hmes98318/music-disc  

If you don't have any available nodes, you need to first start the server container using [Docker Compose](server/docker-compose.yml) in the server directory.  

### Start with Docker Compose
Please put your **token** into the `BOT_TOKEN` variable.  
```yml
services:
  music-disc:
    image: hmes98318/music-disc:latest
    container_name: music-disc
    restart: always
    environment:
      TZ: "Asia/Taipei"
      BOT_TOKEN: "your_token"

      # OAUTH2 mode requires setting BOT_ADMIN, BOT_CLIENT_SECRET value
      BOT_ADMIN: ""
      BOT_CLIENT_SECRET: ""

      BOT_NAME: "Music Disc"
      BOT_PREFIX: "+"
      BOT_PLAYING: "+help | music"
      BOT_EMBEDS_COLOR: "#FFFFFF"
      BOT_SLASH_COMMAND: true

      DEFAULT_VOLUME: 50
      MAX_VOLUME: 100

      AUTO_LEAVE: "true"
      AUTO_LEAVE_COOLDOWN: 5000
      DISPLAY_VOICE_STATE: "true"

      # Web dashboard settings
      ENABLE_SITE: true
      SITE_PORT: 33333
      SITE_LOGIN_TYPE: "USER"   # "OAUTH2" | "USER"
      # USER mode settings
      SITE_USERNAME: "admin"
      SITE_PASSWORD: "password"
      # OAUTH2 mode settings
      SITE_OAUTH2_LINK: ""      # Your OAuth2 authentication link
      SITE_OAUTH2_REDIRECT_URI: "http://localhost:33333/login"   # Redirect link after OAuth2 authentication is complete

      # Local Lavalink node
      ENABLE_LOCAL_NODE: false
      LOCAL_NODE_AUTO_RESTART: true
    volumes:
      - ./server:/bot/server    # localnode configuration file
      - ./nodelist.json:/bot/nodelist.json
      - ./blacklist.json:/bot/blacklist.json
    ports:
      - 33333:33333
```

#### Start the container  
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
  -e BOT_ADMIN="" \
  -e BOT_CLIENT_SECRET="" \
  -e BOT_NAME="Music Disc" \
  -e BOT_PREFIX="+" \
  -e BOT_PLAYING="+help | music" \
  -e BOT_EMBEDS_COLOR="#FFFFFF" \
  -e BOT_SLASH_COMMAND="#true" \
  -e DEFAULT_VOLUME=50 \
  -e MAX_VOLUME=100 \
  -e AUTO_LEAVE="true" \
  -e AUTO_LEAVE_COOLDOWN=5000 \
  -e DISPLAY_VOICE_STATE="true" \
  -e ENABLE_SITE=true \
  -e SITE_PORT=33333 \
  -e SITE_LOGIN_TYPE="USER" \
  -e SITE_USERNAME="admin" \
  -e SITE_PASSWORD="password" \
  -e SITE_OAUTH2_LINK="" \
  -e SITE_OAUTH2_REDIRECT_URI="http://localhost:33333/login" \
  -e ENABLE_LOCAL_NODE=false \
  -e LOCAL_NODE_AUTO_RESTART=true \
  -v $(pwd)/server:/bot/server \
  -v $(pwd)/nodelist.json:/bot/nodelist.json \
  -v $(pwd)/blacklist.json:/bot/blacklist.json \
  -p 33333:33333 \
  hmes98318/music-disc:latest
```