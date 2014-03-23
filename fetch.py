#!/usr/bin/env python
# -*- coding: utf-8 -*-

from __future__ import (division, print_function, absolute_import,
                        unicode_literals)

import os
import sys
import time
import json
import requests
from math import exp
from functools import partial
from operator import itemgetter
from collections import defaultdict
from itertools import izip, imap, product
from values import FOURSQUARE_ID, FOURSQUARE_SECRET

stations = json.load(open("data/stations.json"))
all_results = [[[] for j in xrange(11)] for i in xrange(11)]
all_venues = {}
mapper = defaultdict(lambda: len(mapper))


def compute_score(d, r, v):
    return exp(-(v["distance"]/d)**2)*exp(-((10-v["rating"])/r)**2)


# Set up the request.
url = "https://api.foursquare.com/v2/venues/explore"
q = dict(
    limit=50,
    client_id=FOURSQUARE_ID,
    client_secret=FOURSQUARE_SECRET,
    v="20140212",
)

if len(sys.argv) >= 2:
    q["query"] = " ".join(sys.argv[1:])
    bp = "-".join(sys.argv[1:])
else:
    q["section"] = "coffee"
    bp = "coffee"

try:
    os.makedirs(bp)
except os.error:
    pass

for station in stations:
    print(station["name"])

    # Update the query.
    q["ll"] = "{1},{0}".format(*(station["latlng"]))

    # Send the request.
    r = requests.get(url, params=q, verify=False)
    if r.status_code != requests.codes.ok:
        print("Waiting for 3 minutes after server failure...")
        time.sleep(3 * 60)
        r = requests.get(url, params=q, verify=False)
        if r.status_code != requests.codes.ok:
            r.raise_for_status()
    results = r.json()

    # Parse the venues.
    places = []
    for group in results["response"]["groups"]:
        for item in group["items"]:
            venue = item["venue"]
            if "rating" not in venue:
                continue
            places.append({
                "id": venue["id"],
                "name": venue["name"],
                "rating": venue["rating"],
                "distance": venue["location"]["distance"],
            })

    # Loop over hyperparameter settings and save the venues.
    for d, r in product(reversed(xrange(11)), reversed(xrange(11))):
        v = sorted(izip(imap(partial(compute_score, 300+d*160, 0.5*(r+1)),
                             places), places),
                   key=itemgetter(0), reverse=True)[0][1]
        all_venues[mapper[v["id"]]] = {"id": v["id"],
                                       "name": v["name"],
                                       "rating": v["rating"]}
        all_results[d][r].append(mapper[v["id"]])

json.dump(all_venues, open(os.path.join(bp, "venues.json"), "w"))
json.dump(all_results, open(os.path.join(bp, "grid.json"), "w"))
