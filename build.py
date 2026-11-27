# Joins the source parts into one self-contained page: index.html
import glob,os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
css=''.join(open(f).read()+'\n' for f in sorted(glob.glob('src/*.css')))
js=''.join(open(f).read()+'\n' for f in sorted(glob.glob('src/*.js')))
GA=open('src/ga.html').read().strip()
html=open('src/page.html').read()
out=html.replace('/*CSS*/',css).replace('/*JS*/',js)
# title, meta, icons and the search-engine profile at the top of page.html belong in <head>:
# social sites and search engines only read them there
import re
m=re.match(r'(\s*(?:<title>.*?</title>|<meta\b[^>]*>|<link\b[^>]*>|<script type="application/ld\+json">.*?</script>|<!--.*?-->)\s*)+',out,re.S)
head=m.group(0) if m else ''
out=out[len(head):]
# a full document with the charset first, so quotes and apostrophes show correctly anywhere it's hosted
open('index.html','w',encoding='utf-8').write('<!doctype html><html lang="en"><head><meta charset="utf-8">'+GA+'<meta name="viewport" content="width=device-width,initial-scale=1"><style>[hidden]{display:none!important}</style>'+head+'</head><body>'+out+'</body></html>')
open('_test.html','w').write('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>[hidden]{display:none!important}</style>'+head+'</head><body>'+out+'</body></html>')
print(len(out),'bytes')
