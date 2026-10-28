/* Fendaria — ranking mundial de la Grieta del Día (Supabase).
 * Cada jugador tiene un identificador anónimo (SAVE.pid) y un nombre visible. La puntuación se envía al
 * terminar la Grieta del Día (función submit_daily, que guarda solo la mejor del día) y la tabla se lee con
 * get_daily_top (top 50 + tu puesto). Sin conexión, el juego sigue igual y lo envía en el siguiente intento.
 */
'use strict';

// clave publicable: está pensada para ir en el cliente (la tabla solo se toca a través de las dos funciones)
const RANK_API = { url: 'https://peyywtypbriuxspnwnsk.supabase.co', key: 'sb_publishable_mhBv-mlDDb0NABnFjSubkw_Y_CWK8KS' };
const uuid4 = () => (window.crypto && crypto.randomUUID ? crypto.randomUUID()
  : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); }));
const rankPid = () => (SAVE.pid = SAVE.pid || uuid4());
const rankName = () => SAVE.pname || '';
async function rankRpc(fn, body) {
  const r = await fetch(`${RANK_API.url}/rest/v1/rpc/${fn}`, {
    method: 'POST', headers: { apikey: RANK_API.key, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error('ranking ' + r.status);
  return r.json();
}
const dayIso = () => (typeof dayKey === 'function' ? dayKey() : new Date().toISOString().slice(0, 10));

// envío: la mejor puntuación de hoy (se reintenta si no hay red)
async function rankSubmit() {
  const sv = S && S.daily2;
  if (!sv || !sv.best || !rankName()) return;
  if (sv.sentBest >= sv.best) return;
  try {
    await rankRpc('submit_daily', { p_day: sv.key, p_player: rankPid(), p_name: rankName(), p_hero: S.cls, p_score: sv.best });
    sv.sentBest = sv.best; persist();
  } catch (e) { /* sin red: se reintenta luego */ }
}
const _finishRiftK = finishRift;
finishRift = function () { const d = rift && rift.daily; _finishRiftK(); if (d) setTimeout(rankSubmit, 500); };
const _playerDiedK = playerDied;
playerDied = function () { const d = rift && rift.daily; _playerDiedK(); if (d) setTimeout(rankSubmit, 1500); };
setInterval(() => { if (state === 'hub') rankSubmit(); }, 30000);

// Tormento: nivel más alto superado (torment.js); se envía al superarlo y se reintenta en la villa
async function rankSubmitTorment() {
  const lv = typeof torBest === 'function' ? torBest() : 0;
  if (!S || !lv || !rankName() || (S.torSent || 0) >= lv) return;
  try {
    await rankRpc('submit_torment', { p_player: rankPid(), p_name: rankName(), p_hero: S.cls, p_level: lv });
    S.torSent = lv; persist();
  } catch (e) { /* sin red: se reintenta luego */ }
}
setInterval(() => { if (state === 'hub') rankSubmitTorment(); }, 30000);

// tabla (pestaña «Ranking» del panel de Logros): Grieta del Día o Tormento
let rankCache = null, rankMode = 'daily';
function buildRanking(list) {
  if (rankMode === 'torment') return buildTormentRanking(list);
  $('achSub').innerHTML = `Daily Rift · ${dayIso().split('-').reverse().join('/')} · the ranking resets every day`;
  if (!rankName()) {
    list.innerHTML = `<div class="rank-me">Choose the name you'll appear with on the world ranking:</div>
      <div class="rank-name"><input id="rankNameIn" maxlength="16" placeholder="Your name" value="${(CLASS_LORE[S.cls] && CLASS_LORE[S.cls].hero) || ''}"><button id="rankNameOk">Save</button></div>`;
    $('rankNameOk').onclick = () => {
      const v = $('rankNameIn').value.trim().replace(/[<>&"]/g, '').slice(0, 16);
      if (v.length < 2) return;
      SAVE.pname = v; persist(); rankSubmit(); buildRanking(list);
    };
    return;
  }
  list.innerHTML = "<div class=\"rank-me\">Loading ranking…</div>";
  rankSwitch(list);
  rankRpc('get_daily_top', { p_day: dayIso(), p_player: rankPid() }).then((rows) => {
    if (achTab !== 'rank') return;
    rankCache = rows;
    const me = rows.find((r) => r.is_me);
    const top = rows.filter((r) => !r.is_me || r.pos <= 50);
    const esc = (s) => String(s).replace(/[<>&"]/g, '');
    list.innerHTML = (me ? `<div class="rank-me">Your place today: <b>#${me.pos}</b> of ${fmtNum(me.total)} · ${fmtNum(me.score)} pts</div>`
      : `<div class="rank-me">You don't have a score today yet: play the Daily Rift («Daily» button) to enter the ranking.</div>`) +
      (top.length ? top.map((r) => `<div class="rank-row ${r.is_me ? 'me' : ''}"><span class="pos">${r.pos <= 3 ? ['🥇', '🥈', '🥉'][r.pos - 1] : r.pos}</span><span>${esc(r.name)}</span><span class="hero">${CLASSES[r.hero] ? CLASSES[r.hero].name : ''}</span><span class="sc">${fmtNum(r.score)}</span></div>`).join('')
        : "<div class=\"rank-me\">Nobody has played today's Rift yet. Be the first!</div>") +
      `<div class="rank-name" style="margin-top:8px"><small style="color:#aab3cc">You appear as «${esc(rankName())}»</small></div>`;
    rankSwitch(list);
  }).catch(() => { if (achTab === 'rank') { list.innerHTML = "<div class=\"rank-me\">Offline: the ranking can't be loaded right now. Your scores will be sent when the connection is back.</div>"; rankSwitch(list); } });
}

// selector Grieta del Día / Tormento
function rankSwitch(list) {
  list.insertAdjacentHTML('afterbegin', `<div class="rank-sw"><button data-rm="daily" class="${rankMode === 'daily' ? 'on' : ''}">☀ Daily Rift</button><button data-rm="torment" class="${rankMode === 'torment' ? 'on' : ''}">☠ Torment</button></div>`);
  for (const b of list.querySelectorAll('[data-rm]')) b.onclick = () => { if (rankMode === b.dataset.rm) return; rankMode = b.dataset.rm; SFX.play('click'); buildRanking(list); };
}
function buildTormentRanking(list) {
  $('achSub').innerHTML = "Torment · the highest level cleared by each player";
  list.innerHTML = "<div class=\"rank-me\">Loading ranking…</div>";
  rankSwitch(list);
  rankSubmitTorment();
  rankRpc('get_torment_top', { p_player: rankPid() }).then((rows) => {
    if (achTab !== 'rank' || rankMode !== 'torment') return;
    const me = rows.find((r) => r.is_me);
    const top = rows.filter((r) => !r.is_me || r.pos <= 50);
    const esc = (s) => String(s).replace(/[<>&"]/g, '');
    const mine = typeof torBest === 'function' ? torBest() : 0;
    list.innerHTML = (me ? `<div class="rank-me">Your place: <b>#${me.pos}</b> of ${fmtNum(me.total)} · Torment ${ROMAN(me.level)}</div>`
      : !rankName() ? "<div class=\"rank-me\">Choose your name in the «Daily Rift» tab to appear in the ranking.</div>"
      : mine ? "<div class=\"rank-me\">Sending your Torment…</div>"
      : `<div class="rank-me">${typeof tormentOpen === 'function' && tormentOpen() ? "Beat your first Torment (Rift map) to enter the ranking." : "Torment Levels open when you defeat Morvhal."}</div>`) +
      (top.length ? top.map((r) => `<div class="rank-row ${r.is_me ? 'me' : ''}"><span class="pos">${r.pos <= 3 ? ['🥇', '🥈', '🥉'][r.pos - 1] : r.pos}</span><span>${esc(r.name)}</span><span class="hero">${CLASSES[r.hero] ? CLASSES[r.hero].name : ''}</span><span class="sc" style="color:#e6b8ff">☠ ${ROMAN(r.level)}</span></div>`).join('')
        : "<div class=\"rank-me\">Nobody has beaten a Torment yet. Be the first!</div>");
    rankSwitch(list);
  }).catch(() => { if (achTab === 'rank') { list.innerHTML = "<div class=\"rank-me\">Offline: the ranking can't be loaded right now.</div>"; rankSwitch(list); } });
}
