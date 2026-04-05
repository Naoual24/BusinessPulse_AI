import codecs

with codecs.open("Rapport_Projet_BusinessPulse.md", "r", "utf-8") as f:
    md_content = f.read()

html_template = """<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Rapport BusinessPulse</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.2.0/github-markdown.min.css">
    <style>
        .markdown-body { box-sizing: border-box; min-width: 200px; max-width: 900px; margin: 0 auto; padding: 45px; }
        @media print { .markdown-body { padding: 0; } }
    </style>
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
</head>
<body>
    <article id="content" class="markdown-body"></article>
    <textarea id="markdown-source" style="display:none;">
__MARKDOWN_CONTENT__
    </textarea>
    <script>
        document.getElementById('content').innerHTML = marked.parse(document.getElementById('markdown-source').value);
    </script>
</body>
</html>
"""

html_out = html_template.replace("__MARKDOWN_CONTENT__", md_content.replace("<textarea", "< textarea"))

with codecs.open("Rapport_Projet_BusinessPulse.html", "w", "utf-8") as f:
    f.write(html_out)

print("HTML generated successfully!")
