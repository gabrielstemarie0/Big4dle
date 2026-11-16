// Where each team plays (city centre, approximate). Used for the "km away" clue.
const PLACES = {
  "Anaheim": [33.84, -117.91], "Arizona": [33.45, -112.07], "Atlanta": [33.75, -84.39], "Baltimore": [39.29, -76.61], "Boston": [42.36, -71.06],
  "Brooklyn": [40.68, -73.97], "Buffalo": [42.89, -78.88], "Calgary": [51.05, -114.07], "California": [33.84, -117.91], "Carolina": [35.23, -80.84],
  "Charlotte": [35.23, -80.84], "Chicago": [41.88, -87.63], "Cincinnati": [39.10, -84.51], "Cleveland": [41.50, -81.69], "Colorado": [39.74, -104.99],
  "Columbus": [39.96, -83.00], "Dallas": [32.78, -96.80], "Denver": [39.74, -104.99], "Detroit": [42.33, -83.05], "Edmonton": [53.55, -113.49],
  "Florida": [26.16, -80.32], "Golden State": [37.77, -122.39], "Green Bay": [44.51, -88.02], "Hamilton": [43.26, -79.87], "Hartford": [41.76, -72.67],
  "Houston": [29.76, -95.37], "Indiana": [39.77, -86.16], "Indianapolis": [39.77, -86.16], "Jacksonville": [30.33, -81.66], "Kansas City": [39.10, -94.58],
  "Las Vegas": [36.17, -115.14], "Los Angeles": [34.05, -118.24], "Memphis": [35.15, -90.05], "Miami": [25.76, -80.19], "Mighty Ducks": [33.84, -117.91],
  "Milwaukee": [43.04, -87.91], "Minneapolis": [44.98, -93.27], "Minnesota": [44.98, -93.27], "Montreal": [45.50, -73.57], "Nashville": [36.16, -86.78],
  "New England": [42.09, -71.26], "New Jersey": [40.73, -74.17], "New Orleans": [29.95, -90.07], "New York": [40.71, -74.01], "Oakland": [37.80, -122.27],
  "Oklahoma City": [35.47, -97.52], "Orlando": [28.54, -81.38], "Ottawa": [45.42, -75.70], "Philadelphia": [39.95, -75.17], "Phoenix": [33.45, -112.07],
  "Pittsburgh": [40.44, -80.00], "Portland": [45.52, -122.68], "Quebec": [46.81, -71.21], "Sacramento": [38.58, -121.49], "San Antonio": [29.42, -98.49],
  "San Diego": [32.72, -117.16], "San Francisco": [37.77, -122.42], "San Jose": [37.34, -121.89], "Seattle": [47.61, -122.33], "St. Louis": [38.63, -90.20],
  "Syracuse": [43.05, -76.15], "Tampa Bay": [27.95, -82.46], "Tennessee": [36.16, -86.78], "Texas": [32.75, -97.08], "Toronto": [43.65, -79.38],
  "Utah": [40.76, -111.89], "Vancouver": [49.28, -123.12], "Vegas": [36.17, -115.14], "Washington": [38.91, -77.04], "Winnipeg": [49.90, -97.14]
};
// Teams whose home isn't where their city name points.
const PLACE_OVERRIDES = {
  "Carolina Hurricanes": [35.78, -78.64], "California Angels": [33.84, -117.91], "California Golden Seals": [37.80, -122.27],
  "Florida Marlins": [25.76, -80.19]
};
for (const s of Object.values(TEAMS)) for (const t of s.alltime) t.loc = PLACE_OVERRIDES[t.name] || PLACES[t.city];

// Great-circle distance in whole kilometres.
function kmBetween(a, b) {
  const rad = d => d * Math.PI / 180, [la1, lo1] = a, [la2, lo2] = b;
  const h = Math.sin(rad(la2 - la1) / 2) ** 2 + Math.cos(rad(la1)) * Math.cos(rad(la2)) * Math.sin(rad(lo2 - lo1) / 2) ** 2;
  return Math.round(12742 * Math.asin(Math.sqrt(h)));
}
