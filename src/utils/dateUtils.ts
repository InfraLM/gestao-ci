/**
 * Formata uma data ISO (string) para DD/MM/AAAA sem erro de timezone.
 * new Date("2025-03-06").toLocaleDateString('pt-BR') mostra dia anterior
 * porque JS parse YYYY-MM-DD como UTC meia-noite, e BR e UTC-3.
 */
export function formatDateUTC(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Sem data';
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length !== 3) return 'Sem data';
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}
