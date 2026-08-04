/* ------------------------------------------------------------------ */
/*  GEO / "Watch In" location data for pSEO landing pages               */
/*                                                                      */
/*  Each entry powers /watch-in/[slug]. User-facing copy is generated    */
/*  from verified structural fields and explicitly qualifies that title  */
/*  availability can vary by device and location.                        */
/* ------------------------------------------------------------------ */

export type LocationType = "city" | "state" | "country";

export interface LocationPage {
  slug: string; // e.g. "new-york", "texas", "united-kingdom"
  name: string; // "New York", "Texas", "United Kingdom"
  type: LocationType;
  region: string; // e.g. "Northeast US", "US State", "Europe"
  locale?: string; // BCP-47 if a translated locale exists, else undefined
  intro: string;
  blurb: string;
}

type LocationSeed = Omit<LocationPage, "intro" | "blurb">;

/* ------------------------------------------------------------------ */
/*  US CITIES (30)                                                     */
/* ------------------------------------------------------------------ */

const CITIES: LocationSeed[] = [
  {
    slug: "new-york",
    name: "New York",
    type: "city",
    region: "Northeast US",
  },
  {
    slug: "los-angeles",
    name: "Los Angeles",
    type: "city",
    region: "West Coast US",
  },
  {
    slug: "chicago",
    name: "Chicago",
    type: "city",
    region: "Midwest US",
  },
  {
    slug: "houston",
    name: "Houston",
    type: "city",
    region: "Southern US",
  },
  {
    slug: "phoenix",
    name: "Phoenix",
    type: "city",
    region: "Southwest US",
  },
  {
    slug: "philadelphia",
    name: "Philadelphia",
    type: "city",
    region: "Northeast US",
  },
  {
    slug: "san-antonio",
    name: "San Antonio",
    type: "city",
    region: "Southern US",
  },
  {
    slug: "san-diego",
    name: "San Diego",
    type: "city",
    region: "West Coast US",
  },
  {
    slug: "dallas",
    name: "Dallas",
    type: "city",
    region: "Southern US",
  },
  {
    slug: "miami",
    name: "Miami",
    type: "city",
    region: "Southeast US",
  },
  {
    slug: "atlanta",
    name: "Atlanta",
    type: "city",
    region: "Southeast US",
  },
  {
    slug: "boston",
    name: "Boston",
    type: "city",
    region: "Northeast US",
  },
  {
    slug: "seattle",
    name: "Seattle",
    type: "city",
    region: "Pacific Northwest US",
  },
  {
    slug: "las-vegas",
    name: "Las Vegas",
    type: "city",
    region: "Southwest US",
  },
  {
    slug: "denver",
    name: "Denver",
    type: "city",
    region: "Mountain West US",
  },
  {
    slug: "washington-dc",
    name: "Washington DC",
    type: "city",
    region: "Mid-Atlantic US",
  },
  {
    slug: "nashville",
    name: "Nashville",
    type: "city",
    region: "Southern US",
  },
  {
    slug: "austin",
    name: "Austin",
    type: "city",
    region: "Southern US",
  },
  {
    slug: "orlando",
    name: "Orlando",
    type: "city",
    region: "Southeast US",
  },
  {
    slug: "charlotte",
    name: "Charlotte",
    type: "city",
    region: "Southeast US",
  },
  {
    slug: "detroit",
    name: "Detroit",
    type: "city",
    region: "Midwest US",
  },
  {
    slug: "minneapolis",
    name: "Minneapolis",
    type: "city",
    region: "Midwest US",
  },
  {
    slug: "tampa",
    name: "Tampa",
    type: "city",
    region: "Southeast US",
  },
  {
    slug: "portland",
    name: "Portland",
    type: "city",
    region: "Pacific Northwest US",
  },
  {
    slug: "san-francisco",
    name: "San Francisco",
    type: "city",
    region: "West Coast US",
  },
  {
    slug: "sacramento",
    name: "Sacramento",
    type: "city",
    region: "West Coast US",
  },
  {
    slug: "kansas-city",
    name: "Kansas City",
    type: "city",
    region: "Midwest US",
  },
  {
    slug: "columbus",
    name: "Columbus",
    type: "city",
    region: "Midwest US",
  },
  {
    slug: "indianapolis",
    name: "Indianapolis",
    type: "city",
    region: "Midwest US",
  },
  {
    slug: "new-orleans",
    name: "New Orleans",
    type: "city",
    region: "Southern US",
  },
];

/* ------------------------------------------------------------------ */
/*  US STATES (15)                                                     */
/* ------------------------------------------------------------------ */

const STATES: LocationSeed[] = [
  {
    slug: "california",
    name: "California",
    type: "state",
    region: "US State",
  },
  {
    slug: "texas",
    name: "Texas",
    type: "state",
    region: "US State",
  },
  {
    slug: "florida",
    name: "Florida",
    type: "state",
    region: "US State",
  },
  {
    slug: "new-york-state",
    name: "New York",
    type: "state",
    region: "US State",
  },
  {
    slug: "illinois",
    name: "Illinois",
    type: "state",
    region: "US State",
  },
  {
    slug: "pennsylvania",
    name: "Pennsylvania",
    type: "state",
    region: "US State",
  },
  {
    slug: "georgia",
    name: "Georgia",
    type: "state",
    region: "US State",
  },
  {
    slug: "north-carolina",
    name: "North Carolina",
    type: "state",
    region: "US State",
  },
  {
    slug: "ohio",
    name: "Ohio",
    type: "state",
    region: "US State",
  },
  {
    slug: "michigan",
    name: "Michigan",
    type: "state",
    region: "US State",
  },
  {
    slug: "washington",
    name: "Washington",
    type: "state",
    region: "US State",
  },
  {
    slug: "arizona",
    name: "Arizona",
    type: "state",
    region: "US State",
  },
  {
    slug: "massachusetts",
    name: "Massachusetts",
    type: "state",
    region: "US State",
  },
  {
    slug: "nevada",
    name: "Nevada",
    type: "state",
    region: "US State",
  },
  {
    slug: "tennessee",
    name: "Tennessee",
    type: "state",
    region: "US State",
  },
];

/* ------------------------------------------------------------------ */
/*  COUNTRIES (25)                                                     */
/* ------------------------------------------------------------------ */

const COUNTRIES: LocationSeed[] = [
  {
    slug: "united-states",
    name: "United States",
    type: "country",
    region: "North America",
    locale: "en-US",
  },
  {
    slug: "united-kingdom",
    name: "United Kingdom",
    type: "country",
    region: "Europe",
    locale: "en-GB",
  },
  {
    slug: "canada",
    name: "Canada",
    type: "country",
    region: "North America",
    locale: "en-CA",
  },
  {
    slug: "australia",
    name: "Australia",
    type: "country",
    region: "Oceania",
    locale: "en-AU",
  },
  {
    slug: "ireland",
    name: "Ireland",
    type: "country",
    region: "Europe",
    locale: "en-IE",
  },
  {
    slug: "india",
    name: "India",
    type: "country",
    region: "Asia",
    locale: "en-IN",
  },
  {
    slug: "philippines",
    name: "Philippines",
    type: "country",
    region: "Southeast Asia",
    locale: "en-PH",
  },
  {
    slug: "indonesia",
    name: "Indonesia",
    type: "country",
    region: "Southeast Asia",
    locale: "id-ID",
  },
  {
    slug: "malaysia",
    name: "Malaysia",
    type: "country",
    region: "Southeast Asia",
    locale: "ms-MY",
  },
  {
    slug: "singapore",
    name: "Singapore",
    type: "country",
    region: "Southeast Asia",
    locale: "en-SG",
  },
  {
    slug: "nigeria",
    name: "Nigeria",
    type: "country",
    region: "Africa",
    locale: "en-NG",
  },
  {
    slug: "kenya",
    name: "Kenya",
    type: "country",
    region: "Africa",
    locale: "en-KE",
  },
  {
    slug: "south-africa",
    name: "South Africa",
    type: "country",
    region: "Africa",
    locale: "en-ZA",
  },
  {
    slug: "brazil",
    name: "Brazil",
    type: "country",
    region: "South America",
    locale: "pt-BR",
  },
  {
    slug: "mexico",
    name: "Mexico",
    type: "country",
    region: "North America",
    locale: "es-MX",
  },
  {
    slug: "argentina",
    name: "Argentina",
    type: "country",
    region: "South America",
    locale: "es-AR",
  },
  {
    slug: "colombia",
    name: "Colombia",
    type: "country",
    region: "South America",
    locale: "es-CO",
  },
  {
    slug: "germany",
    name: "Germany",
    type: "country",
    region: "Europe",
    locale: "de-DE",
  },
  {
    slug: "france",
    name: "France",
    type: "country",
    region: "Europe",
    locale: "fr-FR",
  },
  {
    slug: "spain",
    name: "Spain",
    type: "country",
    region: "Europe",
    locale: "es-ES",
  },
  {
    slug: "italy",
    name: "Italy",
    type: "country",
    region: "Europe",
    locale: "it-IT",
  },
  {
    slug: "netherlands",
    name: "Netherlands",
    type: "country",
    region: "Europe",
    locale: "nl-NL",
  },
  {
    slug: "united-arab-emirates",
    name: "United Arab Emirates",
    type: "country",
    region: "Middle East",
    locale: "ar-AE",
  },
  {
    slug: "saudi-arabia",
    name: "Saudi Arabia",
    type: "country",
    region: "Middle East",
    locale: "ar-SA",
  },
  {
    slug: "japan",
    name: "Japan",
    type: "country",
    region: "Asia",
    locale: "ja-JP",
  },
];

/* ------------------------------------------------------------------ */
/*  Combined export + helpers                                          */
/* ------------------------------------------------------------------ */

function withVerifiedCopy(location: LocationSeed): LocationPage {
  return {
    ...location,
    intro: `This ${location.type} guide is for viewers checking VERZA TV in ${location.name} (${location.region}). Explore phone-first vertical micro-dramas across romance, thrillers, mystery, revenge, and family drama. Content availability can vary by title, device, and location. Each title page shows its current episode count, free-preview availability, and access details.`,
    blurb: `Check VERZA TV availability in ${location.name} and browse phone-first vertical micro-dramas. Title access can vary by device and location.`,
  };
}

export const LOCATIONS: LocationPage[] = [
  ...CITIES,
  ...STATES,
  ...COUNTRIES,
].map(withVerifiedCopy);

export function getLocation(slug: string): LocationPage | undefined {
  return LOCATIONS.find((loc) => loc.slug === slug);
}
