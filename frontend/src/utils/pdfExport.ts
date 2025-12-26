import { Proposal } from '@/hooks/useProposals';
import { ProposalService } from '@/hooks/useProposalServices';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

const generateReservationCode = (id: string, number: number) => {
  // Create a hash-like code using proposal id and number
  const idPart = id.replace(/-/g, '').substring(0, 4).toUpperCase();
  const numPart = number.toString().padStart(4, '0');
  const timestamp = Date.now().toString(36).substring(-4).toUpperCase();
  return `RES-${idPart}${numPart}`;
};

const formatDateTime = (date: string) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  }) + ' ' + d.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

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
  premium_economy: 'Premium Economy',
  business: 'Executiva',
  first: 'Primeira Classe',
};

const boardLabels: Record<string, string> = {
  RO: 'Sem Refeições',
  BB: 'Café da Manhã',
  HB: 'Meia Pensão',
  FB: 'Pensão Completa',
  AI: 'All Inclusive',
};

function renderFlightDetails(details: any): string {
  if (!details) return '';
  let html = '';
  
  // Passengers
  const passengers = details.passengers || [];
  const paxInfo = passengers.map((p: any) => {
    const labels: Record<string, string> = { ADT: 'Adulto', CHD: 'Criança', INF: 'Bebê' };
    return `${p.count} ${labels[p.type] || p.type}${p.count > 1 ? 's' : ''}`;
  }).join(', ');
  if (paxInfo) html += `<div class="service-meta">👥 ${paxInfo}</div>`;
  
  // Class
  if (details.cabinClass) {
    html += `<div class="service-meta">💺 Classe: ${cabinLabels[details.cabinClass] || details.cabinClass}</div>`;
  }
  
  // Segments
  const segments = details.segments || [];
  if (segments.length > 0) {
    html += '<div class="flight-segments">';
    segments.forEach((seg: any, idx: number) => {
      if (seg.fromIata || seg.toIata) {
        html += `<div class="flight-segment">`;
        html += `<div class="segment-route">`;
        html += `<span class="airport">${seg.fromIata || '---'}</span>`;
        html += `<span class="arrow">→</span>`;
        html += `<span class="airport">${seg.toIata || '---'}</span>`;
        if (seg.airlineCode && seg.flightNumber) {
          html += `<span class="flight-number">${seg.airlineCode}${seg.flightNumber}</span>`;
        }
        html += `</div>`;
        if (seg.departureAt) {
          html += `<div class="segment-time">🛫 ${formatDateTime(seg.departureAt)}`;
          if (seg.arrivalAt) html += ` → 🛬 ${formatDateTime(seg.arrivalAt)}`;
          html += `</div>`;
        }
        html += `</div>`;
      }
    });
    html += '</div>';
  }
  
  // Baggage
  const baggage = details.baggage;
  if (baggage) {
    const baggageItems = [];
    if (baggage.carryOn) baggageItems.push(`${baggage.carryOnQty || 1}x Mão`);
    if (baggage.checked) baggageItems.push(`${baggage.checkedQty || 1}x Despachada (${baggage.checkedWeight || '23kg'})`);
    if (baggageItems.length > 0) {
      html += `<div class="service-meta">🧳 ${baggageItems.join(' + ')}</div>`;
    }
  }
  
  // PNR
  if (details.pnr) {
    html += `<div class="service-meta pnr">📋 Localizador: <strong>${details.pnr}</strong></div>`;
  }
  
  return html;
}

function renderHotelDetails(details: any): string {
  if (!details) return '';
  let html = '';
  
  if (details.hotelName) {
    html += `<div class="service-main-title">🏨 ${details.hotelName}</div>`;
  }
  if (details.city || details.country) {
    html += `<div class="service-meta">📍 ${[details.city, details.country].filter(Boolean).join(', ')}</div>`;
  }
  if (details.checkIn || details.checkOut) {
    const checkInTime = details.checkInTime ? ` ${details.checkInTime}` : '';
    const checkOutTime = details.checkOutTime ? ` ${details.checkOutTime}` : '';
    html += `<div class="service-meta">📅 ${details.checkIn ? formatDate(details.checkIn) : ''}${checkInTime}${details.checkIn && details.checkOut ? ' → ' : ''}${details.checkOut ? formatDate(details.checkOut) : ''}${checkOutTime}</div>`;
  }
  if (details.roomType) {
    html += `<div class="service-meta">🛏️ ${details.roomType}</div>`;
  }
  if (details.board) {
    html += `<div class="service-meta">🍽️ ${boardLabels[details.board] || details.board}</div>`;
  }
  if (details.guests) {
    const guests = [];
    if (details.guests.adults) guests.push(`${details.guests.adults} adulto${details.guests.adults > 1 ? 's' : ''}`);
    if (details.guests.children) guests.push(`${details.guests.children} criança${details.guests.children > 1 ? 's' : ''}`);
    if (guests.length > 0) html += `<div class="service-meta">👥 ${guests.join(', ')}</div>`;
  }
  if (details.confirmationNumber) {
    html += `<div class="service-meta pnr">📋 Confirmação: <strong>${details.confirmationNumber}</strong></div>`;
  }
  
  return html;
}

function renderCarDetails(details: any): string {
  if (!details) return '';
  let html = '';
  
  if (details.rentalCompany) {
    html += `<div class="service-main-title">🚗 ${details.rentalCompany}</div>`;
  }
  if (details.carCategory) {
    const trans = details.transmission === 'auto' ? 'Automático' : details.transmission === 'manual' ? 'Manual' : '';
    html += `<div class="service-meta">🚙 ${details.carCategory}${trans ? ` (${trans})` : ''}</div>`;
  }
  if (details.pickupLocation && details.pickupAt) {
    html += `<div class="service-meta">📍 Retirada: ${details.pickupLocation} - ${formatDateTime(details.pickupAt)}</div>`;
  }
  if (details.dropoffLocation && details.dropoffAt) {
    html += `<div class="service-meta">📍 Devolução: ${details.dropoffLocation} - ${formatDateTime(details.dropoffAt)}</div>`;
  }
  if (details.mileagePolicy) {
    html += `<div class="service-meta">📏 ${details.mileagePolicy}</div>`;
  }
  if (details.insurance) {
    html += `<div class="service-meta">🛡️ ${details.insurance}</div>`;
  }
  
  return html;
}

function renderCruiseDetails(details: any): string {
  if (!details) return '';
  let html = '';
  
  if (details.cruiseLine || details.shipName) {
    html += `<div class="service-main-title">🚢 ${details.cruiseLine || ''} ${details.shipName || ''}</div>`;
  }
  if (details.embarkPort || details.disembarkPort) {
    html += `<div class="service-meta">📍 ${details.embarkPort || ''} → ${details.disembarkPort || ''}</div>`;
  }
  if (details.sailingDate || details.returnDate) {
    html += `<div class="service-meta">📅 ${details.sailingDate ? formatDate(details.sailingDate) : ''} ${details.sailingDate && details.returnDate ? ' → ' : ''} ${details.returnDate ? formatDate(details.returnDate) : ''}</div>`;
  }
  if (details.cabinType || details.cabinCategory) {
    html += `<div class="service-meta">🛏️ ${[details.cabinType, details.cabinCategory].filter(Boolean).join(' - ')}</div>`;
  }
  if (details.itineraryPorts) {
    html += `<div class="service-meta">🗺️ ${details.itineraryPorts}</div>`;
  }
  
  return html;
}

function renderInsuranceDetails(details: any): string {
  if (!details) return '';
  let html = '';
  
  if (details.insurer || details.planName) {
    html += `<div class="service-main-title">🛡️ ${details.insurer || ''} - ${details.planName || ''}</div>`;
  }
  if (details.coverageStart || details.coverageEnd) {
    html += `<div class="service-meta">📅 ${details.coverageStart ? formatDate(details.coverageStart) : ''} ${details.coverageStart && details.coverageEnd ? ' a ' : ''} ${details.coverageEnd ? formatDate(details.coverageEnd) : ''}</div>`;
  }
  if (details.destinationRegion) {
    html += `<div class="service-meta">🌍 ${details.destinationRegion}</div>`;
  }
  if (details.medicalCoverageAmount) {
    html += `<div class="service-meta">🏥 Cobertura Médica: ${details.medicalCoverageAmount}</div>`;
  }
  if (details.policyNumber) {
    html += `<div class="service-meta pnr">📋 Apólice: <strong>${details.policyNumber}</strong></div>`;
  }
  
  return html;
}

function renderTransferDetails(details: any): string {
  if (!details) return '';
  let html = '';
  
  const type = details.transferType === 'privado' ? 'Privado' : 'Compartilhado';
  html += `<div class="service-main-title">🚐 Transfer ${type}</div>`;
  
  if (details.pickupPlace) {
    html += `<div class="service-meta">📍 De: ${details.pickupPlace}</div>`;
  }
  if (details.dropoffPlace) {
    html += `<div class="service-meta">📍 Para: ${details.dropoffPlace}</div>`;
  }
  if (details.pickupAt) {
    html += `<div class="service-meta">📅 ${formatDateTime(details.pickupAt)}</div>`;
  }
  if (details.vehicleType) {
    html += `<div class="service-meta">🚗 ${details.vehicleType}</div>`;
  }
  if (details.passengersCount) {
    html += `<div class="service-meta">👥 ${details.passengersCount} passageiro${details.passengersCount > 1 ? 's' : ''}</div>`;
  }
  
  return html;
}

function renderPackageDetails(details: any): string {
  if (!details) return '';
  let html = '';
  
  if (details.packageName) {
    html += `<div class="service-main-title">📦 ${details.packageName}</div>`;
  }
  if (details.destinations) {
    html += `<div class="service-meta">📍 ${details.destinations}</div>`;
  }
  if (details.startDate || details.endDate) {
    html += `<div class="service-meta">📅 ${details.startDate ? formatDate(details.startDate) : ''} ${details.startDate && details.endDate ? ' a ' : ''} ${details.endDate ? formatDate(details.endDate) : ''} ${details.nights ? `(${details.nights} noites)` : ''}</div>`;
  }
  if (details.inclusions) {
    html += `<div class="service-meta">✅ Inclui: ${details.inclusions}</div>`;
  }
  
  return html;
}

function renderTourDetails(details: any): string {
  if (!details) return '';
  let html = '';
  
  if (details.destinationBase) {
    html += `<div class="service-main-title">🗺️ Roteiro: ${details.destinationBase}</div>`;
  }
  if (details.startDate || details.endDate) {
    html += `<div class="service-meta">📅 ${details.startDate ? formatDate(details.startDate) : ''} ${details.startDate && details.endDate ? ' a ' : ''} ${details.endDate ? formatDate(details.endDate) : ''}</div>`;
  }
  if (details.pace) {
    const paceLabels: Record<string, string> = { leve: 'Leve', moderado: 'Moderado', intenso: 'Intenso' };
    html += `<div class="service-meta">⚡ Ritmo: ${paceLabels[details.pace] || details.pace}</div>`;
  }
  if (details.days && details.days.length > 0) {
    html += `<div class="service-meta">📋 ${details.days.length} dia${details.days.length > 1 ? 's' : ''} de roteiro</div>`;
  }
  
  return html;
}

function renderServiceDetails(service: ProposalService): string {
  const details = service.details as any;
  
  switch (service.type) {
    case 'flight': return renderFlightDetails(details);
    case 'hotel': return renderHotelDetails(details);
    case 'car': return renderCarDetails(details);
    case 'cruise': return renderCruiseDetails(details);
    case 'insurance': return renderInsuranceDetails(details);
    case 'transfer': return renderTransferDetails(details);
    case 'package': return renderPackageDetails(details);
    case 'tour': return renderTourDetails(details);
    default: return '';
  }
}

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
  const discountValue = (totalServices * (proposal.discount || 0)) / 100;
  const finalValue = totalServices - discountValue;

  const logoSection = agencyLogo 
    ? `<img src="${agencyLogo}" alt="${agencyName}" class="agency-logo" />`
    : `<div class="agency-name-large">${agencyName}</div>`;

  const contactInfo = [];
  if (agencyPhone) contactInfo.push(`Tel: ${agencyPhone}`);
  if (agencyEmail) contactInfo.push(`${agencyEmail}`);
  if (agencyAddress) contactInfo.push(`${agencyAddress}`);

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Proposta #${proposal.number} - ${proposal.title}</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          color: #1a1a1a;
          line-height: 1.5;
          background: #fff;
          font-size: 13px;
        }
        .container { max-width: 800px; margin: 0 auto; padding: 40px; }
        
        /* Header */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 40px;
          padding-bottom: 24px;
          border-bottom: 2px solid #f3f4f6;
        }
        .agency-logo { max-width: 160px; max-height: 50px; object-fit: contain; }
        .agency-name-large { font-size: 22px; font-weight: 700; color: #111; }
        .agency-contact { margin-top: 8px; font-size: 11px; color: #6b7280; line-height: 1.8; }
        .header-right { text-align: right; }
        .proposal-badge {
          display: inline-block;
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: #fff;
          padding: 6px 14px;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 1px;
          text-transform: uppercase;
        }
        .proposal-number { font-size: 28px; font-weight: 700; color: #111; margin-top: 8px; }
        .proposal-date { font-size: 12px; color: #6b7280; margin-top: 2px; }
        
        /* Title */
        .title-section { margin-bottom: 32px; }
        .title-section h1 { font-size: 24px; font-weight: 700; color: #111; margin-bottom: 4px; }
        .title-section .subtitle { font-size: 14px; color: #6b7280; }
        
        /* Sections */
        .section { margin-bottom: 28px; }
        .section-title {
          font-size: 10px;
          font-weight: 600;
          color: #3b82f6;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .section-title::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #e5e7eb;
        }
        
        /* Client */
        .client-card {
          background: #f9fafb;
          padding: 16px 20px;
          border-radius: 10px;
          border-left: 4px solid #3b82f6;
        }
        .client-name { font-size: 15px; font-weight: 600; color: #111; }
        .client-info { font-size: 12px; color: #6b7280; margin-top: 4px; }
        
        /* Services */
        .service-card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          margin-bottom: 12px;
          overflow: hidden;
        }
        .service-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 16px 20px;
          background: #fafafa;
          border-bottom: 1px solid #f3f4f6;
        }
        .service-type {
          display: inline-block;
          background: #111;
          color: #fff;
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 9px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .service-value {
          text-align: right;
        }
        .service-value-unit {
          font-size: 18px;
          font-weight: 700;
          color: #111;
        }
        .service-value-unit .per-person {
          font-size: 11px;
          font-weight: 400;
          color: #6b7280;
        }
        .service-value-breakdown {
          font-size: 12px;
          color: #4b5563;
          margin-top: 2px;
        }
        .service-value-total {
          font-size: 14px;
          font-weight: 600;
          color: #3b82f6;
          margin-top: 4px;
        }
        .service-value-detail {
          font-size: 11px;
          color: #6b7280;
          font-weight: 400;
          margin-top: 2px;
        }
        .service-body { padding: 16px 20px; }
        .service-description {
          font-size: 14px;
          font-weight: 500;
          color: #111;
          margin-bottom: 12px;
        }
        .service-main-title {
          font-size: 14px;
          font-weight: 600;
          color: #111;
          margin-bottom: 8px;
        }
        .service-meta {
          font-size: 12px;
          color: #4b5563;
          margin-bottom: 4px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .service-meta.pnr {
          background: #fef3c7;
          padding: 6px 10px;
          border-radius: 6px;
          margin-top: 8px;
          display: inline-block;
        }
        
        /* Flight Segments */
        .flight-segments { margin: 12px 0; }
        .flight-segment {
          background: #f3f4f6;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 8px;
        }
        .segment-route {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 600;
        }
        .airport { font-family: monospace; font-size: 16px; }
        .arrow { color: #9ca3af; }
        .flight-number {
          background: #3b82f6;
          color: #fff;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
          margin-left: auto;
        }
        .segment-time { font-size: 11px; color: #6b7280; margin-top: 6px; }
        
        /* Notes */
        .notes-box {
          background: #fefce8;
          border-left: 3px solid #eab308;
          padding: 14px 18px;
          border-radius: 0 8px 8px 0;
          font-size: 12px;
          color: #713f12;
        }
        
        /* Totals */
        .totals-section {
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          color: #fff;
          padding: 28px 32px;
          border-radius: 16px;
          margin-top: 32px;
        }
        .totals-row {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
          font-size: 13px;
        }
        .totals-row.discount { color: #fca5a5; }
        .totals-divider { border-top: 1px solid rgba(255,255,255,0.1); margin: 14px 0; }
        .totals-row.final { font-size: 22px; font-weight: 700; padding-top: 12px; }
        .totals-label { color: #9ca3af; }
        .totals-row.final .totals-label { color: #fff; }
        
        /* Footer */
        .footer {
          margin-top: 40px;
          padding-top: 24px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
        }
        .footer-text { font-size: 11px; color: #9ca3af; margin-bottom: 4px; }
        .footer-cta {
          display: inline-block;
          margin-top: 16px;
          padding: 12px 36px;
          background: #3b82f6;
          color: #fff;
          border-radius: 8px;
          font-weight: 600;
          font-size: 13px;
          text-decoration: none;
        }
        
        @media print {
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          .container { padding: 20px; }
          .service-card, .totals-section { break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="header-left">
            ${logoSection}
            ${contactInfo.length > 0 ? `<div class="agency-contact">${contactInfo.join('<br>')}</div>` : ''}
          </div>
          <div class="header-right">
            <div class="proposal-badge">Proposta Comercial</div>
            <div class="proposal-number">${generateReservationCode(proposal.id, proposal.number)}</div>
            <div class="proposal-date">${formatDate(proposal.created_at)}</div>
          </div>
        </div>

        <div class="title-section">
          <h1>${proposal.title}</h1>
          <div class="subtitle">Proposta personalizada para ${proposal.clients?.name || 'Cliente'}</div>
        </div>

        ${proposal.clients ? `
        <div class="section">
          <div class="section-title">Cliente</div>
          <div class="client-card">
            <div class="client-name">${proposal.clients.name}</div>
            <div class="client-info">
              ${proposal.clients.email ? proposal.clients.email : ''}
              ${proposal.clients.email && proposal.clients.phone ? ' &nbsp;•&nbsp; ' : ''}
              ${proposal.clients.phone ? proposal.clients.phone : ''}
            </div>
          </div>
        </div>
        ` : ''}

        <div class="section">
          <div class="section-title">Serviços Inclusos</div>
          ${services.length === 0 ? '<p style="color: #6b7280; font-style: italic;">Nenhum serviço adicionado</p>' : 
          services.map(service => {
            const details = service.details as any;
            const quantity = details?.quantity || 1;
            const unitValue = details?.unit_value || (quantity > 0 ? (service.value || 0) / quantity : service.value || 0);
            const totalValue = service.value || 0;
            
            // Build passenger breakdown for flights
            let passengerBreakdown = '';
            if (service.type === 'flight' && details?.passengers) {
              const passengers = details.passengers || [];
              const parts: string[] = [];
              passengers.forEach((p: any) => {
                if (p.count > 0) {
                  const labels: Record<string, string> = { ADT: 'adulto', CHD: 'criança', INF: 'bebê' };
                  const label = labels[p.type] || p.type;
                  parts.push(p.count + ' ' + label + (p.count > 1 ? 's' : ''));
                }
              });
              if (parts.length > 0) {
                passengerBreakdown = parts.join(' + ');
              }
            }
            
            // For flights: show unit value prominently, then breakdown, then total
            const isFlightWithMultiple = service.type === 'flight' && quantity > 1;
            
            let valueHtml = '';
            if (isFlightWithMultiple) {
              valueHtml = '<div class="service-value-unit">' + formatCurrency(unitValue) + ' <span class="per-person">por pessoa</span></div>' +
                '<div class="service-value-breakdown">' + (passengerBreakdown || (quantity + 'x')) + '</div>' +
                '<div class="service-value-total">Total: ' + formatCurrency(totalValue) + '</div>';
            } else if (quantity > 1) {
              valueHtml = formatCurrency(totalValue) + '<div class="service-value-detail">' + quantity + 'x ' + formatCurrency(unitValue) + '</div>';
            } else {
              valueHtml = formatCurrency(totalValue);
            }
            
            return '<div class="service-card">' +
              '<div class="service-header">' +
                '<span class="service-type">' + (serviceLabels[service.type] || service.type) + '</span>' +
                '<div class="service-value">' + valueHtml + '</div>' +
              '</div>' +
              '<div class="service-body">' +
                (service.description ? '<div class="service-description">' + service.description + '</div>' : '') +
                renderServiceDetails(service) +
              '</div>' +
            '</div>';
          }).join('')}
        </div>

        ${proposal.notes ? `
        <div class="section">
          <div class="section-title">Observações</div>
          <div class="notes-box">${proposal.notes}</div>
        </div>
        ` : ''}

        <div class="totals-section">
          <div class="totals-row">
            <span class="totals-label">Subtotal</span>
            <span>${formatCurrency(totalServices)}</span>
          </div>
          ${(proposal.discount || 0) > 0 ? `
          <div class="totals-row discount">
            <span>Desconto (${proposal.discount}%)</span>
            <span>-${formatCurrency(discountValue)}</span>
          </div>
          ` : ''}
          <div class="totals-divider"></div>
          <div class="totals-row final">
            <span class="totals-label">Valor Total</span>
            <span>${formatCurrency(finalValue)}</span>
          </div>
        </div>

        <div class="footer">
          <p class="footer-text">Os valores apresentados estão sujeitos a alteração sem aviso prévio e serão confirmados no momento da reserva.</p>
          <p class="footer-text">Dúvidas? Entre em contato conosco</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }
}
