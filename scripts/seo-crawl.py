#!/usr/bin/env python3
"""Audit SEO du site en ligne : statuts, titles, descriptions, H1, canonicals, robots, liens internes, pages orphelines.
Usage : python3 -I scripts/seo-crawl.py [URL de base] ; écrit seo/crawl-latest.json. Sans dépendance externe."""
import ssl,urllib.request,re,html,json,collections,os,sys
CA="/root/.ccr/ca-bundle.crt"
ctx=ssl.create_default_context(cafile=CA) if os.path.exists(CA) else ssl.create_default_context()
B=(sys.argv[1] if len(sys.argv)>1 else "https://permizy.com").rstrip("/")
def get(u):
    try:
        r=urllib.request.urlopen(urllib.request.Request(u,headers={"User-Agent":"PermizySEOAudit/1.0"}),context=ctx,timeout=30)
        return r.status,r.read().decode("utf-8","ignore")
    except urllib.error.HTTPError as e: return e.code,""
sm=get(B+"/sitemap.xml")[1]; seeds=re.findall(r"<loc>(.*?)</loc>",sm)
seen={};queue=list(seeds)+[B+"/"];inlinks=collections.Counter();ext=set()
while queue:
    u=queue.pop(0)
    if u in seen: continue
    st,body=get(u); info={"status":st}
    if body:
        g=lambda p:(re.search(p,body,re.S) or [None,None])[1]
        info["title"]=html.unescape(g(r"<title>(.*?)</title>") or "")
        info["desc"]=html.unescape(g(r'<meta name="description" content="(.*?)"') or "")
        info["canonical"]=g(r'<link rel="canonical" href="(.*?)"')
        info["robots"]=g(r'<meta name="robots" content="(.*?)"')
        info["h1"]=len(re.findall(r"<h1[\s>]",body))
        info["words"]=len(re.sub(r"<[^>]+>"," ",re.sub(r"<(script|style)[^>]*>.*?</\1>","",body,flags=re.S)).split())
        info["imgs_noalt"]=len([m for m in re.findall(r"<img[^>]*>",body) if 'alt=' not in m])
        info["jsonld"]=len(re.findall(r'application/ld\+json',body))
        for h in re.findall(r'href="([^"#?]*)',body):
            if h.startswith("http") and not h.startswith(B): ext.add(h); continue
            if not h.startswith("/") or h.startswith("/_next") or re.search(r"\.(png|svg|ico|pdf|zip|webmanifest|xml|txt)$",h): continue
            full=B+h
            if full!=u: inlinks[full]+=1
            if full not in seen and full not in queue and not h.startswith("/app/"): queue.append(full)
    seen[u]=info
json.dump({"pages":seen,"inlinks":inlinks,"ext":sorted(ext),"sitemap":seeds},open(os.path.join(os.path.dirname(os.path.abspath(__file__)),"..","seo","crawl-latest.json"),"w"),ensure_ascii=False,indent=1)
for u,i in sorted(seen.items()):
    print(i["status"], u.replace(B,""), "| inlinks",inlinks.get(u,0),"| h1",i.get("h1"),"| words",i.get("words"),"| T",len(i.get("title","")),"| D",len(i.get("desc","")),"| canon_ok",i.get("canonical")==u,"| robots",i.get("robots"),"| ld",i.get("jsonld"))
print("not in sitemap:",[u for u in seen if u not in seeds and seen[u]["status"]==200])
print("ext links:",len(ext))
orphans=[u for u in seeds if inlinks.get(u,0)==0 and u.rstrip("/")!=B]
print("orphans (sitemap pages without internal links):",orphans)
long_t=[u for u,i in seen.items() if len(i.get("title",""))>65]; print("titles > 65 chars:",[u.replace(B,"") for u in long_t])
