module.exports = async (req, res) => {
  const secret = req.query.secret;
  if (!secret || secret !== process.env.CRON_SECRET) {
    res.status(401).json({ ok: false, error: 'unauthorized' });
    return;
  }

  const token = process.env.GH_DISPATCH_TOKEN;
  if (!token) {
    res.status(500).json({ ok: false, error: 'GH_DISPATCH_TOKEN not configured' });
    return;
  }

  try {
    const ghRes = await fetch(
      'https://api.github.com/repos/emanuelcarloscr10/achou-oferta/actions/workflows/telegram-post.yml/dispatches',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
          'User-Agent': 'achou-oferta-cron',
        },
        body: JSON.stringify({ ref: 'main' }),
      }
    );

    if (ghRes.status === 204) {
      res.status(200).json({ ok: true, triggered: true });
    } else {
      const text = await ghRes.text();
      res.status(502).json({ ok: false, error: 'github_dispatch_failed', status: ghRes.status, body: text });
    }
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
};
