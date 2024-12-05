FROM denoland/deno:2.1.2
EXPOSE 8080

WORKDIR /app

COPY . .

USER deno

CMD ["task", "start"]
