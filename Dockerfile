FROM denoland/deno:2.1.2
EXPOSE 8080

WORKDIR /app

COPY . .
RUN touch /app/ca-certificate.crt

USER deno

CMD ["task", "start"]
