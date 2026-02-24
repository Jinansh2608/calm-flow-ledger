import urllib.request, json, urllib.error
try:
    req = urllib.request.Request(
        'http://localhost:8000/api/projects/35/po?client_id=1',
        data=b'{"po_number":"PO-TEST", "po_date":"2026-02-20", "po_value":0, "po_type":"standard", "notes":"Test"}',
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    res = urllib.request.urlopen(req)
    print("SUCCESS")
    print(res.read().decode())
except urllib.error.HTTPError as e:
    print("ERROR")
    body = e.read().decode()
    try:
        print(json.dumps(json.loads(body), indent=2))
    except:
        print(body)
