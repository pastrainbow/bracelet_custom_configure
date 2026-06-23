// ─── SIDEBAR ─────────────────────────────────────────────────────────────────

function updateSidebar() {
  const beads = state.beadsOnCanvas;
  const count = beads.length;
  const total = beads.reduce((sum, b) => sum + b.beadDef.price, 0);
  const lengthCm = (beads.reduce((sum, b) => sum + b.size + 0.5, 0) * 0.1).toFixed(1);

  document.getElementById('beadCountBadge').textContent = `${count} bead${count !== 1 ? 's' : ''}`;
  document.getElementById('priceDisplay').innerHTML = `<span>$</span>${total.toFixed(2)}`;
  document.getElementById('infoCount').textContent = `${count} / 40`;
  document.getElementById('infoLength').textContent = count > 0 ? `~${lengthCm} cm` : '— cm';
  const beadsOnly = beads.filter(b => !b.beadDef.shape);
  const maxSize = beadsOnly.length > 0 ? Math.max(...beadsOnly.map(b => b.size)) : state.beadSize;
  document.getElementById('infoSize').textContent = `${maxSize}mm`;

  renderBeadList(beads);
}

function renderBeadList(beads) {
  const list = document.getElementById('beadList');

  if (beads.length === 0) {
    list.innerHTML = '<div class="empty-state"><div class="icon">○</div>Add beads from the picker below</div>';
    return;
  }

  list.innerHTML = '';
  let selectedRow = null;
  beads.forEach((b, idx) => {
    const isSelected = idx === state.selectedBeadIndex;
    const row = document.createElement('div');
    row.className = 'bead-list-item' + (isSelected ? ' selected' : '');

    const top = document.createElement('div');
    top.className = 'bead-list-top';

    const dot = document.createElement('div');
    dot.className = 'bead-dot';
    dot.style.background = b.beadDef.gradient
      ? `radial-gradient(circle at 35% 35%, ${b.beadDef.gradient[0]}, ${b.beadDef.gradient[1]})`
      : b.beadDef.color || '#888';

    const name = document.createElement('div');
    name.className = 'bead-list-name';
    name.textContent = `${b.beadDef.name} · ${b.size}mm`;

    const price = document.createElement('div');
    price.className = 'bead-list-price';
    price.textContent = `$${b.beadDef.price.toFixed(2)}`;

    const rm = document.createElement('button');
    rm.className = 'bead-list-remove';
    rm.innerHTML = '×';
    rm.title = 'Remove';
    rm.addEventListener('click', () => { removeBead(idx); });

    top.append(dot, name, price, rm);
    row.appendChild(top);

    if (isSelected && !b.beadDef.shape) {
      const sizeBtns = document.createElement('div');
      sizeBtns.className = 'bead-size-btns';
      [6, 10, 12, 14].forEach(mm => {
        const btn = document.createElement('button');
        btn.className = 'bead-size-btn' + (b.size === mm ? ' active' : '');
        btn.textContent = `${mm}mm`;
        btn.addEventListener('click', e => {
          e.stopPropagation();
          resizeBead(idx, mm);
          document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
          closeSizeWheel();
          updateSidebar();
        });
        sizeBtns.appendChild(btn);
      });
      row.appendChild(sizeBtns);
      selectedRow = row;
    }

    list.appendChild(row);
  });
  if (selectedRow && !state.wheelOpen) selectedRow.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}
