import waitUntil from "async-wait-until";
import delay from "delay";
import { configure, shallow } from "enzyme";
import Adapter from "enzyme-adapter-react-16";
import { createServer } from "http";
import querystring from "querystring";
import * as React from "react";
import url from "url";

export function beforeRunHttpServer(port: number) {
  let server;
  beforeAll(done => {
    server = createServer(async (req, res) => {
      res.setHeader("Date", "Fake");

      const qs = querystring.parse(url.parse(req.url).query);

      if (qs.delay) {
        await delay(parseInt(qs.delay as string, 10));
      }

      switch (true) {
        case /^\/200/.test(req.url):
          res.setHeader("Content-Type", "application/json");
          res.write(
            JSON.stringify({
              headers: req.headers,
              url: req.url,
            }),
          );
          res.end();
          break;
        case /^\/404/.test(req.url):
          res.statusCode = 404;
          res.write("404");
          res.end();
          break;
        case /^\/500/.test(req.url):
          res.statusCode = 500;
          res.write("500");
          res.end();
          break;
        case /^\/post\/200/.test(req.url):
          let body = "";
          req.on("data", data => {
            body += data;
          });
          req.on("end", () => {
            res.write(
              JSON.stringify({
                body,
                headers: req.headers,
                url: req.url,
              }),
            );
            res.end();
          });
          break;
        default:
          res.write("ok");
          res.end();
          break;
      }
    });

    server.listen(port, done);
  });
  afterAll(() => {
    if (server) {
      server.close();
    }
  });
}

export function setup(Element: any, props: { [k: string]: any }) {
  const result: any = {};

  const render = jest.fn((iBag: (params) => {}) => {
    result.bag = iBag;
  });
  const element = <Element {...props} render={render} />;

  result.wrapper = shallow(element);

  return result;
}
