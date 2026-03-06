// ============================================================================
// FORMATADORES E VALIDADORES
// ============================================================================

/**
 * Formata um valor Decimal/Number para ter sempre 2 casas decimais
 * @param {number|string|Decimal} value - Valor a ser formatado
 * @returns {number} - Valor formatado com 2 casas decimais
 */
function formatDecimal(value) {
  if (value === null || value === undefined) return 0.00;
  const num = Number(value);
  if (isNaN(num)) return 0.00;
  return Math.round(num * 100) / 100;
}

/**
 * Formata valores decimais de um objeto
 * @param {object} obj - Objeto com valores a serem formatados
 * @param {string[]} fields - Campos que devem ser formatados
 * @returns {object} - Objeto com valores formatados
 */
function formatDecimalFields(obj, fields) {
  if (!obj) return obj;

  const formatted = { ...obj };
  fields.forEach(field => {
    if (formatted[field] !== undefined && formatted[field] !== null) {
      formatted[field] = formatDecimal(formatted[field]);
    }
  });

  return formatted;
}

/**
 * Converte valores para formato brasileiro (1234.56 -> "1.234,56")
 * @param {number} value - Valor numérico
 * @returns {string} - Valor formatado em real brasileiro
 */
function toBRL(value) {
  const num = formatDecimal(value);
  return num.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Converte formato brasileiro para número ("1.234,56" -> 1234.56)
 * @param {string} value - Valor em formato brasileiro
 * @returns {number} - Valor numérico
 */
function fromBRL(value) {
  if (typeof value === 'number') return formatDecimal(value);
  if (!value || typeof value !== 'string') return 0.00;

  // Remove pontos de milhar e substitui vírgula por ponto
  const cleaned = value.replace(/\./g, '').replace(',', '.');
  return formatDecimal(cleaned);
}

module.exports = {
  formatDecimal,
  formatDecimalFields,
  toBRL,
  fromBRL
};
