FROM oven/bun

WORKDIR /home/bun/app

COPY ./package.json .

RUN bun install

COPY . .

CMD ["bun", "run"]