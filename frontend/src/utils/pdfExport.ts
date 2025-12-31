import { Proposal } from '@/hooks/useProposals';
import { ProposalService } from '@/hooks/useProposalServices';

/* -------------------- Formatação -------------------- */
const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const pad2 = (n: number) => String(n).padStart(2, '0');

const formatDate = (date: string | Date) => {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return String(date);
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
};

const formatDateTime = (date: string | Date) => {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return String(date);
  return `${formatDate(d)} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};

const escapeHtml = (unsafe: any) => {
  const s = String(unsafe ?? '');
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const isBlank = (v: any) =>
  v === null || v === undefined || (typeof v === 'string' && v.trim() === '');

const safeStr = (v: any) => String(v ?? '').trim();

/** tenta converter string numérica pt/en para number */
const coerceNumber = (v: any): number | null => {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number' && Number.isFinite(v)) return v;

  if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return null;

    // remove R$, espaços, etc
    let x = s.replace(/[R$\s]/g, '');

    // se tiver vírgula e ponto, assume pt-BR: 1.234,56
    if (x.includes(',') && x.includes('.')) {
      x = x.replace(/\./g, '').replace(',', '.');
    } else if (x.includes(',') && !x.includes('.')) {
      // 1234,56
      x = x.replace(',', '.');
    }

    const n = Number(x);
    if (Number.isFinite(n)) return n;
  }

  return null;
};

const isMoneyKey = (key: string) => {
  const k = (key || '').toLowerCase();
  return /(^|_)(amount|value|price|total|cost|fare|tax|fee|deposit|coverage|limit|premium)(_|$)/i.test(k) ||
    /(valor|preco|preço|total|taxa|tarifa|multa|cobertura|caucao|caução|franquia|diaria|diária)/i.test(k);
};

const isMoneyLabel = (label: string) => {
  const l = (label || '').toLowerCase();
  return /(valor|total|preço|preco|taxa|tarifa|cobertura|caução|caucao|franquia|diária|diaria)/i.test(l);
};

const formatMaybeDate = (v: any) => {
  const s = safeStr(v);
  if (!s) return '';
  const d = new Date(s);
  if (!Number.isNaN(d.getTime()) && (s.includes('T') || s.includes('-') || s.includes('/'))) {
    const hasTime = s.includes('T') || /\d{2}:\d{2}/.test(s);
    return hasTime ? formatDateTime(s) : formatDate(s);
  }
  return s;
};

const generateReservationCode = (id: string, number: number) => {
  const idPart = (id || '').replace(/-/g, '').substring(0, 4).toUpperCase() || 'XXXX';
  const numPart = (number ?? 0).toString().padStart(4, '0');
  const stamp = Date.now().toString(36).toUpperCase().slice(-4);
  return `RES-${idPart}${numPart}-${stamp}`;
};

function pluralize(n: number, singular: string, plural: string) {
  return n === 1 ? singular : plural;
}

/* -------------------- Rótulos PT -------------------- */
const serviceLabels: Record<string, string> = {
  flight: 'Voo',
  hotel: 'Hotel',
  car: 'Carro',
  package: 'Pacote',
  tour: 'Roteiro',
  cruise: 'Cruzeiro',
  insurance: 'Seguro',
  transfer: 'Transfer',
  other: 'Outro',
};

const cabinLabels: Record<string, string> = {
  economy: 'Econômica',
  premium_economy: 'Econômica Premium',
  business: 'Executiva',
  first: 'Primeira Classe',
};

const boardLabels: Record<string, string> = {
  RO: 'Sem refeições',
  BB: 'Café da manhã',
  HB: 'Meia pensão',
  FB: 'Pensão completa',
  AI: 'Tudo incluído',
};

const keyLabelPt: Record<string, string> = {
  // genéricos
  quantity: 'Quantidade',
  unit_value: 'Valor unitário',
  unitValue: 'Valor unitário',
  value: 'Valor',
  total: 'Total',
  total_value: 'Total',

  // datas
  startDate: 'Data inicial',
  endDate: 'Data final',
  start_date: 'Data inicial',
  end_date: 'Data final',
  created_at: 'Criado em',
  updated_at: 'Atualizado em',

  // voos (top)
  passengers: 'Passageiros',
  cabinClass: 'Classe',
  segments: 'Trechos',
  baggage: 'Bagagem',
  pnr: 'Localizador',

  // voos (segmentos)
  fromIata: 'Origem (IATA)',
  toIata: 'Destino (IATA)',
  fromCity: 'Cidade de origem',
  toCity: 'Cidade de destino',
  fromAirport: 'Aeroporto de origem',
  toAirport: 'Aeroporto de destino',
  departureAt: 'Partida',
  arrivalAt: 'Chegada',
  airlineCode: 'Companhia',
  airlineName: 'Companhia',
  flightNumber: 'Número do voo',
  operatingAirline: 'Operado por',
  operatedBy: 'Operado por',
  aircraft: 'Aeronave',
  aircraftModel: 'Aeronave',
  terminal: 'Terminal',
  gate: 'Portão',
  seat: 'Assento',
  bookingClass: 'Classe de reserva',
  fareBasis: 'Tarifa (fare basis)',
  fareFamily: 'Família tarifária',
  duration: 'Duração',
  durationMinutes: 'Duração (min)',
  connection: 'Conexão',
  layover: 'Conexão',
  stopover: 'Parada',
  stops: 'Paradas',

  // hotel
  hotelName: 'Hotel',
  city: 'Cidade',
  country: 'País',
  address: 'Endereço',
  checkIn: 'Check-in',
  checkOut: 'Check-out',
  checkInTime: 'Horário de check-in',
  checkOutTime: 'Horário de check-out',
  roomType: 'Tipo de quarto',
  board: 'Regime',
  guests: 'Hóspedes',
  adults: 'Adultos',
  children: 'Crianças',
  confirmationNumber: 'Confirmação',
  amenities: 'Comodidades',
  cancellationPolicy: 'Política de cancelamento',
  refundable: 'Reembolsável',

  // carro
  rentalCompany: 'Locadora',
  carCategory: 'Categoria',
  transmission: 'Câmbio',
  pickupLocation: 'Local de retirada',
  pickupAt: 'Retirada',
  dropoffLocation: 'Local de devolução',
  dropoffAt: 'Devolução',
  mileagePolicy: 'Política de quilometragem',
  fuelPolicy: 'Política de combustível',
  insurance: 'Seguro',
  deposit: 'Caução',
  driverAge: 'Idade do condutor',
  franchise: 'Franquia',

  // seguro
  insurer: 'Seguradora',
  planName: 'Plano',
  coverageStart: 'Início da vigência',
  coverageEnd: 'Fim da vigência',
  destinationRegion: 'Região',
  medicalCoverageAmount: 'Cobertura médica',
  baggageCoverageAmount: 'Cobertura de bagagem',
  cancellationCoverageAmount: 'Cobertura de cancelamento',
  policyNumber: 'Apólice',

  // cruzeiro
  cruiseLine: 'Companhia',
  shipName: 'Navio',
  embarkPort: 'Embarque',
  disembarkPort: 'Desembarque',
  sailingDate: 'Data de saída',
  returnDate: 'Data de retorno',
  cabinType: 'Tipo de cabine',
  cabinCategory: 'Categoria',
  itineraryPorts: 'Itinerário',

  // transfer
  transferType: 'Tipo',
  pickupPlace: 'Origem',
  dropoffPlace: 'Destino',
  vehicleType: 'Veículo',
  passengersCount: 'Passageiros',

  // roteiro/pacote
  pace: 'Ritmo',
  days: 'Programação',
  itinerary: 'Programação',
  program: 'Programação',
  destinations: 'Destinos',
  inclusions: 'Inclui',
  packageName: 'Nome do pacote',
  destinationBase: 'Base do roteiro',
};

const toLabelPT = (key: string) => {
  const k = String(key || '');
  if (keyLabelPt[k]) return keyLabelPt[k];
  return k
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim()
    .replace(/^./, (c) => c.toUpperCase());
};

const translateCommonValuePT = (v: any) => {
  const s = safeStr(v);
  if (!s) return '';
  const map: Record<string, string> = {
    'premium economy': 'Econômica Premium',
    'all inclusive': 'Tudo incluído',
    'economy': 'Econômica',
    'business': 'Executiva',
    'first': 'Primeira Classe',
    'private': 'Privado',
    'shared': 'Compartilhado',
    'yes': 'Sim',
    'no': 'Não',
    'true': 'Sim',
    'false': 'Não',
  };
  const key = s.toLowerCase();
  return map[key] ?? s;
};

/* -------------------- UI helpers (documento) -------------------- */

function formatValueByKey(keyOrLabel: string, v: any): string {
  if (isBlank(v)) return '';

  // datas (string -> dd/mm/yyyy)
  if (typeof v === 'string') {
    const maybeDate = formatMaybeDate(v);
    // se converteu, retorna convertido; se não, traduz valores comuns
    return translateCommonValuePT(maybeDate);
  }

  // boolean
  if (typeof v === 'boolean') return v ? 'Sim' : 'Não';

  // number como moeda quando fizer sentido
  if (typeof v === 'number') {
    if (isMoneyKey(keyOrLabel) || isMoneyLabel(keyOrLabel)) return formatCurrency(v);
    return String(v);
  }

  // strings numéricas como moeda
  const n = coerceNumber(v);
  if (n !== null && (isMoneyKey(keyOrLabel) || isMoneyLabel(keyOrLabel))) return formatCurrency(n);

  // fallback
  return translateCommonValuePT(String(v));
}

function buildKeyValueList(items: Array<{ key?: string; label: string; value?: any }>) {
  const clean = items
    .map((i) => ({ ...i, value: i.value }))
    .filter((i) => !isBlank(i.value));

  if (!clean.length) return '';

  return `
    <div class="kv">
      ${clean
        .map((i) => {
          const keyOrLabel = i.key || i.label;
          const vv = formatValueByKey(keyOrLabel, i.value);
          if (isBlank(vv)) return '';
          return `
            <div class="kv-row">
              <div class="kv-k">${escapeHtml(i.label)}</div>
              <div class="kv-v">${escapeHtml(vv)}</div>
            </div>
          `;
        })
        .filter(Boolean)
        .join('')}
    </div>
  `;
}

function renderValueCompact(v: any): string {
  if (isBlank(v)) return '';
  if (typeof v === 'boolean') return v ? 'Sim' : 'Não';
  if (typeof v === 'number') return String(v);
  if (typeof v === 'string') return translateCommonValuePT(formatMaybeDate(v));

  if (Array.isArray(v)) {
    if (!v.length) return '';
    if (v.every((x) => ['string', 'number', 'boolean'].includes(typeof x) || x == null)) {
      return v
        .map((x) => (typeof x === 'string' ? translateCommonValuePT(formatMaybeDate(x)) : typeof x === 'boolean' ? (x ? 'Sim' : 'Não') : String(x)))
        .filter((x) => !isBlank(x))
        .join(', ');
    }
    return `${v.length} ${pluralize(v.length, 'item', 'itens')}`;
  }

  if (typeof v === 'object') {
    const keys = Object.keys(v);
    if (!keys.length) return '';
    const previewKeys = keys.slice(0, 3);
    const preview = previewKeys
      .map((k) => {
        const vv = (v as any)[k];
        const vvStr = renderValueCompact(vv);
        return vvStr ? `${toLabelPT(k)}: ${vvStr}` : '';
      })
      .filter(Boolean)
      .join(' • ');
    return preview || 'Detalhes';
  }

  return String(v);
}

function hasAnyNonBlankDeep(obj: any): boolean {
  if (isBlank(obj)) return false;
  if (typeof obj !== 'object') return !isBlank(obj);
  if (Array.isArray(obj)) return obj.some((x) => hasAnyNonBlankDeep(x));
  return Object.values(obj).some((x) => hasAnyNonBlankDeep(x));
}

function renderTableFromObjectArray(label: string, arr: any[]) {
  const rows = arr.filter((x) => x && typeof x === 'object' && !Array.isArray(x));
  if (!rows.length) return '';

  // escolhe colunas mais relevantes (até 7)
  const colSet = new Set<string>();
  for (const r of rows.slice(0, 10)) {
    Object.keys(r).forEach((k) => {
      if (hasAnyNonBlankDeep(r[k])) colSet.add(k);
    });
  }
  const cols = Array.from(colSet).slice(0, 7);
  if (!cols.length) return '';

  const head = cols.map((c) => `<th>${escapeHtml(toLabelPT(c))}</th>`).join('');
  const body = rows
    .map((r) => {
      const tds = cols
        .map((c) => {
          const vv = formatValueByKey(c, r[c]);
          return `<td>${escapeHtml(vv || '')}</td>`;
        })
        .join('');
      return `<tr>${tds}</tr>`;
    })
    .join('');

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
function renderAllRemainingDetails(details: any, usedKeys: Set<string>, title = 'Detalhes adicionais') {
  if (!details || typeof details !== 'object') return '';

  const entries = Object.entries(details).filter(([k, v]) => !usedKeys.has(k) && hasAnyNonBlankDeep(v));
  if (!entries.length) return '';

  const simple: Array<{ key: string; label: string; value: string }> = [];
  const tables: Array<{ label: string; raw: any[] }> = [];
  const complexObjects: Array<{ label: string; raw: any }> = [];

  for (const [k, v] of entries) {
    if (typeof v !== 'object' || v === null) {
      const vv = formatValueByKey(k, v);
      if (!isBlank(vv)) simple.push({ key: k, label: toLabelPT(k), value: vv });
      continue;
    }

    if (Array.isArray(v)) {
      if (!v.length) continue;

      if (v.every((x) => typeof x === 'string' || typeof x === 'number' || typeof x === 'boolean' || x == null)) {
        const vv = renderValueCompact(v);
        if (!isBlank(vv)) simple.push({ key: k, label: toLabelPT(k), value: vv });
      } else if (v.every((x) => x && typeof x === 'object' && !Array.isArray(x))) {
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

      if (typeof vv !== 'object' || vv === null) {
        flatPairs.push({ key: kk, label: toLabelPT(kk), value: vv });
      } else {
        nested[kk] = vv;
      }
    }

    if (flatPairs.length) {
      // render flatPairs como sub-bloco
      const block = buildKeyValueList(flatPairs.map((p) => ({ key: p.key, label: p.label, value: p.value })));
      complexObjects.push({ label: toLabelPT(k), raw: block + (Object.keys(nested).length ? '' : '') });
      if (Object.keys(nested).length) {
        complexObjects.push({ label: `${toLabelPT(k)} (detalhes)`, raw: nested });
      }
    } else {
      complexObjects.push({ label: toLabelPT(k), raw: v });
    }
  }

  const simpleHtml = simple.length
    ? buildKeyValueList(simple.map((x) => ({ key: x.key, label: x.label, value: x.value })))
    : '';

  const tablesHtml = tables.map((t) => renderTableFromObjectArray(t.label, t.raw)).join('');

  const complexHtml = complexObjects
    .map((r) => {
      // se já veio HTML (string com KV), usa direto
      if (typeof r.raw === 'string' && r.raw.includes('<div')) {
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
    .join('');

  if (!simpleHtml && !tablesHtml && !complexHtml) return '';

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
  const unitValue =
    !isBlank(details?.unit_value) ? Number(details.unit_value) : quantity > 0 ? total / quantity : total;

  const normalizedQty = quantity > 0 ? quantity : undefined;
  return { total, quantity: normalizedQty, unitValue };
}

/* -------------------- Render por tipo (sem “cards dentro de cards”) -------------------- */

function renderFlightDetails(details: any): string {
  if (!details) return '';
  const used = new Set<string>();

  const passengers = Array.isArray(details.passengers) ? details.passengers : [];
  used.add('passengers');

  const paxInfo = passengers
    .map((p: any) => {
      const labels: Record<string, string> = { ADT: 'Adulto', CHD: 'Criança', INF: 'Bebê' };
      const count = Number(p?.count || 0);
      if (!count) return null;
      const type = labels[p?.type] || p?.type || 'Passageiro';
      return `${count} ${type}${count > 1 ? 's' : ''}`;
    })
    .filter(Boolean)
    .join(', ');

  used.add('cabinClass');

  const baggage = details.baggage || null;
  if (baggage) used.add('baggage');

  const baggageItems: string[] = [];
  if (baggage?.carryOn) baggageItems.push(`${baggage.carryOnQty || 1}x Mão`);
  if (baggage?.checked) baggageItems.push(`${baggage.checkedQty || 1}x Despachada (${baggage.checkedWeight || '23kg'})`);

  used.add('pnr');

  const top = buildKeyValueList([
    { key: 'passengers', label: 'Passageiros', value: paxInfo },
    { key: 'cabinClass', label: 'Classe', value: details.cabinClass ? cabinLabels[details.cabinClass] || details.cabinClass : '' },
    { key: 'baggage', label: 'Bagagem', value: baggageItems.length ? baggageItems.join(' + ') : '' },
    { key: 'pnr', label: 'Localizador', value: details.pnr || '' },
  ]);

  const segments = Array.isArray(details.segments) ? details.segments : [];
  used.add('segments');

  const parseMs = (iso: any) => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? null : d.getTime();
  };

  const diffHuman = (ms: number) => {
    const min = Math.max(0, Math.round(ms / 60000));
    const h = Math.floor(min / 60);
    const m = min % 60;
    if (!h) return `${m}min`;
    if (!m) return `${h}h`;
    return `${h}h${String(m).padStart(2, '0')}`;
  };

  const stopsCount = Math.max(0, segments.length - 1);

  const segRows = segments
    .filter((s: any) => s?.fromIata || s?.toIata || s?.departureAt || s?.arrivalAt)
    .map((seg: any, idx: number) => {
      const route = `${escapeHtml(seg.fromIata || '---')} → ${escapeHtml(seg.toIata || '---')}`;

      const flightNo =
        seg.airlineCode && seg.flightNumber ? `${escapeHtml(seg.airlineCode)}${escapeHtml(seg.flightNumber)}` : '';

      const dep = seg.departureAt ? formatDateTime(seg.departureAt) : '';
      const arr = seg.arrivalAt ? formatDateTime(seg.arrivalAt) : '';

      const segDuration =
        seg.duration || seg.durationMinutes
          ? seg.duration
            ? String(seg.duration)
            : `${Math.round(Number(seg.durationMinutes))}min`
          : '';

      const extraParts = [
        segDuration ? `Duração: ${escapeHtml(segDuration)}` : '',
        seg.cabinClass ? `Classe: ${escapeHtml(cabinLabels[seg.cabinClass] || seg.cabinClass)}` : '',
        seg.aircraft || seg.aircraftModel ? `Aeronave: ${escapeHtml(seg.aircraft || seg.aircraftModel)}` : '',
        seg.operatedBy || seg.operatingAirline ? `Operado por: ${escapeHtml(seg.operatedBy || seg.operatingAirline)}` : '',
        seg.terminal ? `Terminal: ${escapeHtml(seg.terminal)}` : '',
        seg.gate ? `Portão: ${escapeHtml(seg.gate)}` : '',
        seg.bookingClass ? `Classe de reserva: ${escapeHtml(seg.bookingClass)}` : '',
        seg.fareFamily ? `Família tarifária: ${escapeHtml(seg.fareFamily)}` : '',
      ].filter(Boolean);

      let connHtml = '';
      if (idx < segments.length - 1) {
        const a = parseMs(seg.arrivalAt);
        const b = parseMs(segments[idx + 1]?.departureAt);
        if (a != null && b != null && b > a) {
          connHtml = `<div class="conn">Conexão em <strong>${escapeHtml(seg.toIata || '')}</strong>: ${escapeHtml(
            diffHuman(b - a)
          )}</div>`;
        } else {
          const conn = seg.connection || seg.layover || '';
          if (conn) connHtml = `<div class="conn">Conexão: ${escapeHtml(renderValueCompact(conn))}</div>`;
        }
      }

      const timeLine = [dep ? `Partida: ${dep}` : '', arr ? `Chegada: ${arr}` : ''].filter(Boolean).join(' • ');

      return `
        <div class="seg-row">
          <div>
            <div class="seg-route">${route}</div>
            ${extraParts.length ? `<div class="seg-extra">${extraParts.join(' • ')}</div>` : ''}
            ${connHtml}
          </div>
          <div class="seg-time">${escapeHtml(timeLine)}</div>
          <div class="seg-right">${flightNo ? `<span class="seg-chip">${flightNo}</span>` : ''}</div>
        </div>
      `;
    })
    .join('');

  const segHtml = segRows
    ? `
      <div class="subsection">
        <div class="subsection-title">
          Trechos${stopsCount ? ` • ${stopsCount} ${pluralize(stopsCount, 'conexão', 'conexões')}` : ''}
        </div>
        <div class="segments">
          <div class="seg-head">
            <div>Rota</div>
            <div>Horários</div>
            <div>Voo</div>
          </div>
          ${segRows}
        </div>
      </div>
    `
    : '';

  const remaining = renderAllRemainingDetails(details, used, 'Detalhes adicionais do voo');
  return `${top}${segHtml}${remaining}`;
}

function renderHotelDetails(details: any): string {
  if (!details) return '';
  const used = new Set<string>();

  used.add('hotelName');
  used.add('city');
  used.add('country');
  used.add('checkIn');
  used.add('checkOut');
  used.add('checkInTime');
  used.add('checkOutTime');
  used.add('roomType');
  used.add('board');
  used.add('guests');
  used.add('confirmationNumber');

  const guestsParts: string[] = [];
  if (details?.guests?.adults) guestsParts.push(`${details.guests.adults} adulto${details.guests.adults > 1 ? 's' : ''}`);
  if (details?.guests?.children) guestsParts.push(`${details.guests.children} criança${details.guests.children > 1 ? 's' : ''}`);

  const checkInTime = details.checkInTime ? ` ${details.checkInTime}` : '';
  const checkOutTime = details.checkOutTime ? ` ${details.checkOutTime}` : '';

  const title = !isBlank(details.hotelName) ? `${details.hotelName}` : '';

  const base = `
    ${title ? `<div class="service-main">${escapeHtml(title)}</div>` : ''}
    ${buildKeyValueList([
      { key: 'local', label: 'Local', value: [details.city, details.country].filter(Boolean).join(', ') },
      {
        key: 'periodo',
        label: 'Período',
        value:
          (details.checkIn ? `${formatDate(details.checkIn)}${checkInTime}` : '') +
          (details.checkIn && details.checkOut ? ' → ' : '') +
          (details.checkOut ? `${formatDate(details.checkOut)}${checkOutTime}` : ''),
      },
      { key: 'roomType', label: 'Quarto', value: details.roomType || '' },
      { key: 'board', label: 'Regime', value: details.board ? boardLabels[details.board] || details.board : '' },
      { key: 'guests', label: 'Hóspedes', value: guestsParts.join(', ') },
      { key: 'confirmationNumber', label: 'Confirmação', value: details.confirmationNumber || '' },
    ])}
  `;

  const remaining = renderAllRemainingDetails(details, used, 'Detalhes adicionais do hotel');
  return `${base}${remaining}`;
}

function renderCarDetails(details: any): string {
  if (!details) return '';
  const used = new Set<string>();

  used.add('rentalCompany');
  used.add('carCategory');
  used.add('transmission');
  used.add('pickupLocation');
  used.add('pickupAt');
  used.add('dropoffLocation');
  used.add('dropoffAt');
  used.add('mileagePolicy');
  used.add('fuelPolicy');
  used.add('insurance');
  used.add('deposit');
  used.add('driverAge');
  used.add('franchise');

  const trans =
    details.transmission === 'auto'
      ? 'Automático'
      : details.transmission === 'manual'
      ? 'Manual'
      : translateCommonValuePT(details.transmission || '');

  const title = !isBlank(details.rentalCompany) ? `${details.rentalCompany}` : '';

  const base = `
    ${title ? `<div class="service-main">${escapeHtml(title)}</div>` : ''}
    ${buildKeyValueList([
      { key: 'carCategory', label: 'Categoria', value: details.carCategory ? `${details.carCategory}${trans ? ` (${trans})` : ''}` : '' },
      { key: 'pickup', label: 'Retirada', value: details.pickupLocation && details.pickupAt ? `${details.pickupLocation} • ${formatDateTime(details.pickupAt)}` : '' },
      { key: 'dropoff', label: 'Devolução', value: details.dropoffLocation && details.dropoffAt ? `${details.dropoffLocation} • ${formatDateTime(details.dropoffAt)}` : '' },
      { key: 'mileagePolicy', label: 'Política de quilometragem', value: details.mileagePolicy || '' },
      { key: 'fuelPolicy', label: 'Política de combustível', value: details.fuelPolicy || '' },
      { key: 'deposit', label: 'Caução', value: details.deposit ?? '' },
      { key: 'franchise', label: 'Franquia', value: details.franchise ?? '' },
      { key: 'insurance', label: 'Seguro', value: details.insurance || '' },
    ])}
  `;

  const remaining = renderAllRemainingDetails(details, used, 'Detalhes adicionais do carro');
  return `${base}${remaining}`;
}

function renderCruiseDetails(details: any): string {
  if (!details) return '';
  const used = new Set<string>();

  used.add('cruiseLine');
  used.add('shipName');
  used.add('embarkPort');
  used.add('disembarkPort');
  used.add('sailingDate');
  used.add('returnDate');
  used.add('cabinType');
  used.add('cabinCategory');
  used.add('itineraryPorts');

  const title = [details.cruiseLine, details.shipName].filter(Boolean).join(' ');
  const main = title ? `${title}` : '';

  const base = `
    ${main ? `<div class="service-main">${escapeHtml(main)}</div>` : ''}
    ${buildKeyValueList([
      { key: 'ports', label: 'Portos', value: [details.embarkPort, details.disembarkPort].filter(Boolean).join(' → ') },
      {
        key: 'period',
        label: 'Período',
        value:
          (details.sailingDate ? formatDate(details.sailingDate) : '') +
          (details.sailingDate && details.returnDate ? ' → ' : '') +
          (details.returnDate ? formatDate(details.returnDate) : ''),
      },
      { key: 'cabin', label: 'Cabine', value: [details.cabinType, details.cabinCategory].filter(Boolean).join(' - ') },
      { key: 'itineraryPorts', label: 'Itinerário', value: details.itineraryPorts || '' },
    ])}
  `;

  const remaining = renderAllRemainingDetails(details, used, 'Detalhes adicionais do cruzeiro');
  return `${base}${remaining}`;
}

function renderInsuranceDetails(details: any): string {
  if (!details) return '';
  const used = new Set<string>();

  used.add('insurer');
  used.add('planName');
  used.add('coverageStart');
  used.add('coverageEnd');
  used.add('destinationRegion');
  used.add('medicalCoverageAmount');
  used.add('baggageCoverageAmount');
  used.add('cancellationCoverageAmount');
  used.add('policyNumber');

  const title = [details.insurer, details.planName].filter(Boolean).join(' - ');
  const main = title ? `${title}` : '';

  const base = `
    ${main ? `<div class="service-main">${escapeHtml(main)}</div>` : ''}
    ${buildKeyValueList([
      {
        key: 'coveragePeriod',
        label: 'Vigência',
        value:
          (details.coverageStart ? formatDate(details.coverageStart) : '') +
          (details.coverageStart && details.coverageEnd ? ' → ' : '') +
          (details.coverageEnd ? formatDate(details.coverageEnd) : ''),
      },
      { key: 'destinationRegion', label: 'Região', value: details.destinationRegion || '' },
      { key: 'medicalCoverageAmount', label: 'Cobertura médica', value: details.medicalCoverageAmount ?? '' },
      { key: 'baggageCoverageAmount', label: 'Cobertura de bagagem', value: details.baggageCoverageAmount ?? '' },
      { key: 'cancellationCoverageAmount', label: 'Cobertura de cancelamento', value: details.cancellationCoverageAmount ?? '' },
      { key: 'policyNumber', label: 'Apólice', value: details.policyNumber || '' },
    ])}
  `;

  const remaining = renderAllRemainingDetails(details, used, 'Detalhes adicionais do seguro');
  return `${base}${remaining}`;
}

function renderTransferDetails(details: any): string {
  if (!details) return '';
  const used = new Set<string>();

  used.add('transferType');
  used.add('pickupPlace');
  used.add('dropoffPlace');
  used.add('pickupAt');
  used.add('vehicleType');
  used.add('passengersCount');

  const type =
    details.transferType === 'privado'
      ? 'Privado'
      : details.transferType === 'compartilhado'
      ? 'Compartilhado'
      : translateCommonValuePT(details.transferType || '');

  const base = `
    <div class="service-main">${escapeHtml(`Transfer ${type}`)}</div>
    ${buildKeyValueList([
      { key: 'pickupPlace', label: 'Origem', value: details.pickupPlace || '' },
      { key: 'dropoffPlace', label: 'Destino', value: details.dropoffPlace || '' },
      { key: 'pickupAt', label: 'Horário', value: details.pickupAt ? formatDateTime(details.pickupAt) : '' },
      { key: 'vehicleType', label: 'Veículo', value: details.vehicleType || '' },
      {
        key: 'passengersCount',
        label: 'Passageiros',
        value: details.passengersCount ? `${details.passengersCount} passageiro${details.passengersCount > 1 ? 's' : ''}` : '',
      },
    ])}
  `;

  const remaining = renderAllRemainingDetails(details, used, 'Detalhes adicionais do transfer');
  return `${base}${remaining}`;
}

/* ---- Programação (sem JSON “meleca”) ---- */
function normalizeActivities(items: any[]): string[] {
  const out: string[] = [];

  for (const x of items || []) {
    if (isBlank(x)) continue;

    if (typeof x === 'string') {
      const s = x.trim();
      if (!s) continue;
      if (/^\s*\{.*\}\s*$/.test(s) || /^\s*\[.*\]\s*$/.test(s)) continue;
      out.push(translateCommonValuePT(s));
      continue;
    }

    if (typeof x === 'object') {
      const text =
        safeStr(x.title) ||
        safeStr(x.name) ||
        safeStr(x.summary) ||
        safeStr(x.description) ||
        safeStr(x.activity) ||
        safeStr(x.place);

      const time = safeStr(x.time) || safeStr(x.hour) || safeStr(x.at);
      const line = [time, text].filter(Boolean).join(' • ');

      // se não tem conteúdo humano, não imprime
      if (line && !/^\s*[\{\[]/.test(line)) out.push(translateCommonValuePT(line));
      continue;
    }
  }

  return out;
}

function renderProgramacao(days: any[], titulo: string) {
  if (!Array.isArray(days) || !days.length) return '';

  const rows = days
    .map((d: any, i: number) => {
      if (!d) return '';

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

      if (!title && !date && !summary && items.length === 0) return '';

      return `
        <div class="t-row">
          <div class="t-left">
            <div class="t-day">Dia ${i + 1}</div>
            ${date ? `<div class="t-date">${escapeHtml(formatMaybeDate(date))}</div>` : ''}
          </div>
          <div class="t-right">
            ${title ? `<div class="t-title">${escapeHtml(title)}</div>` : ''}
            ${summary ? `<div class="t-text">${escapeHtml(summary)}</div>` : ''}
            ${
              items.length
                ? `<ul class="t-list">${items.map((it) => `<li>${escapeHtml(it)}</li>`).join('')}</ul>`
                : ''
            }
          </div>
        </div>
      `;
    })
    .filter(Boolean)
    .join('');

  if (!rows) return '';

  return `
    <div class="subsection">
      <div class="subsection-title">${escapeHtml(titulo)}</div>
      <div class="timeline">
        ${rows}
      </div>
    </div>
  `;
}

function renderPackageDetails(details: any): string {
  if (!details) return '';
  const used = new Set<string>();

  used.add('packageName');
  used.add('destinations');
  used.add('startDate');
  used.add('endDate');
  used.add('nights');
  used.add('inclusions');
  used.add('days');
  used.add('itinerary');
  used.add('program');

  const nights = details.nights ? ` (${details.nights} noites)` : '';
  const main = details.packageName ? `📦 ${details.packageName}` : '';

  const days =
    Array.isArray(details.days)
      ? details.days
      : Array.isArray(details.itinerary)
      ? details.itinerary
      : Array.isArray(details.program)
      ? details.program
      : [];

  const programHtml = renderProgramacao(days, 'Programação do pacote');

  const base = `
    ${main ? `<div class="service-main">${escapeHtml(main)}</div>` : ''}
    ${buildKeyValueList([
      { key: 'destinations', label: 'Destinos', value: details.destinations || '' },
      {
        key: 'period',
        label: 'Período',
        value:
          (details.startDate ? formatDate(details.startDate) : '') +
          (details.startDate && details.endDate ? ' → ' : '') +
          (details.endDate ? formatDate(details.endDate) : '') +
          nights,
      },
      { key: 'inclusions', label: 'Inclui', value: details.inclusions || '' },
    ])}
    ${programHtml}
  `;

  const remaining = renderAllRemainingDetails(details, used, 'Detalhes adicionais do pacote');
  return `${base}${remaining}`;
}

function renderTourDetails(details: any): string {
  if (!details) return '';
  const used = new Set<string>();

  used.add('destinationBase');
  used.add('startDate');
  used.add('endDate');
  used.add('pace');
  used.add('days');
  used.add('program');
  used.add('itinerary');

  const paceLabels: Record<string, string> = { leve: 'Leve', moderado: 'Moderado', intenso: 'Intenso' };
  const main = details.destinationBase ? `Roteiro: ${details.destinationBase}` : '';

  const days =
    Array.isArray(details.days)
      ? details.days
      : Array.isArray(details.program)
      ? details.program
      : Array.isArray(details.itinerary)
      ? details.itinerary
      : [];

  const programHtml = renderProgramacao(days, 'Programação do roteiro');

  const base = `
    ${main ? `<div class="service-main">${escapeHtml(main)}</div>` : ''}
    ${buildKeyValueList([
      {
        key: 'period',
        label: 'Período',
        value:
          (details.startDate ? formatDate(details.startDate) : '') +
          (details.startDate && details.endDate ? ' → ' : '') +
          (details.endDate ? formatDate(details.endDate) : ''),
      },
      { key: 'pace', label: 'Ritmo', value: details.pace ? paceLabels[details.pace] || translateCommonValuePT(details.pace) : '' },
      { key: 'days', label: 'Dias', value: days?.length ? `${days.length} ${pluralize(days.length, 'dia', 'dias')}` : '' },
    ])}
    ${programHtml}
  `;

  const remaining = renderAllRemainingDetails(details, used, 'Detalhes adicionais do roteiro');
  return `${base}${remaining}`;
}

function renderServiceDetails(service: ProposalService): string {
  const details: any = service.details || {};
  switch (service.type) {
    case 'flight':
      return renderFlightDetails(details);
    case 'hotel':
      return renderHotelDetails(details);
    case 'car':
      return renderCarDetails(details);
    case 'cruise':
      return renderCruiseDetails(details);
    case 'insurance':
      return renderInsuranceDetails(details);
    case 'transfer':
      return renderTransferDetails(details);
    case 'package':
      return renderPackageDetails(details);
    case 'tour':
      return renderTourDetails(details);
    default: {
      const used = new Set<string>();
      const main = !isBlank(details?.title || details?.name)
        ? `<div class="service-main">${escapeHtml(details.title || details.name)}</div>`
        : '';
      return `${main}${renderAllRemainingDetails(details, used, 'Detalhes do serviço')}`;
    }
  }
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
  agencyName: string = 'Sua Agência de Viagens',
  agencyLogo?: string | null,
  agencyEmail?: string | null,
  agencyPhone?: string | null,
  agencyAddress?: string | null
) {
  const totalServices = services.reduce((sum, s) => sum + (s.value || 0), 0);
  const discountPct = Number(proposal.discount || 0);
  const discountValue = (totalServices * discountPct) / 100;
  const finalValue = totalServices - discountValue;

  const proposalCode = generateReservationCode(proposal.id, proposal.number);
  const createdAt = (proposal as any).created_at ? formatDate(String((proposal as any).created_at)) : '';
  const client = (proposal as any).clients || null;

  const tripPeriod = inferTripPeriod(services);
  const tripPeriodText = tripPeriod ? `${formatDate(tripPeriod.start)} → ${formatDate(tripPeriod.end)}` : '';

  const logoSection = agencyLogo
    ? `<img src="${escapeHtml(agencyLogo)}" alt="${escapeHtml(agencyName)}" class="agency-logo" />`
    : `<div class="agency-name">${escapeHtml(agencyName)}</div>`;

  const contactInfo = [agencyPhone ? `Telefone: ${agencyPhone}` : '', agencyEmail || '', agencyAddress || ''].filter(Boolean);

  const notesValue =
    (proposal as any).notes || (proposal as any).observations || (proposal as any).observation || '';

  const servicesCountText = services.length
    ? `${services.length} ${pluralize(services.length, 'item', 'itens')}`
    : '';

  const html = `
  <!DOCTYPE html>
  <html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Proposta #${escapeHtml(proposal.number)} - ${escapeHtml(proposal.title)}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
      :root{
        --ink:#0f172a;
        --muted:#475569;
        --muted2:#64748b;
        --line:#e5e7eb;
        --soft:#f8fafc;
        --accent:#2563eb;
      }
      *{ margin:0; padding:0; box-sizing:border-box; }
      body{
        font-family:'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        color:var(--ink);
        background:#fff;
        line-height:1.55;
        font-size:14px;
      }
      .container{ max-width:940px; margin:0 auto; padding:44px; }

      /* Header */
      .topbar{
        display:flex;
        justify-content:space-between;
        align-items:flex-start;
        gap:20px;
        padding-bottom:18px;
        border-bottom:1px solid var(--line);
      }
      .agency-logo{ max-width:180px; max-height:56px; object-fit:contain; display:block; }
      .agency-name{ font-size:22px; font-weight:700; letter-spacing:-0.02em; }
      .agency-contact{ margin-top:10px; font-size:12px; color:var(--muted2); line-height:1.6; }

      .docmeta{ text-align:right; }
      .badge{
        display:inline-block;
        border:1px solid var(--line);
        color:var(--muted);
        padding:7px 12px;
        border-radius:999px;
        font-size:11px;
        font-weight:600;
        letter-spacing:.08em;
        text-transform:uppercase;
        background:#fff;
      }
      .code{ font-size:18px; font-weight:700; margin-top:10px; letter-spacing:-0.02em; }
      .muted{ color:var(--muted2); font-size:12.5px; margin-top:4px; }

      .hero{
        display:flex;
        justify-content:space-between;
        align-items:flex-end;
        gap:18px;
        margin:22px 0 18px 0;
      }
      .hero h1{
        font-size:30px;
        font-weight:700;
        letter-spacing:-0.03em;
        line-height:1.08;
      }
      .hero .sub{
        margin-top:8px;
        color:var(--muted);
        font-size:14px;
        font-weight:500;
      }
      .meta{
        text-align:right;
        border:1px solid var(--line);
        background:#fff;
        padding:12px 14px;
        border-radius:14px;
        min-width:280px;
      }
      .meta-row{
        display:flex;
        justify-content:space-between;
        gap:12px;
        padding:12px 0;
        border-top:1px dashed var(--line);
      }
      .meta-row:first-child{ border-top:none; padding-top:0; }
      .meta-k{
        font-size:11px;
        color:var(--muted2);
        text-transform:uppercase;
        letter-spacing:.10em;
        font-weight:600;
      }
      .meta-v{
        font-size:13.5px;
        font-weight:600;
        color:var(--ink);
      }

      .grid{
        display:grid;
        gap:18px;
        margin-top:18px;
      }
      .block{
        border:1px solid var(--line);
        border-radius:14px;
        padding:14px 16px;
        background:#fff;
      }
      .block-title{
        font-size:11px;
        letter-spacing:.12em;
        text-transform:uppercase;
        color:var(--accent);
        font-weight:600;
        margin-bottom:10px;
      }

      .totals .row{
        display:flex; justify-content:space-between; align-items:baseline;
        gap:12px; padding:8px 0;
        border-top:1px dashed var(--line);
      }
      .totals .row:first-child{ border-top:none; padding-top:0; }
      .totals .k{ color:var(--muted); font-weight:500; font-size:13px; }
      .totals .v{ font-weight:600; font-size:13.5px; }
      .totals .final{
        margin-top:10px;
        padding-top:12px;
        border-top:1px solid var(--line);
        display:flex; justify-content:space-between; align-items:baseline;
      }
      .totals .final .k{ letter-spacing:.12em; text-transform:uppercase; font-size:11px; color:var(--muted2); font-weight:600; }
      .totals .final .v{ font-size:22px; font-weight:700; color:var(--accent); letter-spacing:-0.02em; }
      .totals .note{ margin-top:10px; color:var(--muted2); font-size:12.5px; line-height:1.5; font-weight:500; }

      .section{ margin-top:26px; }
      .section-head{
        display:flex;
        justify-content:space-between;
        align-items:flex-end;
        gap:12px;
        padding-bottom:10px;
        border-bottom:1px solid var(--line);
        margin-bottom:14px;
      }
      .section-title{
        font-size:12px;
        letter-spacing:.14em;
        text-transform:uppercase;
        color:var(--accent);
        font-weight:600;
      }
      .section-sub{
        color:var(--muted2);
        font-size:12.5px;
        font-weight:500;
      }

     .service {
  padding: 45px 0 12px 0;
  break-inside: avoid;


  /* linha dashed custom */
  background-image: repeating-linear-gradient(
    90deg,
    var(--line) 0 14px,        /* tamanho do traço */
    transparent 14px 20px      /* gap (26-14 = 12px) */
  );
  background-repeat: no-repeat;
  background-position: left bottom;
  background-size: 100% 1px;   /* espessura da linha */
}

      .service:last-child{ border-bottom:none; }
      .service-top{
        display:flex;
        justify-content:space-between;
        gap:16px;
        align-items:flex-start;
      }
      .type-chip{
        text-align: right;
        font-size: 17px;
        font-weight: 700;
        letter-spacing: -0.02em;
        color: var(--ink);
        white-space: nowrap;
        text-transform: uppercase;
      }
      .service-desc{
        margin-top:8px;
        font-size:16px;
        font-weight:600;
        letter-spacing:-0.02em;
        line-height:1.22;
      }
      .service-meta{
        margin-top:6px;
        color:var(--muted);
        font-size:13px;
        font-weight:500;
      }
      .price{
        text-align:right;
        font-size:16px;
        font-weight:700;
        letter-spacing:-0.02em;
        color:var(--ink);
        white-space:nowrap;
      }
      .price-sub{
        margin-top:6px;
        text-align:right;
        font-size:12.5px;
        color:var(--muted2);
        font-weight:500;
      }
      .service-body{
        margin-top:12px;
        padding-top:12px;
        border-top:1px solid var(--line);
      }
      .service-main{
        font-size:14.5px;
        font-weight:600;
        margin-bottom:10px;
      }

      .kv{
        display:grid;
        grid-template-columns: 1fr 1fr;
        gap:10px 18px;
      }
      .kv-row{
        display:grid;
        grid-template-columns: 160px 1fr;
        gap:10px;
        align-items:start;
        padding:6px 0;
        border-bottom:1px dashed #eef2f7;
      }
      .kv-row:nth-last-child(-n+2){ border-bottom:none; }
      .kv-k{
        font-size:11px;
        color:var(--muted2);
        text-transform:uppercase;
        letter-spacing:.10em;
        font-weight:600;
      }
      .kv-v{
        font-size:13.5px;
        color:var(--ink);
        font-weight:500;
        word-break:break-word;
      }
      .kv-block{ margin-top:12px; }

      .pre{
        margin-top:8px;
        padding:12px 12px;
        background:var(--soft);
        border:1px solid #eef2f7;
        border-radius:12px;
        font-size:12px;
        line-height:1.5;
        white-space:pre-wrap;
        word-break:break-word;
        color:#111827;
      }

      .subsection{ margin-top:14px; }
      .subsection-title{
        font-size:11px;
        letter-spacing:.12em;
        text-transform:uppercase;
        color:var(--muted2);
        font-weight:600;
        margin-bottom:10px;
      }

      .segments{
        border:1px solid #eef2f7;
        border-radius:12px;
        overflow:hidden;
      }
      .seg-head, .seg-row{
        display:grid;
        grid-template-columns: 1.25fr 1.6fr 0.55fr;
        gap:12px;
        padding:10px 12px;
      }
      .seg-head{
        background:var(--soft);
        font-size:11px;
        color:var(--muted2);
        letter-spacing:.10em;
        text-transform:uppercase;
        font-weight:600;
      }
      .seg-row{
        border-top:1px solid #eef2f7;
        font-size:13px;
        align-items:start;
      }
      .seg-route{ font-weight:600; letter-spacing:-0.01em; }
      .seg-time{ color:var(--muted); font-weight:500; }
      .seg-extra{ margin-top:6px; color:var(--muted2); font-size:12.5px; font-weight:500; }
      .conn{ margin-top:6px; color:var(--muted); font-size:12.5px; font-weight:500; }
      .conn strong{ font-weight:600; }
      .seg-right{ text-align:right; }
      .seg-chip{
        display:inline-block;
        border:1px solid var(--line);
        color:var(--muted);
        padding:4px 10px;
        border-radius:999px;
        font-size:11px;
        font-weight:600;
        white-space:nowrap;
        background:#fff;
      }

      .timeline{ overflow:hidden;  }
      .t-row{
        display:grid;
        grid-template-columns: 140px 1fr;
        gap:14px;
        padding:12px 12px;
        border-top:1px solid #eef2f7;
      }
      .t-row:first-child{ border-top:none; }
      .t-day{
        font-size:11px;
        letter-spacing:.10em;
        text-transform:uppercase;
        font-weight:600;
        color:var(--accent);
      }
      .t-date{ margin-top:6px; font-size:12.5px; font-weight:500; color:var(--muted2); }
      .t-title{ font-size:14px; font-weight:600; letter-spacing:-0.01em; }
      .t-text{ margin-top:6px; color:var(--muted); font-size:13px; font-weight:500; }
      .t-list{ margin-top:8px; padding-left:18px; color:var(--muted); font-size:13px; font-weight:500; }
      .t-list li{ margin:4px 0; }

      .tbl-wrap{ border:1px solid #eef2f7; border-radius:12px; overflow:hidden; margin-top:8px; }
      .tbl{ width:100%; border-collapse:collapse; font-size:12.5px; }
      .tbl thead th{
        background:var(--soft);
        text-align:left;
        padding:10px 10px;
        color:var(--muted2);
        font-weight:600;
        text-transform:uppercase;
        letter-spacing:.08em;
        font-size:11px;
      }
      .tbl tbody td{
        padding:10px 10px;
        border-top:1px solid #eef2f7;
        color:var(--ink);
        font-weight:500;
        vertical-align:top;
      }

      .notes{
        margin-top:26px;
        border:1px solid var(--line);
        border-radius:14px;
        padding:14px 16px;
      }
      .notes-title{
        font-size:11px;
        letter-spacing:.12em;
        text-transform:uppercase;
        color:var(--accent);
        font-weight:600;
        margin-bottom:10px;
      }
      .notes-body{
        font-size:13.5px;
        color:var(--ink);
        line-height:1.65;
        font-weight:500;
      }

      .footer{
        margin-top:26px;
        padding-top:16px;
        border-top:1px solid var(--line);
        text-align:center;
        color:var(--muted2);
        font-size:12px;
        font-weight:500;
      }
      .footer strong{ color:var(--ink); font-weight:600; }

      @media print{
        body{ print-color-adjust:exact; -webkit-print-color-adjust:exact; }
        .container{ padding:26px; }
        .service, .block{ break-inside:avoid; }
      }
    </style>
  </head>
  <body>
    <div class="container">

      <div class="topbar">
        <div>
          ${logoSection}
          ${contactInfo.length ? `<div class="agency-contact">${contactInfo.map(escapeHtml).join('<br>')}</div>` : ''}
        </div>

        <div class="docmeta">
          <div class="badge">Proposta comercial</div>
          <div class="code">${escapeHtml(proposalCode)}</div>
          ${createdAt ? `<div class="muted">Gerado em ${escapeHtml(createdAt)}</div>` : ''}
        </div>
      </div>

      <div class="hero">
        <div>
          <h1>${escapeHtml(proposal.title || 'Proposta')}</h1>
          <div class="sub">
            ${
              client?.name
                ? `Proposta para <span style="font-weight:600">${escapeHtml(client.name)}</span>`
                : `Proposta personalizada`
            }
          </div>
        </div>

        <div class="meta">
          <div class="meta-row">
            <div class="meta-k">Proposta</div>
            <div class="meta-v">#${escapeHtml(proposal.number)}</div>
          </div>
          ${
            tripPeriodText
              ? `<div class="meta-row">
                   <div class="meta-k">Período</div>
                   <div class="meta-v">${escapeHtml(tripPeriodText)}</div>
                 </div>`
              : ''
          }
        </div>
      </div>

      <div class="grid">
        <div class="block totals">
          <div class="block-title">Resumo financeiro</div>
          <div class="row">
            <div class="k">Subtotal</div>
            <div class="v">${escapeHtml(formatCurrency(totalServices))}</div>
          </div>
          ${
            discountPct > 0
              ? `
                <div class="row">
                  <div class="k">Desconto (${escapeHtml(discountPct)}%)</div>
                  <div class="v">- ${escapeHtml(formatCurrency(discountValue))}</div>
                </div>
              `
              : ''
          }
          <div class="final">
            <div class="k">Valor total</div>
            <div class="v">${escapeHtml(formatCurrency(finalValue))}</div>
          </div>
          <div class="note">
            Valores sujeitos a disponibilidade e alteração até a confirmação da reserva.
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-head">
          <div class="section-title">Serviços incluídos</div>
          <div class="section-sub">${escapeHtml(servicesCountText)}</div>
        </div>

        ${
          services.length === 0
            ? `<div class="muted">Nenhum serviço adicionado.</div>`
            : services
                .map((service) => {
                  const label = serviceLabels[service.type] || translateCommonValuePT(service.type);
                  const details: any = service.details || {};
                  const { total, quantity, unitValue } = getServicePricing(service);

                  const desc = safeStr(service.description);

                  const metaPieces: string[] = [];
                  if ((service as any).partners?.name) metaPieces.push(String((service as any).partners.name));
                  const metaLine = metaPieces.filter(Boolean).join(' • ');

                  const priceHtml =
                    quantity && quantity > 1
                      ? `
                        <div class="price">${escapeHtml(formatCurrency(total))}</div>
                        <div class="price-sub">${escapeHtml(String(quantity))}x • ${escapeHtml(formatCurrency(unitValue))} por unidade</div>
                      `
                      : `
                        <div class="price">${escapeHtml(formatCurrency(total))}</div>
                        ${
                          details?.unit_value || details?.quantity
                            ? `<div class="price-sub">${details?.quantity ? `${escapeHtml(String(details.quantity))}x` : ''}${details?.quantity && details?.unit_value ? ' • ' : ''}${details?.unit_value ? `${escapeHtml(formatCurrency(Number(details.unit_value)))} por unidade` : ''}</div>`
                            : `<div class="price-sub">&nbsp;</div>`
                        }
                      `;

                  return `
                    <div class="service">
                      <div class="service-top">
                        <div>
                          <div class="type-chip">${escapeHtml(label)}</div>
                          ${desc ? `<div class="service-desc">${escapeHtml(desc)}</div>` : ''}
                          ${metaLine ? `<div class="service-meta">${escapeHtml(metaLine)}</div>` : ''}
                        </div>
                        <div>
                          ${priceHtml}
                        </div>
                      </div>

                      <div class="service-body">
                        ${renderServiceDetails(service)}
                      </div>
                    </div>
                  `;
                })
                .join('')
        }
      </div>

      ${
        !isBlank(notesValue)
          ? `
            <div class="notes">
              <div class="notes-title">Observações</div>
              <div class="notes-body">
                ${escapeHtml(notesValue).replace(/\n/g, '<br>')}
              </div>
            </div>
          `
          : ''
      }

      <div class="footer">
        <div>Gerado por <strong>${escapeHtml(agencyName)}</strong>.</div>
        <div style="margin-top:6px;">
          ${contactInfo.length ? `Contato: ${escapeHtml(contactInfo.join(' • '))}` : 'Entre em contato para confirmar disponibilidade e condições.'}
        </div>
      </div>

    </div>
  </body>
  </html>
  `;

  const printWindow = window.open('', '_blank');
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
