#!/usr/bin/env python
# -*- coding: utf-8 -*-

from __future__ import (division, print_function, absolute_import,
                        unicode_literals)

import json
from collections import defaultdict

# Parse the line geometry.
colors = ["A", "C", "E", "B", "D", "F", "M", "G", "J", "Z", "L", "N", "Q",
          "R", "S", "FS", "1", "2", "3", "4", "5", "6", "7"]
lines, sublines = [], []
coords = defaultdict(list)
for line in open("raw/shapes.txt").readlines()[1:]:
    cols = line.split(",")
    k = cols[0]
    l = k[:3].strip(".")
    if l not in colors:
        continue
    coords[k].append([float(cols[2]), float(cols[1])])

# Find the longest representation of the line.
final = {}
for k, v in coords.iteritems():
    l = k[:3].strip(".")
    if k in ["A..S87R", "A..N86R", "5..S03R", "G..N13R"]:
        final[k] = v
        continue
    if l not in final or len(v) > len(final[l]):
        final[l] = v

json.dump([{
    "type": "Feature", "line": l[0],
    "geometry": {"type": "LineString", "coordinates": v}
} for l, v in final.iteritems()], open("data/shapes.json", "w"),
indent=2)
print("sup")

# Parse the station coordinates.
stations = defaultdict(dict)
for line in open("raw/StationEntrances.csv").readlines()[1:]:
    cols = line.split(",")
    k = "-".join(cols[:3])
    stations[k]["latlng"] = [float(cols[4]), float(cols[3])]
    stations[k]["lines"] = " ".join(filter(len, cols[5:15]))
    stations[k]["name"] = cols[2]
    stations[k]["align"] = "rb"  # cm, lt
json.dump(stations.values(), open("data/stations-temp.json", "w"), indent=2)
