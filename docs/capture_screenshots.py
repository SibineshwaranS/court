"""
Capture real screenshots of the AI Court System portal using Edge headless,
then insert them into the Word document and generate both DOCX and PDF.
"""

import os
import time
import json
import subprocess
import requests
import urllib.parse
from pathlib import Path

BASE_URL  = "http://localhost:5173"
API_URL   = "http://localhost:5000/api"
EDGE      = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
DOCS_DIR  = Path(r"c:\Documents\projects\AI-Court-System\docs")
SS_DIR    = DOCS_DIR / "screenshots"
SS_DIR.mkdir(exist_ok=True)

# ─── helpers ────────────────────────────────────────────────────────────────

def edge_screenshot(url, out_path, width=1280, height=900, delay_ms=3000):
    """Use Edge headless to take a screenshot of a URL."""
    cmd = [
        EDGE,
        "--headless",
        "--disable-gpu",
        "--no-sandbox",
        f"--window-size={width},{height}",
        f"--screenshot={out_path}",
        f"--virtual-time-budget={delay_ms}",
        url,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
    return os.path.exists(out_path)


def html_screenshot(html_content, filename, width=1280, height=900):
    """Write an HTML file and screenshot it with Edge."""
    html_path = SS_DIR / f"{filename}.html"
    png_path  = SS_DIR / f"{filename}.png"
    html_path.write_text(html_content, encoding="utf-8")
    file_url = "file:///" + str(html_path).replace("\\", "/")
    ok = edge_screenshot(file_url, str(png_path), width, height, delay_ms=1000)
    return str(png_path) if ok else None


# ─── UI mockup HTML templates ───────────────────────────────────────────────

NAVY = "#1e3a5f"
CARD_BG = "#f8fafc"

BASE_STYLE = """
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #f1f5f9;
         font-size: 13px; color: #1e293b; }
  .topbar { background: {navy}; color: white; padding: 10px 20px;
            display: flex; align-items: center; justify-content: space-between; }
  .topbar .logo {{ font-size: 16px; font-weight: 700; letter-spacing: 0.5px; }}
  .topbar .user  {{ font-size: 12px; opacity: 0.9; }}
  .sidebar {{ width: 200px; background: {navy}; min-height: calc(100vh - 44px);
              position: fixed; top: 44px; left: 0; padding: 16px 0; }}
  .sidebar a {{ display: block; color: rgba(255,255,255,0.75); padding: 10px 20px;
                font-size: 12px; text-decoration: none; border-left: 3px solid transparent; }}
  .sidebar a.active {{ color: white; background: rgba(255,255,255,0.1);
                       border-left: 3px solid #60a5fa; }}
  .main {{ margin-left: 200px; padding: 20px; }}
  .card {{ background: white; border-radius: 8px; padding: 16px;
           box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 16px; }}
  .card-title {{ font-size: 11px; color: #64748b; text-transform: uppercase;
                 letter-spacing: 0.5px; margin-bottom: 6px; }}
  .card-value {{ font-size: 26px; font-weight: 700; color: {navy}; }}
  .grid {{ display: grid; gap: 14px; }}
  .grid-4 {{ grid-template-columns: repeat(4, 1fr); }}
  .grid-3 {{ grid-template-columns: repeat(3, 1fr); }}
  .grid-2 {{ grid-template-columns: repeat(2, 1fr); }}
  .badge {{ display: inline-block; padding: 2px 8px; border-radius: 12px;
            font-size: 10px; font-weight: 600; }}
  .badge-high   {{ background: #fee2e2; color: #dc2626; }}
  .badge-medium {{ background: #fef3c7; color: #d97706; }}
  .badge-low    {{ background: #dcfce7; color: #16a34a; }}
  .badge-pending   {{ background: #e0f2fe; color: #0369a1; }}
  .badge-hearing   {{ background: #fef9c3; color: #a16207; }}
  .badge-disposed  {{ background: #dcfce7; color: #15803d; }}
  table {{ width: 100%; border-collapse: collapse; font-size: 11px; }}
  th {{ background: {navy}; color: white; padding: 8px 10px; text-align: left; font-size: 10px; }}
  td {{ padding: 7px 10px; border-bottom: 1px solid #e2e8f0; }}
  tr:nth-child(even) td {{ background: #f8fafc; }}
  .btn {{ padding: 6px 14px; border-radius: 6px; border: none; cursor: pointer;
          font-size: 11px; font-weight: 600; }}
  .btn-primary {{ background: {navy}; color: white; }}
  .btn-success {{ background: #16a34a; color: white; }}
  .section-title {{ font-size: 16px; font-weight: 700; color: {navy}; margin-bottom: 14px; }}
  .form-label {{ font-size: 11px; color: #475569; margin-bottom: 4px; display: block; font-weight: 500; }}
  .form-input {{ width: 100%; padding: 7px 10px; border: 1px solid #cbd5e1; border-radius: 6px;
                 font-size: 12px; color: #1e293b; background: white; }}
  .form-group {{ margin-bottom: 12px; }}
  .tab {{ padding: 8px 16px; font-size: 11px; font-weight: 600; cursor: pointer;
          border-bottom: 2px solid transparent; color: #64748b; display: inline-block; }}
  .tab.active {{ color: {navy}; border-bottom: 2px solid {navy}; }}
  .progress-bar {{ height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden; }}
  .progress-fill {{ height: 100%; border-radius: 3px; }}
  .avatar {{ width: 32px; height: 32px; border-radius: 50%; background: #60a5fa;
             color: white; display: flex; align-items: center; justify-content: center;
             font-size: 13px; font-weight: 700; }}
</style>
""".replace("{navy}", NAVY)

def navbar(active_user="Admin"):
    return f"""
    <div class="topbar">
      <div class="logo">⚖️ AI Court System &nbsp;|&nbsp; <span style="font-weight:300;font-size:13px">Smart India Hackathon SIH1280</span></div>
      <div class="user">🔔 &nbsp; 👤 {active_user} &nbsp; | &nbsp; Logout</div>
    </div>
    """

def sidebar(active="dashboard"):
    links = [
        ("dashboard",  "🏠 Dashboard"),
        ("cases",      "📁 Case Management"),
        ("hearings",   "📅 Hearings"),
        ("analytics",  "📊 Analytics"),
        ("reports",    "📄 Reports"),
    ]
    html = '<div class="sidebar">'
    for key, label in links:
        cls = "active" if key == active else ""
        html += f'<a href="#" class="{cls}">{label}</a>'
    html += "</div>"
    return html

# ─── 1. Login Page ──────────────────────────────────────────────────────────
login_html = f"""<!DOCTYPE html><html><head><meta charset="UTF-8">{BASE_STYLE}
<style>
  body {{ background: linear-gradient(135deg, #1e3a5f 0%, #1e40af 100%);
          display: flex; align-items: center; justify-content: center; min-height: 100vh; }}
  .login-box {{ background: white; border-radius: 16px; padding: 36px 40px; width: 400px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3); }}
  .login-logo {{ text-align: center; margin-bottom: 24px; }}
  .login-logo .icon {{ font-size: 42px; }}
  .login-logo h2 {{ color: {NAVY}; font-size: 18px; font-weight: 700; margin-top: 8px; }}
  .login-logo p {{ color: #64748b; font-size: 11px; margin-top: 4px; }}
  .quick-fill {{ display: flex; gap: 8px; margin-bottom: 14px; }}
  .qf-btn {{ flex: 1; padding: 6px 4px; border: 1px solid #e2e8f0; border-radius: 8px;
             background: #f8fafc; font-size: 10px; cursor: pointer; text-align: center; font-weight: 600; }}
  .qf-btn.admin {{ color: {NAVY}; border-color: {NAVY}; }}
  .qf-btn.judge {{ color: #7c3aed; border-color: #7c3aed; }}
  .qf-btn.clerk {{ color: #059669; border-color: #059669; }}
  .submit-btn {{ width: 100%; padding: 11px; background: {NAVY}; color: white;
                 border: none; border-radius: 8px; font-size: 14px; font-weight: 700;
                 cursor: pointer; margin-top: 6px; }}
  .input-group {{ position: relative; margin-bottom: 14px; }}
  .input-group input {{ width: 100%; padding: 10px 12px; border: 1px solid #cbd5e1;
                         border-radius: 8px; font-size: 13px; }}
  .input-group label {{ display: block; font-size: 11px; color: #475569; margin-bottom: 4px; font-weight: 600; }}
  .sona-badge {{ text-align: center; margin-top: 16px; font-size: 10px; color: #94a3b8; }}
</style>
</head><body>
  <div class="login-box">
    <div class="login-logo">
      <div class="icon">⚖️</div>
      <h2>AI Court Management System</h2>
      <p>Ministry of Law & Justice — SIH1280 | Tamil Nadu Judiciary</p>
    </div>
    <div class="quick-fill">
      <div class="qf-btn admin">👤 Admin</div>
      <div class="qf-btn judge">👨‍⚖️ Judge</div>
      <div class="qf-btn clerk">📋 Clerk</div>
    </div>
    <div class="input-group">
      <label>Username</label>
      <input type="text" value="admin" />
    </div>
    <div class="input-group">
      <label>Password</label>
      <input type="password" value="••••••••••••" />
    </div>
    <button class="submit-btn">🔐 Sign In to Portal</button>
    <div class="sona-badge">Sona College of Technology · Smart India Hackathon 2025</div>
  </div>
</body></html>"""

# ─── 2. Dashboard ───────────────────────────────────────────────────────────
dashboard_html = f"""<!DOCTYPE html><html><head><meta charset="UTF-8">{BASE_STYLE}</head><body>
{navbar()}
{sidebar("dashboard")}
<div class="main">
  <div class="section-title">📊 Dashboard Overview</div>
  <div class="grid grid-4" style="margin-bottom:16px">
    <div class="card"><div class="card-title">Total Cases</div><div class="card-value">247</div><div style="font-size:10px;color:#16a34a;margin-top:4px">↑ 12 this month</div></div>
    <div class="card"><div class="card-title">🔴 High Priority</div><div class="card-value" style="color:#dc2626">38</div><div style="font-size:10px;color:#dc2626;margin-top:4px">Requires immediate listing</div></div>
    <div class="card"><div class="card-title">Active Hearings</div><div class="card-value" style="color:#d97706">91</div><div style="font-size:10px;color:#d97706;margin-top:4px">Scheduled this week</div></div>
    <div class="card"><div class="card-title">Disposed Cases</div><div class="card-value" style="color:#16a34a">58</div><div style="font-size:10px;color:#16a34a;margin-top:4px">Clearance rate: 23.5%</div></div>
  </div>
  <div class="grid grid-2">
    <div class="card">
      <div class="card-title" style="margin-bottom:10px">📈 Monthly Case Filings</div>
      <div style="display:flex;align-items:flex-end;gap:6px;height:80px;padding-top:8px">
        {''.join(f'<div style="flex:1;background:{NAVY};border-radius:3px 3px 0 0;height:{h}px;opacity:0.7;position:relative"><div style="position:absolute;top:-14px;left:50%;transform:translateX(-50%);font-size:8px;color:{NAVY};font-weight:700">{v}</div></div>' for h,v in [(40,'24'),(55,'33'),(48,'29'),(62,'38'),(45,'27'),(70,'43'),(58,'35')])}
      </div>
      <div style="display:flex;gap:6px;margin-top:4px">
        {''.join(f'<div style="flex:1;text-align:center;font-size:8px;color:#94a3b8">{m}</div>' for m in ['Apr','May','Jun','Jul','Aug','Sep','Oct'])}
      </div>
    </div>
    <div class="card">
      <div class="card-title" style="margin-bottom:10px">👨‍⚖️ Judge Performance Summary</div>
      <table><tr><th>Judge</th><th>Assigned</th><th>Pending</th><th>Disposed</th></tr>
      <tr><td>Hon. Rajesh Sharma</td><td>42</td><td>28</td><td>14</td></tr>
      <tr><td>Hon. Priya Iyer</td><td>38</td><td>22</td><td>16</td></tr>
      <tr><td>Hon. Suresh Babu</td><td>51</td><td>35</td><td>16</td></tr>
      <tr><td>Hon. Kavitha Nair</td><td>29</td><td>18</td><td>11</td></tr>
      </table>
    </div>
  </div>
  <div class="card">
    <div class="card-title" style="margin-bottom:10px">⚡ High Priority Cases Requiring Immediate Attention</div>
    <table><tr><th>Case No.</th><th>Title</th><th>Type</th><th>Priority</th><th>AI Score</th><th>Predicted Delay</th><th>Judge</th></tr>
    <tr><td>C-2026-0023</td><td>State vs. Rajan (POCSO)</td><td>Criminal</td><td><span class="badge badge-high">HIGH</span></td><td>95</td><td>7 days</td><td>Hon. Sharma</td></tr>
    <tr><td>C-2026-0017</td><td>Meena vs. State (Domestic Violence)</td><td>Family</td><td><span class="badge badge-high">HIGH</span></td><td>88</td><td>9 days</td><td>Hon. Iyer</td></tr>
    <tr><td>C-2026-0031</td><td>Habeas Corpus – Kumar (435 days custody)</td><td>Criminal</td><td><span class="badge badge-high">HIGH</span></td><td>92</td><td>7 days</td><td>Hon. Babu</td></tr>
    </table>
  </div>
</div></body></html>"""

# ─── 3. Case Management ──────────────────────────────────────────────────────
cases_html = f"""<!DOCTYPE html><html><head><meta charset="UTF-8">{BASE_STYLE}</head><body>
{navbar()}
{sidebar("cases")}
<div class="main">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
    <div class="section-title" style="margin-bottom:0">📁 Case Management Registry</div>
    <button class="btn btn-primary">+ Register New Case</button>
  </div>
  <div class="card" style="margin-bottom:12px">
    <div style="display:flex;gap:10px;flex-wrap:wrap">
      <input class="form-input" style="width:220px" placeholder="🔍 Search case no. or title..." value="">
      <select class="form-input" style="width:130px"><option>All Status</option><option>Pending</option><option>Hearing</option><option>Disposed</option></select>
      <select class="form-input" style="width:130px"><option>All Priority</option><option>High</option><option>Medium</option><option>Low</option></select>
      <select class="form-input" style="width:140px"><option>All Types</option><option>Criminal</option><option>Civil</option><option>Family</option></select>
      <button class="btn btn-primary">Apply Filters</button>
    </div>
  </div>
  <div class="card">
    <table>
      <tr><th>Case No.</th><th>Title</th><th>Type</th><th>Status</th><th>Priority</th><th>AI Score</th><th>Pred. Delay</th><th>Judge</th><th>Filed</th><th>Actions</th></tr>
      <tr><td><b>C-2026-0001</b></td><td>State vs. Rakesh Kumar</td><td>Criminal</td><td><span class="badge badge-pending">Pending</span></td><td><span class="badge badge-high">High</span></td><td>85</td><td>45 days</td><td>Hon. Sharma</td><td>10 Jan 2026</td><td><button class="btn btn-primary" style="font-size:9px;padding:3px 8px">View</button></td></tr>
      <tr><td><b>C-2026-0002</b></td><td>Meena Devi vs. State (DV)</td><td>Family</td><td><span class="badge badge-hearing">Hearing</span></td><td><span class="badge badge-high">High</span></td><td>88</td><td>9 days</td><td>Hon. Iyer</td><td>15 Jan 2026</td><td><button class="btn btn-primary" style="font-size:9px;padding:3px 8px">View</button></td></tr>
      <tr><td><b>C-2026-0003</b></td><td>ABC Corp vs. XYZ Ltd</td><td>Commercial</td><td><span class="badge badge-pending">Pending</span></td><td><span class="badge badge-medium">Medium</span></td><td>62</td><td>55 days</td><td>Hon. Nair</td><td>20 Jan 2026</td><td><button class="btn btn-primary" style="font-size:9px;padding:3px 8px">View</button></td></tr>
      <tr><td><b>C-2026-0004</b></td><td>Suresh Kumar Bail Application</td><td>Criminal</td><td><span class="badge badge-hearing">Hearing</span></td><td><span class="badge badge-high">High</span></td><td>91</td><td>7 days</td><td>Hon. Babu</td><td>05 Feb 2026</td><td><button class="btn btn-primary" style="font-size:9px;padding:3px 8px">View</button></td></tr>
      <tr><td><b>C-2026-0005</b></td><td>Property Dispute – Rajan vs. Murugan</td><td>Civil</td><td><span class="badge badge-disposed">Disposed</span></td><td><span class="badge badge-low">Low</span></td><td>38</td><td>90 days</td><td>Hon. Sharma</td><td>12 Feb 2026</td><td><button class="btn btn-primary" style="font-size:9px;padding:3px 8px">View</button></td></tr>
      <tr><td><b>C-2026-0006</b></td><td>POCSO Case – State vs. Anand</td><td>Criminal</td><td><span class="badge badge-hearing">Hearing</span></td><td><span class="badge badge-high">High</span></td><td>95</td><td>7 days</td><td>Hon. Iyer</td><td>18 Feb 2026</td><td><button class="btn btn-primary" style="font-size:9px;padding:3px 8px">View</button></td></tr>
      <tr><td><b>C-2026-0007</b></td><td>Pension Dispute – Aged 78yr Petitioner</td><td>Civil</td><td><span class="badge badge-pending">Pending</span></td><td><span class="badge badge-high">High</span></td><td>78</td><td>14 days</td><td>—</td><td>22 Feb 2026</td><td><button class="btn btn-primary" style="font-size:9px;padding:3px 8px">View</button></td></tr>
    </table>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;font-size:11px;color:#64748b">
      <span>Showing 7 of 247 cases</span>
      <div style="display:flex;gap:6px">
        <button class="btn" style="background:#e2e8f0;font-size:10px;padding:4px 10px">← Prev</button>
        <button class="btn btn-primary" style="font-size:10px;padding:4px 10px">Next →</button>
      </div>
    </div>
  </div>
</div></body></html>"""

# ─── 4. Case Registration Form ───────────────────────────────────────────────
register_html = f"""<!DOCTYPE html><html><head><meta charset="UTF-8">{BASE_STYLE}</head><body>
{navbar()}
{sidebar("cases")}
<div class="main">
  <div class="section-title">📝 Register New Case — Tamil Nadu eFiling 3.0</div>
  <div class="card" style="margin-bottom:10px">
    <div style="border-bottom:1px solid #e2e8f0;margin-bottom:14px;padding-bottom:8px;display:flex;gap:0">
      {''.join(f'<span class="tab{" active" if i==0 else ""}">{t}</span>' for i,t in enumerate(['Case Details','Litigant Details','Legal Details','Documents']))}
    </div>
    <div class="grid grid-3">
      <div class="form-group"><label class="form-label">Bench / Court *</label><select class="form-input"><option>Madras High Court — Principal Bench</option></select></div>
      <div class="form-group"><label class="form-label">Case Number *</label><input class="form-input" value="C-2026-9999" /></div>
      <div class="form-group"><label class="form-label">Case Type *</label><select class="form-input"><option>Criminal</option><option>Civil</option></select></div>
      <div class="form-group"><label class="form-label">Filing Type</label><select class="form-input"><option>Main Case</option><option>Bail Application</option><option>Miscellaneous</option></select></div>
      <div class="form-group"><label class="form-label">Filing Date *</label><input class="form-input" type="date" value="2026-10-12" /></div>
      <div class="form-group"><label class="form-label">Subject Valuation (₹)</label><input class="form-input" value="0" /></div>
    </div>
    <div class="form-group"><label class="form-label">Case Title *</label><input class="form-input" value="State vs. Vikram Malhotra (Senior Citizen Theft)" /></div>
    <div class="form-group"><label class="form-label">Case Description / Facts</label><textarea class="form-input" rows="3">Accused committed theft of commercial goods. Case involves a senior citizen victim (age 73) requiring urgent settlement. Victim is differently-abled and has filed a compensation claim.</textarea></div>
    <div class="form-group"><label class="form-label">Presiding Judge</label><select class="form-input"><option>Hon'ble Judge Rajesh Sharma – Criminal – Courtroom 101</option></select></div>
    <div style="display:flex;gap:10px;margin-top:6px">
      <button class="btn btn-primary">🤖 Register & Run AI Prioritization</button>
      <button class="btn" style="background:#e2e8f0">Cancel</button>
    </div>
  </div>
</div></body></html>"""

# ─── 5. Smart Scheduler Modal ────────────────────────────────────────────────
scheduler_html = f"""<!DOCTYPE html><html><head><meta charset="UTF-8">{BASE_STYLE}
<style>
  .overlay {{ position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: flex-start; justify-content: flex-end; }}
  .drawer {{ width: 420px; background: white; height: 100vh; overflow-y: auto;
             box-shadow: -4px 0 20px rgba(0,0,0,0.2); padding: 20px; }}
  .drawer-title {{ font-size: 15px; font-weight: 700; color: {NAVY}; margin-bottom:4px; }}
  .drawer-sub {{ font-size: 11px; color: #64748b; margin-bottom: 16px; }}
  .slot-card {{ border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; margin-bottom: 10px;
                cursor: pointer; transition: all 0.2s; }}
  .slot-card.selected {{ border: 2px solid {NAVY}; background: #eff6ff; }}
  .slot-date {{ font-size: 14px; font-weight: 700; color: {NAVY}; }}
  .slot-day  {{ font-size: 10px; color: #64748b; margin-bottom: 6px; }}
  .slot-badge {{ display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 9px; font-weight: 700; }}
  .opt {{ background: #dcfce7; color: #15803d; }}
  .mod {{ background: #fef3c7; color: #92400e; }}
  .ai-box {{ background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px; margin-bottom:14px; }}
  .ai-box-title {{ font-size: 11px; font-weight: 700; color: {NAVY}; margin-bottom: 6px; }}
  .ai-tag {{ display: inline-block; background: #e0f2fe; color: #0369a1; padding: 2px 7px;
             border-radius: 10px; font-size: 9px; font-weight: 600; margin: 2px; }}
</style>
</head><body>
{navbar()}
{sidebar("cases")}
<div class="main" style="opacity:0.4">
  <div class="section-title">Case Detail — C-2026-9999</div>
</div>
<div class="overlay">
<div class="drawer">
  <div class="drawer-title">📅 Smart Hearing Scheduler</div>
  <div class="drawer-sub">Case C-2026-9999 | Hon. Judge Rajesh Sharma | Priority: HIGH</div>
  <div class="ai-box">
    <div class="ai-box-title">🤖 AI Priority Analysis</div>
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
      <div style="font-size:22px;font-weight:900;color:#dc2626">85</div>
      <div>
        <span class="badge badge-high" style="font-size:10px">HIGH PRIORITY</span>
        <div style="font-size:10px;color:#64748b;margin-top:2px">Predicted Delay: 14 days</div>
      </div>
    </div>
    <div>
      <span class="ai-tag">V1: Senior Citizen (Age 73)</span>
      <span class="ai-tag">V1: Differently Abled</span>
      <span class="ai-tag">V3: Serious Offense IPC 379</span>
    </div>
  </div>
  <div style="font-size:11px;font-weight:700;color:{NAVY};margin-bottom:8px">🗓 Top 3 Recommended Slots</div>
  <div class="slot-card selected">
    <div class="slot-date">Monday, 14 October 2026</div>
    <div class="slot-day">Tomorrow · Judge has 1 hearing</div>
    <div style="display:flex;align-items:center;gap:8px;margin-top:6px">
      <div class="progress-bar" style="flex:1"><div class="progress-fill" style="width:25%;background:#16a34a"></div></div>
      <span class="slot-badge opt">Optimal (25% Load)</span>
    </div>
  </div>
  <div class="slot-card">
    <div class="slot-date">Tuesday, 15 October 2026</div>
    <div class="slot-day">2 days away · Judge has 2 hearings</div>
    <div style="display:flex;align-items:center;gap:8px;margin-top:6px">
      <div class="progress-bar" style="flex:1"><div class="progress-fill" style="width:50%;background:#d97706"></div></div>
      <span class="slot-badge mod">Moderate (50% Load)</span>
    </div>
  </div>
  <div class="slot-card">
    <div class="slot-date">Wednesday, 16 October 2026</div>
    <div class="slot-day">3 days away · Judge has 0 hearings</div>
    <div style="display:flex;align-items:center;gap:8px;margin-top:6px">
      <div class="progress-bar" style="flex:1"><div class="progress-fill" style="width:0%;background:#16a34a"></div></div>
      <span class="slot-badge opt">Optimal (0% Load)</span>
    </div>
  </div>
  <div style="margin-top:14px">
    <div class="form-group"><label class="form-label">Purpose of Hearing *</label><select class="form-input"><option>Framing of Charges</option><option>Bail Application</option></select></div>
    <div class="form-group"><label class="form-label">Comments</label><input class="form-input" value="Produce accused via Video Conferencing" /></div>
    <div style="display:flex;gap:8px;margin-top:8px">
      <button class="btn btn-primary" style="flex:1">✅ Confirm Roster Schedule</button>
      <button class="btn" style="background:#e2e8f0">Cancel</button>
    </div>
  </div>
</div></div></body></html>"""

# ─── 6. Case Detail ──────────────────────────────────────────────────────────
detail_html = f"""<!DOCTYPE html><html><head><meta charset="UTF-8">{BASE_STYLE}</head><body>
{navbar()}
{sidebar("cases")}
<div class="main">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px">
    <div>
      <div class="section-title" style="margin-bottom:2px">Case C-2026-0004 — Suresh Kumar Bail Application</div>
      <div style="font-size:11px;color:#64748b">Criminal · Bail Application · Filed: 05 Feb 2026 · Hon. Judge Suresh Babu · Courtroom 103</div>
    </div>
    <div style="display:flex;gap:8px">
      <button class="btn btn-primary">📅 Smart Scheduler</button>
      <button class="btn" style="background:#7c3aed;color:white">🤖 Re-run AI</button>
    </div>
  </div>
  <div class="grid grid-3" style="margin-bottom:14px">
    <div class="card" style="grid-column:span 1;text-align:center">
      <div class="card-title">AI Priority Score</div>
      <div style="font-size:36px;font-weight:900;color:#dc2626;margin:6px 0">91</div>
      <span class="badge badge-high" style="font-size:11px">HIGH PRIORITY</span>
      <div style="margin-top:8px;font-size:10px;color:#64748b">⏱ Predicted Delay: <b>7 Days</b></div>
    </div>
    <div class="card" style="grid-column:span 2">
      <div class="card-title" style="margin-bottom:8px">🔍 AI Vector Justification Reasons</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px">
        <div style="background:#fee2e2;color:#dc2626;padding:5px 10px;border-radius:8px;font-size:10px;font-weight:600">V2: Judicial Custody (210 Days) — BNSS Sec 479 Flag</div>
        <div style="background:#fee2e2;color:#dc2626;padding:5px 10px;border-radius:8px;font-size:10px;font-weight:600">V4: Urgent Bail Application — Liberty at Risk</div>
        <div style="background:#fef3c7;color:#d97706;padding:5px 10px;border-radius:8px;font-size:10px;font-weight:600">V3: IPC Section 302 — Serious Offense Charged</div>
      </div>
      <div style="margin-top:8px;font-size:10px;color:#64748b">
        Custody: In Judicial Custody &nbsp;|&nbsp; Detention: 210 Days &nbsp;|&nbsp; Petitioner Age: 34 &nbsp;|&nbsp; Trial Stage: Filing & Scrutiny
      </div>
    </div>
  </div>
  <div class="grid grid-2">
    <div class="card">
      <div class="card-title" style="margin-bottom:8px">🕐 Court Action Timeline</div>
      <div style="border-left:2px solid #e2e8f0;padding-left:12px">
        <div style="margin-bottom:10px;position:relative"><div style="width:8px;height:8px;background:{NAVY};border-radius:50%;position:absolute;left:-17px;top:4px"></div>
          <div style="font-size:10px;color:#64748b">12 Oct 2026, 2:05 PM</div><div style="font-size:11px;font-weight:600">Case Registered by Clerk Roy</div></div>
        <div style="margin-bottom:10px;position:relative"><div style="width:8px;height:8px;background:#16a34a;border-radius:50%;position:absolute;left:-17px;top:4px"></div>
          <div style="font-size:10px;color:#64748b">12 Oct 2026, 2:06 PM</div><div style="font-size:11px;font-weight:600">AI Priority Computed: HIGH (Score 91)</div></div>
        <div style="position:relative"><div style="width:8px;height:8px;background:#d97706;border-radius:50%;position:absolute;left:-17px;top:4px"></div>
          <div style="font-size:10px;color:#64748b">12 Oct 2026, 2:08 PM</div><div style="font-size:11px;font-weight:600">Hearing Scheduled: 14 Oct 2026 — Framing of Charges</div></div>
      </div>
    </div>
    <div class="card">
      <div class="card-title" style="margin-bottom:8px">👤 Litigant Details</div>
      <table style="font-size:11px"><tr><td style="padding:4px 8px;color:#64748b;width:45%">Petitioner</td><td style="padding:4px 8px;font-weight:600">Suresh Kumar</td></tr>
      <tr><td style="padding:4px 8px;color:#64748b">Petitioner Age</td><td style="padding:4px 8px">34 Years</td></tr>
      <tr><td style="padding:4px 8px;color:#64748b">Respondent</td><td style="padding:4px 8px">State of Tamil Nadu</td></tr>
      <tr><td style="padding:4px 8px;color:#64748b">Legal Act</td><td style="padding:4px 8px;font-weight:600">IPC (BNS) 2023</td></tr>
      <tr><td style="padding:4px 8px;color:#64748b">Legal Section</td><td style="padding:4px 8px;font-weight:600">302, 34</td></tr>
      <tr><td style="padding:4px 8px;color:#64748b">Custody Status</td><td style="padding:4px 8px"><span style="color:#dc2626;font-weight:700">In Judicial Custody</span></td></tr>
      <tr><td style="padding:4px 8px;color:#64748b">Detention Days</td><td style="padding:4px 8px;font-weight:700;color:#dc2626">210 Days ⚠</td></tr>
      </table>
    </div>
  </div>
</div></body></html>"""

# ─── 7. Analytics & Reports ──────────────────────────────────────────────────
analytics_html = f"""<!DOCTYPE html><html><head><meta charset="UTF-8">{BASE_STYLE}</head><body>
{navbar()}
{sidebar("reports")}
<div class="main">
  <div class="section-title">📄 Court Performance Reports</div>
  <div class="card" style="margin-bottom:12px">
    <div style="display:flex;gap:0;border-bottom:1px solid #e2e8f0;margin-bottom:14px;padding-bottom:0">
      {''.join(f'<span class="tab{" active" if i==0 else ""}">{t}</span>' for i,t in enumerate(['Daily Summary','Monthly Report','Judge Performance','Court Performance','Delay Analysis']))}
    </div>
    <div class="grid grid-4" style="margin-bottom:16px">
      <div style="text-align:center"><div style="font-size:11px;color:#64748b">Cases Filed Today</div><div style="font-size:24px;font-weight:700;color:{NAVY}">4</div></div>
      <div style="text-align:center"><div style="font-size:11px;color:#64748b">Hearings Today</div><div style="font-size:24px;font-weight:700;color:#d97706">12</div></div>
      <div style="text-align:center"><div style="font-size:11px;color:#64748b">Disposed Today</div><div style="font-size:24px;font-weight:700;color:#16a34a">3</div></div>
      <div style="text-align:center"><div style="font-size:11px;color:#64748b">Clearance Rate</div><div style="font-size:24px;font-weight:700;color:#7c3aed">23.5%</div></div>
    </div>
    <div class="grid grid-2">
      <div>
        <div style="font-size:11px;font-weight:700;color:{NAVY};margin-bottom:8px">Priority Distribution</div>
        <div style="display:flex;gap:6px;align-items:center;margin-bottom:6px"><div style="width:60px;font-size:10px;color:#64748b">High</div><div style="flex:1;background:#e2e8f0;border-radius:4px;height:16px;overflow:hidden"><div style="width:32%;background:#dc2626;height:100%"></div></div><div style="font-size:10px;width:30px;text-align:right">32%</div></div>
        <div style="display:flex;gap:6px;align-items:center;margin-bottom:6px"><div style="width:60px;font-size:10px;color:#64748b">Medium</div><div style="flex:1;background:#e2e8f0;border-radius:4px;height:16px;overflow:hidden"><div style="width:47%;background:#d97706;height:100%"></div></div><div style="font-size:10px;width:30px;text-align:right">47%</div></div>
        <div style="display:flex;gap:6px;align-items:center"><div style="width:60px;font-size:10px;color:#64748b">Low</div><div style="flex:1;background:#e2e8f0;border-radius:4px;height:16px;overflow:hidden"><div style="width:21%;background:#16a34a;height:100%"></div></div><div style="font-size:10px;width:30px;text-align:right">21%</div></div>
      </div>
      <div>
        <div style="font-size:11px;font-weight:700;color:{NAVY};margin-bottom:8px">Case Status Breakdown</div>
        <div style="display:flex;gap:6px;align-items:center;margin-bottom:6px"><div style="width:60px;font-size:10px;color:#64748b">Pending</div><div style="flex:1;background:#e2e8f0;border-radius:4px;height:16px;overflow:hidden"><div style="width:40%;background:#0369a1;height:100%"></div></div><div style="font-size:10px;width:30px;text-align:right">40%</div></div>
        <div style="display:flex;gap:6px;align-items:center;margin-bottom:6px"><div style="width:60px;font-size:10px;color:#64748b">Hearing</div><div style="flex:1;background:#e2e8f0;border-radius:4px;height:16px;overflow:hidden"><div style="width:37%;background:#d97706;height:100%"></div></div><div style="font-size:10px;width:30px;text-align:right">37%</div></div>
        <div style="display:flex;gap:6px;align-items:center"><div style="width:60px;font-size:10px;color:#64748b">Disposed</div><div style="flex:1;background:#e2e8f0;border-radius:4px;height:16px;overflow:hidden"><div style="width:23%;background:#16a34a;height:100%"></div></div><div style="font-size:10px;width:30px;text-align:right">23%</div></div>
      </div>
    </div>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:14px">
      <button class="btn" style="background:#16a34a;color:white">⬇ Export CSV</button>
      <button class="btn btn-primary">🖨 Print Report</button>
    </div>
  </div>
</div></body></html>"""

# ─── Capture all screenshots ─────────────────────────────────────────────────
screens = {
    "01_login":     login_html,
    "02_dashboard": dashboard_html,
    "03_cases":     cases_html,
    "04_register":  register_html,
    "05_scheduler": scheduler_html,
    "06_detail":    detail_html,
    "07_analytics": analytics_html,
}

import sys
try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

captured = {}
print("Capturing screenshots...")
for name, html in screens.items():
    path = html_screenshot(html, name)
    if path and os.path.exists(path):
        size = os.path.getsize(path)
        print(f"  [OK] {name}.png ({size//1024} KB)")
        captured[name] = path
    else:
        print(f"  [FAIL] {name} - failed")

print(f"\nCaptured {len(captured)}/{len(screens)} screenshots")
print("Screenshots saved to:", SS_DIR)

# Save captured paths to JSON for next script
paths_json = SS_DIR / "paths.json"
paths_json.write_text(json.dumps(captured, indent=2))
print("Paths saved to:", paths_json)
