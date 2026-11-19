# Joins the source parts into one self-contained page: index.html
import glob,os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
css=''.join(open(f).read()+'\n' for f in sorted(glob.glob('src/*.css')))
js=''.join(open(f).read()+'\n' for f in sorted(glob.glob('src/*.js')))
html=open('src/page.html').read()
out=html.replace('/*CSS*/',css).replace('/*JS*/',js)
open('index.html','w').write(out)
open('_test.html','w').write('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>[hidden]{display:none!important}</style></head><body>'+out+'</body></html>')
print(len(out),'bytes')
