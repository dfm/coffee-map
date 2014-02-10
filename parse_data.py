#!/usr/bin/env python
# -*- coding: utf-8 -*-

from __future__ import (division, print_function, absolute_import,
                        unicode_literals)

import json
from collections import defaultdict

# Parse the line geometry.
colors = ["A", "C", "E", "B", "D", "F", "M", "G", "J", "Z", "L", "N", "Q",
          "R", "S", "FS", "1", "2", "3", "4", "5", "6", "7"]
coords = defaultdict(list)
for line in open("shapes.txt").readlines()[1:]:
    cols = line.split(",")
    k = cols[0]
    l = k[:3].strip(".")
    if k[-1] != "R" or l not in colors:
        continue
    coords[k].append([float(cols[2]), float(cols[1])])
json.dump([{
    "type": "Feature", "line": k[:3].strip("."),
    "geometry": {"type": "LineString", "coordinates": v}
} for k, v in coords.iteritems()], open("shapes.json", "w"))

# Parse the station coordinates.
stations = defaultdict(dict)
for line in open("StationEntrances.csv").readlines()[1:]:
    cols = line.split(",")
    k = "-".join(cols[:3])
    stations[k]["latlng"] = [float(cols[4]), float(cols[3])]
    stations[k]["lines"] = " ".join(filter(len, cols[5:15]))
    stations[k]["name"] = cols[2]
json.dump(stations.values(), open("stations-temp.json", "w"))
