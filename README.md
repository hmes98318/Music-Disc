<img width="150" height="150" align="right" style="float: right; margin: 0 10px 0 0;" alt="music_disc" src="public/imgs/logo2.png">

# Music Disc 

<a href="https://github.com/hmes98318/Music-Disc/releases"><img alt="GitHub package.json version" src="https://img.shields.io/github/package-json/v/hmes98318/Music-Disc?style=for-the-badge"></a> 
<a href="https://discord.js.org/"><img src="https://img.shields.io/badge/Discord.JS-v14-blue?style=for-the-badge&logo=DISCORD" /></a> 
<a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.JS->=16.13.0-brightgreen?style=for-the-badge&logo=Node.js"></a> 
<a href="https://github.com/hmes98318/Music-Disc/blob/main/LICENSE"><img alt="GitHub" src="https://img.shields.io/github/license/hmes98318/Music-Disc?style=for-the-badge&color=brightgreen"></a>  

### Discord.js v14 Music Bot  
This is a music bot developed based on [**LavaShark**](https://lavashark.js.org/).  
If you need the version of [**discord-player**](https://github.com/Androz2091/discord-player), please refer to this [**branch**](https://github.com/hmes98318/Music-Disc/tree/discord-player).  


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





