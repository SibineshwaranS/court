import os
import subprocess
import markdown

script_dir = os.path.dirname(os.path.abspath(__file__))
md_path = os.path.join(script_dir, "Project_Report_U23CS704.md")
html_path = os.path.join(script_dir, "Project_Report_U23CS704.html")
pdf_path = os.path.join(script_dir, "Project_Report_U23CS704.pdf")

with open(md_path, "r", encoding="utf-8") as f:
    md_content = f.read()

# Convert markdown to html with tables, fences, and attr_list extensions
html_body = markdown.markdown(
    md_content,
    extensions=['tables', 'fenced_code', 'def_list', 'nl2br']
)

# Custom print CSS for A4 Sona College / Anna University format
html_document = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>AI-Powered Case Prioritization & Hearing-Delay Prediction System - Mini Project Report</title>
<style>
  @page {{
    size: A4 portrait;
    margin: 25mm 20mm 25mm 30mm; /* 30mm left margin for binding gutter */
    @bottom-center {{
      content: counter(page);
      font-family: "Times New Roman", Times, serif;
      font-size: 11pt;
    }}
  }}

  body {{
    font-family: "Times New Roman", Times, serif;
    font-size: 13pt;
    line-height: 1.5;
    color: #000;
    margin: 0;
    padding: 0;
    text-align: justify;
  }}

  h1, h2, h3, h4, h5, h6 {{
    font-family: "Times New Roman", Times, serif;
    color: #000;
    font-weight: bold;
    page-break-after: avoid;
    line-height: 1.3;
  }}

  h1 {{
    font-size: 17pt;
    text-align: center;
    margin-top: 24pt;
    margin-bottom: 14pt;
    text-transform: uppercase;
  }}

  h2 {{
    font-size: 15pt;
    margin-top: 18pt;
    margin-bottom: 10pt;
  }}

  h3 {{
    font-size: 13.5pt;
    margin-top: 14pt;
    margin-bottom: 8pt;
  }}

  p {{
    margin-top: 0;
    margin-bottom: 10pt;
    text-indent: 0pt;
  }}

  table {{
    width: 100%;
    border-collapse: collapse;
    margin: 14pt 0;
    page-break-inside: avoid;
    font-size: 11pt;
  }}

  table, th, td {{
    border: 1px solid #000;
  }}

  th {{
    background-color: #f5f5f5;
    padding: 6pt 8pt;
    font-weight: bold;
    text-align: left;
  }}

  td {{
    padding: 5pt 8pt;
    vertical-align: top;
  }}

  pre, code {{
    font-family: "Consolas", "Courier New", Courier, monospace;
    font-size: 10pt;
  }}

  pre {{
    background-color: #f8f9fa;
    border: 1px solid #ccc;
    padding: 8pt;
    overflow-x: auto;
    page-break-inside: avoid;
    white-space: pre-wrap;
    word-break: break-all;
    line-height: 1.25;
  }}

  code {{
    background-color: #f1f1f1;
    padding: 1pt 3pt;
    border-radius: 2pt;
  }}

  hr {{
    border: none;
    border-top: 1px solid #000;
    margin: 18pt 0;
    page-break-after: always;
  }}

  .page-break {{
    page-break-after: always;
    break-after: page;
  }}

  ul, ol {{
    margin-top: 0;
    margin-bottom: 10pt;
    padding-left: 25pt;
  }}

  li {{
    margin-bottom: 4pt;
  }}

  blockquote {{
    margin: 12pt 0;
    padding: 8pt 16pt;
    border-left: 4px solid #333;
    background-color: #f9f9f9;
    font-style: italic;
  }}

  .center {{
    text-align: center;
    page-break-inside: avoid;
    margin: 12pt 0;
  }}

  img {{
    max-width: 100%;
    height: auto;
    page-break-inside: avoid;
  }}
</style>
</head>
<body>
{html_body}
</body>
</html>
"""

# Replace page break markers if needed
html_document = html_document.replace('<div style="page-break-after: always;"></div>', '<div class="page-break"></div>')

with open(html_path, "w", encoding="utf-8") as f:
    f.write(html_document)

print(f"HTML successfully generated at: {html_path}")

# Run Microsoft Edge Headless to print to PDF
edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if not os.path.exists(edge_path):
    edge_path = r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"

file_url = "file:///" + html_path.replace("\\", "/")

cmd = [
    edge_path,
    "--headless",
    "--disable-gpu",
    "--no-pdf-header-footer",
    f"--print-to-pdf={pdf_path}",
    file_url
]

print("Executing Edge headless to generate PDF...")
result = subprocess.run(cmd, capture_output=True, text=True)
if os.path.exists(pdf_path):
    size_kb = os.path.getsize(pdf_path) / 1024
    print(f"SUCCESS: PDF created at {pdf_path} (Size: {size_kb:.1f} KB)")
else:
    print(f"Error generating PDF: {result.stderr}")
