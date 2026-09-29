export const TOWY_RATE = 0.06;
export const ROADSIDE_CAP = 125;
export const DEDUCTIBLE = 100;
export const AFTER_HOURS_FEE = 40;
export const DESK_FEE = 4000;
export const DISPATCH_FEE = 18;
export const PILOT_STOPS_A_NIGHT = 8;
export const PILOT_NIGHTS = 30;

export const SCENARIO = {
  when: "Monday night",
  place: "Columbus",
  afterHours: true,
};

export type Drivetrain = "FWD" | "RWD" | "AWD" | "4WD";
export type Position = "shoulder" | "lane" | "ditch" | "offroad";
export type Side = "right" | "left" | "median" | "ramp";
export type Coverage = "none" | "roadside" | "full" | "deductible";
export type Equipment = "wheel-lift" | "flatbed";
export type Traffic = "light" | "moderate" | "heavy";
export type HelpKind = "tire" | "jump" | "lockout" | "fuel" | "bulb" | "oil" | "wipers" | "crack" | "tow";
export type JobStatus = "draft" | "calling" | "quoted" | "enroute" | "checked" | "arrived" | "done";
export type View = "home" | "intake" | "calling" | "quotes" | "job" | "insurer" | "operator" | "promote";

export type Vehicle = {
  year: string;
  make: string;
  model: string;
  drivetrain: Drivetrain;
  tires: string;
  ev: boolean;
};

export type SavedCar = {
  id: string;
  contactName: string;
  contactPhone: string;
  vehicle: Vehicle;
};

export function carLabel(vehicle: Vehicle): string {
  return [vehicle.year, vehicle.make, vehicle.model].filter((part) => part.trim()).join(" ");
}

export type Situation = {
  starts: boolean;
  rolls: boolean;
  position: Position;
  side: Side;
  equipment: Equipment;
  winch: boolean;
  police: boolean;
  equipmentTouched: boolean;
  winchTouched: boolean;
  policeTouched: boolean;
  spare: boolean;
  wrongFuel: boolean;
  shattered: boolean;
  broken: boolean;
};

export type Quote = {
  companyId: string;
  etaMin: number;
  miles: number;
  hook: number;
  mileage: number;
  equipmentFee: number;
  winchFee: number;
  afterHours: number;
  policeWait: number;
  total: number;
  covered: number;
  driverPays: number;
  towyFee: number;
  dispatchFee: number;
  operatorReceives: number;
  note: string;
  work: string;
  dropMiles: number;
  dropName: string;
  dropFee: number;
};

export type Review = {
  id: string;
  companyId: string;
  author: string;
  stars: number;
  text: string;
};

export type CallResult = {
  companyId: string;
  available: boolean;
  decline?: string;
  quote?: Quote;
};

export type Job = {
  id: string;
  contactName: string;
  contactPhone: string;
  vehicle: Vehicle;
  help: HelpKind;
  situation: Situation;
  locationId: string;
  coverage: Coverage;
  coverageLocked: boolean;
  calls: CallResult[];
  selectedCompanyId: string | null;
  status: JobStatus;
  live: { etaMin: number; total: number; note: string } | null;
  review: { stars: number; text: string } | null;
  payment?: { method: "apple-pay"; amount: number } | null;
  source: "member" | "insurer" | "seed";
  origin: { lat: number; lng: number; source: "device" | "mile" } | null;
  drop: { shop: DropShop; miles: number | null } | null;
};

export function atCurb(help: HelpKind): boolean {
  return help === "bulb" || help === "oil" || help === "wipers" || help === "crack";
}

export function helpLabel(help: HelpKind): string {
  if (help === "tire") return "Flat tire";
  if (help === "jump") return "Jump start";
  if (help === "lockout") return "Lockout";
  if (help === "fuel") return "Fuel";
  if (help === "bulb") return "Headlight";
  if (help === "oil") return "Oil change";
  if (help === "wipers") return "Wipers";
  if (help === "crack") return "Window crack";
  return "Tow";
}

export const helpOptions: { id: HelpKind; title: string; detail: string }[] = [
  { id: "tire", title: "Flat tire", detail: "Spare or a plug, on the shoulder. A shop only if there is no spare." },
  { id: "jump", title: "Jump start", detail: "A pack on the battery. You drive away if it holds a charge." },
  { id: "lockout", title: "Lockout", detail: "Keys inside. Opened where it sits." },
  { id: "fuel", title: "Out of gas", detail: "Two gallons, enough to reach a station. Wrong fuel is a tow." },
  { id: "bulb", title: "Headlight", detail: "One bulb, in the driveway or a lot. A sealed housing is a shop." },
  { id: "oil", title: "Oil change", detail: "Filter and five quarts, where the car is parked." },
  { id: "wipers", title: "Wipers", detail: "Both blades. Done in a few minutes." },
  { id: "crack", title: "Window crack", detail: "A chip filled where it sits. If someone broke the glass, they replace it there." },
  { id: "tow", title: "Tow", detail: "It will not roll, or it has to come out of a ditch." },
];

export function needsShop(job: Pick<Job, "help" | "vehicle" | "situation">): boolean {
  if (job.help === "tow") return true;
  if (job.help === "tire" && !job.situation.spare) return true;
  if (job.help === "fuel" && job.situation.wrongFuel) return true;
  if (job.help === "jump" && job.vehicle.ev) return true;
  return false;
}

export function workLabel(job: Pick<Job, "help" | "vehicle" | "situation">): string {
  if (needsShop(job)) return "Tow";
  if (job.help === "tire") return "Spare swap";
  if (job.help === "jump") return "Jump start";
  if (job.help === "lockout") return "Lockout";
  if (job.help === "bulb") return "Headlight";
  if (job.help === "oil") return "Oil change";
  if (job.help === "wipers") return "Wipers";
  if (job.help === "crack") return job.situation.broken ? "Broken glass" : job.situation.shattered ? "Glass replacement" : "Crack fill";
  return "Fuel drop";
}

export function trafficLabel(traffic: Traffic): string {
  if (traffic === "heavy") return "Heavy traffic";
  if (traffic === "moderate") return "Moderate traffic";
  return "Light traffic";
}

export type Location = {
  id: string;
  road: string;
  direction: string;
  mile: string;
  place: string;
  traffic: Traffic;
  note: string;
  lat: number;
  lng: number;
};

export type Company = {
  id: string;
  name: string;
  phone: string;
  yard: string;
  lat: number;
  lng: number;
  rating: number;
  reviewCount: number;
  tags: string[];
  evCertified: boolean;
  canWinch: boolean;
  canFlatbed: boolean;
  hook: number;
  perMile: number;
  flatbed: number;
  winch: number;
  bias: number;
  flatbedEta: number;
  reviews: { author: string; stars: number; text: string }[];
  miles: Record<string, number>;
};

export const coverageOptions: { id: Coverage; title: string; detail: string }[] = [
  { id: "none", title: "No coverage", detail: "Member pays the bill. Shoulder takes 6% of that. No insurance company is invoiced." },
  { id: "roadside", title: "Roadside assist", detail: "Policy pays the first $125. The insurance company pays Shoulder $18. The shop is paid in full." },
  { id: "deductible", title: "$100 deductible", detail: "Member pays the first $100. The insurance company pays Shoulder $18. The rest is untouched." },
  { id: "full", title: "Tow fully covered", detail: "Insurance pays the shop in full. The insurance company still pays Shoulder $18." },
];

export const locations: Location[] = [
  {
    id: "i70-108",
    road: "I-70",
    direction: "Eastbound",
    mile: "108.2",
    place: "Bexley",
    traffic: "heavy",
    note: "Shoulder narrows at the Nelson Road exit.",
    lat: 39.9684,
    lng: -82.9375,
  },
  {
    id: "i71-111",
    road: "I-71",
    direction: "Southbound",
    mile: "111.0",
    place: "Downtown",
    traffic: "moderate",
    note: "Innerbelt. Left lane is tight against the barrier.",
    lat: 39.9612,
    lng: -82.999,
  },
  {
    id: "sr315-4",
    road: "SR-315",
    direction: "Northbound",
    mile: "4.1",
    place: "Ohio State",
    traffic: "heavy",
    note: "Event traffic stacking toward Lane Avenue.",
    lat: 40.0025,
    lng: -83.0215,
  },
  {
    id: "us33-12",
    road: "US-33",
    direction: "Westbound",
    mile: "12.6",
    place: "Dublin",
    traffic: "light",
    note: "Wide shoulder past the Frantz Road split.",
    lat: 40.0992,
    lng: -83.1095,
  },
  {
    id: "i270-22",
    road: "I-270",
    direction: "Outer",
    mile: "22.4",
    place: "Easton",
    traffic: "moderate",
    note: "Outerbelt, east side. Ramp from Morse is slow.",
    lat: 40.0518,
    lng: -82.9164,
  },
];

export type DropShop = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating: number;
  reviews: number;
  kind: "tire" | "repair";
};

export function milesBetween(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const r = 3958.8;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * r * Math.asin(Math.min(1, Math.sqrt(s)));
}

export function dropFor(job: Pick<Job, "help" | "vehicle" | "situation" | "drop">): { shop: DropShop; miles: number | null } | null {
  if (!needsShop(job) || !job.drop) return null;
  return job.drop;
}

export const companies: Company[] = [
  {
    id: "scioto",
    name: "Scioto Hook & Haul",
    phone: "(614) 555-0142",
    yard: "Franklinton",
    lat: 39.9574,
    lng: -83.0178,
    rating: 4.7,
    reviewCount: 312,
    tags: ["Wheel-lift", "Flatbed"],
    evCertified: false,
    canWinch: true,
    canFlatbed: true,
    hook: 85,
    perMile: 6.5,
    flatbed: 60,
    winch: 145,
    bias: 1,
    flatbedEta: 4,
    reviews: [
      { author: "Marisol A.", stars: 5, text: "Quoted the hook fee before they rolled. On I-71 in 22 minutes." },
      { author: "Dev Patel", stars: 4, text: "Flatbed was clean. Dispatcher picked up on the second ring." },
    ],
    miles: { "i70-108": 6.2, "i71-111": 2.4, "sr315-4": 4.6, "us33-12": 11.2, "i270-22": 10.4 },
  },
  {
    id: "olentangy",
    name: "Olentangy Recovery",
    phone: "(614) 555-0177",
    yard: "Clintonville",
    lat: 40.0315,
    lng: -83.0208,
    rating: 4.5,
    reviewCount: 188,
    tags: ["Winch", "Off-road"],
    evCertified: false,
    canWinch: true,
    canFlatbed: true,
    hook: 95,
    perMile: 7,
    flatbed: 70,
    winch: 120,
    bias: 3,
    flatbedEta: 6,
    reviews: [
      { author: "Chris N.", stars: 5, text: "Jeep was in the ditch past Lane. Winch, no surprise add-on." },
      { author: "Elena V.", stars: 4, text: "Slower than the app said, but the price held." },
    ],
    miles: { "i70-108": 9.1, "i71-111": 5.6, "sr315-4": 2.2, "us33-12": 6.4, "i270-22": 12.1 },
  },
  {
    id: "outerbelt",
    name: "OuterBelt Tow",
    phone: "(614) 555-0108",
    yard: "Easton",
    lat: 40.0506,
    lng: -82.9154,
    rating: 4.8,
    reviewCount: 540,
    tags: ["Light duty", "Fast"],
    evCertified: false,
    canWinch: false,
    canFlatbed: true,
    hook: 75,
    perMile: 5.5,
    flatbed: 80,
    winch: 0,
    bias: -2,
    flatbedEta: 5,
    reviews: [
      { author: "Jordan P.", stars: 5, text: "Fastest light-duty truck on the outerbelt. No winch, they said so up front." },
      { author: "Sam Okonkwo", stars: 5, text: "Civic on the shoulder. Wheel-lift, cashless with roadside." },
    ],
    miles: { "i70-108": 8.4, "i71-111": 11.0, "sr315-4": 12.4, "us33-12": 14.2, "i270-22": 1.8 },
  },
  {
    id: "northbank",
    name: "North Bank Flatbeds",
    phone: "(614) 555-0164",
    yard: "Italian Village",
    lat: 39.9808,
    lng: -82.9974,
    rating: 4.6,
    reviewCount: 96,
    tags: ["EV certified", "Flatbed"],
    evCertified: true,
    canWinch: true,
    canFlatbed: true,
    hook: 110,
    perMile: 6,
    flatbed: 45,
    winch: 155,
    bias: 2,
    flatbedEta: 2,
    reviews: [
      { author: "Priya S.", stars: 5, text: "Model Y in transport mode. They knew not to drag it." },
      { author: "Luis M.", stars: 4, text: "Pricier hook, cheaper flatbed. Net was fair." },
    ],
    miles: { "i70-108": 7.0, "i71-111": 3.3, "sr315-4": 3.8, "us33-12": 10.1, "i270-22": 11.0 },
  },
  {
    id: "parsons",
    name: "Parsons Night Shift",
    phone: "(614) 555-0190",
    yard: "South Side",
    lat: 39.9392,
    lng: -82.9836,
    rating: 4.2,
    reviewCount: 74,
    tags: ["After hours", "Budget"],
    evCertified: false,
    canWinch: true,
    canFlatbed: true,
    hook: 70,
    perMile: 7,
    flatbed: 90,
    winch: 165,
    bias: 6,
    flatbedEta: 8,
    reviews: [
      { author: "Andy Cole", stars: 4, text: "Late truck, honest price. Dispatcher stayed on the line." },
      { author: "Renee H.", stars: 3, text: "ETA slipped in the rain. They called before I had to." },
    ],
    miles: { "i70-108": 4.8, "i71-111": 4.1, "sr315-4": 8.2, "us33-12": 15.5, "i270-22": 9.2 },
  },
];

export const vehiclePresets: { label: string; vehicle: Vehicle }[] = [
  { label: "Civic", vehicle: { year: "2019", make: "Honda", model: "Civic", drivetrain: "FWD", tires: "215/55R16", ev: false } },
  { label: "Camry", vehicle: { year: "2018", make: "Toyota", model: "Camry", drivetrain: "FWD", tires: "215/55R17", ev: false } },
  { label: "F-150", vehicle: { year: "2021", make: "Ford", model: "F-150", drivetrain: "4WD", tires: "275/65R18", ev: false } },
  { label: "Model Y", vehicle: { year: "2023", make: "Tesla", model: "Model Y", drivetrain: "AWD", tires: "255/45R19", ev: true } },
  { label: "Wrangler", vehicle: { year: "2016", make: "Jeep", model: "Wrangler", drivetrain: "4WD", tires: "255/75R17", ev: false } },
];

export function locationById(id: string): Location {
  return locations.find((l) => l.id === id) ?? locations[0];
}

export function companyById(id: string): Company | undefined {
  return companies.find((c) => c.id === id);
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function usd(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function positionLabel(position: Position): string {
  switch (position) {
    case "shoulder":
      return "On the shoulder";
    case "lane":
      return "In a live lane";
    case "ditch":
      return "In the ditch";
    case "offroad":
      return "Off the roadway";
  }
}

export function sideLabel(side: Side): string {
  switch (side) {
    case "right":
      return "Right side";
    case "left":
      return "Left side";
    case "median":
      return "Median";
    case "ramp":
      return "On a ramp";
  }
}

export function equipmentLabel(equipment: Equipment): string {
  return equipment === "flatbed" ? "Flatbed" : "Wheel-lift truck";
}

export function recommendEquipment(vehicle: Vehicle, situation: Pick<Situation, "starts" | "rolls" | "position">): Equipment {
  if (vehicle.ev) return "flatbed";
  if (!situation.rolls) return "flatbed";
  if ((vehicle.drivetrain === "AWD" || vehicle.drivetrain === "4WD") && !situation.starts) return "flatbed";
  if (situation.position === "offroad") return "flatbed";
  return "wheel-lift";
}

export function equipmentReason(vehicle: Vehicle, situation: Situation): string {
  if (vehicle.ev) return "Electric. Wheels stay on a flatbed so the drivetrain is not dragged.";
  if (!situation.rolls) return "It does not roll. A wheel-lift is the wrong truck.";
  if ((vehicle.drivetrain === "AWD" || vehicle.drivetrain === "4WD") && !situation.starts) {
    return "All-wheel drive that will not start can be damaged on a wheel-lift.";
  }
  if (situation.position === "offroad") return "Once it is winched up, it goes on a flatbed.";
  return "It rolls and it is not electric. A wheel-lift truck is enough.";
}

export function recommendWinch(position: Position): boolean {
  return position === "ditch" || position === "offroad";
}

export function winchReason(position: Position): string {
  if (position === "ditch" || position === "offroad") return "Fish-out. The truck needs a winch.";
  return "Still on pavement. No winch.";
}

export function recommendPolice(position: Position, side: Side, traffic: Traffic): boolean {
  if (position === "lane") return true;
  if ((side === "median" || side === "ramp") && traffic !== "light") return true;
  return false;
}

export function policeReason(position: Position, side: Side, traffic: Traffic): string {
  const load = traffic === "heavy" ? "heavy" : traffic === "moderate" ? "moving" : "light";
  if (position === "lane") return `You are in a live lane and traffic is ${load}. Ask for an officer before the truck arrives.`;
  if (side === "median" && traffic !== "light") return `You are in the median and traffic is ${load}. A marked unit is worth the wait.`;
  if (side === "ramp" && traffic === "heavy") return "The ramp is backed up. An officer keeps the merge from closing on the truck.";
  if (traffic === "heavy") return "Traffic is heavy, but you are out of the lane. An officer is optional.";
  return `Traffic is ${load} and you are out of the lane. An officer is optional.`;
}

export function splitBill(total: number, coverage: Coverage, source: Job["source"] = "member") {
  const covered =
    coverage === "full" ? total : coverage === "roadside" ? Math.min(ROADSIDE_CAP, total) : coverage === "deductible" ? Math.max(0, total - DEDUCTIBLE) : 0;
  const driverPays = round2(Math.max(0, total - covered));
  const carrierJob = source === "insurer" || source === "seed";
  const towyFee = carrierJob ? 0 : round2(driverPays * TOWY_RATE);
  const dispatchFee = carrierJob ? DISPATCH_FEE : 0;
  const operatorReceives = round2(total - towyFee);
  return {
    covered: round2(covered),
    driverPays,
    towyFee,
    dispatchFee,
    operatorReceives,
  };
}

export function pilotMonth() {
  const stops = PILOT_STOPS_A_NIGHT * PILOT_NIGHTS;
  const dispatch = stops * DISPATCH_FEE;
  return { stops, dispatch, desk: DESK_FEE, total: dispatch + DESK_FEE };
}

export function recomputeSituation(job: Job): Job {
  const location = locationById(job.locationId);
  const situation: Situation = { ...job.situation };
  const shop = needsShop(job);
  if (!shop) {
    if (!situation.equipmentTouched) situation.equipment = "wheel-lift";
    if (!situation.winchTouched) situation.winch = false;
  } else {
    if (!situation.equipmentTouched) situation.equipment = recommendEquipment(job.vehicle, situation);
    if (!situation.winchTouched) situation.winch = recommendWinch(situation.position);
  }
  if (!situation.policeTouched) {
    situation.police = job.help === "crack" && situation.broken ? true : atCurb(job.help) ? false : recommendPolice(situation.position, situation.side, location.traffic);
  }
  return { ...job, situation };
}

function serviceCall(company: Company, job: Job): number {
  if (job.help === "bulb") return round2(company.hook * 0.4 + 22);
  if (job.help === "oil") return round2(company.hook * 0.55 + 48);
  if (job.help === "wipers") return round2(company.hook * 0.35 + 32);
  if (job.help === "crack") return job.situation.broken || job.situation.shattered ? round2(company.hook * 0.7 + 180) : round2(company.hook * 0.4 + 40);
  const factor = job.help === "jump" ? 0.5 : job.help === "fuel" ? 0.45 : job.help === "lockout" ? 0.6 : 0.7;
  const fuel = job.help === "fuel" ? 12 : 0;
  return round2(company.hook * factor + fuel);
}

function quoteFor(company: Company, job: Job): Quote {
  const miles = company.miles[job.locationId] ?? 8;
  const location = locationById(job.locationId);
  const shop = needsShop(job);
  const flatbed = shop && job.situation.equipment === "flatbed";
  const hook = shop ? company.hook : serviceCall(company, job);
  const mileage = round2(miles * company.perMile);
  const equipmentFee = flatbed ? company.flatbed : 0;
  const winchFee = shop && job.situation.winch ? company.winch : 0;
  const afterHours = !atCurb(job.help) && SCENARIO.afterHours ? AFTER_HOURS_FEE : 0;
  const policeWait = job.situation.police ? 25 : 0;
  const drop = dropFor(job);
  const dropMiles = drop?.miles ?? 0;
  const dropFee = drop ? round2(dropMiles * company.perMile) : 0;
  const total = round2(hook + mileage + equipmentFee + winchFee + afterHours + policeWait + dropFee);
  const money = splitBill(total, job.coverage, job.source);
  const trafficAdd = location.traffic === "heavy" ? 8 : location.traffic === "moderate" ? 4 : 1;
  const etaMin = Math.max(12, Math.min(75, Math.round(8 + miles * 1.65 + company.bias + trafficAdd + (flatbed ? company.flatbedEta : 0) + (SCENARIO.afterHours ? 3 : 0))));
  const notes: string[] = [];
  if (!shop && job.help === "tire") notes.push("Spare goes on here. You leave if it holds air.");
  if (!shop && job.help === "jump") notes.push("Jump pack. A shop is only if it will not hold a charge.");
  if (!shop && job.help === "lockout") notes.push("Unlocked in place. No tow.");
  if (!shop && job.help === "fuel") notes.push("Two gallons. Enough to reach a station.");
  if (!shop && job.help === "bulb") notes.push("One bulb. A sealed lamp housing still goes to a shop.");
  if (!shop && job.help === "oil") notes.push("Filter and five quarts. Driveway or a lot, not a bay.");
  if (!shop && job.help === "wipers") notes.push("Both blades, where the car is parked.");
  if (!shop && job.help === "crack" && job.situation.broken) notes.push("Someone broke the glass. Replaced where the car sits.");
  if (!shop && job.help === "crack" && job.situation.shattered && !job.situation.broken) notes.push("Pane replaced where the car sits. Not a shop.");
  if (!shop && job.help === "crack" && !job.situation.shattered && !job.situation.broken) notes.push("Resin in the crack. You can drive as soon as it cures.");
  if (shop && job.help === "tire") notes.push("No spare. This one has to be towed.");
  if (shop && job.help === "fuel") notes.push("Wrong fuel has to be drained. This is a tow.");
  if (shop && job.help === "jump") notes.push("A jump will not start an electric car. Flatbed.");
  if (shop && job.vehicle.ev && !company.evCertified && job.help !== "jump") notes.push("Not EV-certified. Confirm transport mode before loading.");
  if (shop && job.vehicle.ev && company.evCertified) notes.push("EV-certified flatbed.");
  if (job.situation.police) notes.push("They will stage until the officer is on scene.");
  if (!notes.length) notes.push("Price includes the Monday night rate.");
  return {
    companyId: company.id,
    etaMin,
    miles,
    hook,
    mileage,
    equipmentFee,
    winchFee,
    afterHours,
    policeWait,
    total,
    ...money,
    note: notes[0],
    work: workLabel(job),
    dropMiles,
    dropName: drop ? drop.shop.name : "",
    dropFee,
  };
}

export type PromoPlan = "pin" | "first" | "both";

export type Promotion = { companyId: string; plan: PromoPlan };

export const promoPlans: { id: PromoPlan; title: string; price: string; detail: string }[] = [
  { id: "pin", title: "On the map", price: "$49 a week", detail: "A pin beside the car. Drivers see the shop before they ask for help." },
  { id: "first", title: "Called first", price: "$12 a stop", detail: "When someone nearby needs a truck, this shop is the first call." },
  { id: "both", title: "Map and first call", price: "$49 a week, $12 a stop", detail: "The pin, and the first call. The stop fee is only when they get the job." },
];

export function buildCalls(job: Job, firstId?: string | null): CallResult[] {
  const ready = recomputeSituation(job);
  const ranked = [...companies].sort((a, b) => (a.miles[ready.locationId] ?? 99) - (b.miles[ready.locationId] ?? 99));
  if (firstId) ranked.sort((a, b) => (a.id === firstId ? -1 : b.id === firstId ? 1 : 0));
  const results: CallResult[] = [];
  for (const company of ranked) {
    const shop = needsShop(ready);
    if (!shop) {
      results.push({ companyId: company.id, available: true, quote: quoteFor(company, ready) });
    } else if (ready.situation.winch && !company.canWinch) {
      results.push({ companyId: company.id, available: false, decline: "No winch on tonight's truck." });
    } else if (ready.situation.equipment === "flatbed" && !company.canFlatbed) {
      results.push({ companyId: company.id, available: false, decline: "No flatbed free." });
    } else {
      results.push({ companyId: company.id, available: true, quote: quoteFor(company, ready) });
    }
    const got = results.filter((r) => r.quote).length;
    if (got >= 3) break;
  }
  return results;
}

export function companyScore(company: Company, reviews: Review[]) {
  const extra = reviews.filter((r) => r.companyId === company.id);
  const count = company.reviewCount + extra.length;
  const sum = company.rating * company.reviewCount + extra.reduce((acc, r) => acc + r.stars, 0);
  return { rating: count ? sum / count : company.rating, count };
}

export function callLines(company: Company, job: Job, result: CallResult): string[] {
  const location = locationById(job.locationId);
  const vehicle = `${job.vehicle.year} ${job.vehicle.make} ${job.vehicle.model}`.trim();
  const open = [
    `${company.name}. Dispatcher speaking.`,
    `${location.road} ${location.direction.toLowerCase()}, mile ${location.mile}, ${location.place}. ${sideLabel(job.situation.side).toLowerCase()}, ${positionLabel(job.situation.position).toLowerCase()}.`,
    `${vehicle}, ${job.vehicle.drivetrain}${job.vehicle.ev ? ", electric" : ""}. Tires ${job.vehicle.tires || "not listed"}.`,
    `${job.situation.starts ? "It starts." : "It will not start."} ${job.situation.rolls ? "It rolls." : "It does not roll."} ${job.situation.police ? "Officer requested." : "No officer requested."}`,
  ];
  if (!result.available || !result.quote) {
    return [...open, result.decline ?? "We can't take this one."];
  }
  const quote = result.quote;
  const ask = needsShop(job)
    ? `${equipmentLabel(job.situation.equipment)}${job.situation.winch ? " and a winch" : ""}. We can be there in ${quote.etaMin} minutes.`
    : atCurb(job.help)
      ? `${workLabel(job)}. Where the car is parked. ${quote.etaMin} minutes.`
      : `${workLabel(job)}. On the shoulder, not a shop. ${quote.etaMin} minutes.`;
  const drop = dropFor(job);
  const dest = drop
    ? `Drop at ${drop.shop.name}, ${drop.shop.address}.${drop.shop.rating > 0 ? ` ${drop.shop.rating.toFixed(1)} on Google` : ""}${drop.miles != null ? ` ${drop.miles.toFixed(1)} miles from this phone` : ""}.`
    : null;
  return [...open, ask, `Estimate ${usd(quote.total)}. ${quote.note}`, ...(dest ? [dest] : [])];
}

export function halfwayUpdate(job: Job): { etaMin: number; total: number; note: string } {
  const location = locationById(job.locationId);
  const quote = job.calls.find((c) => c.companyId === job.selectedCompanyId)?.quote;
  const current = job.live?.etaMin ?? quote?.etaMin ?? 20;
  const total = quote?.total ?? job.live?.total ?? 0;
  const slip = location.traffic === "heavy" ? 3 : 0;
  const etaMin = Math.max(6, Math.round(current * 0.48) + slip);
  const note = job.situation.police
    ? "Officer is on the shoulder. Lane is moving. Price held."
    : slip
      ? "Heavy traffic added a few minutes. Price held."
      : "Clear run from the shop. Price held.";
  return { etaMin, total, note };
}

export function blankJob(source: Job["source"] = "member"): Job {
  return recomputeSituation({
    id: `job-${Math.random().toString(36).slice(2, 8)}`,
    contactName: "",
    contactPhone: "",
    vehicle: { year: "2019", make: "Honda", model: "Civic", drivetrain: "FWD", tires: "215/55R16", ev: false },
    help: "tow",
    situation: {
      starts: false,
      rolls: true,
      position: "shoulder",
      side: "right",
      equipment: "wheel-lift",
      winch: false,
      police: false,
      equipmentTouched: false,
      winchTouched: false,
      policeTouched: false,
      spare: true,
      wrongFuel: false,
      shattered: false,
      broken: false,
    },
    locationId: "i70-108",
    coverage: "roadside",
    coverageLocked: false,
    calls: [],
    selectedCompanyId: null,
    status: "draft",
    live: null,
    review: null,
    payment: null,
    source,
    origin: null,
    drop: null,
  });
}

export function applySample(job: Job, which: "civic" | "ev"): Job {
  if (which === "ev") {
    return recomputeSituation({
      ...job,
      contactName: job.contactName || "Alex Chen",
      contactPhone: job.contactPhone || "(614) 555-0198",
      vehicle: { year: "2023", make: "Tesla", model: "Model Y", drivetrain: "AWD", tires: "255/45R19", ev: true },
      situation: {
        ...job.situation,
        starts: false,
        rolls: false,
        position: "ditch",
        side: "right",
        equipmentTouched: false,
        winchTouched: false,
        policeTouched: false,
      },
      locationId: "sr315-4",
      coverage: job.coverageLocked ? job.coverage : "full",
    });
  }
  return recomputeSituation({
    ...job,
    contactName: job.contactName || "Alex Chen",
    contactPhone: job.contactPhone || "(614) 555-0198",
    vehicle: { year: "2019", make: "Honda", model: "Civic", drivetrain: "FWD", tires: "215/55R16", ev: false },
    situation: {
      ...job.situation,
      starts: false,
      rolls: true,
      position: "shoulder",
      side: "right",
      equipmentTouched: false,
      winchTouched: false,
      policeTouched: false,
    },
    locationId: "i70-108",
    coverage: job.coverageLocked ? job.coverage : "roadside",
  });
}

function seedJob(partial: Pick<Job, "id" | "contactName" | "vehicle" | "situation" | "locationId" | "coverage" | "status" | "selectedCompanyId">): Job {
  const base = recomputeSituation({
    ...blankJob("seed"),
    ...partial,
    contactPhone: "(614) 555-0133",
    coverageLocked: false,
    calls: [],
    live: null,
    review: null,
    source: "seed",
  });
  const calls = buildCalls(base);
  const selected = calls.find((c) => c.companyId === partial.selectedCompanyId)?.quote;
  return {
    ...base,
    calls,
    live: selected ? { etaMin: selected.etaMin, total: selected.total, note: "Shop accepted. Truck is rolling." } : null,
  };
}

export const seedJobs: Job[] = [
  seedJob({
    id: "seed-camry",
    contactName: "Riley Brooks",
    vehicle: { year: "2018", make: "Toyota", model: "Camry", drivetrain: "FWD", tires: "215/55R17", ev: false },
    situation: {
      starts: false,
      rolls: true,
      position: "shoulder",
      side: "right",
      equipment: "wheel-lift",
      winch: false,
      police: false,
      equipmentTouched: true,
      winchTouched: true,
      policeTouched: true,
      spare: true,
      wrongFuel: false,
      shattered: false,
      broken: false,
    },
    locationId: "i71-111",
    coverage: "roadside",
    status: "enroute",
    selectedCompanyId: "scioto",
  }),
  seedJob({
    id: "seed-f150",
    contactName: "Morgan Ellis",
    vehicle: { year: "2021", make: "Ford", model: "F-150", drivetrain: "4WD", tires: "275/65R18", ev: false },
    situation: {
      starts: false,
      rolls: false,
      position: "ditch",
      side: "right",
      equipment: "flatbed",
      winch: true,
      police: true,
      equipmentTouched: true,
      winchTouched: true,
      policeTouched: true,
      spare: true,
      wrongFuel: false,
      shattered: false,
      broken: false,
    },
    locationId: "i270-22",
    coverage: "deductible",
    status: "quoted",
    selectedCompanyId: null,
  }),
];

export function phoneOk(phone: string): boolean {
  return phone.replace(/\D/g, "").length >= 10;
}

export function vehicleOk(vehicle: Vehicle): boolean {
  return Boolean(vehicle.year.trim() && vehicle.make.trim() && vehicle.model.trim());
}
