export default async function handler(req, res) {
  try {
    const { path = [] } = req.query; // e.g. ["user_status"]
    const subpath = Array.isArray(path) ? path.join("/") : String(path || "");
    const url = `https://gomtu.xyz/api/kaito/${subpath}${
      req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : ""
    }`;

    const upstream = await fetch(url, {
      method: req.method,
      headers: {
        // Forward only safe headers
        "content-type": req.headers["content-type"] || "application/json",
      },
      body:
        req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined,
      // avoids caching weirdness while debugging
      cache: "no-store",
    });

    const contentType =
      upstream.headers.get("content-type") || "application/json";
    const text = await upstream.text();

    res.setHeader("content-type", contentType);
    res.status(upstream.status).send(text);
  } catch (err) {
    res.status(500).json({ error: "Proxy error", detail: String(err) });
  }
}
