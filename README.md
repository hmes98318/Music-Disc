<img width="150" height="150" align="right" style="float: right; margin: 0 10px 0 0;" alt="music_disc" src="public/imgs/logo2.png">

# Music Disc 

<a href="https://github.com/hmes98318/Music-Disc/releases"><img alt="GitHub package.json version" src="https://img.shields.io/github/package-json/v/hmes98318/Music-Disc?style=for-the-badge"></a> 
<a href="https://discord.js.org/"><img src="https://img.shields.io/badge/Discord.JS-v14-blue?style=for-the-badge&logo=DISCORD" /></a> 
<a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.JS->=16.13.0-brightgreen?style=for-the-badge&logo=Node.js"></a> 
<a href="https://github.com/hmes98318/Music-Disc/blob/main/LICENSE"><img alt="GitHub" src="https://img.shields.io/github/license/hmes98318/Music-Disc?style=for-the-badge&color=brightgreen"></a>  

### Discord.js v14 Music Bot  
This is a music bot developed based on [**LavaShark**](https://lavashark.js.org/).  
If you need the version of [**discord-player**](https://github.com/Androz2091/discord-player), please refer to this [**branch**](https://github.com/hmes98318/Music-Disc/tree/discord-player).  

Supports **YouTube**, **Spotify**, **SoundCloud** streams.  

If you encounter any issues or would like to contribute to the community, please join our [Discord server](https://discord.gg/7rQEx7SPGr).  

## Deploying with node.js

### Clone the latest version of the repository
```
git clone -b v2.0.0 https://github.com/hmes98318/Music-Disc.git
```
or [**click here**](https://github.com/hmes98318/Music-Disc/releases) to download  


### Install the dependencies
install all the dependencies from [**package.json**](./package.json)  
```
npm install
```


### Add Lavalink node
Please refer to this [**documentation**](https://lavashark.js.org/docs/server-config) for detailed information.  
Edit the file [**node-list.json**](./node-list.json)  
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
Edit the file [**.env**](./.env) 
```env
TOKEN = "your_token"
NAME = "Music Disc"
PREFIX = "+"
PLAYING = "+help | music"
EMBEDS_COLOR = "#FFFFFF"
DEFAULT_VOLUME = 50
MAX_VOLUME = 100
AUTO_LEAVE = true
AUTO_LEAVE_COOLDOWN = 5000
DISPLAY_VOICE_STATE = true
PORT = 33333
```

<details> 
  <summary>Detailed description</summary>

  **`AUTO_LEAVE`** : After the music finished, can choose whether let the bot leave voice channel automatically or not.  
  **`AUTO_LEAVE_COOLDOWN`** : Timer for auto disconnect(ms).  
  **`DISPLAY_VOICE_STATE`** : Show voice channel status updates.   
</details>


### Running the script 
```
npm run start
```


## Deploying with Docker
**image link** : https://hub.docker.com/r/hmes98318/music-disc  

If you don't have any available nodes, you need to first start the server container using [Docker Compose](server/docker-compose.yml) in the server directory.  

### Start with Docker
Use the following command to start the container:  
Please put your **token** into the `TOKEN` variable.  
```
docker run -d \
  --name music-disc \
  -e TOKEN="your_token" \
  -e PREFIX="+" \
  -e PLAYING="+help | music" \
  -e EMBEDS_COLOR="#FFFFFF" \
  -e DEFAULT_VOLUME=50 \
  -e MAX_VOLUME=100 \
  -e AUTO_LEAVE="true" \
  -e AUTO_LEAVE_COOLDOWN=5000 \
  -e DISPLAY_VOICE_STATE="true" \
  -v ./node-list.json:/bot/node-list.json \
  -v ./blacklist.json:/bot/blacklist.json \
  -p 33333:33333 \
  hmes98318/music-disc:2.0.0
```

### Start with Docker-Compose
Please put your **token** into the `TOKEN` variable.  
```yml
version: '3.8'
services:
  music-disc:
    image: hmes98318/music-disc:2.0.0
    container_name: music-disc
    restart: always
    environment:
      TOKEN: "your_token"
      PREFIX: "+"
      PLAYING: "+help | music"
      EMBEDS_COLOR: "#FFFFFF"
      DEFAULT_VOLUME: 50
      MAX_VOLUME: 100
      AUTO_LEAVE: "true"
      AUTO_LEAVE_COOLDOWN: 5000
      DISPLAY_VOICE_STATE: "true"
    volumes:
      - ./node-list.json:/bot/node-list.json
      - ./blacklist.json:/bot/blacklist.json
    ports:
      - 33333:33333
```

#### Start the container  
```
docker-compose up -d
```
