export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "content-type");
    return res.status(204).end();
  }

  const { username } = req.query;
  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  try {
    const url = `https://gomtu.xyz/api/yap/open?username=${encodeURIComponent(
      username
    )}`;

    const upstream = await fetch(url, { cache: "no-store" });
    const data = await upstream.json();

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(upstream.ok ? 200 : upstream.status).json(data);
  } catch (err) {
    res.status(500).json({ error: "Proxy error", detail: String(err) });
  }
}
