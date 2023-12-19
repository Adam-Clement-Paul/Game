FROM oven/bun

WORKDIR /home/bun/app

COPY package*.json ./

RUN bun install

COPY . .

EXPOSE 3010

CMD ["bun", "start"]
