function getBrazilDate() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
}

module.exports = { getBrazilDate };
