const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const healthFill = document.getElementById('healthFill');
const manaFill = document.getElementById('manaFill');
const formName = document.getElementById('formName');
const statusText = document.getElementById('statusText');

const world = {
  width: 1800,
  height: 1800,
};

const keys = {};
const ui = {
  joystick: {
    base: document.getElementById('joystickBase'),
    knob: document.getElementById('joystickKnob'),
    active: false,
    startX: 0,
    startY: 0,
    dx: 0,
    dy: 0,
  },
};

const FORMS = {
  thien: {
    name: 'Thần — Thiên Kiếm Vô Khuyết',
    heroColor: '#e0f2fe',
    accent: '#facc15',
    speed: 280,
    attackDamage: 18,
    attackRange: 150,
    attackCooldown: 0.52,
    skill1: 'Lạc Kiếm',
    skill2: 'Vô Khuyết',
    ult: 'Thiên Kiếm',
  },
  ma: {
    name: 'Ma — Huyết Kiếm Cuồng Tận',
    heroColor: '#fca5a5',
    accent: '#ef4444',
    speed: 300,
    attackDamage: 22,
    attackRange: 140,
    attackCooldown: 0.42,
    skill1: 'Đoạt Huyết',
    skill2: 'Cuồng Chém',
    ult: 'Huyết Tận',
  },
  song: {
    name: 'Song Mệnh — Quy Nhất',
    heroColor: '#c4b5fd',
    accent: '#f9a8d4',
    speed: 310,
    attackDamage: 24,
    attackRange: 160,
    attackCooldown: 0.38,
    skill1: 'Lưỡng Mệnh',
    skill2: 'Vân Hồn',
    ult: 'Biến Hình',
  },
};

const game = {
  state: 'playing',
  lastTs: 0,
  particles: [],
  player: null,
  enemies: [],
  camera: { x: 0, y: 0 },
  time: 0,
};

function resizeCanvas() {
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.floor(window.innerWidth * ratio);
  canvas.height = Math.floor(window.innerHeight * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function normalizeAngle(angle) {
  let a = angle;
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

function createPlayer() {
  return {
    x: world.width / 2,
    y: world.height / 2,
    radius: 22,
    maxHp: 190,
    hp: 190,
    maxMana: 100,
    mana: 100,
    facing: 0,
    form: 'thien',
    speed: FORMS.thien.speed,
    attackCooldown: 0,
    invuln: 0,
    transformTimer: 0,
    damageFlash: 0,
    skillCooldowns: {
      skill1: 0,
      skill2: 0,
      ult: 0,
    },
    formUnlocked: {
      thien: true,
      ma: true,
      song: true,
    },
  };
}

function createEnemy(x, y, type = 'minion') {
  const palette = [
    { body: '#ef4444', accent: '#fca5a5' },
    { body: '#f59e0b', accent: '#fcd34d' },
    { body: '#a78bfa', accent: '#ddd6fe' },
  ];
  const colorSet = palette[Math.floor(Math.random() * palette.length)];

  return {
    x,
    y,
    radius: 18,
    hp: 75,
    maxHp: 75,
    hitCooldown: 0,
    attackCooldown: 0,
    color: colorSet.body,
    accent: colorSet.accent,
    type,
    facing: 0,
  };
}

function spawnEnemies() {
  const count = 7;
  game.enemies = [];
  const positions = [
    { x: 220, y: 220 },
    { x: 1360, y: 260 },
    { x: 1500, y: 860 },
    { x: 1200, y: 1380 },
    { x: 320, y: 1420 },
    { x: 500, y: 980 },
    { x: 950, y: 430 },
  ];

  for (let i = 0; i < count; i += 1) {
    const p = positions[i] || {
      x: 200 + Math.random() * 1400,
      y: 220 + Math.random() * 1200,
    };
    game.enemies.push(createEnemy(p.x, p.y, i === 0 ? 'brute' : 'minion'));
  }
}

function setForm(formKey) {
  if (!game.player.formUnlocked[formKey]) return;
  game.player.form = formKey;
  const form = FORMS[formKey];
  game.player.speed = form.speed;
  formName.textContent = form.name;
  statusText.textContent = `${form.skill1} / ${form.skill2} / ${form.ult} sẵn sàng`;
  const buttons = [...document.querySelectorAll('[data-form]')];
  buttons.forEach((button) => {
    button.classList.toggle('active', button.dataset.form === formKey);
  });
}

function updateHUD() {
  const player = game.player;
  const healthPercent = (player.hp / player.maxHp) * 100;
  const manaPercent = (player.mana / player.maxMana) * 100;
  healthFill.style.width = `${healthPercent}%`;
  manaFill.style.width = `${manaPercent}%`;
}

function updateCamera() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  game.camera.x = clamp(game.player.x - width / 2, 0, world.width - width);
  game.camera.y = clamp(game.player.y - height / 2, 0, world.height - height);
}

function addParticles(x, y, color, amount = 10) {
  for (let i = 0; i < amount; i += 1) {
    game.particles.push({
      x,
      y,
      dx: (Math.random() - 0.5) * 120,
      dy: (Math.random() - 0.5) * 120,
      life: 0.45 + Math.random() * 0.35,
      color,
      radius: 2 + Math.random() * 3,
    });
  }
}

function triggerAttack() {
  if (game.state !== 'playing') return;
  const player = game.player;
  if (player.attackCooldown > 0) return;

  player.attackCooldown = FORMS[player.form].attackCooldown;
  const damage = FORMS[player.form].attackDamage + (player.transformTimer > 0 ? 8 : 0);
  const range = FORMS[player.form].attackRange;
  let hitCount = 0;

  for (const enemy of game.enemies) {
    const dx = enemy.x - player.x;
    const dy = enemy.y - player.y;
    const dist = Math.hypot(dx, dy);
    const angleToEnemy = Math.atan2(dy, dx);
    const angleDelta = Math.abs(normalizeAngle(angleToEnemy - player.facing));

    if (dist <= range && angleDelta < Math.PI / 2.6) {
      enemy.hp -= damage;
      enemy.hitCooldown = 0.18;
      player.mana = clamp(player.mana + 6, 0, player.maxMana);
      hitCount += 1;
      addParticles(enemy.x, enemy.y, FORMS[player.form].accent, 10);
      if (enemy.hp <= 0) {
        addParticles(enemy.x, enemy.y, '#fef3c7', 18);
      }
    }
  }

  if (hitCount > 0) {
    statusText.textContent = `${FORMS[player.form].name} đã đánh trúng ${hitCount} mục tiêu`;
  } else {
    statusText.textContent = 'Tấn công hụt mục tiêu';
  }
}

function castSkill(slot) {
  if (game.state !== 'playing') return;
  const player = game.player;
  const form = FORMS[player.form];
  const cooldown = player.skillCooldowns[slot];
  if (cooldown > 0) return;

  if (player.mana < 20) {
    statusText.textContent = 'Mana không đủ';
    return;
  }

  player.mana = clamp(player.mana - 20, 0, player.maxMana);
  player.skillCooldowns[slot] = slot === 'ult' ? 9 : 4;

  if (player.form === 'thien') {
    if (slot === 'skill1') {
      player.x += Math.cos(player.facing) * 90;
      player.y += Math.sin(player.facing) * 90;
      for (const enemy of game.enemies) {
        const dist = distance(player, enemy);
        if (dist < 150) {
          enemy.hp -= 36;
          addParticles(enemy.x, enemy.y, '#fef9c3', 14);
        }
      }
      statusText.textContent = 'Thiên kiếm lướt qua, mục tiêu bị chém lệch';
    }

    if (slot === 'skill2') {
      for (const enemy of game.enemies) {
        const dist = distance(player, enemy);
        if (dist < 200) {
          enemy.hp -= 42;
          addParticles(enemy.x, enemy.y, '#e0f2fe', 16);
        }
      }
      statusText.textContent = 'Vô Khuyết mở ra không gian đánh khu vực';
    }

    if (slot === 'ult') {
      for (const enemy of game.enemies) {
        const dist = distance(player, enemy);
        if (dist < 420) {
          enemy.hp -= 60;
          addParticles(enemy.x, enemy.y, '#facc15', 18);
        }
      }
      statusText.textContent = 'Thiên kiếm bừng sáng, đánh xa cực mạnh';
    }
  }

  if (player.form === 'ma') {
    if (slot === 'skill1') {
      for (const enemy of game.enemies) {
        const dist = distance(player, enemy);
        if (dist < 170) {
          enemy.hp -= 32;
          addParticles(enemy.x, enemy.y, '#fecaca', 14);
        }
      }
      statusText.textContent = 'Ma kiếm quét nhanh, combo bùng nổ';
    }

    if (slot === 'skill2') {
      for (const enemy of game.enemies) {
        const dist = distance(player, enemy);
        if (dist < 210) {
          enemy.hp -= 46;
          addParticles(enemy.x, enemy.y, '#f87171', 18);
        }
      }
      statusText.textContent = 'Huyết kiếm cuồng loạn, thương tổn lan rộng';
    }

    if (slot === 'ult') {
      player.transformTimer = 4.5;
      for (const enemy of game.enemies) {
        const dist = distance(player, enemy);
        if (dist < 260) {
          enemy.hp -= 72;
          addParticles(enemy.x, enemy.y, '#dc2626', 20);
        }
      }
      statusText.textContent = 'Huyết kiếm cuồng tận, đòn đánh cực đại';
    }
  }

  if (player.form === 'song') {
    if (slot === 'skill1') {
      player.x += Math.cos(player.facing) * 120;
      player.y += Math.sin(player.facing) * 120;
      for (const enemy of game.enemies) {
        const dist = distance(player, enemy);
        if (dist < 180) {
          enemy.hp -= 38;
          addParticles(enemy.x, enemy.y, '#ddd6fe', 14);
        }
      }
      statusText.textContent = 'Lưỡng mệnh bứt ra, dịch chuyển trong nháy mắt';
    }

    if (slot === 'skill2') {
      for (const enemy of game.enemies) {
        const dist = distance(player, enemy);
        if (dist < 210) {
          enemy.hp -= 40;
          addParticles(enemy.x, enemy.y, '#c4b5fd', 16);
        }
      }
      statusText.textContent = 'Song mệnh nối combo, đòn đánh sắc bén';
    }

    if (slot === 'ult') {
      player.transformTimer = 5.2;
      for (const enemy of game.enemies) {
        const dist = distance(player, enemy);
        if (dist < 260) {
          enemy.hp -= 80;
          addParticles(enemy.x, enemy.y, '#f9a8d4', 22);
        }
      }
      statusText.textContent = 'Biến hình Song Mệnh, chiến lực tăng mạnh';
    }
  }
}

function updatePlayer(dt) {
  const player = game.player;
  let moveX = 0;
  let moveY = 0;

  if (keys['w'] || keys['arrowup']) moveY -= 1;
  if (keys['s'] || keys['arrowdown']) moveY += 1;
  if (keys['a'] || keys['arrowleft']) moveX -= 1;
  if (keys['d'] || keys['arrowright']) moveX += 1;

  const joystick = ui.joystick;
  if (joystick.active) {
    moveX += joystick.dx;
    moveY += joystick.dy;
  }

  const moveLen = Math.hypot(moveX, moveY);
  if (moveLen > 0) {
    moveX /= moveLen;
    moveY /= moveLen;
    const speed = player.speed * (player.transformTimer > 0 ? 1.1 : 1);
    player.x += moveX * speed * dt;
    player.y += moveY * speed * dt;
    player.facing = Math.atan2(moveY, moveX);
  }

  player.x = clamp(player.x, player.radius, world.width - player.radius);
  player.y = clamp(player.y, player.radius, world.height - player.radius);

  player.attackCooldown = Math.max(0, player.attackCooldown - dt);
  player.invuln = Math.max(0, player.invuln - dt);
  player.transformTimer = Math.max(0, player.transformTimer - dt);
  player.damageFlash = Math.max(0, player.damageFlash - dt);
  player.mana = clamp(player.mana + dt * 9, 0, player.maxMana);

  Object.keys(player.skillCooldowns).forEach((key) => {
    player.skillCooldowns[key] = Math.max(0, player.skillCooldowns[key] - dt);
  });
}

function updateEnemies(dt) {
  for (const enemy of game.enemies) {
    if (enemy.hp <= 0) continue;

    enemy.attackCooldown = Math.max(0, enemy.attackCooldown - dt);
    enemy.hitCooldown = Math.max(0, enemy.hitCooldown - dt);

    const dx = game.player.x - enemy.x;
    const dy = game.player.y - enemy.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 0.0001) {
      enemy.facing = Math.atan2(dy, dx);
    }

    if (dist < 500) {
      const step = 80 * dt;
      enemy.x += (dx / dist) * step;
      enemy.y += (dy / dist) * step;
    }

    if (dist < enemy.radius + game.player.radius + 12 && enemy.attackCooldown <= 0) {
      const damage = 10 + ((game.player.form === 'ma') ? 2 : 0);
      game.player.hp -= damage;
      game.player.invuln = 0.35;
      game.player.damageFlash = 0.2;
      enemy.attackCooldown = 0.9;
      addParticles(game.player.x, game.player.y, '#fca5a5', 12);
      statusText.textContent = `Người chơi nhận ${damage} sát thương từ quái`;
    }
  }
}

function resolveCombat() {
  const livingEnemies = [];
  for (const enemy of game.enemies) {
    if (enemy.hp > 0) livingEnemies.push(enemy);
    else {
      addParticles(enemy.x, enemy.y, '#f8fafc', 12);
    }
  }
  game.enemies = livingEnemies;

  if (game.player.hp <= 0) {
    game.state = 'lost';
    statusText.textContent = 'Thua trận — bấm F5 hoặc nhấn nút khởi động lại';
  }

  if (game.enemies.length === 0) {
    game.state = 'won';
    statusText.textContent = 'Chiến thắng! Dạ Vô Cực đã áp chế toàn bộ tuyến địch';
  }
}

function updateParticles(dt) {
  for (let i = game.particles.length - 1; i >= 0; i -= 1) {
    const particle = game.particles[i];
    particle.x += particle.dx * dt;
    particle.y += particle.dy * dt;
    particle.life -= dt;
    if (particle.life <= 0) {
      game.particles.splice(i, 1);
    }
  }
}

function handleActions() {
  document.getElementById('attackBtn').addEventListener('pointerdown', (event) => {
    event.preventDefault();
    triggerAttack();
  });

  document.getElementById('skill1Btn').addEventListener('pointerdown', (event) => {
    event.preventDefault();
    castSkill('skill1');
  });

  document.getElementById('skill2Btn').addEventListener('pointerdown', (event) => {
    event.preventDefault();
    castSkill('skill2');
  });

  document.getElementById('ultBtn').addEventListener('pointerdown', (event) => {
    event.preventDefault();
    castSkill('ult');
  });

  document.querySelectorAll('[data-form]').forEach((button) => {
    button.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      setForm(button.dataset.form);
    });
  });
}

function setupJoystick() {
  const base = ui.joystick.base;
  const knob = ui.joystick.knob;

  function updateKnob(clientX, clientY) {
    const rect = base.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const maxDistance = rect.width * 0.32;
    const distance = Math.min(Math.hypot(dx, dy), maxDistance);
    const angle = Math.atan2(dy, dx);
    ui.joystick.dx = Math.cos(angle) * (distance / maxDistance);
    ui.joystick.dy = Math.sin(angle) * (distance / maxDistance);
    knob.style.left = `${50 + (Math.cos(angle) * distance) / maxDistance * 100 / 2}%`;
    knob.style.top = `${50 + (Math.sin(angle) * distance) / maxDistance * 100 / 2}%`;
  }

  base.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    ui.joystick.active = true;
    updateKnob(event.clientX, event.clientY);
  });

  base.addEventListener('pointermove', (event) => {
    if (!ui.joystick.active) return;
    updateKnob(event.clientX, event.clientY);
  });

  const release = () => {
    ui.joystick.active = false;
    ui.joystick.dx = 0;
    ui.joystick.dy = 0;
    knob.style.left = '50%';
    knob.style.top = '50%';
  };

  base.addEventListener('pointerup', release);
  base.addEventListener('pointercancel', release);
  base.addEventListener('pointerleave', release);
}

function setupKeyboard() {
  window.addEventListener('keydown', (event) => {
    keys[event.key.toLowerCase()] = true;
    if (event.key === ' ') {
      event.preventDefault();
      triggerAttack();
    }
    if (event.key === '1') castSkill('skill1');
    if (event.key === '2') castSkill('skill2');
    if (event.key === '3') castSkill('ult');
    if (event.key === 'c') setForm('thien');
    if (event.key === 'v') setForm('ma');
    if (event.key === 'b') setForm('song');
  });

  window.addEventListener('keyup', (event) => {
    keys[event.key.toLowerCase()] = false;
  });
}

function renderArena() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const cameraX = game.camera.x;
  const cameraY = game.camera.y;

  ctx.clearRect(0, 0, width, height);

  ctx.fillStyle = '#08131f';
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.translate(-cameraX, -cameraY);

  ctx.fillStyle = '#11233a';
  ctx.fillRect(0, 0, world.width, world.height);

  for (let x = 0; x <= world.width; x += 80) {
    ctx.strokeStyle = 'rgba(125, 211, 252, 0.08)';
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, world.height);
    ctx.stroke();
  }

  for (let y = 0; y <= world.height; y += 80) {
    ctx.strokeStyle = 'rgba(125, 211, 252, 0.08)';
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(world.width, y);
    ctx.stroke();
  }

  const player = game.player;
  const form = FORMS[player.form];

  ctx.strokeStyle = 'rgba(160, 215, 255, 0.34)';
  ctx.strokeRect(18, 18, world.width - 36, world.height - 36);

  for (const enemy of game.enemies) {
    ctx.fillStyle = enemy.color;
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(enemy.x - 24, enemy.y - 30, 48, 6);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(enemy.x - 24, enemy.y - 30, (enemy.hp / enemy.maxHp) * 48, 6);
  }

  ctx.fillStyle = form.heroColor;
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = form.accent;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius + 5, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = '#f8fafc';
  ctx.beginPath();
  ctx.moveTo(player.x, player.y);
  ctx.lineTo(
    player.x + Math.cos(player.facing) * 36,
    player.y + Math.sin(player.facing) * 36,
  );
  ctx.stroke();

  for (const particle of game.particles) {
    ctx.fillStyle = particle.color;
    ctx.globalAlpha = Math.max(particle.life, 0.05);
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.restore();
}

function gameLoop(timestamp) {
  const dt = Math.min((timestamp - game.lastTs) / 1000 || 0.016, 0.033);
  game.lastTs = timestamp;

  if (game.state === 'playing') {
    updatePlayer(dt);
    updateEnemies(dt);
    resolveCombat();
    updateParticles(dt);
    updateCamera();
    updateHUD();
  }

  renderArena();
  requestAnimationFrame(gameLoop);
}

function init() {
  resizeCanvas();
  game.player = createPlayer();
  spawnEnemies();
  setForm('thien');
  setupKeyboard();
  setupJoystick();
  handleActions();
  updateCamera();
  updateHUD();
  requestAnimationFrame(gameLoop);
}

window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', resizeCanvas);

init();
