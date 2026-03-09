function formatDate(date) {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function renderLabels(labels) {
  if (!labels || !labels.length) return '';
  return labels
    .map(l => `<span class="label-chip">${l}</span>`)
    .join('');
}