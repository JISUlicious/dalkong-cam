# dalkong-cam

## Live Demo
[Dalkong-Cam](https://dv4m5ajprpkkf.cloudfront.net/)

## WebRTC based home security application

- 2023-04~2023-07

## Tech

- Typescript, React, Bootstrap
- Firebase, WebRTC, AWS S3

## Functionalities

- WebRTC based real-time audio & video
- role specific functionality: viewer & camera
  - viewer: list of cameras, recording history, toggle voice
  - camera: movement detection recording, list of viewers

## Installation

### Clone repository
```
git clone git@github.com:JISUlicious/dalkong-cam.git
```
### Setup STUN, TURN server
Create .env file and setup STUN and TURN servers.
```
# .env
REACT_APP_TURN_SERVER={"iceServers":[{"urls": "stun:stun.server.url:port"},{"urls": "turn:turn.server.url:port","username": "username","credential": "credential"}]}
```
### Run in local
```
npm install
npm run start
```


