module.exports = async function handler(req, res) {
  const { svc, op, ...rest } = req.query;

  if (!svc || !op) {
    return res.status(400).json({ error: 'svc and op are required' });
  }

  const url = `https://apis.data.go.kr/1160100/service/${svc}/${op}`;
  const params = new URLSearchParams({
    ...rest,
    serviceKey: process.env.API_KEY,
    resultType: 'json',
  });

  try {
    const upstream = await fetch(`${url}?${params}`);
    const json = await upstream.json();
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
    res.json(json);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
