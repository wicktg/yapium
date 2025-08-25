export default async function handler(req, res) {
  const { path = [] } = req.query;
  const search = req.url.includes("?")
    ? req.url.slice(req.url.indexOf("?"))
    : "";
  const target = `https://gomtu.xyz/api/yap/${
    Array.isArray(path) ? path.join("/") : path
  }${search}`;

  try {
    const upstream = await fetch(target, {
      method: req.method,
      headers: {
        "content-type": req.headers["content-type"] || undefined,
        authorization: req.headers["authorization"] || undefined,
      },
      body: ["GET", "HEAD"].includes(req.method) ? undefined : req,
    });

    res.status(upstream.status);
    upstream.headers.forEach((val, key) => {
      if (
        !["content-encoding", "transfer-encoding", "connection"].includes(
          key.toLowerCase()
        )
      ) {
        res.setHeader(key, val);
      }
    });

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,PATCH,DELETE,OPTIONS"
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );

    if (req.method === "OPTIONS") {
      res.status(204).end();
      return;
    }

    const buf = Buffer.from(await upstream.arrayBuffer());
    res.end(buf);
  } catch (err) {
    res
      .status(502)
      .json({ error: "Upstream proxy failed", detail: String(err) });
  }
}
