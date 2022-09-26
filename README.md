<img width="150" height="150" align="right" style="float: right; margin: 0 10px 0 0;" alt="music_disc" src="https://i.imgur.com/JWSIlSt.png">

# Music Disc
### A Discord Music Bot



### Reference version  
[**node.js  `v16.15.0`**](https://nodejs.org/en/)  
[**discord.js  `13.6.0`**](https://discord.js.org/#/)  

### Dependencies Modules
* **discord-player  `5.2.2`**  
* **dotenv  `16.0.0`**  
* **ffmpeg-static  `4.4.1`**  
* **express  `4.18.1`**  
* **opusscript  `0.0.8`**  
* **ms  `3.0.0-canary.1`**  


## Deploying with node.js

### Clone the repository
```
git clone -b v1.1.5 https://github.com/hmes98318/Music-Disc.git
```
or [**click here**](https://github.com/hmes98318/Music-Disc/releases) to download  


### Install the dependencies
auto install all dependencies on [`package.json`](./package.json)  
```
npm install
```

### Configure Files
[`.env`](./.env) 
```env
TOKEN = "your_token"
```

[`config.json`](./config.json)  
```json
{
    "name": "Music Disc",
    "prefix": "+",
    "playing": "+help | music",
    "maxVol": 200,
    "autoLeave": true,
    "displayVoiceState":true
}
```
**`autoLeave`** : After the music finished, can choose whether let the bot leave voice channel automatically or not  
**`displayVoiceState`** : Display voice channels state   

## Running the script 
```
node index.js
```


## Deploying with Docker  
**image link** : https://hub.docker.com/r/hmes98318/music-disc  
### put your Token into [`docker-compose.yml`](./docker-compose.yml)
```yml
version: '3.8'
services:
  music-disc:
    image: hmes98318/music-disc:1.1.5
    restart: always
    environment:
      TOKEN: "your_token"
```

### Start the container  
```
docker-compose up -d
```


## Deploying with Replit  
Watch it by clicking on the image down below  
[![Music-Disc-with-Replit](https://img.youtube.com/vi/Q3JSz0N4N48/0.jpg)](https://www.youtube.com/watch?v=Q3JSz0N4N48)  


