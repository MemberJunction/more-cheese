// Flavor banks: names, org-name pieces, cities (with real coordinates), segment mix.
//
// ⚠ PLACEHOLDER QUALITY — knowingly so. The production plan replaces the flat name banks
// with the region-conditioned template library (GAP-6): names should follow real dairy-world
// demographics (hero-roster believability rule #1), so a person's CITY should drive their
// name distribution. The city list with pre-baked lat/long IS the real design (GAP-11a:
// no live geocoding; dairy-belt density on the member map).

export const FIRST = ['Ava','Liam','Noah','Mia','Ella','Owen','Ruth','Cole','Ines','Hugo','Nina','Theo','June','Silas','Wren','Otto','Freya','Bram','Lena','Ezra','Maren','Joss','Petra','Anders','Talia','Rhys','Clio','Dario','Sanne','Kofi','Yuki','Priit','Aroha','Diego','Maeve','Lars','Sofia','Emil','Greta','Nadia'];

export const LAST = ['Hartman','Beck','Okoro','Lindqvist','Marsh','Vega','Kowal','Brandt','Ferris','Nakamura','Oduya','Sorensen','Vidal','Keane','Muller','Ostrom','Pace','Quill','Ryder','Sato','Tamm','Ueda','Voss','Whitaker','Yoder','Zeller','Bauer','Chavez','Dietrich','Eng','Falk','Groen','Hale','Iversen','Jansen','Klein','Lund','Meyer','Novak','Olsen'];

export const CHEESE_WORDS = ['Alpine','Meadow','Cave','Wheel','Rind','Curd','Brook','Dairy','Hollow','Prairie','Cedar','Willow','Granite','Clover','Harvest','Stone','Valley','Summit','Lark','Birch'];

export const ORG_SUFFIX = {
  Producer: ['Creamery','Farmstead','Caves','Dairy Co.'],
  Retailer: ['Cheese Shop','Provisions','Market','Fromagerie'],
  Supplier: ['Supply Co.','Cultures Ltd.','Equipment Co.'],
  Educator: ['Institute','Academy'],
};

// [city, state, lat, lon, weight] — weights give the dairy-belt clustering
export const CITIES = {
  NA: [['Madison','WI',43.0731,-89.4012,3],['Green Bay','WI',44.5133,-88.0133,2],['Petaluma','CA',38.2324,-122.6367,3],['Sonoma','CA',38.2919,-122.458,2],['Burlington','VT',44.4759,-73.2121,2],['Brattleboro','VT',42.8509,-72.5579,1],['Portland','OR',45.5152,-122.6784,2],['Seattle','WA',47.6062,-122.3321,2],['Brooklyn','NY',40.6782,-73.9442,2],['Ithaca','NY',42.4440,-76.5019,1],['Chicago','IL',41.8781,-87.6298,1],['Denver','CO',39.7392,-104.9903,1],['Austin','TX',30.2672,-97.7431,1],['Asheville','NC',35.5951,-82.5515,1]],
  EU: [['Poligny','FR',46.8367,5.7075,2],['Aarhus','DK',56.1629,10.2039,1],['Amsterdam','NL',52.3676,4.9041,1],['Bern','CH',46.9480,7.4474,1],['Somerset','UK',51.0577,-2.7183,1]],
  RoW: [['Hobart','AU',-42.8821,147.3272,1],['Auckland','NZ',-36.8509,174.7645,1],['Guelph','CA-ON',43.5448,-80.2482,1],['Oaxaca','MX',17.0732,-96.7266,1]],
};

export const SEGMENTS = [['Producer',0.38],['Retailer',0.27],['Supplier',0.12],['Educator',0.08],['Enthusiast',0.15]];
