FROM node:20-alpine

# Install Python3, pip, ffmpeg
RUN apk update && \
    apk add --no-cache python3 py3-pip ffmpeg curl && \
    python3 -m pip install --no-cache-dir --upgrade yt-dlp --break-system-packages

WORKDIR /app

COPY package.json ./
RUN npm install --production

COPY server.js media-stream.js ./

EXPOSE 4000

CMD ["node", "server.js"]
