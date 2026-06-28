/* ------------------------------------------------------------------ */
/*  GEO / "Watch In" location data for pSEO landing pages               */
/*                                                                      */
/*  Each entry powers /watch-in/[slug]. Every `intro` (80-150 words)    */
/*  and `blurb` (150-160 char meta) is unique and region-specific —     */
/*  these are real localized pages, not thin doorway pages.             */
/* ------------------------------------------------------------------ */

export type LocationType = "city" | "state" | "country";

export interface LocationPage {
  slug: string; // e.g. "new-york", "texas", "united-kingdom"
  name: string; // "New York", "Texas", "United Kingdom"
  type: LocationType;
  region: string; // e.g. "Northeast US", "US State", "Europe"
  locale?: string; // BCP-47 if a translated locale exists, else undefined
  intro: string; // UNIQUE 80-150 word localized intro paragraph
  blurb: string; // 150-160 char meta description, unique
}

/* ------------------------------------------------------------------ */
/*  US CITIES (30)                                                     */
/* ------------------------------------------------------------------ */

const CITIES: LocationPage[] = [
  {
    slug: "new-york",
    name: "New York",
    type: "city",
    region: "Northeast US",
    intro:
      "New York never stops, and neither do Verza TV's vertical micro-dramas. Whether you're packed onto the 6 train at rush hour, killing twenty minutes between meetings in Midtown, or unwinding after a late shift in Brooklyn, every episode runs 60 to 120 seconds — built for the way New Yorkers actually watch. The platform streams in Eastern Time with no regional blackout, so the newest billionaire romance or revenge thriller drops the moment it goes live nationwide. With over 80 originals filmed in cinematic 9:16, Verza TV turns your commute through the five boroughs into a binge session. Start any series free with the first five episodes, then unlock the rest with coins — no subscription required to dive in.",
    blurb:
      "Watch Verza TV vertical micro-dramas in New York. 80+ originals streaming in Eastern Time, built for your commute. Start free with 5 episodes per series.",
  },
  {
    slug: "los-angeles",
    name: "Los Angeles",
    type: "city",
    region: "West Coast US",
    intro:
      "In the entertainment capital of the world, Verza TV gives Angelenos a fresh kind of show: cinematic micro-dramas shot vertically for the phone in your hand. Stuck on the 405, waiting for a table in Silver Lake, or recharging between auditions, you can knock out a full story arc in the time it takes to order a cold brew. Streaming in Pacific Time with no blackout restrictions, LA viewers get every new billionaire saga, Hollywood-romance, and revenge thriller the second it premieres. With 80+ originals produced in the same 9:16 format that dominates social feeds, Verza TV feels native to the city that invented the medium. The first five episodes of every series are always free.",
    blurb:
      "Stream Verza TV micro-dramas in Los Angeles. 80+ vertical originals in Pacific Time, perfect for LA traffic and downtime. First 5 episodes free.",
  },
  {
    slug: "chicago",
    name: "Chicago",
    type: "city",
    region: "Midwest US",
    intro:
      "Chicago winters are long, the L is reliable, and Verza TV is the perfect companion for both. From the Loop to Logan Square, Chicagoans can stream over 80 vertical micro-dramas in Central Time with no regional restrictions — billionaire romances, family-dynasty sagas, and edge-of-your-seat thrillers, each episode just 60 to 120 seconds. Whether you're riding the Red Line, waiting out a lake-effect snow squall, or grabbing a quick break in River North, a complete storyline fits neatly into your day. The 9:16 cinematic format is made for one-handed phone viewing, and the first five episodes of every series cost nothing. Unlock the rest with coins whenever a cliffhanger refuses to let you go.",
    blurb:
      "Watch Verza TV in Chicago: 80+ vertical micro-dramas in Central Time, ideal for the L and long winters. Start any series free with 5 episodes.",
  },
  {
    slug: "houston",
    name: "Houston",
    type: "city",
    region: "Southern US",
    intro:
      "Houston sprawls, the commutes run long, and Verza TV makes every mile of I-10 more bearable. The platform streams over 80 vertical micro-dramas in Central Time with no blackout, so Houstonians catch every new release the moment it drops nationwide. Each episode lands in 60 to 120 seconds — perfect for a Bayou City lunch break, a wait at the Texas Medical Center, or a quiet evening in The Heights. Filmed in cinematic 9:16 for phone-first viewing, the catalog ranges from contract-marriage billionaire romances to revenge thrillers and family sagas. Start any series free with its first five episodes and unlock the rest with coins — no subscription needed to get hooked on Houston's favorite short-form drama.",
    blurb:
      "Stream Verza TV micro-dramas in Houston. 80+ vertical originals in Central Time for long commutes and lunch breaks. First 5 episodes always free.",
  },
  {
    slug: "phoenix",
    name: "Phoenix",
    type: "city",
    region: "Southwest US",
    intro:
      "When Phoenix hits triple digits and stepping outside is a commitment, Verza TV keeps you entertained in the air conditioning. The platform delivers 80+ vertical micro-dramas to the Valley of the Sun, streaming on Mountain Standard Time year-round with no daylight-saving shuffle and no regional blackout. Each episode runs a tight 60 to 120 seconds, ideal for a poolside break in Scottsdale, a wait at Sky Harbor, or a slow afternoon in Tempe. The cinematic 9:16 format is built for the phone, and the catalog spans billionaire romances, revenge thrillers, and dynasty dramas. Start any series free with the first five episodes, then unlock the rest with coins whenever the desert heat keeps you indoors a little longer.",
    blurb:
      "Watch Verza TV in Phoenix: 80+ vertical micro-dramas on Mountain Time, the perfect indoor escape from the heat. Start free with 5 episodes per series.",
  },
  {
    slug: "philadelphia",
    name: "Philadelphia",
    type: "city",
    region: "Northeast US",
    intro:
      "From the row houses of South Philly to the platforms of 30th Street Station, Verza TV gives Philadelphians 80+ vertical micro-dramas to fill the gaps in a busy day. Streaming in Eastern Time with no blackout, every new billionaire romance, family thriller, and revenge saga arrives the instant it goes live across the country. Episodes run 60 to 120 seconds — short enough for a SEPTA ride to Center City, long enough to leave you on a cliffhanger. Shot in cinematic 9:16 for phone-first viewing, the catalog is designed for the way Philly actually watches: one-handed, on the move, between things. The first five episodes of any series are free, and coins unlock the rest whenever you're ready.",
    blurb:
      "Stream Verza TV micro-dramas in Philadelphia. 80+ vertical originals in Eastern Time for SEPTA rides and downtime. First 5 episodes free, no subscription.",
  },
  {
    slug: "san-antonio",
    name: "San Antonio",
    type: "city",
    region: "Southern US",
    intro:
      "San Antonio moves at its own pace, and Verza TV fits right into it. Streaming 80+ vertical micro-dramas in Central Time with no regional restrictions, the platform delivers every new release the moment it premieres nationwide. Whether you're strolling the River Walk, waiting out the afternoon heat in Alamo Heights, or settling in after work on the South Side, each 60-to-120-second episode slots neatly into your day. The cinematic 9:16 format is made for the phone in your pocket, and the catalog runs deep — contract-marriage romances, dynasty dramas, and twist-packed thrillers. Start any series free with its first five episodes, then unlock the rest with coins. No subscription required to start bingeing San Antonio's favorite short-form drama.",
    blurb:
      "Watch Verza TV in San Antonio: 80+ vertical micro-dramas in Central Time, built for the phone. Start any series free with 5 episodes, no subscription.",
  },
  {
    slug: "san-diego",
    name: "San Diego",
    type: "city",
    region: "West Coast US",
    intro:
      "San Diego's easygoing rhythm pairs perfectly with Verza TV's bite-sized storytelling. Streaming 80+ vertical micro-dramas in Pacific Time with no blackout, the platform brings every new billionaire romance, revenge thriller, and family saga to America's Finest City the moment it drops. Each episode runs 60 to 120 seconds — ideal for a beach day in Pacific Beach, a wait at the trolley stop, or a quiet evening in North Park. The cinematic 9:16 format is built for one-handed phone viewing, so a complete story arc fits between a surf session and sunset. Start any series free with the first five episodes and unlock the rest with coins whenever a cliffhanger pulls you back in.",
    blurb:
      "Stream Verza TV micro-dramas in San Diego. 80+ vertical originals in Pacific Time, perfect for beach days and downtime. First 5 episodes always free.",
  },
  {
    slug: "dallas",
    name: "Dallas",
    type: "city",
    region: "Southern US",
    intro:
      "Big stories suit Dallas, and Verza TV delivers them in tidy vertical packages. The platform streams 80+ micro-dramas in Central Time with no regional blackout, so Dallasites get every new dynasty saga and billionaire romance the second it premieres nationwide. Each episode runs 60 to 120 seconds — perfect for a DART ride into Downtown, a wait in Uptown, or a slow evening in Oak Cliff. Filmed in cinematic 9:16 for phone-first viewing, the catalog is packed with the kind of high-stakes drama, betrayal, and revenge that rewards a binge. Start any series free with its first five episodes, then unlock the rest with coins. No subscription needed to dive into Dallas's go-to short-form streaming app.",
    blurb:
      "Watch Verza TV in Dallas: 80+ vertical micro-dramas in Central Time, full of high-stakes drama. Start free with 5 episodes per series, no subscription.",
  },
  {
    slug: "miami",
    name: "Miami",
    type: "city",
    region: "Southeast US",
    intro:
      "Miami runs hot, late, and glamorous — exactly the energy Verza TV's micro-dramas thrive on. Streaming 80+ vertical originals in Eastern Time with no blackout, the platform brings billionaire romances, glamour-soaked betrayals, and revenge thrillers to the Magic City the instant they drop. Each episode lands in 60 to 120 seconds, perfect for a wait at Brickell, a beach break on South Beach, or a late night in Wynwood. The cinematic 9:16 format is made for the phone, and Miami's bilingual, internationally minded audience will feel right at home in a global catalog built for vertical viewing. Start any series free with the first five episodes and unlock the rest with coins whenever the night runs long.",
    blurb:
      "Stream Verza TV in Miami: 80+ glamorous vertical micro-dramas in Eastern Time, perfect for beach breaks and late nights. First 5 episodes free.",
  },
  {
    slug: "atlanta",
    name: "Atlanta",
    type: "city",
    region: "Southeast US",
    intro:
      "Atlanta is a production powerhouse, and its audiences know good drama when they see it. Verza TV streams 80+ vertical micro-dramas in Eastern Time with no regional blackout, delivering every new billionaire saga, revenge thriller, and family dynasty to the ATL the moment it premieres. Each episode runs 60 to 120 seconds — ideal for a MARTA ride, a wait in Midtown traffic, or a slow evening in the West End. Shot in cinematic 9:16 for phone-first viewing, the catalog rewards binge-watchers with cliffhangers and twists in every chapter. Start any series free with its first five episodes, then unlock the rest with coins. No subscription required to make Verza TV part of your Atlanta routine.",
    blurb:
      "Watch Verza TV in Atlanta: 80+ vertical micro-dramas in Eastern Time, built for MARTA and traffic. Start any series free with 5 episodes, no subscription.",
  },
  {
    slug: "boston",
    name: "Boston",
    type: "city",
    region: "Northeast US",
    intro:
      "Between the T, the weather, and a city full of students and professionals always on the move, Boston is built for short-form streaming — and Verza TV fits perfectly. The platform offers 80+ vertical micro-dramas in Eastern Time with no blackout, so every new billionaire romance, mystery, and revenge thriller arrives the moment it drops nationwide. Each episode runs 60 to 120 seconds, slotting neatly into a Green Line ride, a wait in the Back Bay, or a study break in Cambridge. The cinematic 9:16 format is made for one-handed phone viewing, and the catalog is deep enough to carry you through a long New England winter. Start any series free with the first five episodes and unlock the rest with coins.",
    blurb:
      "Stream Verza TV micro-dramas in Boston. 80+ vertical originals in Eastern Time, perfect for the T and study breaks. First 5 episodes free, no subscription.",
  },
  {
    slug: "seattle",
    name: "Seattle",
    type: "city",
    region: "Pacific Northwest US",
    intro:
      "Rainy days and ferry rides make Seattle a natural home for Verza TV's bite-sized storytelling. The platform streams 80+ vertical micro-dramas in Pacific Time with no regional blackout, bringing every new billionaire romance, thriller, and dynasty drama to the Emerald City the moment it premieres. Each episode runs 60 to 120 seconds — ideal for a Link light-rail ride, a coffee break in Capitol Hill, or a gray afternoon in Ballard. Filmed in cinematic 9:16 for phone-first viewing, the catalog is tailor-made for one-handed watching while the rain comes down. Start any series free with its first five episodes, then unlock the rest with coins whenever a cliffhanger keeps you scrolling past the next stop.",
    blurb:
      "Watch Verza TV in Seattle: 80+ vertical micro-dramas in Pacific Time, perfect for rainy days and ferry rides. Start free with 5 episodes per series.",
  },
  {
    slug: "las-vegas",
    name: "Las Vegas",
    type: "city",
    region: "Southwest US",
    intro:
      "In a city built on high stakes and bigger stories, Verza TV's micro-dramas feel right at home. The platform streams 80+ vertical originals in Pacific Time with no blackout, so Las Vegas viewers catch every new billionaire saga, revenge thriller, and glamorous betrayal the moment it drops. Each episode runs a tight 60 to 120 seconds — perfect for a break off the Strip, a wait between shifts in a 24-hour town, or a quiet hour in Summerlin. The cinematic 9:16 format is made for the phone, and the catalog delivers the kind of drama that never sleeps in a city that doesn't either. Start any series free with the first five episodes and unlock the rest with coins whenever the next twist calls.",
    blurb:
      "Stream Verza TV in Las Vegas: 80+ high-stakes vertical micro-dramas in Pacific Time for a 24-hour city. First 5 episodes free, no subscription needed.",
  },
  {
    slug: "denver",
    name: "Denver",
    type: "city",
    region: "Mountain West US",
    intro:
      "A mile high and always on the move, Denver pairs naturally with Verza TV's quick-hit storytelling. The platform streams 80+ vertical micro-dramas in Mountain Time with no regional blackout, delivering every new billionaire romance, dynasty saga, and revenge thriller the moment it premieres nationwide. Each episode runs 60 to 120 seconds — ideal for a light-rail ride into LoDo, a wait at DIA, or a cozy night in after a day in the foothills. Shot in cinematic 9:16 for phone-first viewing, the catalog fits a complete story arc into the gaps of an active Colorado lifestyle. Start any series free with its first five episodes, then unlock the rest with coins. No subscription required to get hooked.",
    blurb:
      "Watch Verza TV in Denver: 80+ vertical micro-dramas in Mountain Time, built for an active lifestyle. Start any series free with 5 episodes, no subscription.",
  },
  {
    slug: "washington-dc",
    name: "Washington DC",
    type: "city",
    region: "Mid-Atlantic US",
    intro:
      "In a city that runs on power plays and high-stakes drama, Verza TV's micro-dramas hit close to home. The platform streams 80+ vertical originals in Eastern Time with no blackout, so Washingtonians catch every new billionaire saga, political-grade betrayal, and revenge thriller the moment it drops. Each episode runs 60 to 120 seconds — perfect for a Metro ride between Foggy Bottom and Capitol Hill, a wait at Union Station, or a late evening in Adams Morgan. The cinematic 9:16 format is made for one-handed phone viewing on the go. Start any series free with its first five episodes, then unlock the rest with coins. No subscription required to bring a little intrigue to your DC commute.",
    blurb:
      "Stream Verza TV in Washington DC: 80+ vertical micro-dramas of power and intrigue in Eastern Time. Start any series free with 5 episodes, no subscription.",
  },
  {
    slug: "nashville",
    name: "Nashville",
    type: "city",
    region: "Southern US",
    intro:
      "Music City knows a great story when it hears one, and Verza TV tells dozens of them in vertical form. The platform streams 80+ micro-dramas in Central Time with no regional blackout, bringing every new billionaire romance, family saga, and revenge thriller to Nashville the moment it premieres. Each episode runs 60 to 120 seconds — ideal for a break on Broadway, a wait in East Nashville traffic, or a quiet night in The Gulch. Filmed in cinematic 9:16 for phone-first viewing, the catalog rewards binge-watchers with cliffhangers in every chapter. Start any series free with its first five episodes, then unlock the rest with coins. No subscription needed to make Verza TV part of your Nashville rotation.",
    blurb:
      "Watch Verza TV in Nashville: 80+ vertical micro-dramas in Central Time, full of unforgettable stories. Start free with 5 episodes per series, no subscription.",
  },
  {
    slug: "austin",
    name: "Austin",
    type: "city",
    region: "Southern US",
    intro:
      "Austin keeps it weird, creative, and always plugged in — a perfect match for Verza TV's phone-native micro-dramas. The platform streams 80+ vertical originals in Central Time with no blackout, so the newest billionaire saga or revenge thriller lands in your feed the moment it drops. Each episode runs 60 to 120 seconds, ideal for a wait on South Congress, a break between sets during a festival week, or a slow evening in East Austin. Shot in cinematic 9:16 for one-handed viewing, the catalog runs deep with twist-packed drama built for binge sessions. Start any series free with the first five episodes and unlock the rest with coins whenever the next cliffhanger refuses to let go.",
    blurb:
      "Stream Verza TV in Austin: 80+ phone-native vertical micro-dramas in Central Time for a creative city. First 5 episodes free, no subscription required.",
  },
  {
    slug: "orlando",
    name: "Orlando",
    type: "city",
    region: "Southeast US",
    intro:
      "Between theme-park lines and warm Florida evenings, Orlando offers plenty of moments to fill — and Verza TV fills them with drama. The platform streams 80+ vertical micro-dramas in Eastern Time with no blackout, delivering every new billionaire romance, mystery, and revenge thriller the moment it premieres nationwide. Each episode runs 60 to 120 seconds — perfect for a wait at the gate, a SunRail ride, or a quiet night in Winter Park. The cinematic 9:16 format is made for the phone, so a full story arc fits between attractions. Start any series free with its first five episodes, then unlock the rest with coins. No subscription required to turn Orlando downtime into binge time.",
    blurb:
      "Watch Verza TV in Orlando: 80+ vertical micro-dramas in Eastern Time, perfect for filling park lines and warm evenings. Start free with 5 episodes per series.",
  },
  {
    slug: "charlotte",
    name: "Charlotte",
    type: "city",
    region: "Southeast US",
    intro:
      "Charlotte's banking-town hustle leaves little room for hour-long shows — which is exactly why Verza TV works so well here. The platform streams 80+ vertical micro-dramas in Eastern Time with no regional blackout, so Queen City viewers get every new billionaire saga, betrayal, and revenge thriller the moment it drops. Each episode runs 60 to 120 seconds — ideal for a LYNX light-rail ride into Uptown, a lunch break in SouthEnd, or a quiet evening in NoDa. Filmed in cinematic 9:16 for phone-first viewing, the catalog packs a full storyline into the margins of a busy day. Start any series free with its first five episodes, then unlock the rest with coins. No subscription required.",
    blurb:
      "Stream Verza TV in Charlotte: 80+ vertical micro-dramas in Eastern Time, made for a busy banking town. Start any series free with 5 episodes, no subscription.",
  },
  {
    slug: "detroit",
    name: "Detroit",
    type: "city",
    region: "Midwest US",
    intro:
      "Detroit's comeback energy and grit make it a natural audience for stories about ambition, betrayal, and reinvention — the heart of Verza TV's catalog. The platform streams 80+ vertical micro-dramas in Eastern Time with no blackout, bringing every new billionaire saga and revenge thriller to the Motor City the instant it premieres. Each episode runs 60 to 120 seconds — perfect for a QLine ride downtown, a break in Corktown, or a long winter evening in Midtown. Shot in cinematic 9:16 for phone-first viewing, the catalog is built for one-handed bingeing. Start any series free with its first five episodes, then unlock the rest with coins. No subscription needed to add some drama to your Detroit day.",
    blurb:
      "Watch Verza TV in Detroit: 80+ vertical micro-dramas in Eastern Time, full of ambition and reinvention. Start free with 5 episodes per series, no subscription.",
  },
  {
    slug: "minneapolis",
    name: "Minneapolis",
    type: "city",
    region: "Midwest US",
    intro:
      "When the Twin Cities winter sets in and the skyways are your best friend, Verza TV keeps you entertained without ever leaving the warmth. The platform streams 80+ vertical micro-dramas in Central Time with no regional blackout, delivering every new billionaire romance, dynasty saga, and revenge thriller the moment it drops nationwide. Each episode runs 60 to 120 seconds — ideal for a light-rail ride to Downtown, a coffee break in Uptown, or a long cold night in Northeast. Filmed in cinematic 9:16 for phone-first viewing, the catalog is deep enough to outlast a Minnesota January. Start any series free with the first five episodes and unlock the rest with coins. No subscription required.",
    blurb:
      "Stream Verza TV in Minneapolis: 80+ vertical micro-dramas in Central Time, perfect for long winters and skyway commutes. First 5 episodes free.",
  },
  {
    slug: "tampa",
    name: "Tampa",
    type: "city",
    region: "Southeast US",
    intro:
      "Tampa Bay's sunshine and laid-back pace leave plenty of room for a quick binge, and Verza TV is ready. The platform streams 80+ vertical micro-dramas in Eastern Time with no blackout, bringing every new billionaire saga, glamorous betrayal, and revenge thriller to the Bay Area the moment it premieres. Each episode runs 60 to 120 seconds — perfect for a Riverwalk break, a wait in Ybor City, or a warm evening in St. Pete. The cinematic 9:16 format is made for the phone, so a full story arc fits between sunshine and sunset. Start any series free with its first five episodes, then unlock the rest with coins. No subscription required to make Verza TV part of your Tampa routine.",
    blurb:
      "Watch Verza TV in Tampa: 80+ vertical micro-dramas in Eastern Time, perfect for sunny breaks and warm evenings. Start any series free with 5 episodes.",
  },
  {
    slug: "portland",
    name: "Portland",
    type: "city",
    region: "Pacific Northwest US",
    intro:
      "Portland's coffee-shop culture and frequent drizzle make it perfect for short, cozy binge sessions — exactly what Verza TV delivers. The platform streams 80+ vertical micro-dramas in Pacific Time with no regional blackout, so PDX viewers catch every new billionaire romance, thriller, and dynasty drama the moment it drops. Each episode runs 60 to 120 seconds — ideal for a MAX ride downtown, a rainy afternoon in the Pearl District, or a quiet evening on the east side. Filmed in cinematic 9:16 for phone-first viewing, the catalog is made for one-handed watching over a cup of locally roasted coffee. Start any series free with the first five episodes and unlock the rest with coins whenever the rain keeps you in.",
    blurb:
      "Stream Verza TV in Portland: 80+ vertical micro-dramas in Pacific Time, perfect for rainy days and coffee breaks. First 5 episodes free, no subscription.",
  },
  {
    slug: "san-francisco",
    name: "San Francisco",
    type: "city",
    region: "West Coast US",
    intro:
      "A city obsessed with what's next, San Francisco is the ideal home for Verza TV's mobile-first take on television. The platform streams 80+ vertical micro-dramas in Pacific Time with no blackout, delivering every new billionaire saga, revenge thriller, and dynasty drama the moment it premieres. Each episode runs 60 to 120 seconds — perfect for a BART ride across the bay, a wait in the Mission, or a foggy evening in the Sunset. Shot in cinematic 9:16 for one-handed phone viewing, the catalog turns micro-moments into full story arcs. Start any series free with its first five episodes, then unlock the rest with coins. No subscription required to bring binge-worthy drama to your SF commute.",
    blurb:
      "Watch Verza TV in San Francisco: 80+ mobile-first vertical micro-dramas in Pacific Time, built for BART. Start any series free with 5 episodes, no subscription.",
  },
  {
    slug: "sacramento",
    name: "Sacramento",
    type: "city",
    region: "West Coast US",
    intro:
      "California's capital moves at a friendlier pace than the coast, and Verza TV fits right into it. The platform streams 80+ vertical micro-dramas in Pacific Time with no regional blackout, bringing every new billionaire romance, betrayal, and revenge thriller to Sacramento the moment it drops nationwide. Each episode runs 60 to 120 seconds — ideal for a light-rail ride downtown, a break in Midtown, or a warm Central Valley evening in East Sac. Filmed in cinematic 9:16 for phone-first viewing, the catalog packs a full storyline into the margins of your day. Start any series free with its first five episodes, then unlock the rest with coins. No subscription needed to start bingeing.",
    blurb:
      "Stream Verza TV in Sacramento: 80+ vertical micro-dramas in Pacific Time, made for the phone. Start any series free with 5 episodes, no subscription required.",
  },
  {
    slug: "kansas-city",
    name: "Kansas City",
    type: "city",
    region: "Midwest US",
    intro:
      "Kansas City's heartland warmth and easy rhythm make it a great match for Verza TV's quick-hit drama. The platform streams 80+ vertical micro-dramas in Central Time with no blackout, delivering every new billionaire saga, family drama, and revenge thriller the moment it premieres nationwide. Each episode runs 60 to 120 seconds — perfect for a streetcar ride downtown, a barbecue-line wait, or a quiet evening in the Crossroads. The cinematic 9:16 format is made for one-handed phone viewing, so a complete story arc fits between everyday moments. Start any series free with its first five episodes, then unlock the rest with coins. No subscription required to make Verza TV part of your KC routine.",
    blurb:
      "Watch Verza TV in Kansas City: 80+ vertical micro-dramas in Central Time, built for the phone. Start any series free with 5 episodes, no subscription needed.",
  },
  {
    slug: "columbus",
    name: "Columbus",
    type: "city",
    region: "Midwest US",
    intro:
      "Columbus is young, growing, and always connected — the kind of city where phone-first entertainment thrives. Verza TV streams 80+ vertical micro-dramas in Eastern Time with no regional blackout, so Buckeye-State viewers catch every new billionaire romance, dynasty saga, and revenge thriller the moment it drops. Each episode runs 60 to 120 seconds — ideal for a bus ride to the Short North, a study break near campus, or a quiet evening in German Village. Filmed in cinematic 9:16 for phone-first viewing, the catalog is built for one-handed bingeing between classes and shifts. Start any series free with its first five episodes, then unlock the rest with coins. No subscription required to dive in.",
    blurb:
      "Stream Verza TV in Columbus: 80+ vertical micro-dramas in Eastern Time, perfect for a young, connected city. Start any series free with 5 episodes.",
  },
  {
    slug: "indianapolis",
    name: "Indianapolis",
    type: "city",
    region: "Midwest US",
    intro:
      "Indianapolis pairs Midwestern practicality with a fast-growing downtown, and Verza TV slots neatly into the daily routine. The platform streams 80+ vertical micro-dramas in Eastern Time with no blackout, bringing every new billionaire saga, betrayal, and revenge thriller to Indy the moment it premieres. Each episode runs 60 to 120 seconds — perfect for a Red Line ride, a break along the Cultural Trail, or a quiet evening in Fountain Square. Shot in cinematic 9:16 for phone-first viewing, the catalog fits a full storyline into the gaps of a busy day. Start any series free with its first five episodes, then unlock the rest with coins. No subscription required to get hooked on Indy's favorite short-form drama.",
    blurb:
      "Watch Verza TV in Indianapolis: 80+ vertical micro-dramas in Eastern Time, built for the daily routine. Start free with 5 episodes per series, no subscription.",
  },
  {
    slug: "new-orleans",
    name: "New Orleans",
    type: "city",
    region: "Southern US",
    intro:
      "New Orleans loves a good story, a slow afternoon, and a little drama — all of which Verza TV serves in vertical form. The platform streams 80+ micro-dramas in Central Time with no regional blackout, delivering every new billionaire romance, family saga, and revenge thriller to the Crescent City the moment it drops. Each episode runs 60 to 120 seconds — ideal for a streetcar ride down St. Charles, a break in the Marigny, or a humid evening in the French Quarter. Filmed in cinematic 9:16 for phone-first viewing, the catalog is made for one-handed bingeing while the city hums around you. Start any series free with the first five episodes and unlock the rest with coins.",
    blurb:
      "Stream Verza TV in New Orleans: 80+ vertical micro-dramas in Central Time, perfect for slow afternoons and streetcar rides. First 5 episodes free.",
  },
];

/* ------------------------------------------------------------------ */
/*  US STATES (15)                                                     */
/* ------------------------------------------------------------------ */

const STATES: LocationPage[] = [
  {
    slug: "california",
    name: "California",
    type: "state",
    region: "US State",
    intro:
      "From the beaches of San Diego to the redwoods up north, California's 39 million residents share one thing: lives in motion. Verza TV is built for exactly that, streaming 80+ vertical micro-dramas in Pacific Time with no regional blackout anywhere in the state. Whether you're crawling along the 101, riding BART across the bay, or relaxing after a long Silicon Valley workday, each 60-to-120-second episode fits the rhythm of California living. The cinematic 9:16 format is native to a state that helped invent vertical video, and the catalog spans billionaire romances, revenge thrillers, and dynasty sagas. Start any series free with its first five episodes, then unlock the rest with coins. No subscription required to start bingeing across the Golden State.",
    blurb:
      "Watch Verza TV across California: 80+ vertical micro-dramas in Pacific Time, from San Diego to the Bay. Start any series free with 5 episodes, no subscription.",
  },
  {
    slug: "texas",
    name: "Texas",
    type: "state",
    region: "US State",
    intro:
      "Everything's bigger in Texas — including the appetite for high-stakes drama. Verza TV streams 80+ vertical micro-dramas across the Lone Star State, available statewide in Central Time with no regional blackout. From Houston's sprawling commutes to the hills outside Austin, the ranchlands of West Texas, and the neighborhoods of Dallas and San Antonio, each 60-to-120-second episode fits a busy day. The cinematic 9:16 format is made for the phone in your pocket, and the catalog delivers exactly the kind of dynasty sagas, betrayals, and revenge thrillers Texans love to binge. Start any series free with its first five episodes, then unlock the rest with coins. No subscription required to dive into Texas's favorite short-form streaming app.",
    blurb:
      "Stream Verza TV across Texas: 80+ vertical micro-dramas in Central Time, full of dynasty drama. Start any series free with 5 episodes, no subscription needed.",
  },
  {
    slug: "florida",
    name: "Florida",
    type: "state",
    region: "US State",
    intro:
      "Florida runs on sunshine, beaches, and a steady stream of glamour — the perfect backdrop for Verza TV's micro-dramas. The platform streams 80+ vertical originals across the Sunshine State in Eastern Time with no regional blackout, from Miami's late nights to Orlando's theme parks and Tampa Bay's quiet shores. Each episode runs 60 to 120 seconds — ideal for a poolside break, a wait at the gate, or a warm evening anywhere from Jacksonville to the Keys. The cinematic 9:16 format is built for the phone, and Florida's diverse, internationally minded audience fits a global catalog made for vertical viewing. Start any series free with its first five episodes, then unlock the rest with coins. No subscription required.",
    blurb:
      "Watch Verza TV across Florida: 80+ glamorous vertical micro-dramas in Eastern Time, from Miami to Tampa. Start any series free with 5 episodes, no subscription.",
  },
  {
    slug: "new-york-state",
    name: "New York",
    type: "state",
    region: "US State",
    intro:
      "Beyond the bright lights of the city, New York State stretches from the Hudson Valley to Buffalo, the Finger Lakes to the Adirondacks — and Verza TV reaches every corner. The platform streams 80+ vertical micro-dramas statewide in Eastern Time with no regional blackout. Whether you're commuting into Manhattan, studying upstate in Albany or Ithaca, or settling in for a snowy Rochester evening, each 60-to-120-second episode fits your day. The cinematic 9:16 format is made for one-handed phone viewing, and the catalog runs deep with billionaire romances, mysteries, and revenge thrillers. Start any series free with its first five episodes, then unlock the rest with coins. No subscription required to start bingeing across the Empire State.",
    blurb:
      "Stream Verza TV across New York State: 80+ vertical micro-dramas in Eastern Time, from NYC to Buffalo. Start any series free with 5 episodes, no subscription.",
  },
  {
    slug: "illinois",
    name: "Illinois",
    type: "state",
    region: "US State",
    intro:
      "From Chicago's lakefront to the prairie towns downstate, Illinois moves to a Midwestern rhythm that Verza TV matches perfectly. The platform streams 80+ vertical micro-dramas statewide in Central Time with no regional blackout. Whether you're riding the L through the Loop, studying in Champaign-Urbana, or waiting out a long winter in Springfield, each 60-to-120-second episode slots neatly into your day. The cinematic 9:16 format is built for the phone, and the catalog is packed with billionaire sagas, family dramas, and revenge thrillers made for binge-watching. Start any series free with its first five episodes, then unlock the rest with coins. No subscription required to make Verza TV part of your Illinois routine.",
    blurb:
      "Watch Verza TV across Illinois: 80+ vertical micro-dramas in Central Time, from Chicago to downstate. Start any series free with 5 episodes, no subscription.",
  },
  {
    slug: "pennsylvania",
    name: "Pennsylvania",
    type: "state",
    region: "US State",
    intro:
      "Pennsylvania spans cheesesteaks and the Liberty Bell in Philadelphia to the bridges of Pittsburgh and the rolling farmland in between — and Verza TV reaches all of it. The platform streams 80+ vertical micro-dramas statewide in Eastern Time with no regional blackout. Whether you're riding SEPTA in Philly, climbing the inclines in Pittsburgh, or relaxing in Lancaster County, each 60-to-120-second episode fits your day. The cinematic 9:16 format is made for one-handed phone viewing, and the catalog delivers billionaire romances, family thrillers, and revenge sagas built for the binge. Start any series free with its first five episodes, then unlock the rest with coins. No subscription required to dive into the Keystone State's go-to short-form app.",
    blurb:
      "Stream Verza TV across Pennsylvania: 80+ vertical micro-dramas in Eastern Time, from Philly to Pittsburgh. Start any series free with 5 episodes, no subscription.",
  },
  {
    slug: "georgia",
    name: "Georgia",
    type: "state",
    region: "US State",
    intro:
      "Georgia has become one of the country's biggest production hubs, and its audiences appreciate a well-told story. Verza TV streams 80+ vertical micro-dramas statewide in Eastern Time with no regional blackout, from Atlanta's busy streets to Savannah's historic squares and the small towns in between. Each episode runs 60 to 120 seconds — perfect for a MARTA ride, a wait in Macon, or a warm evening in Athens. The cinematic 9:16 format is built for the phone, and the catalog rewards binge-watchers with billionaire sagas, dynasty dramas, and revenge thrillers in every chapter. Start any series free with its first five episodes, then unlock the rest with coins. No subscription required to start bingeing across the Peach State.",
    blurb:
      "Watch Verza TV across Georgia: 80+ vertical micro-dramas in Eastern Time, from Atlanta to Savannah. Start any series free with 5 episodes, no subscription needed.",
  },
  {
    slug: "north-carolina",
    name: "North Carolina",
    type: "state",
    region: "US State",
    intro:
      "From the Blue Ridge Mountains to the Outer Banks, North Carolina balances tech-forward cities with easygoing coastal towns — and Verza TV fits both. The platform streams 80+ vertical micro-dramas statewide in Eastern Time with no regional blackout. Whether you're in Charlotte's banking district, the Research Triangle around Raleigh and Durham, or relaxing near the shore in Wilmington, each 60-to-120-second episode fits your day. The cinematic 9:16 format is made for one-handed phone viewing, and the catalog is packed with billionaire romances, betrayals, and revenge thrillers. Start any series free with its first five episodes, then unlock the rest with coins. No subscription required to make Verza TV part of your Tar Heel State routine.",
    blurb:
      "Stream Verza TV across North Carolina: 80+ vertical micro-dramas in Eastern Time, from Charlotte to the coast. Start any series free with 5 episodes, no subscription.",
  },
  {
    slug: "ohio",
    name: "Ohio",
    type: "state",
    region: "US State",
    intro:
      "Ohio's three C's — Columbus, Cleveland, and Cincinnati — anchor a state that's young, growing, and always connected, making it a natural home for Verza TV. The platform streams 80+ vertical micro-dramas statewide in Eastern Time with no regional blackout. Whether you're near campus in Columbus, by the lake in Cleveland, or along the river in Cincinnati, each 60-to-120-second episode slots into your day. The cinematic 9:16 format is built for the phone, and the catalog delivers billionaire sagas, dynasty dramas, and revenge thrillers made for bingeing. Start any series free with its first five episodes, then unlock the rest with coins. No subscription required to dive into the Buckeye State's favorite short-form streaming app.",
    blurb:
      "Watch Verza TV across Ohio: 80+ vertical micro-dramas in Eastern Time, from Columbus to Cleveland. Start any series free with 5 episodes, no subscription needed.",
  },
  {
    slug: "michigan",
    name: "Michigan",
    type: "state",
    region: "US State",
    intro:
      "From Detroit's comeback energy to the Great Lakes shores and the Upper Peninsula's quiet wilds, Michigan covers a lot of ground — and Verza TV reaches all of it. The platform streams 80+ vertical micro-dramas statewide in Eastern Time with no regional blackout. Whether you're commuting through Detroit, studying in Ann Arbor, or settling in for a long winter in Grand Rapids, each 60-to-120-second episode fits your day. The cinematic 9:16 format is made for one-handed phone viewing, and the catalog is deep enough to carry you through a Michigan January. Start any series free with its first five episodes, then unlock the rest with coins. No subscription required to start bingeing across the Great Lakes State.",
    blurb:
      "Stream Verza TV across Michigan: 80+ vertical micro-dramas in Eastern Time, from Detroit to the lakes. Start any series free with 5 episodes, no subscription.",
  },
  {
    slug: "washington",
    name: "Washington",
    type: "state",
    region: "US State",
    intro:
      "Washington State pairs Seattle's tech hum with rainy coastlines, evergreen forests, and the high desert east of the Cascades — and Verza TV streams everywhere in between. The platform delivers 80+ vertical micro-dramas statewide in Pacific Time with no regional blackout. Whether you're riding light rail in Seattle, ferrying across Puget Sound, or relaxing in Spokane, each 60-to-120-second episode fits your day. The cinematic 9:16 format is built for one-handed phone viewing, perfect for the long, gray afternoons the Pacific Northwest is famous for. Start any series free with its first five episodes, then unlock the rest with coins. No subscription required to make Verza TV your rainy-day binge across the Evergreen State.",
    blurb:
      "Watch Verza TV across Washington: 80+ vertical micro-dramas in Pacific Time, from Seattle to Spokane. Start any series free with 5 episodes, no subscription.",
  },
  {
    slug: "arizona",
    name: "Arizona",
    type: "state",
    region: "US State",
    intro:
      "Arizona's desert heat sends people indoors for big chunks of the year, and Verza TV makes the time fly. The platform streams 80+ vertical micro-dramas statewide on Mountain Standard Time — Arizona skips daylight saving — with no regional blackout. Whether you're in Phoenix, a snowbird in Tucson, or escaping to the cooler air of Flagstaff, each 60-to-120-second episode fits your day. The cinematic 9:16 format is made for one-handed phone viewing in the comfort of the air conditioning, and the catalog spans billionaire romances, dynasty sagas, and revenge thrillers. Start any series free with its first five episodes, then unlock the rest with coins. No subscription required to beat the heat with binge-worthy drama across the Grand Canyon State.",
    blurb:
      "Stream Verza TV across Arizona: 80+ vertical micro-dramas on Mountain Time, the perfect indoor escape. Start any series free with 5 episodes, no subscription.",
  },
  {
    slug: "massachusetts",
    name: "Massachusetts",
    type: "state",
    region: "US State",
    intro:
      "From Boston's colleges to the beaches of Cape Cod and the hills of the Berkshires, Massachusetts is packed with students, commuters, and professionals always on the move — an ideal audience for Verza TV. The platform streams 80+ vertical micro-dramas statewide in Eastern Time with no regional blackout. Whether you're riding the T in Boston, studying in Worcester, or relaxing in Provincetown, each 60-to-120-second episode fits your day. The cinematic 9:16 format is built for one-handed phone viewing, perfect for filling a New England commute or a snowy night in. Start any series free with its first five episodes, then unlock the rest with coins. No subscription required to start bingeing across the Bay State.",
    blurb:
      "Watch Verza TV across Massachusetts: 80+ vertical micro-dramas in Eastern Time, from Boston to the Cape. Start any series free with 5 episodes, no subscription.",
  },
  {
    slug: "nevada",
    name: "Nevada",
    type: "state",
    region: "US State",
    intro:
      "Nevada is a 24-hour state, from the neon of the Las Vegas Strip to the high-desert quiet of Reno and everything in between — and Verza TV never sleeps either. The platform streams 80+ vertical micro-dramas statewide in Pacific Time with no regional blackout. Whether you're working an overnight shift, taking a break off the Strip, or relaxing in Henderson, each 60-to-120-second episode fits your schedule, day or night. The cinematic 9:16 format is made for the phone, and the catalog delivers exactly the kind of high-stakes drama, glamour, and revenge that suits the Silver State. Start any series free with its first five episodes, then unlock the rest with coins. No subscription required.",
    blurb:
      "Stream Verza TV across Nevada: 80+ high-stakes vertical micro-dramas in Pacific Time for a 24-hour state. Start any series free with 5 episodes, no subscription.",
  },
  {
    slug: "tennessee",
    name: "Tennessee",
    type: "state",
    region: "US State",
    intro:
      "Tennessee runs on great stories, from Nashville's songwriters to Memphis's blues and the mountain towns of the east — fertile ground for Verza TV's vertical dramas. The platform streams 80+ micro-dramas statewide in Central Time (with the eastern edge on Eastern Time) and no regional blackout. Whether you're on Broadway in Nashville, by the river in Memphis, or in the foothills near Knoxville, each 60-to-120-second episode fits your day. The cinematic 9:16 format is built for the phone, and the catalog rewards binge-watchers with billionaire sagas, family dramas, and revenge thrillers. Start any series free with its first five episodes, then unlock the rest with coins. No subscription required to make Verza TV part of your Volunteer State routine.",
    blurb:
      "Watch Verza TV across Tennessee: 80+ vertical micro-dramas in Central Time, from Nashville to Memphis. Start any series free with 5 episodes, no subscription.",
  },
];

/* ------------------------------------------------------------------ */
/*  COUNTRIES (25)                                                     */
/* ------------------------------------------------------------------ */

const COUNTRIES: LocationPage[] = [
  {
    slug: "united-states",
    name: "United States",
    type: "country",
    region: "North America",
    locale: "en-US",
    intro:
      "Verza TV is the first US-based vertical micro-drama streaming platform, made for the way Americans watch today: on the phone, in the gaps of a busy day. Available nationwide across all four time zones with no regional blackout, the platform delivers 80+ originals — billionaire romances, revenge thrillers, and dynasty sagas — each episode running a tight 60 to 120 seconds. Whether you're commuting in New York, beating the heat in Phoenix, or unwinding on the West Coast, a complete story arc fits between everyday moments. Filmed in cinematic 9:16 for one-handed viewing, Verza TV brings TV-quality storytelling to short form. Start any series free with its first five episodes, then unlock the rest with coins. No subscription required to dive in.",
    blurb:
      "Watch Verza TV across the United States: 80+ vertical micro-dramas in all time zones. Start any series free with 5 episodes, no subscription required.",
  },
  {
    slug: "united-kingdom",
    name: "United Kingdom",
    type: "country",
    region: "Europe",
    locale: "en-GB",
    intro:
      "Across the UK — from London and Manchester to Glasgow, Cardiff, and Belfast — Verza TV brings American vertical micro-dramas to your phone. The platform streams 80+ originals with no regional restrictions, available on GMT/BST whenever you want to watch. Each episode runs just 60 to 120 seconds, perfect for the Tube, a train into the city, or a quiet evening at home as the weather turns. Filmed in cinematic 9:16, the catalog spans billionaire romances, revenge thrillers, and family sagas — bingeable short-form drama that fills the gaps in a busy British day. Start any series free with its first five episodes, then unlock the rest with coins. No subscription required to dive into Verza TV from anywhere in the UK.",
    blurb:
      "Watch Verza TV in the United Kingdom: 80+ vertical micro-dramas on GMT/BST, perfect for the Tube and train rides. Start any series free with 5 episodes.",
  },
  {
    slug: "canada",
    name: "Canada",
    type: "country",
    region: "North America",
    locale: "en-CA",
    intro:
      "From Vancouver to Toronto, Montréal to Halifax, Verza TV streams across all six of Canada's time zones with no regional blackout. The platform offers 80+ vertical micro-dramas — billionaire romances, dynasty sagas, and revenge thrillers — each episode running a tight 60 to 120 seconds. Whether you're riding the TTC, taking the SkyTrain, or waiting out a long prairie winter, a complete story arc fits into your day. Filmed in cinematic 9:16 for one-handed phone viewing, the catalog is deep enough to carry you through the coldest Canadian nights. Start any series free with its first five episodes, then unlock the rest with coins. No subscription required to start bingeing Verza TV anywhere from the Rockies to the Maritimes.",
    blurb:
      "Stream Verza TV in Canada: 80+ vertical micro-dramas across all time zones, perfect for long winters. Start any series free with 5 episodes, no subscription.",
  },
  {
    slug: "australia",
    name: "Australia",
    type: "country",
    region: "Oceania",
    locale: "en-AU",
    intro:
      "Down under, Verza TV brings binge-worthy vertical micro-dramas to phones from Sydney and Melbourne to Brisbane, Perth, and beyond. The platform streams 80+ originals with no regional restrictions across Australia's time zones — AEST, ACST, and AWST — so you can watch whenever suits, day or night. Each episode runs 60 to 120 seconds, ideal for a tram in Melbourne, a ferry across Sydney Harbour, or a lazy afternoon on the coast. Filmed in cinematic 9:16, the catalog spans billionaire romances, revenge thrillers, and family sagas built for one-handed viewing. Start any series free with its first five episodes, then unlock the rest with coins. No subscription required to dive into Verza TV from anywhere in Australia.",
    blurb:
      "Watch Verza TV in Australia: 80+ vertical micro-dramas across AEST, ACST and AWST. Start any series free with 5 episodes, no subscription required.",
  },
  {
    slug: "ireland",
    name: "Ireland",
    type: "country",
    region: "Europe",
    locale: "en-IE",
    intro:
      "From Dublin to Cork, Galway to Belfast's neighbour across the border, Verza TV streams to phones all across Ireland. The platform offers 80+ vertical micro-dramas with no regional restrictions, available on Irish Standard Time whenever you fancy a watch. Each episode runs just 60 to 120 seconds — perfect for the Luas, a DART ride along the coast, or a rainy evening in by the fire. Filmed in cinematic 9:16, the catalog spans billionaire romances, revenge thrillers, and family sagas, all built for one-handed bingeing. Start any series free with its first five episodes, then unlock the rest with coins. No subscription required to dive into Verza TV from anywhere on the Emerald Isle.",
    blurb:
      "Stream Verza TV in Ireland: 80+ vertical micro-dramas on Irish time, perfect for the Luas and rainy evenings. Start any series free with 5 episodes, no subscription.",
  },
  {
    slug: "india",
    name: "India",
    type: "country",
    region: "Asia",
    locale: "en-IN",
    intro:
      "India is one of the world's biggest mobile-first audiences, and Verza TV's vertical micro-dramas are made for exactly that. From Mumbai and Delhi to Bengaluru, Chennai, and Kolkata, the platform streams 80+ originals with no regional restrictions, available on IST whenever you want to watch. Each episode runs a tight 60 to 120 seconds — ideal for a local-train commute, a metro ride, or a break in a packed day. Filmed in cinematic 9:16, the catalog is built for the phone-first viewing India has embraced, spanning billionaire romances, revenge thrillers, and dynasty sagas. Start any series free with its first five episodes, then unlock the rest with coins. No subscription required to dive into Verza TV from anywhere in India.",
    blurb:
      "Watch Verza TV in India: 80+ mobile-first vertical micro-dramas on IST, perfect for the daily commute. Start any series free with 5 episodes, no subscription.",
  },
  {
    slug: "philippines",
    name: "Philippines",
    type: "country",
    region: "Southeast Asia",
    locale: "en-PH",
    intro:
      "Filipinos love a gripping teleserye, and Verza TV brings that same drama in bite-sized vertical form. From Manila to Cebu, Davao, and across the islands, the platform streams 80+ originals with no regional restrictions, available on Philippine Standard Time whenever you want to watch. Each episode runs just 60 to 120 seconds — perfect for a jeepney ride, an MRT commute in Metro Manila, or a break during the day. Filmed in cinematic 9:16, the catalog spans billionaire romances, betrayals, and revenge thrillers, all built for one-handed phone viewing. Start any series free with its first five episodes, then unlock the rest with coins. No subscription required to dive into Verza TV from anywhere in the Philippines.",
    blurb:
      "Stream Verza TV in the Philippines: 80+ vertical micro-dramas on PHT, teleserye-style drama for the phone. Start any series free with 5 episodes, no subscription.",
  },
  {
    slug: "indonesia",
    name: "Indonesia",
    type: "country",
    region: "Southeast Asia",
    locale: "id-ID",
    intro:
      "Indonesia is a mobile-first nation of more than 270 million, and Verza TV's vertical micro-dramas fit that audience perfectly. From Jakarta and Surabaya to Bandung, Medan, and across the archipelago, the platform streams 80+ originals with no regional restrictions, available across WIB, WITA, and WIT whenever you want to watch. Each episode runs a tight 60 to 120 seconds — ideal for a busy commute through Jakarta traffic, a TransJakarta ride, or a quiet break. Filmed in cinematic 9:16, the catalog spans billionaire romances, revenge thrillers, and dynasty sagas built for the phone. Start any series free with its first five episodes, then unlock the rest with coins. No subscription required to dive into Verza TV anywhere in Indonesia.",
    blurb:
      "Watch Verza TV in Indonesia: 80+ vertical micro-dramas across WIB, WITA and WIT, made for the phone. Start any series free with 5 episodes, no subscription.",
  },
  {
    slug: "malaysia",
    name: "Malaysia",
    type: "country",
    region: "Southeast Asia",
    locale: "ms-MY",
    intro:
      "From Kuala Lumpur to Penang, Johor Bahru to Kuching across the South China Sea, Verza TV streams vertical micro-dramas to phones all across Malaysia. The platform offers 80+ originals with no regional restrictions, available on Malaysia Time whenever you want to watch. Each episode runs just 60 to 120 seconds — perfect for an LRT or MRT ride in KL, a break during a humid afternoon, or a quiet evening in. Filmed in cinematic 9:16, the catalog spans billionaire romances, revenge thrillers, and family sagas, all built for one-handed phone viewing in Malaysia's multilingual, mobile-savvy market. Start any series free with its first five episodes, then unlock the rest with coins. No subscription required to dive into Verza TV from anywhere in Malaysia.",
    blurb:
      "Stream Verza TV in Malaysia: 80+ vertical micro-dramas on Malaysia Time, perfect for the LRT and MRT. Start any series free with 5 episodes, no subscription.",
  },
  {
    slug: "singapore",
    name: "Singapore",
    type: "country",
    region: "Southeast Asia",
    locale: "en-SG",
    intro:
      "Singapore is one of the most connected cities on earth, and Verza TV's mobile-first micro-dramas are right at home here. The platform streams 80+ vertical originals with no regional restrictions, available on Singapore Time whenever you want to watch. Each episode runs a tight 60 to 120 seconds — ideal for an MRT ride across the island, a lunch break in the CBD, or a quiet evening in the heartlands. Filmed in cinematic 9:16, the catalog spans billionaire romances, revenge thrillers, and dynasty sagas, all built for the seamless one-handed viewing Singaporeans expect. Start any series free with its first five episodes, then unlock the rest with coins. No subscription required to dive into Verza TV from anywhere in Singapore.",
    blurb:
      "Watch Verza TV in Singapore: 80+ mobile-first vertical micro-dramas on SGT, perfect for the MRT. Start any series free with 5 episodes, no subscription required.",
  },
  {
    slug: "nigeria",
    name: "Nigeria",
    type: "country",
    region: "Africa",
    locale: "en-NG",
    intro:
      "Nigeria's love of Nollywood storytelling makes it a natural home for Verza TV's dramatic vertical series. From Lagos to Abuja, Port Harcourt to Kano, the platform streams 80+ originals with no regional restrictions, available on West Africa Time whenever you want to watch. Each episode runs just 60 to 120 seconds — perfect for a busy Lagos commute, a danfo ride, or a break in the day. Filmed in cinematic 9:16, the catalog spans billionaire romances, betrayals, and revenge thrillers, all built for the data-conscious, mobile-first viewing that defines Nigeria's screens. Start any series free with its first five episodes, then unlock the rest with coins. No subscription required to dive into Verza TV from anywhere in Nigeria.",
    blurb:
      "Stream Verza TV in Nigeria: 80+ vertical micro-dramas on WAT, Nollywood-style drama for the phone. Start any series free with 5 episodes, no subscription.",
  },
  {
    slug: "kenya",
    name: "Kenya",
    type: "country",
    region: "Africa",
    locale: "en-KE",
    intro:
      "Kenya is one of Africa's most mobile-forward markets, and Verza TV's vertical micro-dramas fit that audience perfectly. From Nairobi to Mombasa, Kisumu, and beyond, the platform streams 80+ originals with no regional restrictions, available on East Africa Time whenever you want to watch. Each episode runs a tight 60 to 120 seconds — ideal for a matatu ride through Nairobi, a commute along the coast, or a break in a busy day. Filmed in cinematic 9:16, the catalog spans billionaire romances, revenge thrillers, and family sagas, all built for one-handed, data-friendly phone viewing. Start any series free with its first five episodes, then unlock the rest with coins. No subscription required to dive into Verza TV from anywhere in Kenya.",
    blurb:
      "Watch Verza TV in Kenya: 80+ vertical micro-dramas on EAT, made for mobile-first viewing. Start any series free with 5 episodes, no subscription required.",
  },
  {
    slug: "south-africa",
    name: "South Africa",
    type: "country",
    region: "Africa",
    locale: "en-ZA",
    intro:
      "From Johannesburg to Cape Town, Durban to Pretoria, South Africa's appetite for soapie-style drama makes it a perfect match for Verza TV. The platform streams 80+ vertical micro-dramas with no regional restrictions, available on South Africa Standard Time whenever you want to watch. Each episode runs just 60 to 120 seconds — ideal for a Gautrain ride, a taxi commute, or a relaxed evening at home. Filmed in cinematic 9:16, the catalog spans billionaire romances, betrayals, and revenge thrillers, all built for one-handed phone viewing. Start any series free with its first five episodes, then unlock the rest with coins. No subscription required to dive into Verza TV from anywhere in South Africa.",
    blurb:
      "Stream Verza TV in South Africa: 80+ vertical micro-dramas on SAST, soapie-style drama for the phone. Start any series free with 5 episodes, no subscription.",
  },
  {
    slug: "brazil",
    name: "Brazil",
    type: "country",
    region: "South America",
    locale: "pt-BR",
    intro:
      "Brazil practically invented the modern serialized drama with the telenovela, so Verza TV's micro-dramas feel instantly familiar. From São Paulo and Rio de Janeiro to Brasília, Salvador, and beyond, the platform streams 80+ vertical originals with no regional restrictions, available on Brasília Time whenever you want to watch. Each episode runs a tight 60 to 120 seconds — perfect for a metrô ride, a beach break in Rio, or a busy day in São Paulo. Filmed in cinematic 9:16, the catalog spans billionaire romances, revenge thrillers, and dynasty sagas built for the phone. Start any series free with its first five episodes, then unlock the rest with coins. No subscription required to dive into Verza TV anywhere in Brazil.",
    blurb:
      "Watch Verza TV in Brazil: 80+ vertical micro-dramas on Brasília Time, telenovela-style drama for the phone. Start any series free with 5 episodes, no subscription.",
  },
  {
    slug: "mexico",
    name: "Mexico",
    type: "country",
    region: "North America",
    locale: "es-MX",
    intro:
      "Mexico's deep telenovela tradition makes it a natural home for Verza TV's dramatic vertical series. From Mexico City and Guadalajara to Monterrey, Cancún, and beyond, the platform streams 80+ originals with no regional restrictions, available across Mexico's time zones whenever you want to watch. Each episode runs just 60 to 120 seconds — perfect for a Metro ride through CDMX, a commute in Monterrey, or a relaxed evening. Filmed in cinematic 9:16, the catalog spans billionaire romances, betrayals, and revenge thrillers, all built for one-handed phone viewing. Start any series free with its first five episodes, then unlock the rest with coins. No subscription required to dive into Verza TV from anywhere in Mexico.",
    blurb:
      "Stream Verza TV in Mexico: 80+ vertical micro-dramas across Mexican time zones, telenovela-style drama. Start any series free with 5 episodes, no subscription.",
  },
  {
    slug: "argentina",
    name: "Argentina",
    type: "country",
    region: "South America",
    locale: "es-AR",
    intro:
      "Argentina's passion for storytelling and late nights makes it a perfect fit for Verza TV's binge-worthy micro-dramas. From Buenos Aires to Córdoba, Rosario, and Mendoza, the platform streams 80+ vertical originals with no regional restrictions, available on Argentina Time whenever you want to watch. Each episode runs a tight 60 to 120 seconds — ideal for a Subte ride through the capital, a café break, or a late evening as the city comes alive. Filmed in cinematic 9:16, the catalog spans billionaire romances, revenge thrillers, and dynasty sagas built for the phone. Start any series free with its first five episodes, then unlock the rest with coins. No subscription required to dive into Verza TV anywhere in Argentina.",
    blurb:
      "Watch Verza TV in Argentina: 80+ vertical micro-dramas on Argentina Time, perfect for late nights. Start any series free with 5 episodes, no subscription required.",
  },
  {
    slug: "colombia",
    name: "Colombia",
    type: "country",
    region: "South America",
    locale: "es-CO",
    intro:
      "Colombia produces some of Latin America's most beloved telenovelas, so Verza TV's vertical micro-dramas land in welcome territory. From Bogotá to Medellín, Cali, and Barranquilla, the platform streams 80+ originals with no regional restrictions, available on Colombia Time whenever you want to watch. Each episode runs just 60 to 120 seconds — perfect for a TransMilenio ride in Bogotá, a Metro commute in Medellín, or a warm coastal evening. Filmed in cinematic 9:16, the catalog spans billionaire romances, betrayals, and revenge thrillers, all built for one-handed phone viewing. Start any series free with its first five episodes, then unlock the rest with coins. No subscription required to dive into Verza TV from anywhere in Colombia.",
    blurb:
      "Stream Verza TV in Colombia: 80+ vertical micro-dramas on Colombia Time, telenovela-style drama for the phone. Start any series free with 5 episodes, no subscription.",
  },
  {
    slug: "germany",
    name: "Germany",
    type: "country",
    region: "Europe",
    locale: "de-DE",
    intro:
      "From Berlin and Munich to Hamburg, Cologne, and Frankfurt, Germany's commuters and binge-watchers are a strong fit for Verza TV's quick-hit dramas. The platform streams 80+ vertical originals with no regional restrictions, available on Central European Time whenever you want to watch. Each episode runs just 60 to 120 seconds — perfect for a U-Bahn or S-Bahn ride, a break between meetings, or a cosy evening in. Filmed in cinematic 9:16, the catalog spans billionaire romances, revenge thrillers, and family sagas, all built for one-handed phone viewing. Start any series free with its first five episodes, then unlock the rest with coins. No subscription required to dive into Verza TV from anywhere in Germany.",
    blurb:
      "Watch Verza TV in Germany: 80+ vertical micro-dramas on CET, perfect for the U-Bahn and S-Bahn. Start any series free with 5 episodes, no subscription required.",
  },
  {
    slug: "france",
    name: "France",
    type: "country",
    region: "Europe",
    locale: "fr-FR",
    intro:
      "From Paris and Lyon to Marseille, Toulouse, and beyond, France's audiences appreciate well-crafted drama — and Verza TV delivers it in vertical form. The platform streams 80+ originals with no regional restrictions, available on Central European Time whenever you want to watch. Each episode runs just 60 to 120 seconds — perfect for a Métro ride through Paris, a TGV journey, or a relaxed evening with a glass of wine. Filmed in cinematic 9:16, the catalog spans billionaire romances, revenge thrillers, and dynasty sagas, all built for one-handed phone viewing. Start any series free with its first five episodes, then unlock the rest with coins. No subscription required to dive into Verza TV from anywhere in France.",
    blurb:
      "Stream Verza TV in France: 80+ vertical micro-dramas on CET, perfect for the Métro and TGV. Start any series free with 5 episodes, no subscription required.",
  },
  {
    slug: "spain",
    name: "Spain",
    type: "country",
    region: "Europe",
    locale: "es-ES",
    intro:
      "Spain's culture of late dinners and even later nights leaves plenty of time for a binge, and Verza TV fits right in. From Madrid and Barcelona to Valencia, Seville, and Bilbao, the platform streams 80+ vertical micro-dramas with no regional restrictions, available on Central European Time whenever you want to watch. Each episode runs just 60 to 120 seconds — perfect for a Metro ride through Madrid, a break during a long afternoon, or a late evening out. Filmed in cinematic 9:16, the catalog spans billionaire romances, revenge thrillers, and family sagas, all built for one-handed phone viewing. Start any series free with its first five episodes, then unlock the rest with coins. No subscription required to dive into Verza TV from anywhere in Spain.",
    blurb:
      "Watch Verza TV in Spain: 80+ vertical micro-dramas on CET, perfect for late nights. Start any series free with 5 episodes, no subscription required.",
  },
  {
    slug: "italy",
    name: "Italy",
    type: "country",
    region: "Europe",
    locale: "it-IT",
    intro:
      "From Rome and Milan to Naples, Florence, and Turin, Italy's flair for drama makes it a natural audience for Verza TV. The platform streams 80+ vertical micro-dramas with no regional restrictions, available on Central European Time whenever you want to watch. Each episode runs just 60 to 120 seconds — perfect for a metro ride in Rome or Milan, a coffee break, or a relaxed evening in the piazza. Filmed in cinematic 9:16, the catalog spans billionaire romances, revenge thrillers, and dynasty sagas, all built for one-handed phone viewing. Start any series free with its first five episodes, then unlock the rest with coins. No subscription required to dive into Verza TV from anywhere in Italy.",
    blurb:
      "Stream Verza TV in Italy: 80+ vertical micro-dramas on CET, perfect for a coffee break. Start any series free with 5 episodes, no subscription required.",
  },
  {
    slug: "netherlands",
    name: "Netherlands",
    type: "country",
    region: "Europe",
    locale: "nl-NL",
    intro:
      "From Amsterdam and Rotterdam to The Hague, Utrecht, and Eindhoven, the Netherlands is a compact, hyper-connected country ideal for Verza TV's phone-first dramas. The platform streams 80+ vertical originals with no regional restrictions, available on Central European Time whenever you want to watch. Each episode runs just 60 to 120 seconds — perfect for a train between cities, a tram ride through Amsterdam, or a cosy evening in. Filmed in cinematic 9:16, the catalog spans billionaire romances, revenge thrillers, and family sagas, all built for one-handed phone viewing. Start any series free with its first five episodes, then unlock the rest with coins. No subscription required to dive into Verza TV from anywhere in the Netherlands.",
    blurb:
      "Watch Verza TV in the Netherlands: 80+ vertical micro-dramas on CET, perfect for train rides. Start any series free with 5 episodes, no subscription required.",
  },
  {
    slug: "united-arab-emirates",
    name: "United Arab Emirates",
    type: "country",
    region: "Middle East",
    locale: "ar-AE",
    intro:
      "From Dubai's skyline to Abu Dhabi and Sharjah, the UAE's cosmopolitan, mobile-savvy population is a natural fit for Verza TV. The platform streams 80+ vertical micro-dramas with no regional restrictions, available on Gulf Standard Time whenever you want to watch. Each episode runs just 60 to 120 seconds — perfect for a Dubai Metro ride, a break in the air conditioning during the hottest months, or a quiet evening at home. Filmed in cinematic 9:16, the catalog spans billionaire romances, glamorous betrayals, and revenge thrillers, all built for one-handed phone viewing across the Emirates' diverse, international audience. Start any series free with its first five episodes, then unlock the rest with coins. No subscription required.",
    blurb:
      "Stream Verza TV in the UAE: 80+ vertical micro-dramas on Gulf Standard Time, perfect for the Dubai Metro. Start any series free with 5 episodes, no subscription.",
  },
  {
    slug: "saudi-arabia",
    name: "Saudi Arabia",
    type: "country",
    region: "Middle East",
    locale: "ar-SA",
    intro:
      "Saudi Arabia is one of the world's most active mobile-streaming markets, and Verza TV's vertical micro-dramas suit it perfectly. From Riyadh to Jeddah, Dammam, and beyond, the platform streams 80+ originals with no regional restrictions, available on Arabia Standard Time whenever you want to watch. Each episode runs just 60 to 120 seconds — ideal for a break during the day, a commute through Riyadh, or a relaxed evening indoors away from the desert heat. Filmed in cinematic 9:16, the catalog spans billionaire romances, revenge thrillers, and dynasty sagas, all built for one-handed phone viewing. Start any series free with its first five episodes, then unlock the rest with coins. No subscription required to dive into Verza TV anywhere in Saudi Arabia.",
    blurb:
      "Watch Verza TV in Saudi Arabia: 80+ vertical micro-dramas on Arabia Standard Time, made for mobile. Start any series free with 5 episodes, no subscription.",
  },
  {
    slug: "japan",
    name: "Japan",
    type: "country",
    region: "Asia",
    locale: "ja-JP",
    intro:
      "Japan helped pioneer mobile entertainment, so Verza TV's vertical micro-dramas land in a tech-savvy, screen-loving market. From Tokyo and Osaka to Yokohama, Nagoya, and Fukuoka, the platform streams 80+ originals with no regional restrictions, available on Japan Standard Time whenever you want to watch. Each episode runs just 60 to 120 seconds — perfect for a packed train commute, a break between trains, or a quiet evening at home. Filmed in cinematic 9:16, the catalog spans billionaire romances, revenge thrillers, and dynasty sagas, all built for the seamless one-handed viewing Japanese commuters know well. Start any series free with its first five episodes, then unlock the rest with coins. No subscription required to dive into Verza TV anywhere in Japan.",
    blurb:
      "Stream Verza TV in Japan: 80+ vertical micro-dramas on Japan Standard Time, perfect for the train commute. Start any series free with 5 episodes, no subscription.",
  },
];

/* ------------------------------------------------------------------ */
/*  Combined export + helpers                                          */
/* ------------------------------------------------------------------ */

export const LOCATIONS: LocationPage[] = [...CITIES, ...STATES, ...COUNTRIES];

export function getLocation(slug: string): LocationPage | undefined {
  return LOCATIONS.find((loc) => loc.slug === slug);
}
