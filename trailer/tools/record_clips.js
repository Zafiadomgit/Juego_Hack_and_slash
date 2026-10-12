const { chromium } = require('/opt/node-tools/node_modules/playwright');
const OUT = process.argv[2];
const SCENES = [
  { name: 'glaciar', cls: 1, setup: `__game.startRift(15); window.__hold = () => { const g = __game; g.P.hp = g.P.maxHp = 1e9; g.rift.spawnT = 0; g.rift.elapsed = 40; };`, keys: ['d', 'w', 'a', 's'], ms: 7000, skills: true },
  { name: 'pantano', cls: 2, setup: `__game.startRift(8); window.__hold = () => { const g = __game; g.P.hp = g.P.maxHp = 1e9; }; setTimeout(() => { __game.spawnGuardian(); const b = __game.enemies.find(e => e.boss); b.x = __game.P.x + 170; b.y = __game.P.y - 20; b.st = 0.3; }, 400);`, keys: ['a', 's', 'd', 'w'], ms: 6000, skills: true },
  { name: 'mago', cls: 3, setup: `__game.startRift(29); window.__hold = () => { const g = __game; g.P.hp = g.P.maxHp = 1e9; }; setTimeout(() => { __game.spawnGuardian(); const b = __game.enemies.find(e => e.boss); b.x = __game.P.x + 220; b.y = __game.P.y; b.st = 0.2; b.cycle = 0; }, 400);`, keys: ['w', 'a', 's', 'd'], ms: 6000, skills: true },
  { name: 'super', cls: 1, setup: `__game.startNode(0, 'S', 0); window.__hold = () => { const g = __game; g.P.hp = g.P.maxHp = 1e9; const b = g.enemies.find(e => e.boss); if (b && !window.__moved) { window.__moved = 1; b.x = g.P.x + 200; b.y = g.P.y - 30; b.sCd = 0.6; } };`, keys: ['d', 's', 'a', 'w'], ms: 8000, skills: true },
  { name: 'pueblo', cls: 1, village: true, ms: 7000 },
];
(async () => {
  const b = await chromium.launch();
  for (const sc of SCENES) {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1, recordVideo: { dir: OUT + '/raw_' + sc.name, size: { width: 1280, height: 720 } } });
    const p = await ctx.newPage();
    await p.goto('http://localhost:8765/index.html#test');
    await p.evaluate(() => { localStorage.clear(); window.TRAILER = true; });
    await p.reload(); await p.evaluate(() => { window.TRAILER = true; });
    await p.waitForTimeout(700);
    await p.click(`.card:nth-child(${sc.cls})`); await p.click('#btnStart'); await p.waitForTimeout(500);
    await p.addStyleTag({ content: '#hub, .overlay { display: none !important; }' });
    await p.evaluate(() => { const S = __game.S; S.level = 60; for (const k of Object.keys(S.stats)) S.stats[k] = 80; });
    if (sc.village) {
      await p.evaluate(() => { vHero.x = -380; vHero.y = 200; vCam.x = -300; vCam.y = 120; });
      await p.waitForTimeout(400);
      await p.keyboard.down('d'); await p.waitForTimeout(2600); await p.keyboard.down('w'); await p.waitForTimeout(1400); await p.keyboard.up('d'); await p.waitForTimeout(1400); await p.keyboard.up('w');
      await p.waitForTimeout(1200);
    } else {
      await p.evaluate(sc.setup);
      await p.evaluate(() => { setInterval(() => window.__hold && window.__hold(), 50); });
      await p.keyboard.down('j');
      const t0 = Date.now(); let i = 0;
      while (Date.now() - t0 < sc.ms) {
        const k = sc.keys[i % sc.keys.length];
        await p.keyboard.down(k); await p.waitForTimeout(420); await p.keyboard.up(k);
        if (sc.skills && i % 2 === 0) await p.keyboard.press(i % 4 === 0 ? 'k' : 'l');
        if (i % 3 === 1) await p.keyboard.press('Shift');
        i++;
      }
      await p.keyboard.up('j');
    }
    await ctx.close();
    console.log('ok', sc.name);
  }
  await b.close();
})();
