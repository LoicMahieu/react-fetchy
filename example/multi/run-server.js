const { createServer } = require("http");

const delay = 2000;

const server = createServer((req, res) => {
  setTimeout(() => {
    if (!req.url) {
      res.statusCode = 404;
      res.write("404");
      res.end();
      return;
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
  }, delay);
});

server.listen(8080, () => {
  console.log("Server listen 8080");
});
