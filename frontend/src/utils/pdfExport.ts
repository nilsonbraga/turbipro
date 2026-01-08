import { Proposal } from "@/hooks/useProposals";
import { ProposalService } from "@/hooks/useProposalServices";

/* -------------------- Formatação -------------------- */
const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const pad2 = (n: number) => String(n).padStart(2, "0");

const formatDate = (date: string | Date) => {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return String(date);
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
};

const formatDateTime = (date: string | Date) => {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return String(date);
  return `${formatDate(d)} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};

const formatDateRange = (start?: any, end?: any) => {
  const s = start ? formatDate(start) : "";
  const e = end ? formatDate(end) : "";
  if (!s && !e) return "";
  if (s && e && s !== e) return `${s} → ${e}`;
  return s || e;
};

const formatTime = (date: string | Date) => {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return String(date);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};

const escapeHtml = (unsafe: any) => {
  const s = String(unsafe ?? "");
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const isBlank = (v: any) =>
  v === null || v === undefined || (typeof v === "string" && v.trim() === "");

const isEmptyValue = (v: any) =>
  v === null || v === undefined || v === "" || (Array.isArray(v) && v.length === 0);

const safeStr = (v: any) => String(v ?? "").trim();

/** tenta converter string numérica pt/en para number */
const coerceNumber = (v: any): number | null => {
  if (v === null || v === undefined) return null;
  if (typeof v === "number" && Number.isFinite(v)) return v;

  if (typeof v === "string") {
    const s = v.trim();
    if (!s) return null;

    // remove R$, espaços, etc
    let x = s.replace(/[R$\s]/g, "");

    // se tiver vírgula e ponto, assume pt-BR: 1.234,56
    if (x.includes(",") && x.includes(".")) {
      x = x.replace(/\./g, "").replace(",", ".");
    } else if (x.includes(",") && !x.includes(".")) {
      // 1234,56
      x = x.replace(",", ".");
    }

    const n = Number(x);
    if (Number.isFinite(n)) return n;
  }

  return null;
};

const isMoneyKey = (key: string) => {
  const k = (key || "").toLowerCase();
  return (
    /(^|_)(amount|value|price|total|cost|fare|tax|fee|deposit|coverage|limit|premium)(_|$)/i.test(
      k
    ) ||
    /(valor|preco|preço|total|taxa|tarifa|multa|cobertura|caucao|caução|franquia|diaria|diária)/i.test(
      k
    )
  );
};

const isMoneyLabel = (label: string) => {
  const l = (label || "").toLowerCase();
  return /(valor|total|preço|preco|taxa|tarifa|cobertura|caução|caucao|franquia|diária|diaria)/i.test(
    l
  );
};

const formatMaybeDate = (v: any) => {
  const s = safeStr(v);
  if (!s) return "";
  const d = new Date(s);
  if (
    !Number.isNaN(d.getTime()) &&
    (s.includes("T") || s.includes("-") || s.includes("/"))
  ) {
    const hasTime = s.includes("T") || /\d{2}:\d{2}/.test(s);
    return hasTime ? formatDateTime(s) : formatDate(s);
  }
  return s;
};

const generateReservationCode = (id: string, number: number) => {
  const idPart = (id || "").replace(/-/g, "").substring(0, 4).toUpperCase() || "XXXX";
  const numPart = (number ?? 0).toString().padStart(4, "0");
  const stamp = Date.now().toString(36).toUpperCase().slice(-4);
  return `RES-${idPart}${numPart}-${stamp}`;
};

function pluralize(n: number, singular: string, plural: string) {
  return n === 1 ? singular : plural;
}

/* -------------------- Rótulos PT -------------------- */
const serviceLabels: Record<string, string> = {
  flight: "Voo",
  hotel: "Hotel",
  car: "Carro",
  package: "Pacote",
  tour: "Passeio / Roteiro",
  cruise: "Cruzeiro",
  insurance: "Seguro",
  transfer: "Transfer",
  other: "Outro",
};

const cabinLabels: Record<string, string> = {
  economy: "Econômica",
  premium_economy: "Premium Economy",
  business: "Executiva",
  first: "Primeira Classe",
};

const tripTypeLabels: Record<string, string> = {
  oneway: "Só ida",
  roundtrip: "Ida e volta",
  multicity: "Múltiplos trechos",
};

const boardLabels: Record<string, string> = {
  RO: "Sem refeições",
  BB: "Café da manhã",
  HB: "Meia pensão",
  FB: "Pensão completa",
  AI: "All inclusive",
};

const iconNodes: Record<string, Array<[string, Record<string, string>]>> = {
  plane: [
    [
      "path",
      {
        d: "M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z",
        key: "1v9wt8",
      },
    ],
  ],
  hotel: [
    ["path", { d: "M10 22v-6.57", key: "1wmca3" }],
    ["path", { d: "M12 11h.01", key: "z322tv" }],
    ["path", { d: "M12 7h.01", key: "1ivr5q" }],
    ["path", { d: "M14 15.43V22", key: "1q2vjd" }],
    ["path", { d: "M15 16a5 5 0 0 0-6 0", key: "o9wqvi" }],
    ["path", { d: "M16 11h.01", key: "xkw8gn" }],
    ["path", { d: "M16 7h.01", key: "1kdx03" }],
    ["path", { d: "M8 11h.01", key: "1dfujw" }],
    ["path", { d: "M8 7h.01", key: "1vti4s" }],
    ["rect", { x: "4", y: "2", width: "16", height: "20", rx: "2", key: "1uxh74" }],
  ],
  car: [
    [
      "path",
      {
        d: "M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2",
        key: "5owen",
      },
    ],
    ["circle", { cx: "7", cy: "17", r: "2", key: "u2ysq9" }],
    ["path", { d: "M9 17h6", key: "r8uit2" }],
    ["circle", { cx: "17", cy: "17", r: "2", key: "axvx0g" }],
  ],
  package: [
    [
      "path",
      {
        d: "M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z",
        key: "1a0edw",
      },
    ],
    ["path", { d: "M12 22V12", key: "d0xqtd" }],
    [
      "path",
      { d: "m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7", key: "yx3hmr" },
    ],
    ["path", { d: "m7.5 4.27 9 5.15", key: "1c824w" }],
  ],
  map: [
    [
      "path",
      {
        d: "M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z",
        key: "169xi5",
      },
    ],
    ["path", { d: "M15 5.764v15", key: "1pn4in" }],
    ["path", { d: "M9 3.236v15", key: "1uimfh" }],
  ],
  ship: [
    ["path", { d: "M12 10.189V14", key: "1p8cqu" }],
    ["path", { d: "M12 2v3", key: "qbqxhf" }],
    [
      "path",
      { d: "M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6", key: "qpkstq" },
    ],
    [
      "path",
      {
        d: "M19.38 20A11.6 11.6 0 0 0 21 14l-8.188-3.639a2 2 0 0 0-1.624 0L3 14a11.6 11.6 0 0 0 2.81 7.76",
        key: "7tigtc",
      },
    ],
    [
      "path",
      {
        d: "M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1s1.2 1 2.5 1c2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1",
        key: "1924j5",
      },
    ],
  ],
  shield: [
    [
      "path",
      {
        d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
        key: "oel41y",
      },
    ],
  ],
  bus: [
    ["path", { d: "M8 6v6", key: "18i7km" }],
    ["path", { d: "M15 6v6", key: "1sg6z9" }],
    ["path", { d: "M2 12h19.6", key: "de5uta" }],
    [
      "path",
      {
        d: "M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3",
        key: "1wwztk",
      },
    ],
    ["circle", { cx: "7", cy: "18", r: "2", key: "19iecd" }],
    ["path", { d: "M9 18h5", key: "lrx6i" }],
    ["circle", { cx: "16", cy: "18", r: "2", key: "1v4tcr" }],
  ],
  calendar: [
    ["path", { d: "M8 2v4", key: "1cmpym" }],
    ["path", { d: "M16 2v4", key: "4m81vk" }],
    ["rect", { width: "18", height: "18", x: "3", y: "4", rx: "2", key: "1hopcy" }],
    ["path", { d: "M3 10h18", key: "8toen8" }],
  ],
  ticket: [
    [
      "path",
      {
        d: "M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z",
        key: "qn84l0",
      },
    ],
    ["path", { d: "M13 5v2", key: "dyzc3o" }],
    ["path", { d: "M13 17v2", key: "1ont0d" }],
    ["path", { d: "M13 11v2", key: "1wjjxi" }],
  ],
  users: [
    ["path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", key: "1yyitq" }],
    ["circle", { cx: "9", cy: "7", r: "4", key: "nufk8" }],
    ["path", { d: "M22 21v-2a4 4 0 0 0-3-3.87", key: "kshegd" }],
    ["path", { d: "M16 3.13a4 4 0 0 1 0 7.75", key: "1da9ce" }],
  ],
  briefcase: [
    ["path", { d: "M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16", key: "jecpp" }],
    ["rect", { width: "20", height: "14", x: "2", y: "6", rx: "2", key: "i6l2r4" }],
  ],
  luggage: [
    ["path", { d: "M6 20a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2", key: "1m57jg" }],
    ["path", { d: "M8 18V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v14", key: "1l99gc" }],
    ["path", { d: "M10 20h4", key: "ni2waw" }],
    ["circle", { cx: "16", cy: "20", r: "2", key: "1vifvg" }],
    ["circle", { cx: "8", cy: "20", r: "2", key: "ckkr5m" }],
  ],
  bed: [
    ["path", { d: "M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8", key: "1k78r4" }],
    ["path", { d: "M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4", key: "fb3tl2" }],
    ["path", { d: "M12 4v6", key: "1dcgq2" }],
    ["path", { d: "M2 18h20", key: "ajqnye" }],
  ],
  utensils: [
    ["path", { d: "m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8", key: "n7qcjb" }],
    ["path", { d: "M15 15 3.3 3.3a4.2 4.2 0 0 0 0 6l7.3 7.3c.7.7 2 .7 2.8 0L15 15Zm0 0 7 7", key: "d0u48b" }],
    ["path", { d: "m2.1 21.8 6.4-6.3", key: "yn04lh" }],
    ["path", { d: "m19 5-7 7", key: "194lzd" }],
  ],
  key: [
    [
      "path",
      {
        d: "M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z",
        key: "1s6t7t",
      },
    ],
    ["circle", { cx: "16.5", cy: "7.5", r: ".5", fill: "currentColor", key: "w0ekpg" }],
  ],
  building: [
    ["path", { d: "M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z", key: "1b4qmf" }],
    ["path", { d: "M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2", key: "i71pzd" }],
    ["path", { d: "M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2", key: "10jefs" }],
    ["path", { d: "M10 6h4", key: "1itunk" }],
    ["path", { d: "M10 10h4", key: "tcdvrf" }],
    ["path", { d: "M10 14h4", key: "kelpxr" }],
    ["path", { d: "M10 18h4", key: "1ulq68" }],
  ],
  wallet: [
    [
      "path",
      {
        d: "M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1",
        key: "18etb6",
      },
    ],
    ["path", { d: "M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4", key: "xoc0q4" }],
  ],
  mapPin: [
    [
      "path",
      {
        d: "M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0",
        key: "1r0f0z",
      },
    ],
    ["circle", { cx: "12", cy: "10", r: "3", key: "ilqhr7" }],
  ],
  mail: [
    ["rect", { width: "20", height: "16", x: "2", y: "4", rx: "2", key: "18n3k1" }],
    ["path", { d: "m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7", key: "1ocrg3" }],
  ],
  phone: [
    [
      "path",
      {
        d: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z",
        key: "foiqr5",
      },
    ],
  ],
  gauge: [
    ["path", { d: "m12 14 4-4", key: "9kzdfg" }],
    ["path", { d: "M3.34 19a10 10 0 1 1 17.32 0", key: "19p75a" }],
  ],
  activity: [
    [
      "path",
      {
        d: "M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2",
        key: "169zse",
      },
    ],
  ],
  moon: [
    ["path", { d: "M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z", key: "a7tn18" }],
  ],
  dot: [["circle", { cx: "12", cy: "12", r: "1.25", fill: "currentColor", key: "dot" }]],
};

const renderIcon = (name: string, className = "") => {
  const nodes = iconNodes[name] || iconNodes.dot;
  const cls = className ? ` ${className}` : "";
  const body = nodes
    .map(([tag, attrs]) => {
      const attrStr = Object.entries(attrs)
        .filter(([key]) => key !== "key")
        .map(([key, value]) => `${key}="${escapeHtml(String(value))}"`)
        .join(" ");
      return `<${tag}${attrStr ? ` ${attrStr}` : ""} />`;
    })
    .join("");
  return `<svg class="icon${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
};

const serviceIconMap: Record<string, string> = {
  flight: "plane",
  hotel: "hotel",
  car: "car",
  package: "package",
  tour: "map",
  cruise: "ship",
  insurance: "shield",
  transfer: "bus",
  other: "package",
};

const keyLabelPt: Record<string, string> = {
  // genéricos
  quantity: "Quantidade",
  unit_value: "Valor unitário",
  unitValue: "Valor unitário",
  value: "Valor",
  total: "Total",
  total_value: "Total",

  // datas
  startDate: "Data inicial",
  endDate: "Data final",
  start_date: "Data inicial",
  end_date: "Data final",
  created_at: "Criado em",
  updated_at: "Atualizado em",

  // voos (top)
  passengers: "Passageiros",
  cabinClass: "Classe",
  segments: "Trechos",
  baggage: "Bagagem",
  pnr: "Localizador",

  // voos (segmentos)
  fromIata: "Origem (IATA)",
  toIata: "Destino (IATA)",
  fromCity: "Cidade de origem",
  toCity: "Cidade de destino",
  fromAirport: "Aeroporto de origem",
  toAirport: "Aeroporto de destino",
  departureAt: "Partida",
  arrivalAt: "Chegada",
  airlineCode: "Companhia",
  airlineName: "Companhia",
  flightNumber: "Número do voo",
  operatingAirline: "Operado por",
  operatedBy: "Operado por",
  aircraft: "Aeronave",
  aircraftModel: "Aeronave",
  terminal: "Terminal",
  gate: "Portão",
  seat: "Assento",
  bookingClass: "Classe de reserva",
  fareBasis: "Tarifa (fare basis)",
  fareFamily: "Família tarifária",
  duration: "Duração",
  durationMinutes: "Duração (min)",
  connection: "Conexão",
  layover: "Conexão",
  stopover: "Parada",
  stops: "Paradas",

  // hotel
  hotelName: "Hotel",
  city: "Cidade",
  country: "País",
  address: "Endereço",
  checkIn: "Check-in",
  checkOut: "Check-out",
  checkInTime: "Horário de check-in",
  checkOutTime: "Horário de check-out",
  roomType: "Tipo de quarto",
  board: "Regime",
  guests: "Hóspedes",
  adults: "Adultos",
  children: "Crianças",
  confirmationNumber: "Confirmação",
  amenities: "Comodidades",
  cancellationPolicy: "Política de cancelamento",
  refundable: "Reembolsável",

  // carro
  rentalCompany: "Locadora",
  carCategory: "Categoria",
  transmission: "Câmbio",
  pickupLocation: "Local de retirada",
  pickupAt: "Retirada",
  dropoffLocation: "Local de devolução",
  dropoffAt: "Devolução",
  mileagePolicy: "Política de quilometragem",
  fuelPolicy: "Política de combustível",
  insurance: "Seguro",
  deposit: "Caução",
  driverAge: "Idade do condutor",
  franchise: "Franquia",

  // seguro
  insurer: "Seguradora",
  planName: "Plano",
  coverageStart: "Início da vigência",
  coverageEnd: "Fim da vigência",
  destinationRegion: "Região",
  medicalCoverageAmount: "Cobertura médica",
  baggageCoverageAmount: "Cobertura de bagagem",
  cancellationCoverageAmount: "Cobertura de cancelamento",
  policyNumber: "Apólice",

  // cruzeiro
  cruiseLine: "Companhia",
  shipName: "Navio",
  embarkPort: "Embarque",
  disembarkPort: "Desembarque",
  sailingDate: "Data de saída",
  returnDate: "Data de retorno",
  cabinType: "Tipo de cabine",
  cabinCategory: "Categoria",
  itineraryPorts: "Itinerário",

  // transfer
  transferType: "Tipo",
  pickupPlace: "Origem",
  dropoffPlace: "Destino",
  vehicleType: "Veículo",
  passengersCount: "Passageiros",

  // roteiro/pacote
  pace: "Ritmo",
  days: "Programação",
  itinerary: "Programação",
  program: "Programação",
  destinations: "Destinos",
  inclusions: "Inclui",
  packageName: "Nome do pacote",
  destinationBase: "Base do roteiro",
};

const toLabelPT = (key: string) => {
  const k = String(key || "");
  if (keyLabelPt[k]) return keyLabelPt[k];
  return k
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .trim()
    .replace(/^./, (c) => c.toUpperCase());
};

const translateCommonValuePT = (v: any) => {
  const s = safeStr(v);
  if (!s) return "";
  const map: Record<string, string> = {
    "premium economy": "Econômica Premium",
    "all inclusive": "Tudo incluído",
    economy: "Econômica",
    business: "Executiva",
    first: "Primeira Classe",
    private: "Privado",
    shared: "Compartilhado",
    yes: "Sim",
    no: "Não",
    true: "Sim",
    false: "Não",
  };
  const key = s.toLowerCase();
  return map[key] ?? s;
};

/* -------------------- UI helpers (documento) -------------------- */

function formatValueByKey(keyOrLabel: string, v: any): string {
  if (isBlank(v)) return "";

  // datas (string -> dd/mm/yyyy)
  if (typeof v === "string") {
    const maybeDate = formatMaybeDate(v);
    // se converteu, retorna convertido; se não, traduz valores comuns
    return translateCommonValuePT(maybeDate);
  }

  // boolean
  if (typeof v === "boolean") return v ? "Sim" : "Não";

  // number como moeda quando fizer sentido
  if (typeof v === "number") {
    if (isMoneyKey(keyOrLabel) || isMoneyLabel(keyOrLabel)) return formatCurrency(v);
    return String(v);
  }

  // strings numéricas como moeda
  const n = coerceNumber(v);
  if (n !== null && (isMoneyKey(keyOrLabel) || isMoneyLabel(keyOrLabel)))
    return formatCurrency(n);

  // fallback
  return translateCommonValuePT(String(v));
}

function buildKeyValueList(items: Array<{ key?: string; label: string; value?: any }>) {
  const clean = items
    .map((i) => ({ ...i, value: i.value }))
    .filter((i) => !isBlank(i.value));

  if (!clean.length) return "";

  return `
    <div class="kv">
      ${clean
        .map((i) => {
          const keyOrLabel = i.key || i.label;
          const vv = formatValueByKey(keyOrLabel, i.value);
          if (isBlank(vv)) return "";
          return `
            <div class="kv-row">
              <div class="kv-k">${escapeHtml(i.label)}</div>
              <div class="kv-v">${escapeHtml(vv)}</div>
            </div>
          `;
        })
        .filter(Boolean)
        .join("")}
    </div>
  `;
}

function buildPillGrid(items: Array<{ label: string; value: any }>) {
  const clean = items.filter((item) => !isBlank(item.value));
  if (!clean.length) return "";

  return `
    <div class="pill-grid">
      ${clean
        .map((item) => {
          const vv = formatValueByKey(item.label, item.value);
          if (isBlank(vv)) return "";
          return `
            <div class="pill">
              <div class="pill-label">${escapeHtml(item.label)}</div>
              <div class="pill-value">${escapeHtml(vv)}</div>
            </div>
          `;
        })
        .filter(Boolean)
        .join("")}
    </div>
  `;
}

function formatInfoValue(value: any) {
  if (isEmptyValue(value)) return "";
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  if (Array.isArray(value)) {
    return value
      .map((item) => (item == null ? "" : String(item)))
      .filter((item) => !isBlank(item))
      .join(", ");
  }
  return String(value);
}

function renderInfoPill(icon: string, label: string, value: any) {
  const v = formatInfoValue(value);
  if (isBlank(v)) return "";
  return `
    <div class="info-pill">
      <div class="info-icon">${renderIcon(icon, "icon-xs")}</div>
      <div class="info-text">
        <div class="info-label">${escapeHtml(label)}</div>
        <div class="info-value">${escapeHtml(v)}</div>
      </div>
    </div>
  `;
}

function renderMetaLine(icon: string, value: string) {
  if (isBlank(value)) return "";
  return `
    <div class="meta-line">
      ${renderIcon(icon, "icon-sm")}
      <span>${escapeHtml(value)}</span>
    </div>
  `;
}

function renderValueCompact(v: any): string {
  if (isBlank(v)) return "";
  if (typeof v === "boolean") return v ? "Sim" : "Não";
  if (typeof v === "number") return String(v);
  if (typeof v === "string") return translateCommonValuePT(formatMaybeDate(v));

  if (Array.isArray(v)) {
    if (!v.length) return "";
    if (v.every((x) => ["string", "number", "boolean"].includes(typeof x) || x == null)) {
      return v
        .map((x) =>
          typeof x === "string"
            ? translateCommonValuePT(formatMaybeDate(x))
            : typeof x === "boolean"
            ? x
              ? "Sim"
              : "Não"
            : String(x)
        )
        .filter((x) => !isBlank(x))
        .join(", ");
    }
    return `${v.length} ${pluralize(v.length, "item", "itens")}`;
  }

  if (typeof v === "object") {
    const keys = Object.keys(v);
    if (!keys.length) return "";
    const previewKeys = keys.slice(0, 3);
    const preview = previewKeys
      .map((k) => {
        const vv = (v as any)[k];
        const vvStr = renderValueCompact(vv);
        return vvStr ? `${toLabelPT(k)}: ${vvStr}` : "";
      })
      .filter(Boolean)
      .join(" • ");
    return preview || "Detalhes";
  }

  return String(v);
}

function renderExtraDetails(details: any, exclude: string[] = []) {
  const blacklist = new Set([
    "unit_value",
    "quantity",
    "commission_value",
    "commission_type",
    "segments",
    "passengers",
    "baggage",
  ]);

  const entries = Object.entries(details || {}).filter(([k, v]) => {
    if (exclude.includes(k) || blacklist.has(k)) return false;
    if (isEmptyValue(v)) return false;
    if (typeof v === "object" && !Array.isArray(v)) return false;
    return true;
  });

  if (!entries.length) return "";

  const rows = entries
    .map(([k, v]) => {
      let value = "";
      if (Array.isArray(v)) {
        value = v
          .map((item) => renderValueCompact(item))
          .filter(Boolean)
          .join(" • ");
      } else if (typeof v === "boolean") {
        value = v ? "Sim" : "Não";
      } else {
        value = formatValueByKey(k, v);
      }
      if (isBlank(value)) return "";
      return `
        <div class="extra-row">
          <div class="extra-label">${escapeHtml(toLabelPT(k))}</div>
          <div class="extra-value">${escapeHtml(value)}</div>
        </div>
      `;
    })
    .filter(Boolean)
    .join("");

  if (!rows) return "";

  return `
    <div class="extra-details">
      <div class="extra-title">Outros detalhes</div>
      <div class="extra-list">
        ${rows}
      </div>
    </div>
  `;
}

function hasAnyNonBlankDeep(obj: any): boolean {
  if (isBlank(obj)) return false;
  if (typeof obj !== "object") return !isBlank(obj);
  if (Array.isArray(obj)) return obj.some((x) => hasAnyNonBlankDeep(x));
  return Object.values(obj).some((x) => hasAnyNonBlankDeep(x));
}

function renderTableFromObjectArray(label: string, arr: any[]) {
  const rows = arr.filter((x) => x && typeof x === "object" && !Array.isArray(x));
  if (!rows.length) return "";

  // escolhe colunas mais relevantes (até 7)
  const colSet = new Set<string>();
  for (const r of rows.slice(0, 10)) {
    Object.keys(r).forEach((k) => {
      if (hasAnyNonBlankDeep(r[k])) colSet.add(k);
    });
  }
  const cols = Array.from(colSet).slice(0, 7);
  if (!cols.length) return "";

  const head = cols.map((c) => `<th>${escapeHtml(toLabelPT(c))}</th>`).join("");
  const body = rows
    .map((r) => {
      const tds = cols
        .map((c) => {
          const vv = formatValueByKey(c, r[c]);
          return `<td>${escapeHtml(vv || "")}</td>`;
        })
        .join("");
      return `<tr>${tds}</tr>`;
    })
    .join("");

  return `
    <div class="kv-block">
      <div class="kv-k">${escapeHtml(label)}</div>
      <div class="tbl-wrap">
        <table class="tbl">
          <thead><tr>${head}</tr></thead>
          <tbody>${body}</tbody>
        </table>
      </div>
    </div>
  `;
}

/**
 * Mostra o que sobrou, mas:
 * - tudo em PT (labels)
 * - arrays de objetos viram tabela
 * - objetos viram KV “achatado” quando possível
 * - <pre> só quando for realmente necessário
 */
function renderAllRemainingDetails(
  details: any,
  usedKeys: Set<string>,
  title = "Detalhes adicionais"
) {
  if (!details || typeof details !== "object") return "";

  const entries = Object.entries(details).filter(
    ([k, v]) => !usedKeys.has(k) && hasAnyNonBlankDeep(v)
  );
  if (!entries.length) return "";

  const simple: Array<{ key: string; label: string; value: string }> = [];
  const tables: Array<{ label: string; raw: any[] }> = [];
  const complexObjects: Array<{ label: string; raw: any }> = [];

  for (const [k, v] of entries) {
    if (typeof v !== "object" || v === null) {
      const vv = formatValueByKey(k, v);
      if (!isBlank(vv)) simple.push({ key: k, label: toLabelPT(k), value: vv });
      continue;
    }

    if (Array.isArray(v)) {
      if (!v.length) continue;

      if (
        v.every(
          (x) =>
            typeof x === "string" ||
            typeof x === "number" ||
            typeof x === "boolean" ||
            x == null
        )
      ) {
        const vv = renderValueCompact(v);
        if (!isBlank(vv)) simple.push({ key: k, label: toLabelPT(k), value: vv });
      } else if (v.every((x) => x && typeof x === "object" && !Array.isArray(x))) {
        tables.push({ label: toLabelPT(k), raw: v });
      } else {
        // misto: cai em objeto complexo (último caso)
        complexObjects.push({ label: toLabelPT(k), raw: v });
      }
      continue;
    }

    // objeto: tenta “achatar” primitivos em KV
    const flatPairs: Array<{ key: string; label: string; value: any }> = [];
    const nested: Record<string, any> = {};

    for (const kk of Object.keys(v)) {
      const vv = v[kk];
      if (!hasAnyNonBlankDeep(vv)) continue;

      if (typeof vv !== "object" || vv === null) {
        flatPairs.push({ key: kk, label: toLabelPT(kk), value: vv });
      } else {
        nested[kk] = vv;
      }
    }

    if (flatPairs.length) {
      // render flatPairs como sub-bloco
      const block = buildKeyValueList(
        flatPairs.map((p) => ({ key: p.key, label: p.label, value: p.value }))
      );
      complexObjects.push({
        label: toLabelPT(k),
        raw: block + (Object.keys(nested).length ? "" : ""),
      });
      if (Object.keys(nested).length) {
        complexObjects.push({ label: `${toLabelPT(k)} (detalhes)`, raw: nested });
      }
    } else {
      complexObjects.push({ label: toLabelPT(k), raw: v });
    }
  }

  const simpleHtml = simple.length
    ? buildKeyValueList(
        simple.map((x) => ({ key: x.key, label: x.label, value: x.value }))
      )
    : "";

  const tablesHtml = tables
    .map((t) => renderTableFromObjectArray(t.label, t.raw))
    .join("");

  const complexHtml = complexObjects
    .map((r) => {
      // se já veio HTML (string com KV), usa direto
      if (typeof r.raw === "string" && r.raw.includes("<div")) {
        return `
          <div class="kv-block">
            <div class="kv-k">${escapeHtml(r.label)}</div>
            ${r.raw}
          </div>
        `;
      }

      // se for array/objeto irregular: último caso <pre>
      const pretty = JSON.stringify(r.raw, null, 2);
      return `
        <div class="kv-block">
          <div class="kv-k">${escapeHtml(r.label)}</div>
          <pre class="pre">${escapeHtml(pretty)}</pre>
        </div>
      `;
    })
    .join("");

  if (!simpleHtml && !tablesHtml && !complexHtml) return "";

  return `
    <div class="subsection">
      <div class="subsection-title">${escapeHtml(title)}</div>
      ${simpleHtml}
      ${tablesHtml}
      ${complexHtml}
    </div>
  `;
}

function getServicePricing(service: ProposalService) {
  const details: any = service.details || {};
  const total = Number(service.value || 0);

  const quantity = Number(details?.quantity || 0);
  const unitValue = !isBlank(details?.unit_value)
    ? Number(details.unit_value)
    : quantity > 0
    ? total / quantity
    : total;

  const normalizedQty = quantity > 0 ? quantity : undefined;
  return { total, quantity: normalizedQty, unitValue };
}

/* -------------------- Render por tipo (layout público) -------------------- */

function renderFlightDetails(service: ProposalService): string {
  const details: any = service.details || {};
  const provider = (service as any)?.partners?.name || (service as any)?.provider;

  const passengers = Array.isArray(details.passengers) ? details.passengers : [];
  const paxSummary = passengers
    .map((p: any) => {
      const count = Number(p?.count || 0);
      if (!count) return "";
      const label =
        p?.type === "ADT"
          ? "Adulto"
          : p?.type === "CHD"
          ? "Criança"
          : p?.type === "INF"
          ? "Bebê"
          : "Passageiro";
      return `${count} ${label}${count > 1 ? "s" : ""}`;
    })
    .filter(Boolean)
    .join(", ");

  const baggage = details?.baggage || {};
  const carryOnText = baggage?.carryOn ? `${baggage.carryOnQty || 1}x` : "";
  const checkedText = baggage?.checked
    ? `${baggage.checkedQty || 1}x${
        baggage.checkedWeight ? ` (${baggage.checkedWeight})` : ""
      }`
    : "";

  const segments = Array.isArray(details.segments) ? details.segments : [];
  const firstSegment = segments[0] || {};
  const airline =
    details?.airline ||
    (service as any)?.airline ||
    firstSegment?.airlineCode ||
    firstSegment?.operatingCarrier ||
    "";
  const mainFlightNumber = firstSegment?.flightNumber || details?.flight_number || "";

  const pills = [
    renderInfoPill("briefcase", "Fornecedor", provider),
    renderInfoPill("users", "Passageiros", paxSummary),
    renderInfoPill("plane", "Companhia", airline),
    renderInfoPill("ticket", "Voo", mainFlightNumber),
    details?.tripType
      ? renderInfoPill(
          "plane",
          "Tipo de viagem",
          tripTypeLabels[details.tripType] || details.tripType
        )
      : "",
    details?.cabinClass
      ? renderInfoPill(
          "ticket",
          "Classe",
          cabinLabels[details.cabinClass] || details.cabinClass
        )
      : "",
    details?.fareClass
      ? renderInfoPill("ticket", "Classe tarifária", details.fareClass)
      : "",
    carryOnText ? renderInfoPill("briefcase", "Bagagem de mão", carryOnText) : "",
    checkedText ? renderInfoPill("luggage", "Despachada", checkedText) : "",
    details?.pnr ? renderInfoPill("ticket", "Localizador", details.pnr) : "",
    typeof details?.refundable === "boolean"
      ? renderInfoPill("shield", "Reembolsável", details.refundable)
      : "",
  ]
    .filter(Boolean)
    .join("");

  const segmentsHtml = segments.length
    ? `
      <div class="detail-section">
        <div class="detail-section-title">Trechos</div>
        <div class="segment-list">
          ${segments
            .map((seg: any, idx: number) => {
              const flightNo =
                seg?.airlineCode || seg?.flightNumber
                  ? `${seg?.airlineCode || ""}${
                      seg?.flightNumber ? ` ${seg.flightNumber}` : ""
                    }`
                  : "";
              const dep = formatDateTime(seg?.departureAt);
              const arr = formatDateTime(seg?.arrivalAt);

              const connections = Array.isArray(seg?.connections)
                ? seg.connections
                : [];

              const connectionsHtml = connections.length
                ? `
                  <div class="segment-connections">
                    <div class="segment-conn-title">Conexões</div>
                    ${connections
                      .map((conn: any, cIdx: number) => {
                        const connFlight =
                          conn?.airlineCode || conn?.flightNumber
                            ? `${conn?.airlineCode || ""}${
                                conn?.flightNumber ? ` ${conn.flightNumber}` : ""
                              }`
                            : "";
                        const times = [
                          conn?.departureAt
                            ? `Saída ${formatTime(conn.departureAt)}`
                            : "",
                          conn?.arrivalAt
                            ? `Chegada ${formatTime(conn.arrivalAt)}`
                            : "",
                        ]
                          .filter(Boolean)
                          .join("  ");
                        return `
                          <div class="segment-conn-row" key="${idx}-${cIdx}">
                            <div class="segment-conn-code">${escapeHtml(
                              String(conn?.iata || "---").toUpperCase()
                            )}</div>
                            <div class="segment-conn-meta">${escapeHtml(
                              [times, connFlight].filter(Boolean).join(" | ")
                            )}</div>
                          </div>
                        `;
                      })
                      .join("")}
                  </div>
                `
                : "";

              const timesHtml =
                dep || arr
                  ? `
                    <div class="segment-times">
                      ${dep ? `<div>Partida: ${escapeHtml(dep)}</div>` : ""}
                      ${arr ? `<div>Chegada: ${escapeHtml(arr)}</div>` : ""}
                    </div>
                  `
                  : "";

              return `
                <div class="segment-card">
                  <div class="segment-top">
                    <div class="segment-route">${escapeHtml(
                      String(seg?.fromIata || "---").toUpperCase()
                    )} → ${escapeHtml(
                      String(seg?.toIata || "---").toUpperCase()
                    )}</div>
                    ${
                      flightNo
                        ? `<div class="segment-flight">${escapeHtml(flightNo)}</div>`
                        : ""
                    }
                  </div>
                  ${timesHtml}
                  ${connectionsHtml}
                </div>
              `;
            })
            .join("")}
        </div>
      </div>
    `
    : "";

  const extras = renderExtraDetails(details, [
    "passengers",
    "segments",
    "baggage",
    "pnr",
    "tripType",
    "cabinClass",
    "fareClass",
    "refundable",
  ]);

  return `
    <div class="detail-block">
      ${pills ? `<div class="info-grid">${pills}</div>` : ""}
      ${segmentsHtml}
      ${extras}
    </div>
  `;
}

function renderHotelDetails(service: ProposalService): string {
  const details: any = service.details || {};
  const provider = (service as any)?.partners?.name || (service as any)?.provider;
  const guests = details?.guests || {};
  const totalGuests = Number(guests.adults || 0) + Number(guests.children || 0);

  const nights = (() => {
    const a = details?.checkIn ? new Date(details.checkIn) : null;
    const b = details?.checkOut ? new Date(details.checkOut) : null;
    if (!a || !b || Number.isNaN(a.getTime()) || Number.isNaN(b.getTime()))
      return null;
    return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86400000));
  })();

  const pills = [
    renderInfoPill("briefcase", "Fornecedor", provider),
    renderInfoPill("bed", "Hotel", details?.hotelName),
    renderInfoPill(
      "mapPin",
      "Local",
      [details?.city, details?.country, details?.address]
        .filter(Boolean)
        .join(" • ")
    ),
    renderInfoPill("key", "Quarto", details?.roomType),
    renderInfoPill(
      "utensils",
      "Regime",
      details?.board ? boardLabels[details.board] || details.board : ""
    ),
    totalGuests > 0
      ? renderInfoPill(
          "users",
          "Hóspedes",
          `${totalGuests} hóspede${totalGuests > 1 ? "s" : ""}`
        )
      : "",
    renderInfoPill("ticket", "Tarifa", details?.ratePlan),
  ]
    .filter(Boolean)
    .join("");

  const checkInText = formatDateTime(details?.checkIn);
  const checkOutText = formatDateTime(details?.checkOut);
  const lines = `
    <div class="detail-lines">
      ${
        checkInText
          ? `<div>Check-in: ${escapeHtml(checkInText)}${
              details?.checkInTime ? ` às ${escapeHtml(details.checkInTime)}` : ""
            }</div>`
          : ""
      }
      ${
        checkOutText
          ? `<div>Check-out: ${escapeHtml(checkOutText)}${
              details?.checkOutTime ? ` às ${escapeHtml(details.checkOutTime)}` : ""
            }</div>`
          : ""
      }
      ${
        nights != null
          ? `<div class="detail-strong">Estadia: ${nights} noite${
              nights === 1 ? "" : "s"
            }</div>`
          : ""
      }
    </div>
  `;

  const photos = Array.isArray(details?.photos)
    ? details.photos.filter((photo: string) => Boolean(photo)).slice(0, 6)
    : [];

  const photoBlock = photos.length
    ? `
      <div class="detail-section">
        <div class="detail-section-title">Fotos do hotel</div>
        <div class="photo-grid">
          ${photos
            .map(
              (photo: string) =>
                `<div class="photo-cell"><img src="${escapeHtml(
                  photo
                )}" alt="Hotel"/></div>`
            )
            .join("")}
        </div>
      </div>
    `
    : "";

  const extras = renderExtraDetails(details, [
    "hotelName",
    "city",
    "country",
    "address",
    "checkIn",
    "checkOut",
    "checkInTime",
    "checkOutTime",
    "roomType",
    "board",
    "guests",
    "ratePlan",
    "photos",
  ]);

  return `
    <div class="detail-block">
      ${pills ? `<div class="info-grid">${pills}</div>` : ""}
      ${lines}
      ${photoBlock}
      ${extras}
    </div>
  `;
}

function renderCarDetails(service: ProposalService): string {
  const details: any = service.details || {};
  const provider = (service as any)?.partners?.name || (service as any)?.provider;
  const transmission =
    details?.transmission === "auto"
      ? "Automático"
      : details?.transmission === "manual"
      ? "Manual"
      : details?.transmission || "";

  const pills = [
    renderInfoPill("briefcase", "Fornecedor", provider),
    renderInfoPill("building", "Locadora", details?.rentalCompany),
    renderInfoPill("car", "Categoria", details?.carCategory),
    renderInfoPill("key", "Câmbio", transmission),
    renderInfoPill("shield", "Seguro", details?.insurance),
    renderInfoPill("wallet", "Depósito", details?.deposit),
  ]
    .filter(Boolean)
    .join("");

  const pickupAt = details?.pickupAt ? formatDateTime(details.pickupAt) : "";
  const dropoffAt = details?.dropoffAt ? formatDateTime(details.dropoffAt) : "";
  const lines = `
    <div class="detail-lines">
      ${
        details?.pickupLocation
          ? `<div>Retirada: ${escapeHtml(details.pickupLocation)}${
              pickupAt ? ` • ${escapeHtml(pickupAt)}` : ""
            }</div>`
          : ""
      }
      ${
        details?.dropoffLocation
          ? `<div>Devolução: ${escapeHtml(details.dropoffLocation)}${
              dropoffAt ? ` • ${escapeHtml(dropoffAt)}` : ""
            }</div>`
          : ""
      }
    </div>
  `;

  const extras = renderExtraDetails(details, [
    "pickupAt",
    "dropoffAt",
    "pickupLocation",
    "dropoffLocation",
    "rentalCompany",
    "carCategory",
    "transmission",
    "insurance",
    "deposit",
  ]);

  return `
    <div class="detail-block">
      ${pills ? `<div class="info-grid">${pills}</div>` : ""}
      ${lines}
      ${extras}
    </div>
  `;
}

function renderCruiseDetails(service: ProposalService): string {
  const details: any = service.details || {};
  const provider = (service as any)?.partners?.name || (service as any)?.provider;

  const pills = [
    renderInfoPill("briefcase", "Fornecedor", provider),
    renderInfoPill("ship", "Navio", details?.ship || details?.shipName),
    renderInfoPill("bed", "Cabine", details?.cabin || details?.cabinType),
  ]
    .filter(Boolean)
    .join("");

  const lines = `
    <div class="detail-lines">
      ${
        details?.sailingDate || details?.startDate
          ? `<div>Início: ${escapeHtml(
              formatDateTime(details?.sailingDate || details?.startDate)
            )}</div>`
          : ""
      }
      ${
        details?.returnDate || details?.endDate
          ? `<div>Retorno: ${escapeHtml(
              formatDateTime(details?.returnDate || details?.endDate)
            )}</div>`
          : ""
      }
    </div>
  `;

  const extras = renderExtraDetails(details, [
    "ship",
    "shipName",
    "cabin",
    "cabinType",
    "sailingDate",
    "returnDate",
    "startDate",
    "endDate",
  ]);

  return `
    <div class="detail-block">
      ${pills ? `<div class="info-grid">${pills}</div>` : ""}
      ${lines}
      ${extras}
    </div>
  `;
}

function renderInsuranceDetails(service: ProposalService): string {
  const details: any = service.details || {};
  const provider = (service as any)?.partners?.name || (service as any)?.provider;
  const travellers = Array.isArray(details?.travellers)
    ? details.travellers.join(", ")
    : details?.travellers;

  const pills = [
    renderInfoPill("briefcase", "Fornecedor", provider),
    renderInfoPill("shield", "Plano", details?.plan),
    renderInfoPill("shield", "Cobertura", details?.coverage),
    renderInfoPill("users", "Viajantes", travellers),
  ]
    .filter(Boolean)
    .join("");

  const lines = `
    <div class="detail-lines">
      ${
        details?.coverageStart
          ? `<div>Início da cobertura: ${escapeHtml(
              formatDateTime(details.coverageStart)
            )}</div>`
          : ""
      }
      ${
        details?.coverageEnd
          ? `<div>Fim da cobertura: ${escapeHtml(
              formatDateTime(details.coverageEnd)
            )}</div>`
          : ""
      }
    </div>
  `;

  const extras = renderExtraDetails(details, [
    "plan",
    "coverage",
    "travellers",
    "coverageStart",
    "coverageEnd",
  ]);

  return `
    <div class="detail-block">
      ${pills ? `<div class="info-grid">${pills}</div>` : ""}
      ${lines}
      ${extras}
    </div>
  `;
}

function renderTransferDetails(service: ProposalService): string {
  const details: any = service.details || {};
  const provider = (service as any)?.partners?.name || (service as any)?.provider;
  const transferType =
    details?.transferType === "privado"
      ? "Privado"
      : details?.transferType === "compartilhado"
      ? "Compartilhado"
      : details?.transferType || "";

  const pills = [
    renderInfoPill("briefcase", "Fornecedor", provider),
    renderInfoPill("bus", "Tipo de transfer", transferType),
    renderInfoPill("car", "Veículo", details?.vehicleType),
    renderInfoPill(
      "users",
      "Passageiros",
      details?.passengersCount ? `${details.passengersCount}` : ""
    ),
    renderInfoPill("plane", "Ref. do voo", details?.flightRef),
    renderInfoPill("bus", "Ref. do trem", details?.trainRef),
  ]
    .filter(Boolean)
    .join("");

  const pickupAt = details?.pickupAt ? formatDateTime(details.pickupAt) : "";
  const lines = `
    <div class="detail-lines">
      ${
        details?.pickupPlace
          ? `<div>Embarque: ${escapeHtml(details.pickupPlace)}${
              pickupAt ? ` • ${escapeHtml(pickupAt)}` : ""
            }</div>`
          : ""
      }
      ${
        details?.dropoffPlace
          ? `<div>Desembarque: ${escapeHtml(details.dropoffPlace)}</div>`
          : ""
      }
      ${
        details?.meetingPointInstructions
          ? `<div>Ponto de encontro: ${escapeHtml(
              details.meetingPointInstructions
            )}</div>`
          : ""
      }
      ${
        details?.luggageInfo
          ? `<div>Bagagem: ${escapeHtml(details.luggageInfo)}</div>`
          : ""
      }
    </div>
  `;

  const extras = renderExtraDetails(details, [
    "transferType",
    "vehicleType",
    "passengersCount",
    "pickupPlace",
    "dropoffPlace",
    "pickupAt",
    "meetingPointInstructions",
    "luggageInfo",
    "flightRef",
    "trainRef",
  ]);

  return `
    <div class="detail-block">
      ${pills ? `<div class="info-grid">${pills}</div>` : ""}
      ${lines}
      ${extras}
    </div>
  `;
}

/* ---- Programação (sem JSON “meleca”) ---- */
function normalizeActivities(items: any[]): string[] {
  const out: string[] = [];

  for (const x of items || []) {
    if (isBlank(x)) continue;

    if (typeof x === "string") {
      const s = x.trim();
      if (!s) continue;
      if (/^\s*\{.*\}\s*$/.test(s) || /^\s*\[.*\]\s*$/.test(s)) continue;
      out.push(translateCommonValuePT(s));
      continue;
    }

    if (typeof x === "object") {
      const text =
        safeStr(x.title) ||
        safeStr(x.name) ||
        safeStr(x.summary) ||
        safeStr(x.description) ||
        safeStr(x.activity) ||
        safeStr(x.place);

      const time = safeStr(x.time) || safeStr(x.hour) || safeStr(x.at);
      const line = [time, text].filter(Boolean).join(" • ");

      // se não tem conteúdo humano, não imprime
      if (line && !/^\s*[\{\[]/.test(line)) out.push(translateCommonValuePT(line));
      continue;
    }
  }

  return out;
}

function renderProgramacao(days: any[], titulo: string) {
  if (!Array.isArray(days) || !days.length) return "";

  const rows = days
    .map((d: any, i: number) => {
      if (!d) return "";

      const title = safeStr(d.title) || safeStr(d.name) || safeStr(d.dayTitle);
      const date = safeStr(d.date) || safeStr(d.dayDate);
      const summary = safeStr(d.summary) || safeStr(d.description) || safeStr(d.notes);

      const itemsRaw = Array.isArray(d.items)
        ? d.items
        : Array.isArray(d.activities)
        ? d.activities
        : Array.isArray(d.schedule)
        ? d.schedule
        : [];

      const items = normalizeActivities(itemsRaw);

      if (!title && !date && !summary && items.length === 0) return "";

      return `
        <div class="t-row">
          <div class="t-left">
            <div class="t-day">Dia ${i + 1}</div>
            ${
              date ? `<div class="t-date">${escapeHtml(formatMaybeDate(date))}</div>` : ""
            }
          </div>
          <div class="t-right">
            ${title ? `<div class="t-title">${escapeHtml(title)}</div>` : ""}
            ${summary ? `<div class="t-text">${escapeHtml(summary)}</div>` : ""}
            ${
              items.length
                ? `<ul class="t-list">${items
                    .map((it) => `<li>${escapeHtml(it)}</li>`)
                    .join("")}</ul>`
                : ""
            }
          </div>
        </div>
      `;
    })
    .filter(Boolean)
    .join("");

  if (!rows) return "";

  return `
    <div class="subsection">
      <div class="subsection-title">${escapeHtml(titulo)}</div>
      <div class="timeline">
        ${rows}
      </div>
    </div>
  `;
}

function renderPackageDetails(service: ProposalService): string {
  const details: any = service.details || {};
  const provider = (service as any)?.partners?.name || (service as any)?.provider;

  const pills = [
    renderInfoPill("briefcase", "Fornecedor", provider),
    renderInfoPill("package", "Pacote", details?.packageName),
    renderInfoPill("mapPin", "Destinos", details?.destinations),
    typeof details?.nights === "number"
      ? renderInfoPill("moon", "Noites", `${details.nights} noite(s)`)
      : "",
  ]
    .filter(Boolean)
    .join("");

  const lines = `
    <div class="detail-lines">
      ${
        details?.startDate
          ? `<div>Início: ${escapeHtml(formatDateTime(details.startDate))}</div>`
          : ""
      }
      ${
        details?.endDate
          ? `<div>Fim: ${escapeHtml(formatDateTime(details.endDate))}</div>`
          : ""
      }
    </div>
  `;

  const sections = [
    details?.itinerarySummary
      ? `<div class="detail-section">
          <div class="detail-section-title">Resumo do roteiro</div>
          <div class="detail-text">${escapeHtml(details.itinerarySummary)}</div>
        </div>`
      : "",
    details?.inclusions
      ? `<div class="detail-section">
          <div class="detail-section-title">Inclusões</div>
          <div class="detail-text pre-wrap">${escapeHtml(details.inclusions)}</div>
        </div>`
      : "",
    details?.exclusions
      ? `<div class="detail-section">
          <div class="detail-section-title">Exclusões</div>
          <div class="detail-text pre-wrap">${escapeHtml(details.exclusions)}</div>
        </div>`
      : "",
    details?.cancellationPolicy
      ? `<div class="detail-section">
          <div class="detail-section-title">Política de cancelamento</div>
          <div class="detail-text pre-wrap">${escapeHtml(
            details.cancellationPolicy
          )}</div>
        </div>`
      : "",
  ]
    .filter(Boolean)
    .join("");

  const extras = renderExtraDetails(details, [
    "packageName",
    "destinations",
    "nights",
    "startDate",
    "endDate",
    "itinerarySummary",
    "inclusions",
    "exclusions",
    "cancellationPolicy",
  ]);

  return `
    <div class="detail-block">
      ${pills ? `<div class="info-grid">${pills}</div>` : ""}
      ${lines}
      ${sections}
      ${extras}
    </div>
  `;
}

function renderTourDetails(service: ProposalService): string {
  const details: any = service.details || {};
  const provider = (service as any)?.partners?.name || (service as any)?.provider;
  const days = Array.isArray(details?.days) ? details.days : [];

  const paceLabels: Record<string, string> = {
    leve: "Leve",
    moderado: "Moderado",
    intenso: "Intenso",
  };

  const pills = [
    renderInfoPill("briefcase", "Fornecedor", provider),
    renderInfoPill("map", "Destino base", details?.destinationBase),
    renderInfoPill(
      "gauge",
      "Ritmo",
      details?.pace ? paceLabels[details.pace] || details.pace : ""
    ),
    days.length
      ? renderInfoPill("activity", "Dias", `${days.length} dia(s)`)
      : "",
    renderInfoPill(
      "calendar",
      "Início",
      details?.startDate || details?.start_date
        ? formatDateTime(details?.startDate || details?.start_date)
        : ""
    ),
    renderInfoPill(
      "calendar",
      "Fim",
      details?.endDate || details?.end_date
        ? formatDateTime(details?.endDate || details?.end_date)
        : ""
    ),
    renderInfoPill("shield", "Mobilidade", details?.mobilityNotes),
  ]
    .filter(Boolean)
    .join("");

  const itineraryHtml = days.length
    ? `
      <div class="detail-section">
        <div class="detail-section-title">Itinerário</div>
        <div class="itinerary-list">
          ${days
            .map((day: any, idx: number) => {
              const acts =
                Array.isArray(day?.activities) && day.activities.length
                  ? day.activities
                  : [{ name: "Sem atividades", summary: "", time: "" }];

              return `
                <div class="itinerary-card">
                  <div class="itinerary-day">Dia ${day?.dayNumber || idx + 1}</div>
                  ${
                    day?.title
                      ? `<div class="itinerary-sub">${escapeHtml(day.title)}</div>`
                      : ""
                  }
                  <div class="itinerary-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Atividade</th>
                          <th>Hora</th>
                          <th>Descrição da atividade</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${acts
                          .map(
                            (act: any) => `
                              <tr>
                                <td>${escapeHtml(act?.name || "Atividade")}</td>
                                <td>${escapeHtml(act?.time || "—")}</td>
                                <td>${escapeHtml(act?.summary || "—")}</td>
                              </tr>
                            `
                          )
                          .join("")}
                      </tbody>
                    </table>
                  </div>
                </div>
              `;
            })
            .join("")}
        </div>
      </div>
    `
    : "";

  const extras = renderExtraDetails(details, [
    "destinationBase",
    "pace",
    "startDate",
    "endDate",
    "start_date",
    "end_date",
    "days",
    "mobilityNotes",
  ]);

  return `
    <div class="detail-block">
      ${pills ? `<div class="info-grid">${pills}</div>` : ""}
      ${itineraryHtml}
      ${extras}
    </div>
  `;
}

function renderGenericDetails(service: ProposalService): string {
  const details: any = service.details || {};
  const provider = (service as any)?.partners?.name || (service as any)?.provider;
  const pills = [renderInfoPill("briefcase", "Fornecedor", provider)]
    .filter(Boolean)
    .join("");
  const extras = renderExtraDetails(details);
  return `
    <div class="detail-block">
      ${pills ? `<div class="info-grid">${pills}</div>` : ""}
      ${extras}
    </div>
  `;
}

function renderServiceDetails(service: ProposalService): string {
  switch (service.type) {
    case "flight":
      return renderFlightDetails(service);
    case "hotel":
      return renderHotelDetails(service);
    case "car":
      return renderCarDetails(service);
    case "cruise":
      return renderCruiseDetails(service);
    case "insurance":
      return renderInsuranceDetails(service);
    case "transfer":
      return renderTransferDetails(service);
    case "package":
      return renderPackageDetails(service);
    case "tour":
      return renderTourDetails(service);
    default:
      return renderGenericDetails(service);
  }
}

function renderServiceCard(service: ProposalService): string {
  const iconName = serviceIconMap[service.type] || "package";
  const label = serviceLabels[service.type] || translateCommonValuePT(service.type);
  const providerName = (service as any)?.partners?.name || (service as any)?.provider;

  const hasRoute = Boolean((service as any)?.origin || (service as any)?.destination);
  const routeText = [
    (service as any)?.origin || "",
    (service as any)?.destination || "",
  ]
    .filter(Boolean)
    .join(" → ");
  const dateLine = formatDateRange(
    (service as any)?.start_date,
    (service as any)?.end_date
  );

  const { total, quantity, unitValue } = getServicePricing(service);
  const desc = safeStr((service as any)?.description) || "Sem descrição";

  return `
    <div class="service-card">
      <div class="service-icon-box">${renderIcon(iconName, "icon-lg")}</div>
      <div class="service-body">
        <div class="service-tags">
          <span class="badge">${escapeHtml(label)}</span>
          ${
            providerName
              ? `<span class="service-provider">${escapeHtml(providerName)}</span>`
              : ""
          }
        </div>
        <div class="service-title">${escapeHtml(desc)}</div>
        <div class="service-meta">
          ${hasRoute ? renderMetaLine("map", routeText) : ""}
          ${dateLine ? renderMetaLine("calendar", dateLine) : ""}
        </div>
        <div class="service-details">${renderServiceDetails(service)}</div>
      </div>
      <div class="service-price">
        <div class="service-price-label">Valor</div>
        <div class="service-price-value">${escapeHtml(formatCurrency(total))}</div>
        ${
          quantity && quantity > 1
            ? `<div class="service-price-sub">${escapeHtml(
                String(quantity)
              )} x ${escapeHtml(formatCurrency(unitValue))}</div>`
            : ""
        }
      </div>
    </div>
  `;
}

function inferTripPeriod(services: ProposalService[]) {
  const dates: Date[] = [];
  const push = (v: any) => {
    if (!v) return;
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) dates.push(d);
  };

  services.forEach((s) => {
    const d: any = s.details || {};
    push(d.start_date);
    push(d.end_date);
    push(d.startDate);
    push(d.endDate);
    push(d.checkIn);
    push(d.checkOut);
    push(d.coverageStart);
    push(d.coverageEnd);
    push(d.sailingDate);
    push(d.returnDate);
    push(d.pickupAt);
    push(d.dropoffAt);

    (Array.isArray(d.segments) ? d.segments : []).forEach((seg: any) => {
      push(seg?.departureAt);
      push(seg?.arrivalAt);
    });
  });

  if (!dates.length) return null;
  dates.sort((a, b) => a.getTime() - b.getTime());
  return { start: dates[0], end: dates[dates.length - 1] };
}

/* -------------------- PDF -------------------- */
export function generateProposalPDF(
  proposal: Proposal,
  services: ProposalService[],
  agencyName: string = "Sua Agência de Viagens",
  agencyLogo?: string | null,
  agencyEmail?: string | null,
  agencyPhone?: string | null,
  agencyAddress?: string | null
) {
  const totalServices = services.reduce((sum, s) => sum + (s.value || 0), 0);
  const discountPct = Number(proposal.discount || 0);
  const discountValue = (totalServices * discountPct) / 100;
  const finalValue = totalServices - discountValue;

  const createdAt = (proposal as any).created_at
    ? formatDate(String((proposal as any).created_at))
    : "";
  const client = (proposal as any).clients || null;

  const contactInfo = [
    agencyEmail || "",
    agencyPhone || "",
    agencyAddress || "",
  ].filter(Boolean);

  const notesValue =
    (proposal as any).notes ||
    (proposal as any).observations ||
    (proposal as any).observation ||
    "";

  const servicesCountText = `${services.length} ${pluralize(
    services.length,
    "serviço",
    "serviços"
  )}`;

  const logoSection = agencyLogo
    ? `<img src="${escapeHtml(agencyLogo)}" alt="${escapeHtml(
        agencyName
      )}" class="agency-logo" />`
    : `<div class="agency-logo-placeholder">LOGO</div>`;

  const summaryRows = (services || []).map((s: any) => {
    const qty = Number(s?.details?.quantity) || 1;
    const total = Number(s?.value || 0);
    const unit = qty > 0 ? total / qty : total;
    const typeLabel = serviceLabels[s?.type] || "Serviço";
    const label = s?.description || typeLabel;
    const sublabel = s?.description && s?.description !== typeLabel ? typeLabel : "";
    return { id: s?.id || `${label}-${total}`, label, sublabel, qty, total, unit };
  });
  const summaryTotal = summaryRows.reduce((sum, r) => sum + r.total, 0);

  const contactItemsHtml = [
    agencyEmail
      ? `<span class="contact-item">${renderIcon(
          "mail",
          "icon-sm"
        )}<span>${escapeHtml(agencyEmail)}</span></span>`
      : "",
    agencyPhone
      ? `<span class="contact-item">${renderIcon(
          "phone",
          "icon-sm"
        )}<span>${escapeHtml(agencyPhone)}</span></span>`
      : "",
    agencyAddress
      ? `<span class="contact-item">${renderIcon(
          "mapPin",
          "icon-sm"
        )}<span>${escapeHtml(agencyAddress)}</span></span>`
      : "",
  ]
    .filter(Boolean)
    .join("");

  const servicesHtml = services.length
    ? services.map((service) => renderServiceCard(service)).join("")
    : `<div class="empty-state">Nenhum serviço adicionado nesta proposta.</div>`;

  const footerLine = contactInfo.length
    ? escapeHtml(contactInfo.join(" | "))
    : "Entre em contato para confirmar disponibilidade e condições.";

  const html = `
  <!DOCTYPE html>
  <html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Proposta #${escapeHtml(String(proposal.number || ""))} - ${escapeHtml(
    proposal.title || "Proposta"
  )}</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
      :root{
        --ink:#0f172a;
        --muted:#64748b;
        --muted2:#94a3b8;
        --border:#e2e8f0;
        --soft:#f8fafc;
        --bg:#f1f5f9;
      }
      *{ margin:0; padding:0; box-sizing:border-box; }
      body{
        font-family:'Poppins', -apple-system, BlinkMacSystemFont, sans-serif;
        color:var(--ink);
        background:var(--bg);
        line-height:1.5;
        font-size:14px;
      }
      .page{ max-width:980px; margin:0 auto; padding:32px; }
      .sheet{
        background:#fff;
        border-radius:18px;
        overflow:hidden;
      }
      .hero{
        position:relative;
        padding:28px 32px;
      }
      .hero::before{
        content:"";
        position:absolute;
        inset:0;
        opacity:0.18;
        background:
          radial-gradient(circle at 20% 20%, rgba(15,23,42,0.18) 0%, transparent 42%),
          radial-gradient(circle at 80% 15%, rgba(15,23,42,0.14) 0%, transparent 38%),
          radial-gradient(circle at 65% 85%, rgba(15,23,42,0.12) 0%, transparent 40%);
      }
      .hero-content{ position:relative; display:flex; flex-direction:column; gap:18px; }
      .hero-top{
        display:flex;
        justify-content:space-between;
        align-items:flex-start;
        gap:20px;
        flex-wrap:wrap;
      }
      .agency{ display:flex; gap:18px; align-items:center; min-width:0; }
      .agency-logo{
        width:90px;
        height:90px;
        border-radius:14px;
        object-fit:contain;
        background:transparent;
        display:block;
      }
      .agency-logo-placeholder{
        width:56px;
        height:56px;
        border-radius:14px;
        border:1px solid var(--border);
        background:var(--soft);
        display:flex;
        align-items:center;
        justify-content:center;
        font-size:11px;
        color:var(--muted);
      }
      .agency-name{
        font-size:14px;
        font-weight:600;
        text-transform: uppercase;
      }
      .agency-contact{
        margin-top:0px;
        display:flex;
        flex-wrap:wrap;
        gap:12px;
        font-size:12.5px;
        color:var(--muted);
      }
      .contact-item{ display:inline-flex; align-items:center; gap:6px; }
      .proposal-meta{
        text-align:right;
        font-size:12.5px;
        color:var(--muted);
      }
      .proposal-meta strong{ color:var(--ink); font-weight:600; }
      .proposal-meta .meta-line{ justify-content:flex-end; }
      .hero-bottom{
        display:flex;
        align-items:flex-end;
        justify-content:space-between;
        gap:12px;
        flex-wrap:wrap;
      }
      .proposal-title{
        font-size:22px;
        font-weight:700;
        line-height:1.2;
      }
.badge{
  display:inline-flex;
  align-items:center;

  /* mantém a fonte igual */
  font-size:11px;
  font-weight:600;
  text-transform:uppercase;
  letter-spacing:.12em;
  color:var(--muted);

  /* remove o “badge/pill” */
  padding:0;
  border:none;
  background:transparent;
  border-radius:0;
}

      .content{ padding:20px 9px 9px; }
      .section-head{
        display:flex;
        justify-content:space-between;
        align-items:flex-end;
        gap:12px;
        margin-bottom:12px;
      }
      .section-title{
        font-size:11px;
        letter-spacing:.14em;
        text-transform:uppercase;
        color:var(--muted);
        font-weight:600;
      }
      .section-sub{
        color:var(--muted2);
        font-size:11px;
        font-weight:600;
      }
      .summary-card{
        border:1px solid var(--border);
        border-radius:12px;
        overflow:hidden;
      }
      .summary-head{
        display:flex;
        justify-content:space-between;
        align-items:center;
        padding:8px 12px;
        background:var(--soft);
        font-size:11px;
        text-transform:uppercase;
        letter-spacing:.12em;
        color:var(--muted);
        font-weight:600;
      }
      .summary-table{
        width:100%;
        border-collapse:collapse;
        font-size:13px;
      }
      .summary-table thead th{
        text-transform:uppercase;
        font-size:11px;
        letter-spacing:.1em;
        color:var(--muted);
        background:var(--soft);
        padding:8px 12px;
        text-align:left;
      }
      .summary-table tbody td{
        padding:10px 12px;
        border-top:1px solid var(--border);
        vertical-align:top;
      }
      .summary-table tfoot td{
        padding:10px 12px;
        background:var(--soft);
        font-weight:700;
      }
      .summary-label{ font-weight:600; }
      .summary-sublabel{
        font-size:11px;
        color:var(--muted);
        margin-top:2px;
      }
      .summary-qty{ text-align:center; }
      .summary-qty small{
        display:block;
        font-size:11px;
        color:var(--muted);
        margin-top:2px;
      }
      .summary-total{ text-align:right; font-weight:600; }
      .summary-empty{
        padding:12px;
        font-size:12.5px;
        color:var(--muted);
      }
      .client-card{
        border:1px solid var(--border);
        border-radius:12px;
        padding:12px;
        background:var(--soft);
      }
      .client-name{ font-weight:600; }
      .client-email{ font-size:12.5px; color:var(--muted); margin-top:2px; }
      .service-list{ display:flex; flex-direction:column; gap:14px; }
      .service-card{
        border:1px solid var(--border);
        border-radius:16px;
        padding:16px;
        display:flex;
        gap:16px;
        background:#fff;
        break-inside:avoid;
      }
      .service-icon-box{
        width:44px;
        height:44px;
        border-radius:12px;
        background:var(--soft);
        border:1px solid var(--border);
        display:flex;
        align-items:center;
        justify-content:center;
        flex-shrink:0;
      }
      .service-body{ flex:1; min-width:0; }
      .service-tags{
        display:flex;
        gap:8px;
        align-items:center;
        flex-wrap:wrap;
      }
      .service-provider{ font-size:12px; color:var(--muted); }
      .service-title{ margin-top:4px; font-size:15px; font-weight:600; }
      .service-meta{
        margin-top:8px;
        display:flex;
        flex-direction:column;
        gap:4px;
      }
      .meta-line{
        display:flex;
        align-items:center;
        gap:6px;
        font-size:12px;
        color:var(--muted);
      }
      .service-details{
        margin-top:12px;
        padding-top:12px;
        border-top:1px solid var(--border);
      }
      .service-price{ text-align:right; min-width:120px; }
      .service-price-label{
        font-size:11px;
        text-transform:uppercase;
        letter-spacing:.12em;
        color:var(--muted);
      }
      .service-price-value{
        font-size:16px;
        font-weight:700;
        margin-top:2px;
      }
      .service-price-sub{
        font-size:12px;
        color:var(--muted);
        margin-top:4px;
      }
      .detail-block{
        display:flex;
        flex-direction:column;
        gap:10px;
      }
      .info-grid{
        display:grid;
        grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));
        gap:4px 12px;
      }
      .info-pill{
        border:none;
        border-radius:0;
        padding:0;
        background:transparent;
        display:flex;
        gap:6px;
        align-items:center;
      }
      .info-label{
        font-size:10px;
        text-transform:uppercase;
        letter-spacing:.12em;
        color:var(--muted2);
        font-weight:600;
      }
      .info-value{
        font-size:12.5px;
        font-weight:600;
        color:var(--ink);
      }
      .detail-lines{
        margin-top:10px;
        display:grid;
        grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));
        gap:6px;
        font-size:12px;
        color:var(--muted);
      }
      .detail-strong{ color:var(--ink); font-weight:600; }
      .detail-section{ margin-top:14px; }
      .detail-section-title{
        font-size:11px;
        text-transform:uppercase;
        letter-spacing:.12em;
        color:var(--muted);
        font-weight:600;
        margin-bottom:8px;
      }
      .detail-text{ font-size:12.5px; color:var(--ink); }
      .pre-wrap{ white-space:pre-wrap; }
      .segment-list{ display:flex; flex-direction:column; gap:8px; }
      .segment-card{
        border:none;
        border-top:1px dashed var(--border);
        border-radius:0;
        padding:8px 0;
        background:transparent;
      }
      .segment-card:first-child{
        border-top:none;
        padding-top:0;
      }
      .segment-top{
        display:flex;
        justify-content:space-between;
        gap:8px;
        font-size:13px;
        font-weight:600;
      }
      .segment-flight{ font-size:12px; color:var(--muted); font-weight:500; }
      .segment-times{
        margin-top:6px;
        display:grid;
        grid-template-columns:repeat(auto-fit, minmax(140px, 1fr));
        gap:4px;
        font-size:12px;
        color:var(--muted);
      }
      .segment-connections{ margin-top:6px; font-size:12px; color:var(--muted); }
      .segment-conn-title{
        font-size:10px;
        text-transform:uppercase;
        letter-spacing:.1em;
        color:var(--muted2);
        font-weight:600;
        margin-bottom:4px;
      }
      .segment-conn-row{
        display:flex;
        justify-content:space-between;
        gap:8px;
      }
      .segment-conn-code{ font-weight:600; color:var(--ink); }
      .segment-conn-meta{ text-align:right; flex:1; }
      .photo-grid{
        display:grid;
        grid-template-columns:repeat(2, minmax(0, 1fr));
        gap:8px;
      }
      .photo-cell{
        border:none;
        border-radius:8px;
        overflow:hidden;
        background:transparent;
      }
      .photo-cell img{
        width:100%;
        height:180px;
        object-fit:cover;
        display:block;
      }
      .extra-details{ margin-top:12px; }
      .extra-title{
        font-size:10px;
        text-transform:uppercase;
        letter-spacing:.12em;
        color:var(--muted2);
        font-weight:600;
        margin-bottom:6px;
      }
      .extra-list{ display:flex; flex-direction:column; gap:6px; }
      .extra-row{
        display:grid;
        grid-template-columns:140px 1fr;
        gap:8px;
        font-size:12px;
      }
      .extra-label{
        color:var(--muted2);
        text-transform:uppercase;
        letter-spacing:.08em;
        font-weight:600;
        font-size:10px;
      }
      .extra-value{ color:var(--ink); font-weight:500; }
      .itinerary-list{ display:flex; flex-direction:column; gap:10px; }
      .itinerary-card{
        border:none;
        border-top:1px dashed var(--border);
        border-radius:0;
        padding:8px 0;
        background:transparent;
      }
      .itinerary-card:first-child{
        border-top:none;
        padding-top:0;
      }
      .itinerary-day{ font-size:12px; font-weight:600; color:var(--ink); }
      .itinerary-sub{ font-size:12px; color:var(--muted); margin-top:4px; }
      .itinerary-table{ margin-top:8px; overflow-x:auto; }
      .itinerary-table table{
        width:100%;
        border-collapse:collapse;
        font-size:12px;
      }
      .itinerary-table thead th{
        text-align:left;
        font-size:10px;
        text-transform:uppercase;
        letter-spacing:.1em;
        color:var(--muted2);
        padding:6px 8px;
      }
      .itinerary-table tbody td{
        padding:6px 8px;
        border-top:1px solid var(--border);
        vertical-align:top;
      }
      .itinerary-table tbody td:nth-child(2){
        color:var(--muted);
        width:90px;
      }
      .notes{
        margin-top:18px;
        border:1px solid var(--border);
        border-radius:12px;
        padding:12px;
        background:var(--soft);
      }
      .notes-title{
        font-size:11px;
        text-transform:uppercase;
        letter-spacing:.12em;
        color:var(--muted);
        font-weight:600;
        margin-bottom:8px;
      }
      .notes-body{
        font-size:12.5px;
        color:var(--ink);
        line-height:1.6;
        white-space:pre-wrap;
      }
      .totals-card{
        margin-top:20px;
        border:1px solid var(--border);
        border-radius:12px;
        padding:14px;
        background:var(--soft);
        max-width:420px;
        margin-left:auto;
      }
      .totals-row{
        display:flex;
        justify-content:space-between;
        font-size:13px;
        color:var(--muted);
        margin-top:8px;
      }
      .totals-row strong{ color:var(--ink); }
      .totals-row:first-child{ margin-top:0; }
      .totals-divider{
        height:1px;
        background:var(--border);
        margin:12px 0;
      }
      .totals-final{
        display:flex;
        justify-content:space-between;
        align-items:flex-end;
        font-size:16px;
        font-weight:700;
      }
      .totals-note{
        margin-top:10px;
        font-size:11px;
        color:var(--muted);
        display:flex;
        gap:6px;
        align-items:flex-start;
      }
      .footer{
        margin-top:18px;
        text-align:center;
        font-size:12px;
        color:var(--muted);
      }
      .footer strong{ color:var(--ink); font-weight:600; }
      .icon{
        display:inline-block;
        vertical-align:middle;
        line-height:1;
      }
      .icon-xs{ width:12px; height:12px; }
      .icon-sm{ width:14px; height:14px; }
      .icon-lg{ width:20px; height:20px; }
      .empty-state{
        border:1px dashed var(--border);
        border-radius:14px;
        padding:18px;
        text-align:center;
        font-size:12.5px;
        color:var(--muted);
        background:var(--soft);
      }
      @media print{
        body{ background:#fff; print-color-adjust:exact; -webkit-print-color-adjust:exact; }
        .page{ padding:12px; }
        .sheet{ border:none; }
        .service-card, .summary-card, .notes, .totals-card{ break-inside:avoid; }
      }
    </style>
  </head>
  <body>
    <div class="page">
      <div class="sheet">
        <div class="hero">
          <div class="hero-content">
            <div class="hero-top">
              <div class="agency">
                ${logoSection}
                <div>
                  <div class="agency-name">${escapeHtml(agencyName)}</div>
                  ${
                    contactItemsHtml
                      ? `<div class="agency-contact">${contactItemsHtml}</div>`
                      : ""
                  }
                </div>
              </div>
              <div class="proposal-meta">
                <div class="meta-line">
                  ${renderIcon("ticket", "icon-sm")}
                  <span>Proposta</span>
                  <strong>#${escapeHtml(String(proposal.number || "—"))}</strong>
                  ${
                    createdAt
                      ? `<span>Emitida em ${escapeHtml(createdAt)}</span>`
                      : ""
                  }
                </div>
              </div>
            </div>
            <div class="hero-bottom">
              <div class="proposal-title">${escapeHtml(proposal.title || "Proposta")}</div>
              ${servicesCountText ? `<span class="badge">${escapeHtml(servicesCountText)}</span>` : ""}
            </div>
          </div>
        </div>

        <div class="content">
          <section class="summary">
            <div class="summary-card">
              <div class="summary-head">
                <div>Resumo dos itens</div>
                <div>${escapeHtml(pluralize(summaryRows.length, "item", "itens"))}</div>
              </div>
              ${
                summaryRows.length === 0
                  ? `<div class="summary-empty">Nenhum serviço adicionado.</div>`
                  : `
                    <table class="summary-table">
                      <thead>
                        <tr>
                          <th>Item</th>
                          <th style="text-align:center; width:90px;">Qtd</th>
                          <th style="text-align:right; width:160px;">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${summaryRows
                          .map(
                            (row) => `
                              <tr>
                                <td>
                                  <div class="summary-label">${escapeHtml(row.label)}</div>
                                  ${
                                    row.sublabel
                                      ? `<div class="summary-sublabel">${escapeHtml(
                                          row.sublabel
                                        )}</div>`
                                      : ""
                                  }
                                </td>
                                <td class="summary-qty">
                                  <div>${escapeHtml(String(row.qty))}</div>
                                  ${
                                    row.qty > 1
                                      ? `<small>${escapeHtml(
                                          formatCurrency(row.unit)
                                        )} un.</small>`
                                      : ""
                                  }
                                </td>
                                <td class="summary-total">${escapeHtml(
                                  formatCurrency(row.total)
                                )}</td>
                              </tr>
                            `
                          )
                          .join("")}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colspan="2" style="text-align:right;">Total</td>
                          <td style="text-align:right;">${escapeHtml(
                            formatCurrency(summaryTotal)
                          )}</td>
                        </tr>
                      </tfoot>
                    </table>
                  `
              }
            </div>
          </section>

          ${
            client?.name
              ? `
                <section style="margin-top:18px;">
                  <div class="section-head">
                    <div class="section-title">Preparada para</div>
                  </div>
                  <div class="client-card">
                    <div class="client-name">${escapeHtml(client.name)}</div>
                    ${
                      client?.email
                        ? `<div class="client-email">${escapeHtml(client.email)}</div>`
                        : ""
                    }
                  </div>
                </section>
              `
              : ""
          }

          <section style="margin-top:18px;">
            <div class="section-head">
              <div class="section-title">Serviços inclusos</div>
             
            </div>
            <div class="service-list">
              ${servicesHtml}
            </div>
          </section>

          ${
            !isBlank(notesValue)
              ? `
                <div class="notes">
                  <div class="notes-title">Observações</div>
                  <div class="notes-body">${escapeHtml(notesValue)}</div>
                </div>
              `
              : ""
          }

          <section>
            <div class="totals-card">
              <div class="totals-row">
                <span>Subtotal</span>
                <strong>${escapeHtml(formatCurrency(totalServices))}</strong>
              </div>
              ${
                discountPct > 0
                  ? `
                    <div class="totals-row">
                      <span>Desconto (${escapeHtml(discountPct)}%)</span>
                      <strong>- ${escapeHtml(formatCurrency(discountValue))}</strong>
                    </div>
                  `
                  : ""
              }
              <div class="totals-divider"></div>
              <div class="totals-final">
                <span>Valor total</span>
                <span>${escapeHtml(formatCurrency(finalValue))}</span>
              </div>
              <div class="totals-note">
                ${renderIcon("dot", "icon-sm")}
                <span>Valores sujeitos a disponibilidade e alteração até a confirmação da reserva.</span>
              </div>
            </div>
          </section>

          <div class="footer">
            <div><strong>${escapeHtml(agencyName)}</strong></div>
            <div style="margin-top:6px;">${footerLine}</div>
          </div>
        </div>
      </div>
    </div>
  </body>
  </html>
  `;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 650);
  }
}
