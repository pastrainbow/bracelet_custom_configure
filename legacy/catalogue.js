// ─── PICKER UI ───────────────────────────────────────────────────────────────

function buildBeadGrid(cat) {
  const grid = document.getElementById('beadGrid');
  grid.innerHTML = '';

  (CATALOGUE[cat] || []).forEach(def => {
    const item = document.createElement('div');
    item.className = 'bead-item';

    if (def.shape) {
      const pc = document.createElement('canvas');
      pc.width = 46;
      pc.height = 46;
      pc.className = 'accessory-preview';
      drawAccessory(23, 23, 20, def, pc.getContext('2d'));
      item.appendChild(pc);
    } else {
      const preview = document.createElement('div');
      preview.className = 'bead-preview';
      preview.style.background = def.shimmer
        ? `radial-gradient(circle at 35% 35%, #fff 0%, ${def.gradient[0]} 30%, ${def.gradient[1]} 100%)`
        : `radial-gradient(circle at 35% 35%, ${def.gradient[0]}, ${def.gradient[1]})`;
      item.appendChild(preview);
    }

    const name = document.createElement('div');
    name.className = 'bead-name';
    name.textContent = def.name;

    const price = document.createElement('div');
    price.className = 'bead-price';
    price.textContent = `$${def.price}`;

    item.append(name, price);
    item.addEventListener('click', () => spawnBead(def));
    grid.appendChild(item);
  });
}

function buildPickerTabs(supercat) {
  const container = document.getElementById('pickerTabs');
  container.innerHTML = '';
  (SUPERCATS[supercat] || []).forEach((tab, i) => {
    const btn = document.createElement('button');
    btn.className = 'picker-tab' + (i === 0 ? ' active' : '');
    btn.dataset.cat = tab.cat;
    btn.textContent = tab.label;
    btn.addEventListener('click', () => {
      container.querySelectorAll('.picker-tab').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      buildBeadGrid(tab.cat);
    });
    container.appendChild(btn);
  });
  if (SUPERCATS[supercat]?.length) buildBeadGrid(SUPERCATS[supercat][0].cat);
}

// ─── TEXTURE PICKER ──────────────────────────────────────────────────────────

function buildTextureGrid() {
  const grid = document.getElementById('textureGrid');
  grid.innerHTML = '';
  TEXTURES.forEach(t => {
    const swatch = document.createElement('div');
    swatch.className = 'texture-swatch' + (t.id === state.backgroundTexture ? ' active' : '');

    const circle = document.createElement('div');
    circle.className = 'texture-circle';
    circle.style.background = t.swatch;

    const label = document.createElement('div');
    label.className = 'texture-label';
    label.textContent = t.label;

    swatch.append(circle, label);
    swatch.addEventListener('click', () => {
      state.backgroundTexture = t.id;
      grid.querySelectorAll('.texture-swatch').forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
    });
    grid.appendChild(swatch);
  });
}

// ─── STEP PROGRESS ───────────────────────────────────────────────────────────

function advanceStep(n) {
  for (let i = 1; i <= n; i++) {
    const el = document.getElementById(`step${i}`);
    el.classList.remove('active');
    el.classList.add('done');
  }
  if (n < 3) {
    document.getElementById(`step${n + 1}`).classList.add('active');
  }
}
