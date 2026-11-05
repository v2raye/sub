import csv,base64,re
from pathlib import Path
root=Path(__file__).resolve().parent.parent
text=(root/'YouTube.mod').read_text()
script_rules=[]
for line in text.splitlines():
 if not re.match(r'^[01],',line):continue
 fields=next(csv.reader([line],skipinitialspace=True))
 if fields[1]=='100':
  assert len(fields)==4
  code=base64.b64decode(fields[3],validate=True).decode()
  assert '[YouTube/diag' not in code and '$request' not in code
  script_rules.append((fields[0],re.compile(fields[2])))
for host in ['redirector.googlevideo.com','redirector-test.googlevideo.com','redirector123.googlevideo.com']:
 for scheme in ['http','https']:
  url=f'{scheme}://{host}/initplayback?foo=1'
  assert not any(pattern.search(url) for _,pattern in script_rules),url
for phase in ['0','1']:
 url='https://rr1---sn-test.googlevideo.com/initplayback?foo=1'
 assert sum(bool(pattern.search(url)) for p,pattern in script_rules if p==phase)==1
print('PASS: embedded scripts, redirector exclusion, normal CDN request/UMP matching')
