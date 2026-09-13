import urllib.request
import json

endpoints = [
    ('FastAPI Personas', 'http://127.0.0.1:8000/api/v1/auth/personas'),
    ('FastAPI Integrations', 'http://127.0.0.1:8000/api/v1/integrations'),
    ('Next.js Integrations Hub', 'http://localhost:3001/integrations'),
    ('Next.js Login Page', 'http://localhost:3001/login'),
    ('Next.js Public Support', 'http://localhost:3001/support'),
    ('Next.js Cases Queue', 'http://localhost:3001/cases'),
    ('Next.js Incident Canvas', 'http://localhost:3001/incidents'),
    ('Next.js CX Analytics', 'http://localhost:3001/analytics')
]

for name, url in endpoints:
    try:
        with urllib.request.urlopen(url) as res:
            print(f'{name}: HTTP {res.status}')
    except Exception as e:
        print(f'{name}: FAILED ({e})')

# Test POST diagnostic ping
req = urllib.request.Request('http://127.0.0.1:8000/api/v1/integrations/datadog/test', data=b'', headers={'Content-Type': 'application/json'})
with urllib.request.urlopen(req) as res:
    data = json.loads(res.read().decode())
    print('Datadog Diagnostic Test:', res.status, data['data']['status'], f"{data['data']['latency_ms']}ms")
