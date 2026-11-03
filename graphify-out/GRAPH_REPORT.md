# Graph Report - Juego_Hack_and_slash  (2026-11-03)

## Corpus Check
- 98 files · ~172,535 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 1 file(s) not represented in the graph (top: (none) 1)

## Summary
- 1361 nodes · 2539 edges · 78 communities (65 shown, 13 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 46 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0dd22ebe`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Herramientas de arte (Python)
- Audio sintetizado y recorte de iconos
- Núcleo del juego y ataques
- Combate: daño, esquiva y saltos
- Simulador de balance e idiomas
- Arte de la villa
- Misiones y armería
- Árbol de talentos
- Campamentos y efectos
- Decorado del suelo
- Balance y poder esperado
- Menús: villa, mapa y pausa
- Historia y diálogos
- Mazmorras
- HUD y botones de combate
- Inventario y equipo
- Progreso y dificultades
- Bendiciones
- Grimorio
- Herrería y refinado
- Datos: clases y enemigos
- Props y vecinos
- Biomas
- Kits de clase
- Guardado en la nube
- Iconos de objetos
- Versión completa (pago)
- Visuales: barras y luz
- Look: cámara y tamaños
- Atlas de efectos (sc_vfx)
- Monstruos dibujados a mano
- Motor HD-2D
- Mecánicas propias de héroes
- Desafío diario
- Saga: decisiones y muerte
- Dibujo de enemigos y proyectiles
- Forja maestra y runas
- Tienda
- Logros
- Ranking
- Iconos de interfaz
- Efectos animados (vfx)
- Props del mundo
- Sensación de combate
- Efectos de la villa
- Rutas de la partida
- Tormento
- Mundos y misiones de héroe
- Animación de monstruos
- Entrenamiento
- Cinemática de definitivas
- Ajustes
- Habilidades extra
- Tutorial
- Interfaz base
- Desbloqueos
- Variedad: mutaciones y eventos
- Intro Lumen
- Ruptura de jefes
- Fluidez (motion)
- Música
- Compartir resultado
- Límite de nivel
- Cinemáticas
- Minimapa
- Poses del héroe (rig)
- Datos de animación de héroes
- Dibujo del jugador
- Datos de animación de monstruos
- Atlas de props
- Atlas de efectos (datos)
- updatePlayer
- balance.js

## God Nodes (most connected - your core abstractions)
1. `rand()` - 26 edges
2. `noise()` - 22 edges
3. `buildInventory()` - 21 edges
4. `lp()` - 19 edges
5. `buildQuests()` - 18 edges
6. `dist()` - 17 edges
7. `updateEnemy()` - 17 edges
8. `drawHUD()` - 17 edges
9. `N()` - 17 edges
10. `updatePlayer()` - 16 edges

## Surprising Connections (you probably didn't know these)
- `openBoonPick()` --indirect_call--> `state()`  [INFERRED]
  www/js/boons.js → www/js/game.js
- `openChoice()` --indirect_call--> `state()`  [INFERRED]
  www/js/hades.js → www/js/game.js
- `playDialog()` --indirect_call--> `state()`  [INFERRED]
  www/js/story.js → www/js/game.js
- `upload()` --calls--> `call()`  [EXTRACTED]
  tools/art/sc_upload.py → tools/art/spritecook.py
- `ostinato()` --calls--> `chord()`  [EXTRACTED]
  tools/audio/trailer_music.py → tools/audio/compose.py

## Import Cycles
- None detected.

## Communities (78 total, 13 thin omitted)

### Community 0 - "Herramientas de arte (Python)"
Cohesion: 0.05
Nodes (33): frames(), frames_grid(), key_mask(), build(), clean_mask(), clip_body(), shrink(), build() (+25 more)

### Community 1 - "Audio sintetizado y recorte de iconos"
Cohesion: 0.06
Nodes (60): slice_icons(), chord(), deg_note(), main(), make_melody(), render_track(), build(), load() (+52 more)

### Community 2 - "Núcleo del juego y ataques"
Cohesion: 0.03
Nodes (77): adaptQuality(), aimAt(), AUDIO_CACHE, autoAdvance(), BAG_TABS, basicAttack(), basicDmg(), BOSS_LOOT_NAME (+69 more)

### Community 3 - "Combate: daño, esquiva y saltos"
Cohesion: 0.14
Nodes (48): addHazard(), angDiff(), aoe(), bossLeap(), clamp(), damageEnemy(), dist(), dropPickup() (+40 more)

### Community 4 - "Simulador de balance e idiomas"
Cohesion: 0.05
Nodes (38): browser, CANDIDATES, CHROME, fs, http, os, path, prof (+30 more)

### Community 5 - "Arte de la villa"
Cohesion: 0.06
Nodes (36): artBoard(), artHen(), artVillager(), buildLife(), buildVillage(), drawAnvil(), drawCloudShadows(), drawHen() (+28 more)

### Community 6 - "Misiones y armería"
Cohesion: 0.09
Nodes (42): ARMORY, bigIcon(), bonusReady(), buildQuests(), claimQuest(), closeQuests(), DAILY_POOL, dailyReady() (+34 more)

### Community 7 - "Árbol de talentos"
Cohesion: 0.11
Nodes (35): branchSpent(), buildTalents(), N(), nArmor(), nAspd(), nBoss(), nCd(), nCrit() (+27 more)

### Community 8 - "Campamentos y efectos"
Cohesion: 0.07
Nodes (21): actLabel(), CAMP_WARES, doInteract(), drawRewardDoor(), END_TALK, findInteract(), frameAct(), godImg() (+13 more)

### Community 9 - "Decorado del suelo"
Cohesion: 0.07
Nodes (21): ATTACK_STATES, CRYSTAL_COLS, drawHeroAnim(), GOLEM_PAL, HERO_ANIM_FR, HERO_ANIM_IMG, HERO_ART, HERO_FACE (+13 more)

### Community 10 - "Balance y poder esperado"
Cohesion: 0.13
Nodes (14): DUOS, godsOwned(), HAMMERS, injectDuo(), keyHold, omegaCast(), omegaRelease(), openChoice() (+6 more)

### Community 11 - "Menús: villa, mapa y pausa"
Cohesion: 0.11
Nodes (29): buildHub(), buildMap(), buildMapInfo(), buildPause(), clearInput(), closeInventory(), closeMap(), closeShop() (+21 more)

### Community 12 - "Historia y diálogos"
Cohesion: 0.11
Nodes (26): advanceDialog(), CHAPTERS, CHATTER, dlgEl, dlgQ, endDialog(), fillText(), finishTyping() (+18 more)

### Community 13 - "Mazmorras"
Cohesion: 0.12
Nodes (22): buildDungeon(), buildLimitTab(), classUnique(), dressDungeon(), DUNGEON_GROUND, DUNGEON_LIGHT, dungeonEss(), dungeonLevel() (+14 more)

### Community 14 - "HUD y botones de combate"
Cohesion: 0.13
Nodes (22): BANNER_Y(), bannerBand(), buttonLayout(), combatButton(), draw3(), draw9(), drawBanners(), drawControls() (+14 more)

### Community 15 - "Inventario y equipo"
Cohesion: 0.15
Nodes (22): autoEquip(), bagMax(), bestGearPlan(), bindStatButton(), boostOn(), buildInventory(), closeGems(), derived() (+14 more)

### Community 16 - "Progreso y dificultades"
Cohesion: 0.12
Nodes (20): activeSetBonus(), biomeUnlocked(), clearedDiffs(), DIFFS, diffUnlocked(), globalLevel(), HARD, highestLevel() (+12 more)

### Community 17 - "Bendiciones"
Cohesion: 0.16
Nodes (20): BOON_RARITY, BOON_SLOTS, boonLights(), BOONS, boonUpdate(), boonX(), bst(), buildBoonBar() (+12 more)

### Community 18 - "Grimorio"
Cohesion: 0.13
Nodes (16): applyLoadout(), ART_BASE, buildGrimoire(), capTaken(), GRIM_BASE, GRIM_NEED, GRIM_NODES, grimHas() (+8 more)

### Community 19 - "Herrería y refinado"
Cohesion: 0.20
Nodes (22): applyRefine(), ascendCost(), buildSmith(), canPay(), costHTML(), doAscend(), doRefine(), doReforge() (+14 more)

### Community 20 - "Datos: clases y enemigos"
Cohesion: 0.09
Nodes (16): AFFIX_POOL, CLASS_LORE, CLASSES, CORE_STATS, ELITES, ELIXIRS, ENEMIES, FAMILIES (+8 more)

### Community 21 - "Props y vecinos"
Cohesion: 0.18
Nodes (18): blitProp(), drawPropDeco(), drawPropSprite(), drawVillager(), drawVillaSprite(), PROP_DECO, PROP_IMG, propFrame() (+10 more)

### Community 22 - "Biomas"
Cohesion: 0.15
Nodes (12): BIOME_TEX, BIOMES, drawBiomeDeco(), drawGlowShroom(), drawIceShard(), drawObsidian(), drawReeds(), drawRipple() (+4 more)

### Community 23 - "Kits de clase"
Cohesion: 0.14
Nodes (10): artWolf(), ATK_ICON, blast(), CLASS_KIT, drawMinion(), lifesteal(), minions, stealLife() (+2 more)

### Community 24 - "Guardado en la nube"
Cohesion: 0.27
Nodes (14): CLOUD(), cloudCheck(), cloudConflict(), cloudFind(), cloudNewCode(), cloudNorm(), cloudOpenRestore(), cloudPayload() (+6 more)

### Community 25 - "Iconos de objetos"
Cohesion: 0.16
Nodes (15): ICON_IMG, ICON_PAL, iconBody(), iconSVG(), itemIconImage(), itemKind(), itemSVG(), PAINTED_STAT (+7 more)

### Community 26 - "Versión completa (pago)"
Cohesion: 0.21
Nodes (16): billing(), FULL, FULL_CODES, fullBuy(), fullCelebrate(), fullGrant(), fullOwned(), fullPrice() (+8 more)

### Community 27 - "Visuales: barras y luz"
Cohesion: 0.14
Nodes (12): bars(), bossCard(), GRADE, LIGHT_RIM, MON_OUT, SHOT_TEX, VFX_LIGHT, WORLD_FX (+4 more)

### Community 28 - "Look: cámara y tamaños"
Cohesion: 0.15
Nodes (9): groundBlob(), MON_SIZE, paintPatches(), RIFT_CAM, texPat(), tintedAtlas, TINTS, VIEW_UNITS (+1 more)

### Community 29 - "Atlas de efectos (sc_vfx)"
Cohesion: 0.25
Nodes (8): anim(), fit(), frame(), grid_cells(), main(), on_black(), tight(), wolf_frames()

### Community 30 - "Monstruos dibujados a mano"
Cohesion: 0.16
Nodes (14): artBoar(), artFireBird(), artGolem(), artMage(), artMushroom(), artSpider(), artSpiderQueen(), artWisp() (+6 more)

### Community 31 - "Motor HD-2D"
Cohesion: 0.20
Nodes (9): HD2D, hd2dBegin(), hd2dCanvas(), hd2dPixSize(), PIX_IMG, pixelImage(), pixelize(), SMOOTH_IMG (+1 more)

### Community 32 - "Mecánicas propias de héroes"
Cohesion: 0.14
Nodes (3): CAST_FX, SIG, WPN_FX

### Community 33 - "Desafío diario"
Cohesion: 0.26
Nodes (9): DAILY_MODS, dailyEnd(), dailySave(), dailyScore(), dayKey(), dayRng(), frontierNode(), openDaily() (+1 more)

### Community 34 - "Saga: decisiones y muerte"
Cohesion: 0.18
Nodes (9): DEATH_TALK, deathTalk(), FAREWELL, mercyLvl(), SAGA_CHOICES, SAGA_FX, SAGA_RETRO, sagaCards() (+1 more)

### Community 35 - "Dibujo de enemigos y proyectiles"
Cohesion: 0.18
Nodes (12): circle(), drawEnemy(), drawGem(), drawGlyph(), drawHazard(), drawPickup(), drawProjectile(), drawSlash() (+4 more)

### Community 36 - "Forja maestra y runas"
Cohesion: 0.26
Nodes (10): bolts, decorateRunes(), doForge(), doTransfer(), FORGE_RUNES, masterCost(), masterLevel(), runeK() (+2 more)

### Community 37 - "Tienda"
Cohesion: 0.24
Nodes (12): buildShop(), elixirPrice(), fmtNum(), genStock(), itemStatLines(), offerHTML(), openShop(), panMax() (+4 more)

### Community 38 - "Logros"
Cohesion: 0.27
Nodes (10): ACH(), achCheck(), achQ, ACHS, achShow(), BEST_PORTRAIT, bestPortrait(), buildAch() (+2 more)

### Community 39 - "Ranking"
Cohesion: 0.45
Nodes (11): buildRanking(), buildTormentRanking(), dayIso(), RANK_API, rankName(), rankPid(), rankRpc(), rankSubmit() (+3 more)

### Community 40 - "Iconos de interfaz"
Cohesion: 0.18
Nodes (6): iconOK, isProtected(), ITEM_ICONS, ITEM_KIND_ICON, selectBy(), sellSel

### Community 41 - "Efectos animados (vfx)"
Cohesion: 0.24
Nodes (8): blitVfx(), drawVfxLayer(), drawVfxSlash(), drawVfxState(), VFX_IMG, VFX_USE, vfxFrames(), vfxList

### Community 42 - "Props del mundo"
Cohesion: 0.25
Nodes (11): drawBrazier(), drawCrystal(), drawLavaPool(), drawPillar(), drawPortal(), drawRock(), drawRunicPortal(), drawTree() (+3 more)

### Community 43 - "Sensación de combate"
Cohesion: 0.24
Nodes (9): BTN_FX, buzz(), drawEdgeArrows(), HAPT, hapticsOn(), offscreenTargets(), RAR_MARK, vibeLabel() (+1 more)

### Community 44 - "Efectos de la villa"
Cohesion: 0.24
Nodes (9): PFX, pfxDrawHero(), pfxEase(), pfxHero(), VFX, VFX_POINTS, VFX_WINDOWS, vfxBuild() (+1 more)

### Community 45 - "Rutas de la partida"
Cohesion: 0.33
Nodes (5): continueRun(), nextRunNode(), openRunPick(), RUN_KEEP, runDepth()

### Community 46 - "Tormento"
Cohesion: 0.36
Nodes (8): ROMAN(), TOR, torBest(), torMax(), tormentDiff(), tormentName(), tormentOpen(), torSel()

### Community 47 - "Mundos y misiones de héroe"
Cohesion: 0.31
Nodes (6): checkHeroQuest(), HERO_QUESTS, heroQuest(), hqState(), nodesCleared(), SUPER_MOVES

### Community 48 - "Animación de monstruos"
Cohesion: 0.29
Nodes (8): drawCorpse(), drawMonsterAnim(), drawMonsterBody(), monAnimId(), monFrame(), monPose(), monSilhouette(), tintSprite()

### Community 50 - "Cinemática de definitivas"
Cohesion: 0.32
Nodes (6): drawUltCine(), ULT_ART, ULT_CINE, ULT_RGB, ultBlast(), ultEase()

### Community 51 - "Ajustes"
Cohesion: 0.38
Nodes (5): applyOptions(), openOptions(), OPT(), OPT_DEF, _sfxInitQ

### Community 52 - "Habilidades extra"
Cohesion: 0.29
Nodes (4): s3Bolts, S3FX, s3Zones, SKILL3

### Community 53 - "Tutorial"
Cohesion: 0.48
Nodes (6): hubHint(), TUT, tutNext(), tutOn(), tutS(), tutShow()

### Community 54 - "Interfaz base"
Cohesion: 0.33
Nodes (5): UI_HERO_WORLD, UI_HI, UI_STAT_ICONS, uiIcon(), uiTiles()

### Community 55 - "Desbloqueos"
Cohesion: 0.48
Nodes (6): featApply(), featMigrate(), featNext(), featQ, FEATS, featSeen()

### Community 56 - "Variedad: mutaciones y eventos"
Cohesion: 0.33
Nodes (4): mutPool(), MUTS, NEW_EVENTS, rollMut()

### Community 57 - "Intro Lumen"
Cohesion: 0.60
Nodes (5): finish(), flame(), frame(), size(), spark()

### Community 59 - "Fluidez (motion)"
Cohesion: 0.40
Nodes (4): FIREFLIES, HERO_MS, LEAF_COLS, LEAVES

### Community 60 - "Música"
Cohesion: 0.40
Nodes (3): BOSS_WORLDS, _musicAttachM, _musicPlayM

### Community 61 - "Compartir resultado"
Cohesion: 0.70
Nodes (4): shareCanvas(), shareData(), shareImg(), shareResult()

### Community 63 - "Cinemáticas"
Cohesion: 0.67
Nodes (3): CINE_FOR, endCine(), playCine()

### Community 64 - "Minimapa"
Cohesion: 0.67
Nodes (3): drawMini(), MINI, miniLoop()

### Community 67 - "Poses del héroe (rig)"
Cohesion: 0.67
Nodes (3): drawHeroImage(), heroPoseFor(), heroPoseSource()

### Community 76 - "updatePlayer"
Cohesion: 0.12
Nodes (17): addText(), collect(), collideObstacles(), dash(), eatBread(), heal(), keyboardAttack(), obstacleGrid() (+9 more)

### Community 77 - "balance.js"
Cohesion: 0.33
Nodes (3): BOSS_CAP, expectK(), recPower()

## Knowledge Gaps
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `closeQuests()` connect `Misiones y armería` to `Núcleo del juego y ataques`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Should `Herramientas de arte (Python)` be split into smaller, more focused modules?**
  _Cohesion score 0.053305879661404716 - nodes in this community are weakly interconnected._
- **Why does `state()` connect `Núcleo del juego y ataques` to `Bendiciones`, `Balance y poder esperado`, `Historia y diálogos`, `balance.js`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Should `Audio sintetizado y recorte de iconos` be split into smaller, more focused modules?**
  _Cohesion score 0.0602655771195097 - nodes in this community are weakly interconnected._
- **Why does `playDialog()` connect `Historia y diálogos` to `Núcleo del juego y ataques`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **Should `Núcleo del juego y ataques` be split into smaller, more focused modules?**
  _Cohesion score 0.027633378932968536 - nodes in this community are weakly interconnected._
- **Should `Combate: daño, esquiva y saltos` be split into smaller, more focused modules?**
  _Cohesion score 0.1400709219858156 - nodes in this community are weakly interconnected._