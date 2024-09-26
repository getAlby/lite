FROM denoland/deno:1.45.5
EXPOSE 8080

WORKDIR /app

USER deno

COPY . .

CMD ["task", "start"]
