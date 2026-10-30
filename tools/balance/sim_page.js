// Fendaria — simulador de poder (se ejecuta DENTRO de la página del juego; lo lanza tools/balance/simular.js).
// Crea héroes sintéticos con las funciones reales del juego (equipo de makeItem, refinado, talentos,
// Trascendencia y Forja) y compara su golpe con el del héroe de referencia de cada Grieta (refPlayer).
// k = golpe real / golpe de referencia. balance.js endurece a los monstruos según k.
(async () => {
  const PROFILES = {
    // juega en orden, sin repetir: equipo Raro en todas las ranuras, sin refinar ni Trascendencia
    justo: { rar: () => 1, refine: () => 0, trans: () => 0, stars: () => 0 },
    // lo esperado: algo de Épico, refina poco a poco, Trascendencia con las misiones diarias
    normal: { rar: (i) => (i % 3 === 0 ? 2 : 1), refine: (L) => Math.min(10, Math.floor(L / 5)), trans: (ch) => Math.min(10, Math.round(ch * 1.25)), stars: (ch) => Math.min(5, Math.floor(ch / 2)) },
    // repite Grietas: todo Épico, refina y forja mucho
    fuerte: { rar: () => 2, refine: (L) => Math.min(10, Math.floor(L / 3.5)), trans: (ch) => Math.min(10, ch * 2), stars: (ch) => Math.min(5, Math.ceil(ch / 1.5)) },
  };
  const classes = Object.keys(CLASSES);
  const points = [];
  for (let b = 0; b < BIOMES.length; b++) for (const n of [1, 4, 'S']) points.push({ b, n });
  const keep = { S, rift, P };
  rift = null;
  const rows = [];
  for (const { b, n } of points) {
    const L = globalLevel(b, n), ref0 = refPlayer('iop', L, 0);
    const row = { grieta: BIOMES[b].name + ' ' + (n === 'S' ? 'Súper Jefe' : n), L, nivel: ref0.plvl };
    for (const [pname, PF] of Object.entries(PROFILES)) {
      const ks = [];
      for (const cls of classes) {
        const ref = refPlayer(cls, L, 0);
        S = migrateSlot(newSlot(cls));
        S.level = ref.plvl;
        const pts = (S.level - 1) * 5, rec = (typeof STAT_REC !== 'undefined' && STAT_REC[cls]) || ['fue', 'vit'];
        S.stats[rec[0]] += Math.round(pts * 0.6); S.stats[rec[1]] += pts - Math.round(pts * 0.6);
        const il = Math.max(1, (L - 1) * 2 + 3);
        SLOTS.forEach((slot, i) => {
          const it = makeItem(cls, il, PF.rar(i), { slot });
          const r = PF.refine(L);
          if (r && typeof applyRefine === 'function') { it.refine = r; applyRefine(it); }
          S.equip[slot] = it;
        });
        const ch = b; // capítulos ya superados al llegar aquí
        S.trans = PF.trans(ch);
        S.forge = {}; for (const slot of SLOTS) S.forge[slot] = PF.stars(ch);
        // talentos: 1 punto por nivel, gastado en orden (en las encrucijadas, la primera opción)
        if (typeof talKeys === 'function') {
          S.tal = {};
          for (let guard = 0; guard < 400 && talPoints() > 0; guard++) {
            const k = Object.keys(talKeys()).find((key) => talCan(key));
            if (!k) break;
            S.tal[k] = (S.tal[k] || 0) + 1;
          }
        }
        createPlayer();
        const hit = basicDmg() * (1 + Math.min(0.75, P.crit) * 0.8);
        ks.push(hit / ref.hit);
      }
      ks.sort((a, b2) => a - b2);
      row[pname] = +(ks[Math.floor(ks.length / 2)]).toFixed(2); // mediana de las clases
      row[pname + 'Max'] = +ks[ks.length - 1].toFixed(2);
      // golpes que aguanta un monstruo normal (el Jabalí aguanta 8 al héroe de referencia)
      const k = row[pname], E = expectK(L);
      row[pname + 'Antes'] = +(8 * (k > 1 ? Math.pow(k, 0.85) : 1) / k).toFixed(1);
      row[pname + 'Ahora'] = +hitsFor(k / E).toFixed(1);
    }
    rows.push(row);
  }
  S = keep.S; rift = keep.rift; P = keep.P;
  return rows;
})()
