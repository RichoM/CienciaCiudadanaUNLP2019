import scholarly
import json

search_query = scholarly.search_pubs_query('("open-source hardware" OR "open-design movement" OR "open design" OR "open hardware" OR "open machine design") AND ("citizen science" OR "community science" OR "crowd science" OR "crowd-sourced science" OR "civic science" OR "volunteer monitoring")')
all = list(map(lambda art: art.bib, list(search_query)))

f = open("google_scholar.json", "w")
f.write(json.dumps(all))
f.close()