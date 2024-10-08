import type { MiddlewareHandler } from "hono/types";
import { getPath } from "hono/utils/url";
import {
  Logger,
  ConsoleHandler,
  formatters,
  LevelName,
} from "https://deno.land/std@0.224.0/log/mod.ts";

export const LOG_LEVEL = (Deno.env.get("LOG_LEVEL") as LevelName) || "INFO";

export const logger = new Logger("default", LOG_LEVEL, {
  handlers: [
    new ConsoleHandler(LOG_LEVEL, {
      formatter: formatters.jsonFormatter,
      useColors: false,
    }),
  ],
});

const ignorePaths = ["/ping", "/favicon.ico"];
const humanize = (times: string[]) => {
  const [delimiter, separator] = [",", "."];

  const orderTimes = times.map((v) =>
    v.replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1" + delimiter)
  );

  return orderTimes.join(separator);
};

const time = (start: number) => {
  const delta = Date.now() - start;
  return humanize([
    delta < 1000 ? delta + "ms" : Math.round(delta / 1000) + "s",
  ]);
};

export const loggerMiddleware = (): MiddlewareHandler => {
  return async function (c, next) {
    const { method } = c.req;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const path = getPath(c.req.raw);

    const start = Date.now();

    await next();

    if (!ignorePaths.includes(path)) {
      logger.info(`${method} ${path}`, {
        method,
        path,
        status: c.res.status,
        fly_client_ip: c.req.header("Fly-Client-IP"),
        connecting_ip: c.req.header,
        user_agent: c.req.header("User-Agent"),
        duration: time(start),
      });
    }
  };
};
