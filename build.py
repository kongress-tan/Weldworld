"""Build a single self-contained EBXWorld HTML file (works offline).

Usage: python3 build.py   ->  dist/EBXWorld-v1.0.html
Inlines three.js, OrbitControls and all data/code files into one page.
"""
import re, pathlib

ROOT = pathlib.Path(__file__).parent
VERSION = re.search(r'APP_VERSION = "([^"]+)"', (ROOT / "index.html").read_text()).group(1)
page = (ROOT / "index.html").read_text()

LOCAL = {
    "https://cdn.jsdelivr.net/npm/three@0.147.0/build/three.min.js": "vendor/three.min.js",
    "https://cdn.jsdelivr.net/npm/three@0.147.0/examples/js/controls/OrbitControls.js": "vendor/OrbitControls.js",
}

def inline(m):
    src = m.group(1)
    code = (ROOT / LOCAL.get(src, src)).read_text()
    code = code.replace("</script", "<\\/script")
    return f"<script>/* {src} */\n{code}\n</script>"

body = re.sub(r'<script src="([^"]+)"></script>', inline, page)
assert "<script src=" not in body, "unresolved external script"
i = body.index('<div id="app">')
head, main = body[:i], body[i:]
out = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
{head}</head>
<body>
{main}
</body>
</html>
"""
dest = ROOT / "dist" / f"EBXWorld-v{VERSION}.html"
dest.write_text(out)
print(f"{dest.relative_to(ROOT)}  {dest.stat().st_size/1024:.0f} KB")
