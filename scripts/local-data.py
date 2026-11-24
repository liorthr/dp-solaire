#!/usr/bin/env python3
"""Données locales vérifiables pour les pages ville (SEO local).
Sources : Annuaire de l'administration (DILA, api-lannuaire.service-public.fr) pour la mairie,
API Carto IGN + API du Géoportail de l'Urbanisme pour le document d'urbanisme en vigueur.
Écrit src/data/seo/local.json. Aucune donnée inventée : un champ introuvable reste vide."""
import json, subprocess, sys, time, urllib.parse, urllib.request, datetime

CITIES = [
    ("paris", "Paris", "75056"), ("marseille", "Marseille", "13055"), ("lyon", "Lyon", "69123"),
    ("toulouse", "Toulouse", "31555"), ("nice", "Nice", "06088"), ("nantes", "Nantes", "44109"),
    ("montpellier", "Montpellier", "34172"), ("strasbourg", "Strasbourg", "67482"),
    ("bordeaux", "Bordeaux", "33063"), ("lille", "Lille", "59350"),
]

def get(url, tries=8):
    # curl (et non urllib) : passe mieux par les proxys d'entreprise
    for i in range(tries):
        r = subprocess.run(["curl", "-sS", "-m", "40", "-f", "-A", "permizy-local-data", url], capture_output=True, text=True)
        if r.returncode == 0:
            return json.loads(r.stdout)
        if i == tries - 1:
            raise RuntimeError(f"{url[:80]}… : {r.stderr.strip()}")
        time.sleep(2 * (i + 1))

def mairie(insee):
    q = urllib.parse.urlencode({"where": f'code_insee_commune="{insee}" and pivot like "mairie"', "limit": 20,
                                "select": "id,nom,site_internet,telephone,adresse,pivot,url_service_public"})
    res = get(f"https://api-lannuaire.service-public.fr/api/explore/v2.1/catalog/datasets/api-lannuaire-administration/records?{q}")["results"]
    # la mairie principale (et non une mairie annexe ou d'arrondissement)
    res.sort(key=lambda r: (("annexe" in r["nom"].lower()) or ("arrondissement" in r["nom"].lower()) or ("secteur" in r["nom"].lower()), len(r["nom"])))
    if not res: return None
    r = res[0]
    adr = next((a for a in json.loads(r["adresse"] or "[]") if a.get("type_adresse") == "Adresse"), None)
    tel = json.loads(r["telephone"] or "[]"); web = json.loads(r["site_internet"] or "[]")
    return {
        "name": r["nom"], "id": r["id"],
        "address": f'{adr["numero_voie"]}, {adr["code_postal"]} {adr["nom_commune"]}' if adr else None,
        "lat": float(adr["latitude"]) if adr and adr.get("latitude") else None,
        "lon": float(adr["longitude"]) if adr and adr.get("longitude") else None,
        "phone": tel[0]["valeur"] if tel else None,
        "website": web[0]["valeur"] if web else None,
        "source": r.get("url_service_public") or f'https://lannuaire.service-public.fr/{r["id"]}',
    }

def plu(insee, lat, lon):
    mun = get(f"https://apicarto.ign.fr/api/gpu/municipality?insee={insee}")["features"][0]["properties"]
    out = {"rnu": bool(mun.get("is_rnu"))}
    # plans de sauvegarde (PSMV) publiés pour la commune elle-même
    own = get("https://www.geoportail-urbanisme.gouv.fr/api/document?" + urllib.parse.urlencode({"grid": insee, "status": "document.production"}))
    out["psmv"] = sorted({d["name"] for d in own if d["type"] == "PSMV"})
    if out["rnu"] or lat is None: return out
    du = []
    # la mairie est souvent dans un secteur sauvegardé (PSMV) : on essaie quelques points voisins dans la commune
    for dlat, dlon in [(0, 0), (0.02, 0), (-0.02, 0), (0, 0.03), (0, -0.03), (0.03, 0.03), (-0.03, -0.03)]:
        geom = json.dumps({"type": "Point", "coordinates": [lon + dlon, lat + dlat]})
        if not get("https://apicarto.ign.fr/api/gpu/municipality?" + urllib.parse.urlencode({"geom": geom, "insee": insee}))["features"]:
            continue
        feats = get("https://apicarto.ign.fr/api/gpu/document?" + urllib.parse.urlencode({"geom": geom}))["features"]
        du = [f["properties"] for f in feats if f["properties"].get("partition", "").startswith("DU_")]
        if du: break
    if not du:  # point hors PLU (ex. secteur sauvegardé) : document d'urbanisme de la commune elle-même
        d = next((d for d in own if d["name"].startswith("DU_")), None)
        if not d: return out
        return out | {"partition": d["name"], "type": d["type"], "title": d["grid"]["title"], "id": d["id"],
                      "publication": "-".join(reversed(d["publicationDate"][:10].split("/"))),
                      "url": f'https://www.geoportail-urbanisme.gouv.fr/document/by-id/{d["id"]}'}
    f = du[0]
    out |= {"partition": f["partition"], "type": f["du_type"], "title": f["grid_title"], "id": f["gpu_doc_id"],
            "publication": f["gpu_timestamp"][:10], "url": f'https://www.geoportail-urbanisme.gouv.fr/document/by-id/{f["gpu_doc_id"]}'}
    # date de publication exacte quand la partition est interrogeable telle quelle
    try:
        docs = get("https://www.geoportail-urbanisme.gouv.fr/api/document?" + urllib.parse.urlencode({"partition": f["partition"], "status": "document.production"}), tries=1)
        if docs and docs[0]["id"] == f["gpu_doc_id"]:
            out["publication"] = "-".join(reversed(docs[0]["publicationDate"][:10].split("/")))
    except RuntimeError:
        pass
    return out

data = {"fetchedAt": datetime.date.today().isoformat(), "cities": []}
for slug, name, insee in CITIES:
    m = mairie(insee)
    p = plu(insee, m and m["lat"], m and m["lon"])
    data["cities"].append({"slug": slug, "name": name, "insee": insee, "mairie": m, "plu": p})
    print(slug, "|", m and m["name"], "|", p.get("type"), p.get("title"), p.get("publication"), file=sys.stderr)
json.dump(data, open("src/data/seo/local.json", "w"), ensure_ascii=False, indent=2)
