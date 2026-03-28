const ROLE_LIBRARY = [
  {
    id: "light",
    name: "Light Scout",
    summary: "Fast and agile. Great for quick moves and side routes.",
    tip: "Best for kids who like speed.",
    color: "#69d8ff",
    hp: 100,
    topSpeed: 220,
    accel: 420,
    damage: 10,
    fireRate: 0.3,
    range: 280,
    skillName: "Dash",
    superName: "Rapid Shot",
    skillCd: 5,
    superCd: 9
  },
  {
    id: "medium",
    name: "Medium Hero",
    summary: "Balanced speed and firepower. Easiest role to learn.",
    tip: "Best default tank for first play.",
    color: "#8fe38f",
    hp: 135,
    topSpeed: 175,
    accel: 340,
    damage: 12,
    fireRate: 0.36,
    range: 300,
    skillName: "Triple Shot",
    superName: "Team Boost",
    skillCd: 6,
    superCd: 10
  },
  {
    id: "heavy",
    name: "Heavy Guard",
    summary: "Slow, tough, and heavy. It really feels weighty.",
    tip: "Moves slowly but can take lots of hits.",
    color: "#ffbd66",
    hp: 190,
    topSpeed: 125,
    accel: 220,
    damage: 18,
    fireRate: 0.54,
    range: 285,
    skillName: "Shield",
    superName: "Ground Blast",
    skillCd: 7,
    superCd: 12
  },
  {
    id: "helper",
    name: "Helper Tank",
    summary: "Repairs and protects teammates.",
    tip: "Great for kids who like helping the team.",
    color: "#d39cff",
    hp: 120,
    topSpeed: 155,
    accel: 300,
    damage: 9,
    fireRate: 0.34,
    range: 270,
    skillName: "Repair Wave",
    superName: "Team Shield",
    skillCd: 6,
    superCd: 11
  }
];

const STAGES = [
  { name: "Green Camp", hint: "Learn to move and auto shoot.", enemies: 5, mission: "Beat 5 enemy tanks" },
  { name: "Stone Bridge", hint: "More enemies. Check the radar map.", enemies: 7, mission: "Clear enemies and push forward" },
  { name: "Wind Field", hint: "The map is larger and enemies come from more sides.", enemies: 9, mission: "Protect allies and take the outpost" },
  { name: "Iron Base", hint: "Final stage. The enemy lead tank is tougher.", enemies: 11, mission: "Defeat the base guard" }
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function angleTo(from, to) {
  return Math.atan2(to.y - from.y, to.x - from.x);
}

function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

function normalize(x, y) {
  const len = Math.sqrt(x * x + y * y) || 1;
  return { x: x / len, y: y / len };
}

function pickRoleById(id) {
  for (let i = 0; i < ROLE_LIBRARY.length; i += 1) {
    if (ROLE_LIBRARY[i].id === id) {
      return ROLE_LIBRARY[i];
    }
  }
  return ROLE_LIBRARY[0];
}

class TinyTankWorld {
  constructor(options) {
    this.canvas = options.canvas;
    this.ctx = options.ctx;
    this.viewWidth = options.width;
    this.viewHeight = options.height;
    this.dpr = options.dpr || 1;
    this.onUiChange = options.onUiChange || function noop() {};

    this.worldWidth = this.viewWidth * 5;
    this.worldHeight = this.viewHeight * 4;
    this.camera = { x: 0, y: 0 };
    this.input = { up: false, down: false, left: false, right: false };
    this.roleIndex = 1;
    this.stageIndex = 0;
    this.status = "menu";
    this.paused = false;
    this.showOverview = false;
    this.units = [];
    this.bullets = [];
    this.effects = [];
    this.decorations = [];
    this.frameTimer = null;
    this.lastTime = 0;
    this.notice = "";
    this.noticeTime = 0;
    this.stageBanner = 0;
    this.syncTimer = 0;
    this.idSeed = 1;
    this.base = null;
    this.buildDecorations();
    this.syncUi(true);
  }

  start() {
    if (this.frameTimer) {
      return;
    }
    this.lastTime = Date.now();
    this.frameTimer = setInterval(() => {
      this.tick();
    }, 16);
  }

  destroy() {
    if (this.frameTimer) {
      clearInterval(this.frameTimer);
      this.frameTimer = null;
    }
  }

  setPaused(nextValue) {
    this.paused = !!nextValue;
  }

  setInput(key, value) {
    if (Object.prototype.hasOwnProperty.call(this.input, key)) {
      this.input[key] = !!value;
    }
  }

  cycleRole() {
    if (this.status === "running") {
      this.showNotice("Finish this stage before switching tanks.", 1.5);
      return;
    }
    this.roleIndex = (this.roleIndex + 1) % ROLE_LIBRARY.length;
    this.syncUi(true);
  }

  toggleOverview() {
    this.showOverview = !this.showOverview;
    this.syncUi(true);
  }

  startAdventure() {
    this.stageIndex = 0;
    this.beginStage();
  }

  restart() {
    this.startAdventure();
  }

  nextStage() {
    this.stageIndex += 1;
    if (this.stageIndex >= STAGES.length) {
      this.status = "won";
      this.syncUi(true);
      return;
    }
    this.beginStage();
  }

  beginStage() {
    this.status = "running";
    this.units = [];
    this.bullets = [];
    this.effects = [];
    this.idSeed = 1;
    this.showOverview = false;
    this.stageBanner = 2.8;
    const stage = STAGES[this.stageIndex];
    this.showNotice(stage.hint, 3);
    this.spawnStage();
    this.syncUi(true);
  }

  spawnStage() {
    const centerY = this.worldHeight * 0.52;
    const player = this.spawnTank("ally", ROLE_LIBRARY[this.roleIndex].id, this.viewWidth * 0.6, centerY, true);
    this.spawnTank("ally", "medium", player.x - 95, player.y - 105, false);
    this.spawnTank("ally", "heavy", player.x - 105, player.y + 105, false);

    const stage = STAGES[this.stageIndex];
    for (let i = 0; i < stage.enemies; i += 1) {
      const role = ROLE_LIBRARY[i % 3];
      this.spawnTank(
        "enemy",
        role.id,
        this.worldWidth - this.viewWidth * 0.75 + randomRange(-120, 160),
        this.worldHeight * 0.2 + (i * 145) % (this.worldHeight * 0.6),
        false
      );
    }

    this.base = {
      ally: { x: this.viewWidth * 0.35, y: centerY, hp: 220 },
      enemy: { x: this.worldWidth - this.viewWidth * 0.35, y: centerY, hp: 260 + this.stageIndex * 60 }
    };
  }

  buildDecorations() {
    this.decorations = [];
    for (let i = 0; i < 28; i += 1) {
      this.decorations.push({
        type: i % 3 === 0 ? "rock" : "tree",
        x: randomRange(120, this.worldWidth - 120),
        y: randomRange(120, this.worldHeight - 120),
        size: randomRange(18, 42)
      });
    }
  }

  spawnTank(team, roleId, x, y, isPlayer) {
    const role = pickRoleById(roleId);
    const unit = {
      id: this.idSeed++,
      team,
      roleId: role.id,
      x,
      y,
      vx: 0,
      vy: 0,
      angle: team === "ally" ? 0 : Math.PI,
      turretAngle: team === "ally" ? 0 : Math.PI,
      radius: role.id === "heavy" ? 26 : 22,
      hp: role.hp,
      maxHp: role.hp,
      shield: 0,
      topSpeed: role.topSpeed,
      accel: role.accel,
      damage: role.damage,
      fireRate: role.fireRate,
      range: role.range,
      fireCooldown: randomRange(0, role.fireRate),
      skillCooldown: role.skillCd,
      superCooldown: role.superCd,
      speedBoost: 0,
      teamBoost: 0,
      healAura: 0,
      shieldAura: 0,
      role,
      alive: true,
      isPlayer: !!isPlayer,
      wander: { x: randomRange(-120, 120), y: randomRange(-120, 120) }
    };
    this.units.push(unit);
    return unit;
  }

  getPlayer() {
    for (let i = 0; i < this.units.length; i += 1) {
      if (this.units[i].isPlayer && this.units[i].alive) {
        return this.units[i];
      }
    }
    return null;
  }

  usePlayerSkill(useSuper) {
    if (this.status !== "running") {
      return;
    }
    const player = this.getPlayer();
    if (!player) {
      return;
    }
    if (useSuper) {
      this.trySuper(player);
    } else {
      this.trySkill(player);
    }
  }

  tick() {
    const now = Date.now();
    const dt = Math.min(0.033, (now - this.lastTime) / 1000 || 0.016);
    this.lastTime = now;

    if (!this.paused && this.status === "running") {
      this.update(dt);
    }

    if (this.noticeTime > 0) {
      this.noticeTime -= dt;
      if (this.noticeTime <= 0) {
        this.notice = "";
      }
    }

    this.render();
  }

  update(dt) {
    this.stageBanner = Math.max(0, this.stageBanner - dt);
    const player = this.getPlayer();

    for (let i = 0; i < this.units.length; i += 1) {
      const unit = this.units[i];
      if (!unit.alive) {
        continue;
      }

      unit.fireCooldown -= dt;
      unit.skillCooldown -= dt;
      unit.superCooldown -= dt;
      unit.speedBoost = Math.max(0, unit.speedBoost - dt);
      unit.teamBoost = Math.max(0, unit.teamBoost - dt);
      unit.healAura = Math.max(0, unit.healAura - dt);
      unit.shieldAura = Math.max(0, unit.shieldAura - dt);

      if (unit.isPlayer) {
        this.updatePlayer(unit, dt);
      } else {
        this.updateAi(unit, dt);
      }

      unit.x += unit.vx * dt;
      unit.y += unit.vy * dt;
      unit.x = clamp(unit.x, 40, this.worldWidth - 40);
      unit.y = clamp(unit.y, 40, this.worldHeight - 40);

      if (unit.healAura > 0) {
        this.healFriends(unit, 24 * dt, 110);
      }
      if (unit.shieldAura > 0) {
        this.shieldFriends(unit, 20 * dt, 125);
      }

      this.autoAttack(unit);
      if (!unit.isPlayer) {
        this.trySkill(unit);
        this.trySuper(unit);
      }
    }

    if (player) {
      this.camera.x = clamp(player.x - this.viewWidth * 0.5, 0, this.worldWidth - this.viewWidth);
      this.camera.y = clamp(player.y - this.viewHeight * 0.5, 0, this.worldHeight - this.viewHeight);
    }

    this.updateBullets(dt);
    this.updateEffects(dt);
    this.cleanupUnits();
    this.checkWinLose();
    this.syncUi();
  }

  updatePlayer(player, dt) {
    let dx = 0;
    let dy = 0;
    if (this.input.up) {
      dy -= 1;
    }
    if (this.input.down) {
      dy += 1;
    }
    if (this.input.left) {
      dx -= 1;
    }
    if (this.input.right) {
      dx += 1;
    }

    const speedCap = player.topSpeed * (player.speedBoost > 0 ? 1.55 : 1) * (player.teamBoost > 0 ? 1.2 : 1);
    if (dx !== 0 || dy !== 0) {
      const dir = normalize(dx, dy);
      player.vx += dir.x * player.accel * dt;
      player.vy += dir.y * player.accel * dt;
      const currentSpeed = Math.sqrt(player.vx * player.vx + player.vy * player.vy);
      if (currentSpeed > speedCap) {
        const fix = speedCap / currentSpeed;
        player.vx *= fix;
        player.vy *= fix;
      }
      player.angle = Math.atan2(player.vy, player.vx);
    } else {
      player.vx *= 0.92;
      player.vy *= 0.92;
    }

    const target = this.findNearestEnemy(player);
    if (target) {
      player.turretAngle = angleTo(player, target);
    }
  }

  updateAi(unit, dt) {
    const target = this.findNearestEnemy(unit);
    const player = this.getPlayer();
    let moveTarget = target;

    if (unit.team === "ally" && player && distance(unit, player) > 170) {
      moveTarget = { x: player.x + unit.wander.x, y: player.y + unit.wander.y };
    }

    if (!moveTarget) {
      unit.vx *= 0.92;
      unit.vy *= 0.92;
      return;
    }

    const dir = normalize(moveTarget.x - unit.x, moveTarget.y - unit.y);
    const speedCap = unit.topSpeed * (unit.speedBoost > 0 ? 1.45 : 1) * (unit.teamBoost > 0 ? 1.2 : 1);
    unit.vx += dir.x * unit.accel * dt * 0.82;
    unit.vy += dir.y * unit.accel * dt * 0.82;
    const currentSpeed = Math.sqrt(unit.vx * unit.vx + unit.vy * unit.vy);
    if (currentSpeed > speedCap) {
      const fix = speedCap / currentSpeed;
      unit.vx *= fix;
      unit.vy *= fix;
    }

    if (target) {
      unit.turretAngle = angleTo(unit, target);
    }
    unit.angle = Math.atan2(unit.vy, unit.vx);
  }

  autoAttack(unit) {
    if (unit.fireCooldown > 0) {
      return;
    }
    const target = this.findNearestEnemy(unit);
    if (!target || distance(unit, target) > unit.range) {
      return;
    }

    this.spawnBullet(unit, unit.turretAngle, unit.damage, 400, 4, unit.team === "ally" ? "#b7f3ff" : "#ffb8b8");
    unit.fireCooldown = unit.fireRate * (unit.teamBoost > 0 ? 0.82 : 1);
  }

  trySkill(unit) {
    if (unit.skillCooldown > 0) {
      return false;
    }

    if (unit.roleId === "light") {
      unit.speedBoost = 2.2;
      unit.skillCooldown = unit.role.skillCd;
      this.addRing(unit.x, unit.y, 28, "#78e4ff");
      return true;
    }

    if (unit.roleId === "medium") {
      for (let i = -1; i <= 1; i += 1) {
        this.spawnBullet(unit, unit.turretAngle + i * 0.12, unit.damage * 0.95, 420, 4, "#baf6bb");
      }
      unit.skillCooldown = unit.role.skillCd;
      return true;
    }

    if (unit.roleId === "heavy") {
      unit.shield = Math.min(unit.maxHp * 0.7, unit.shield + 50);
      unit.skillCooldown = unit.role.skillCd;
      this.addRing(unit.x, unit.y, 36, "#ffd086");
      return true;
    }

    if (unit.roleId === "helper") {
      unit.healAura = 3.5;
      unit.skillCooldown = unit.role.skillCd;
      this.addRing(unit.x, unit.y, 42, "#dcb3ff");
      return true;
    }

    return false;
  }

  trySuper(unit) {
    if (unit.superCooldown > 0) {
      return false;
    }

    if (unit.roleId === "light") {
      for (let i = -2; i <= 2; i += 1) {
        this.spawnBullet(unit, unit.turretAngle + i * 0.08, unit.damage * 1.1, 460, 4, "#7fe8ff");
      }
      unit.superCooldown = unit.role.superCd;
      return true;
    }

    if (unit.roleId === "medium") {
      this.buffFriends(unit, 4.5, 160);
      unit.superCooldown = unit.role.superCd;
      this.showNotice("Medium tank used Team Boost.", 1.2);
      return true;
    }

    if (unit.roleId === "heavy") {
      this.blast(unit.x, unit.y, unit.team, 28, 105, "#ffbf6e");
      unit.superCooldown = unit.role.superCd;
      return true;
    }

    if (unit.roleId === "helper") {
      unit.shieldAura = 4.5;
      unit.superCooldown = unit.role.superCd;
      this.showNotice("Helper tank raised a team shield.", 1.2);
      return true;
    }

    return false;
  }

  buffFriends(unit, duration, radius) {
    for (let i = 0; i < this.units.length; i += 1) {
      const target = this.units[i];
      if (target.alive && target.team === unit.team && distance(unit, target) <= radius) {
        target.teamBoost = duration;
      }
    }
    this.addRing(unit.x, unit.y, radius * 0.45, "#98ffb5");
  }

  healFriends(unit, amount, radius) {
    for (let i = 0; i < this.units.length; i += 1) {
      const target = this.units[i];
      if (target.alive && target.team === unit.team && distance(unit, target) <= radius) {
        target.hp = Math.min(target.maxHp, target.hp + amount);
      }
    }
  }

  shieldFriends(unit, amount, radius) {
    for (let i = 0; i < this.units.length; i += 1) {
      const target = this.units[i];
      if (target.alive && target.team === unit.team && distance(unit, target) <= radius) {
        target.shield = Math.min(target.maxHp * 0.5, target.shield + amount);
      }
    }
  }

  spawnBullet(unit, angle, damage, speed, radius, color) {
    this.bullets.push({
      id: this.idSeed++,
      x: unit.x + Math.cos(angle) * (unit.radius + 8),
      y: unit.y + Math.sin(angle) * (unit.radius + 8),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      ttl: 1.8,
      damage,
      radius,
      color,
      team: unit.team
    });
  }

  updateBullets(dt) {
    for (let i = 0; i < this.bullets.length; i += 1) {
      const bullet = this.bullets[i];
      bullet.ttl -= dt;
      bullet.x += bullet.vx * dt;
      bullet.y += bullet.vy * dt;

      if (bullet.ttl <= 0) {
        bullet.dead = true;
        continue;
      }

      for (let j = 0; j < this.units.length; j += 1) {
        const unit = this.units[j];
        if (!unit.alive || unit.team === bullet.team) {
          continue;
        }
        if (distance(unit, bullet) <= unit.radius + bullet.radius) {
          this.hitUnit(unit, bullet.damage);
          this.addRing(bullet.x, bullet.y, 12, bullet.color);
          bullet.dead = true;
          break;
        }
      }
    }
    this.bullets = this.bullets.filter((item) => !item.dead);
  }

  hitUnit(unit, damage) {
    let remain = damage;
    if (unit.shield > 0) {
      const blocked = Math.min(unit.shield, remain);
      unit.shield -= blocked;
      remain -= blocked;
    }
    unit.hp -= remain;
    if (unit.hp <= 0) {
      unit.hp = 0;
      unit.alive = false;
      this.addRing(unit.x, unit.y, 26, unit.team === "ally" ? "#89e7ff" : "#ff9f7d");
    }
  }

  blast(x, y, team, damage, radius, color) {
    this.addRing(x, y, radius, color);
    for (let i = 0; i < this.units.length; i += 1) {
      const unit = this.units[i];
      if (!unit.alive || unit.team === team) {
        continue;
      }
      const d = Math.sqrt((unit.x - x) * (unit.x - x) + (unit.y - y) * (unit.y - y));
      if (d <= radius) {
        this.hitUnit(unit, damage * (1 - d / radius * 0.65));
      }
    }
  }

  updateEffects(dt) {
    for (let i = 0; i < this.effects.length; i += 1) {
      this.effects[i].ttl -= dt;
      this.effects[i].radius += dt * 45;
    }
    this.effects = this.effects.filter((item) => item.ttl > 0);
  }

  addRing(x, y, radius, color) {
    this.effects.push({
      x,
      y,
      radius,
      color,
      ttl: 0.34
    });
  }

  cleanupUnits() {
    const nextUnits = [];
    for (let i = 0; i < this.units.length; i += 1) {
      const unit = this.units[i];
      if (unit.alive) {
        nextUnits.push(unit);
      } else if (unit.isPlayer && this.status === "running") {
        this.status = "lost";
      }
    }
    this.units = nextUnits;
  }

  checkWinLose() {
    if (this.status !== "running") {
      return;
    }

    const allies = this.units.filter((unit) => unit.alive && unit.team === "ally");
    const enemies = this.units.filter((unit) => unit.alive && unit.team === "enemy");
    if (!allies.length) {
      this.status = "lost";
      return;
    }
    if (!enemies.length) {
      this.status = this.stageIndex >= STAGES.length - 1 ? "won" : "stage-clear";
    }
  }

  findNearestEnemy(unit) {
    let best = null;
    let bestDistance = Infinity;
    for (let i = 0; i < this.units.length; i += 1) {
      const target = this.units[i];
      if (!target.alive || target.team === unit.team) {
        continue;
      }
      const d = distance(unit, target);
      if (d < bestDistance) {
        bestDistance = d;
        best = target;
      }
    }
    return best;
  }

  showNotice(text, duration) {
    this.notice = text;
    this.noticeTime = duration || 1.5;
  }

  syncUi(force) {
    this.syncTimer += 0.016;
    if (!force && this.syncTimer < 0.12) {
      return;
    }
    this.syncTimer = 0;

    const role = ROLE_LIBRARY[this.roleIndex];
    const player = this.getPlayer();
    const stage = STAGES[this.stageIndex];

    let dialogTitle = "Big Map Tank Adventure";
    let dialogCopy = "A simple tank game prototype for kids. Move, auto aim, use one skill, and explore a very large map with your team.";
    let primaryButtonText = "Start";

    if (this.status === "stage-clear") {
      dialogTitle = "Stage Clear";
      dialogCopy = "Next stage has more enemies. Use skills and the big map.";
      primaryButtonText = "Next Stage";
    } else if (this.status === "won") {
      dialogTitle = "You Win";
      dialogCopy = "The first prototype loop is done. Next we can add bosses, treasure, and upgrades.";
      primaryButtonText = "Restart";
    } else if (this.status === "lost") {
      dialogTitle = "Try Again";
      dialogCopy = "No problem. Try another tank. Medium is easiest and heavy is safest.";
      primaryButtonText = "Retry";
    }

    this.onUiChange({
      status: this.status,
      chapterText: "Stage " + (this.stageIndex + 1) + " / " + STAGES.length,
      missionTitle: stage ? stage.name : "Tiny Tank World",
      missionHint: this.notice || (stage ? stage.mission : "Loading map"),
      allyCount: this.units.filter((unit) => unit.alive && unit.team === "ally").length,
      enemyCount: this.units.filter((unit) => unit.alive && unit.team === "enemy").length,
      playerHpText: player ? "HP " + Math.ceil(player.hp) + " / " + player.maxHp + (player.shield > 0 ? "  Shield " + Math.ceil(player.shield) : "") : "HP 0 / 0",
      mapButtonText: this.showOverview ? "Close Map" : "Map",
      roleName: role.name,
      roleSummary: role.summary,
      roleTip: role.tip,
      skillName: role.skillName,
      superName: role.superName,
      dialogTitle,
      dialogCopy,
      primaryButtonText
    });
  }

  worldToScreen(x, y) {
    return { x: x - this.camera.x, y: y - this.camera.y };
  }

  render() {
    const ctx = this.ctx;
    ctx.save();
    ctx.scale(this.dpr, this.dpr);
    ctx.clearRect(0, 0, this.viewWidth, this.viewHeight);

    this.drawGround(ctx);
    this.drawDecorations(ctx);
    if (this.base) {
      this.drawBases(ctx);
    }
    this.drawBullets(ctx);
    this.drawUnits(ctx);
    this.drawEffects(ctx);
    this.drawRadar(ctx);
    if (this.showOverview) {
      this.drawOverview(ctx);
    }
    if (this.stageBanner > 0) {
      this.drawBanner(ctx);
    }
    ctx.restore();
  }

  drawGround(ctx) {
    ctx.fillStyle = "#08121c";
    ctx.fillRect(0, 0, this.viewWidth, this.viewHeight);
    const cell = 90;
    const startX = -((this.camera.x % cell) + cell);
    const startY = -((this.camera.y % cell) + cell);
    for (let x = startX; x < this.viewWidth + cell; x += cell) {
      for (let y = startY; y < this.viewHeight + cell; y += cell) {
        const tone = (Math.floor((x + this.camera.x) / cell) + Math.floor((y + this.camera.y) / cell)) % 2 === 0 ? "#0d1825" : "#0b1420";
        ctx.fillStyle = tone;
        ctx.fillRect(x, y, cell, cell);
      }
    }
  }

  drawDecorations(ctx) {
    for (let i = 0; i < this.decorations.length; i += 1) {
      const item = this.decorations[i];
      const screen = this.worldToScreen(item.x, item.y);
      if (screen.x < -60 || screen.x > this.viewWidth + 60 || screen.y < -60 || screen.y > this.viewHeight + 60) {
        continue;
      }
      ctx.fillStyle = item.type === "tree" ? "#29553a" : "#425263";
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, item.size * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawBases(ctx) {
    const ally = this.worldToScreen(this.base.ally.x, this.base.ally.y);
    const enemy = this.worldToScreen(this.base.enemy.x, this.base.enemy.y);
    ctx.fillStyle = "#1f4a58";
    ctx.fillRect(ally.x - 36, ally.y - 36, 72, 72);
    ctx.fillStyle = "#6fcff0";
    ctx.fillRect(ally.x - 18, ally.y - 18, 36, 36);
    ctx.fillStyle = "#5a2626";
    ctx.fillRect(enemy.x - 42, enemy.y - 42, 84, 84);
    ctx.fillStyle = "#ff8c7e";
    ctx.fillRect(enemy.x - 20, enemy.y - 20, 40, 40);
  }

  drawUnits(ctx) {
    for (let i = 0; i < this.units.length; i += 1) {
      const unit = this.units[i];
      if (!unit.alive) {
        continue;
      }
      const screen = this.worldToScreen(unit.x, unit.y);
      if (screen.x < -80 || screen.x > this.viewWidth + 80 || screen.y < -80 || screen.y > this.viewHeight + 80) {
        continue;
      }
      ctx.save();
      ctx.translate(screen.x, screen.y);
      ctx.rotate(unit.angle);
      ctx.fillStyle = unit.team === "ally" ? unit.role.color : "#bf6262";
      ctx.fillRect(-unit.radius, -unit.radius + 4, unit.radius * 2, unit.radius * 2 - 8);
      ctx.fillStyle = "#dff5ff";
      ctx.fillRect(-8, -8, 16, 16);
      ctx.fillStyle = unit.team === "ally" ? "#f5fbff" : "#ffe4e4";
      ctx.fillRect(0, -3, unit.radius + 12, 6);
      ctx.restore();

      const hpWidth = 42;
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(screen.x - hpWidth / 2, screen.y - unit.radius - 15, hpWidth, 5);
      ctx.fillStyle = unit.team === "ally" ? "#7ceaff" : "#ff8a8a";
      ctx.fillRect(screen.x - hpWidth / 2, screen.y - unit.radius - 15, hpWidth * (unit.hp / unit.maxHp), 5);
      if (unit.shield > 0) {
        ctx.fillStyle = "#ffe08f";
        ctx.fillRect(screen.x - hpWidth / 2, screen.y - unit.radius - 8, hpWidth * Math.min(1, unit.shield / (unit.maxHp * 0.7)), 4);
      }
    }
  }

  drawBullets(ctx) {
    for (let i = 0; i < this.bullets.length; i += 1) {
      const bullet = this.bullets[i];
      const screen = this.worldToScreen(bullet.x, bullet.y);
      ctx.fillStyle = bullet.color;
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, bullet.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawEffects(ctx) {
    for (let i = 0; i < this.effects.length; i += 1) {
      const effect = this.effects[i];
      const screen = this.worldToScreen(effect.x, effect.y);
      ctx.strokeStyle = effect.color;
      ctx.globalAlpha = Math.max(0, effect.ttl / 0.34);
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, effect.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  drawRadar(ctx) {
    const width = 158;
    const height = 116;
    const x = this.viewWidth - width - 24;
    const y = 24;
    ctx.fillStyle = "rgba(3, 8, 15, 0.82)";
    ctx.fillRect(x, y, width, height);
    ctx.strokeStyle = "rgba(167, 214, 255, 0.22)";
    ctx.strokeRect(x, y, width, height);

    for (let i = 0; i < this.units.length; i += 1) {
      const unit = this.units[i];
      if (!unit.alive) {
        continue;
      }
      ctx.fillStyle = unit.team === "ally" ? "#86ecff" : "#ff9494";
      ctx.fillRect(x + unit.x / this.worldWidth * width - 2, y + unit.y / this.worldHeight * height - 2, 4, 4);
    }

    ctx.strokeStyle = "#ffe184";
    ctx.strokeRect(
      x + this.camera.x / this.worldWidth * width,
      y + this.camera.y / this.worldHeight * height,
      this.viewWidth / this.worldWidth * width,
      this.viewHeight / this.worldHeight * height
    );

    ctx.fillStyle = "#b3c8dd";
    ctx.font = "13px sans-serif";
    ctx.fillText("Radar", x + 10, y + height - 8);
  }

  drawOverview(ctx) {
    const x = 28;
    const y = 80;
    const width = this.viewWidth - 56;
    const height = this.viewHeight - 120;
    ctx.fillStyle = "rgba(3, 8, 15, 0.9)";
    ctx.fillRect(x, y, width, height);
    ctx.strokeStyle = "rgba(170, 215, 255, 0.22)";
    ctx.strokeRect(x, y, width, height);

    for (let i = 0; i < this.decorations.length; i += 1) {
      const item = this.decorations[i];
      ctx.fillStyle = item.type === "tree" ? "rgba(56, 126, 83, 0.45)" : "rgba(110, 132, 152, 0.45)";
      ctx.beginPath();
      ctx.arc(x + item.x / this.worldWidth * width, y + item.y / this.worldHeight * height, Math.max(2, item.size / 9), 0, Math.PI * 2);
      ctx.fill();
    }

    for (let i = 0; i < this.units.length; i += 1) {
      const unit = this.units[i];
      if (!unit.alive) {
        continue;
      }
      ctx.fillStyle = unit.team === "ally" ? "#89ebff" : "#ff9c9c";
      ctx.beginPath();
      ctx.arc(x + unit.x / this.worldWidth * width, y + unit.y / this.worldHeight * height, unit.isPlayer ? 6 : 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = "#ffe28a";
    ctx.strokeRect(
      x + this.camera.x / this.worldWidth * width,
      y + this.camera.y / this.worldHeight * height,
      this.viewWidth / this.worldWidth * width,
      this.viewHeight / this.worldHeight * height
    );

    ctx.fillStyle = "#edf7ff";
    ctx.font = "20px sans-serif";
    ctx.fillText("World Map", x + 18, y + 28);
    ctx.font = "14px sans-serif";
    ctx.fillStyle = "#9bb5ce";
    ctx.fillText("The map is about 5 x 4 screens. The yellow box is your current view.", x + 18, y + 54);
  }

  drawBanner(ctx) {
    const stage = STAGES[this.stageIndex];
    ctx.fillStyle = "rgba(5, 11, 18, 0.84)";
    ctx.fillRect(this.viewWidth * 0.5 - 180, 100, 360, 82);
    ctx.strokeStyle = "rgba(171, 216, 255, 0.2)";
    ctx.strokeRect(this.viewWidth * 0.5 - 180, 100, 360, 82);
    ctx.fillStyle = "#eef7ff";
    ctx.textAlign = "center";
    ctx.font = "24px sans-serif";
    ctx.fillText(stage.name, this.viewWidth * 0.5, 132);
    ctx.font = "14px sans-serif";
    ctx.fillStyle = "#acc2d8";
    ctx.fillText(stage.mission, this.viewWidth * 0.5, 156);
    ctx.textAlign = "left";
  }
}

module.exports = {
  ROLE_LIBRARY,
  TinyTankWorld
};
