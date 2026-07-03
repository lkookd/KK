const rawUrl = $request.url;
const arg = typeof $argument !== "undefined" ? $argument : "";
const params = Object.fromEntries(
  arg.split("&").map(x => x.split("=")).filter(x => x.length === 2)
);

const defaultClient = params.client || "auto";

if (rawUrl.includes("tgchooser=web")) {
  $done({});
}

function htmlEscape(s) {
  return s.replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
}

function buildLinks(url) {
  const u = new URL(url);
  const path = u.pathname.replace(/^\/+/, "");
  const parts = path.split("/");

  let tg, sw, nice;

  if (path.startsWith("+")) {
    const invite = path.slice(1);
    tg = `tg://join?invite=${encodeURIComponent(invite)}`;
    sw = `swiftgram://join?invite=${encodeURIComponent(invite)}`;
    nice = `nicegram://join?invite=${encodeURIComponent(invite)}`;
  } else if (path.startsWith("joinchat/")) {
    const invite = parts[1] || "";
    tg = `tg://join?invite=${encodeURIComponent(invite)}`;
    sw = `swiftgram://join?invite=${encodeURIComponent(invite)}`;
    nice = `nicegram://join?invite=${encodeURIComponent(invite)}`;
  } else if (path.startsWith("c/")) {
    const channel = parts[1] || "";
    const post = parts[2] || "";
    tg = `tg://privatepost?channel=${encodeURIComponent(channel)}&post=${encodeURIComponent(post)}`;
    sw = `swiftgram://privatepost?channel=${encodeURIComponent(channel)}&post=${encodeURIComponent(post)}`;
    nice = `nicegram://privatepost?channel=${encodeURIComponent(channel)}&post=${encodeURIComponent(post)}`;
  } else {
    const domain = parts[0] || "";
    const post = parts[1] || "";
    let query = `domain=${encodeURIComponent(domain)}`;
    if (post) query += `&post=${encodeURIComponent(post)}`;

    tg = `tg://resolve?${query}`;
    sw = `swiftgram://resolve?${query}`;
    nice = `nicegram://resolve?${query}`;
  }

  const webUrl = rawUrl + (rawUrl.includes("?") ? "&" : "?") + "tgchooser=web";

  return { tg, sw, nice, web: webUrl };
}

const links = buildLinks(rawUrl);

if (defaultClient === "telegram") {
  $done({ response: { status: 302, headers: { Location: links.tg } } });
}

if (defaultClient === "swiftgram") {
  $done({ response: { status: 302, headers: { Location: links.sw } } });
}

if (defaultClient === "nicegram") {
  $done({ response: { status: 302, headers: { Location: links.nice } } });
}

const html = `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Telegram Chooser</title>
<style>
body {
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  background: #f2f2f7;
  padding: 28px;
}
.card {
  background: white;
  border-radius: 22px;
  padding: 24px;
}
h2 {
  margin-top: 0;
}
a {
  display: block;
  padding: 16px;
  margin: 14px 0;
  border-radius: 14px;
  text-align: center;
  text-decoration: none;
  color: white;
  font-size: 18px;
}
.tg { background: #229ED9; }
.sw { background: #ff6b35; }
.nice { background: #5865f2; }
.web { background: #555; }
.url {
  margin-top: 18px;
  font-size: 13px;
  color: #777;
  word-break: break-all;
}
</style>
</head>
<body>
<div class="card">
<h2>选择打开方式</h2>
<a class="tg" href="${links.tg}">官方 Telegram</a>
<a class="sw" href="${links.sw}">Swiftgram</a>
<a class="nice" href="${links.nice}">Nicegram</a>
<a class="web" href="${links.web}">继续网页打开</a>
<div class="url">${htmlEscape(rawUrl)}</div>
</div>
</body>
</html>
`;

$done({
  response: {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8"
    },
    body: html
  }
});