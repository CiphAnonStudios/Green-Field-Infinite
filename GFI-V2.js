(() => {
  if (window.__wasdBlockCleanup) window.__wasdBlockCleanup();

  const size = 40;
  const speed = 300;
  const bulletSpeed = 500;

  let level = 1;

  // ⭐ NEW SYSTEMS (SAFE ADDITIONS)
  let xp = 0;
  let xpToNext = 10;
  let coins = 0;

  // Score counter
  let score = 0;
  const scoreDisplay = document.createElement('div');
  Object.assign(scoreDisplay.style, {
    position: 'fixed',
    top: '10px',
    left: '10px',
    color: 'white',
    fontSize: '20px',
    fontFamily: 'sans-serif',
    zIndex: 2147483651,
    textShadow: '0 0 4px black'
  });
  scoreDisplay.textContent = `Score: ${score}`;
  document.body.appendChild(scoreDisplay);

  // ⭐ XP DISPLAY (NEW)
  const xpDisplay = document.createElement('div');
  Object.assign(xpDisplay.style, {
    position: 'fixed',
    top: '40px',
    left: '10px',
    color: 'white',
    fontSize: '16px',
    fontFamily: 'sans-serif',
    zIndex: 2147483651,
    textShadow: '0 0 4px black'
  });
  xpDisplay.textContent = `XP: ${xp}/${xpToNext} | Level: ${level}`;
  document.body.appendChild(xpDisplay);

  // Background block 🟩
  const bgBlock = document.createElement('div');
  Object.assign(bgBlock.style, {
    position: 'fixed',
    left: '0px',
    top: '0px',
    width: '10000px',
    height: '10000px',
    background: 'green',
    zIndex: 2147483645,
    pointerEvents: 'auto',
  });
  document.body.appendChild(bgBlock);

  // player ⬜️
  const block = document.createElement('div');
  block.id = 'block';
  Object.assign(block.style, {
    position: 'fixed',
    left: '200px',
    top: '150px',
    width: size + 'px',
    height: size + 'px',
    background: 'tan',
    border: '2px solid black',
    borderRadius: '6px',
    boxShadow: '0 6px 16px rgba(0,0,0,.35)',
    zIndex: 2147483647,
    pointerEvents: 'none',
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  });

  const textSpan = document.createElement('span');
  textSpan.innerText = "| |";
  textSpan.style.color = "black";
  textSpan.style.fontSize = "14px";
  textSpan.style.fontFamily = "sans-serif";
  textSpan.style.position = "relative";
  textSpan.style.webkitTextStroke = "2px black";
  block.appendChild(textSpan);
  document.body.appendChild(block);

  let x = window.innerWidth / 2 - size / 2;
  let y = window.innerHeight / 2 - size / 2;
  block.style.left = x + 'px';
  block.style.top = y + 'px';

  const keys = new Set();
  const bullets = [];
  const enemies = [];

  let raf = null;
  let last = performance.now();
  let paused = false;

  const onKeyUp = (e) => keys.delete(e.key.toLowerCase());

  const onClick = (e) => {
    if (paused) return;
    const rect = block.getBoundingClientRect();
    const bx = rect.left + size / 2;
    const by = rect.top + size / 2;
    const dx = e.clientX - bx;
    const dy = e.clientY - by;
    const len = Math.hypot(dx, dy);
    if (len === 0) return;
    const dirX = dx / len;
    const dirY = dy / len;

    const bullet = document.createElement('div');
    Object.assign(bullet.style, {
      position: 'fixed',
      left: bx - 5 + 'px',
      top: by - 5 + 'px',
      width: '10px',
      height: '10px',
      background: 'yellow',
      borderRadius: '50%',
      border: '2px solid black',
      boxShadow: '0 6px 16px rgba(255, 255, 0, 1)',
      zIndex: 2147483646,
      pointerEvents: 'none',
    });
    document.body.appendChild(bullet);

    bullets.push({ el: bullet, x: bx - 5, y: by - 5, dx: dirX, dy: dirY });
  };

  function spawnEnemy() {
    const types = ['Zombie', 'Tank', 'Speedy'];
    if (score >= 50) types.push('Ghost');
    if (score >= 100) types.push('Leech');

    const type = types[Math.floor(Math.random() * types.length)];
    const enemy = document.createElement('div');

    Object.assign(enemy.style, {
      position: 'fixed',
      width: size + 'px',
      height: size + 'px',
      border: '2px solid black',
      borderRadius: '6px',
      boxShadow: '0 6px 16px rgba(0,0,0,.35)',
      pointerEvents: 'none'
    });

    enemy.hp = 1;
    enemy.speed = 100;
    enemy.type = type;

    if (type === 'Zombie') enemy.style.background = 'green';
    if (type === 'Tank') { enemy.style.background = 'darkred'; enemy.hp = 5; enemy.speed = 75; }
    if (type === 'Speedy') { enemy.style.background = 'blue'; enemy.speed = 250; }
    if (type === 'Ghost') { enemy.style.background = 'white'; enemy.style.opacity = .1; enemy.hp = 2; enemy.speed = 200; enemy.immunityChance = 0.8; }
    if (type === 'Leech') { enemy.style.background = '#636B2F'; enemy.speed = 400; enemy.style.width = "15px"; enemy.style.height = "15px"; }

    const side = Math.floor(Math.random() * 4);
    let ex, ey;
    if (side === 0) { ex = -size; ey = Math.random() * window.innerHeight; }
    if (side === 1) { ex = window.innerWidth + size; ey = Math.random() * window.innerHeight; }
    if (side === 2) { ex = Math.random() * window.innerWidth; ey = -size; }
    if (side === 3) { ex = Math.random() * window.innerHeight; ey = window.innerHeight + size; }

    enemy.x = ex;
    enemy.y = ey;

    enemy.style.left = ex + 'px';
    enemy.style.top = ey + 'px';
    document.body.appendChild(enemy);
    enemies.push(enemy);
  }

  function popEffect(el) {
    el.style.transition = "transform 0.1s ease";
    el.style.transform = "scale(1.3)";
    setTimeout(() => el.style.transform = "scale(1)", 100);
  }

  let spawnTimer = 0;

  function loop(t) {
    if (paused) return;
    const dt = Math.min(0.05, (t - last) / 1000);
    last = t;

    spawnTimer += dt;
    if (spawnTimer >= 1.5) {
      spawnEnemy();
      spawnTimer = 0;
    }

    let dx = 0, dy = 0;
    if (keys.has('w')) dy -= 1;
    if (keys.has('s')) dy += 1;
    if (keys.has('a')) dx -= 1;
    if (keys.has('d')) dx += 1;

    if (dx || dy) {
      const len = Math.hypot(dx, dy);
      dx /= len; dy /= len;
      x += dx * speed * dt;
      y += dy * speed * dt;
      x = Math.max(0, Math.min(x, window.innerWidth - size));
      y = Math.max(0, Math.min(y, window.innerHeight - size));
      block.style.left = x + 'px';
      block.style.top = y + 'px';
    }

    textSpan.style.left = (keys.has('a') ? -5 : keys.has('d') ? 5 : 0) + "px";
    textSpan.style.top = (keys.has('w') ? -5 : keys.has('s') ? 5 : 0) + "px";

    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.x += b.dx * bulletSpeed * dt;
      b.y += b.dy * bulletSpeed * dt;
      b.el.style.left = b.x + 'px';
      b.el.style.top = b.y + 'px';
    }

    const playerRect = block.getBoundingClientRect();

    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];

      const dx = playerRect.left - e.x;
      const dy = playerRect.top - e.y;
      const len = Math.hypot(dx, dy);

      e.x += (dx / len) * e.speed * dt;
      e.y += (dy / len) * e.speed * dt;

      e.style.left = e.x + 'px';
      e.style.top = e.y + 'px';

      for (let j = bullets.length - 1; j >= 0; j--) {
        const b = bullets[j];

        const br = b.el.getBoundingClientRect();
        const er = e.getBoundingClientRect();

        if (br.left < er.right && br.right > er.left && br.top < er.bottom && br.bottom > er.top) {

          if (e.type === 'Ghost' && Math.random() < 0.8) continue;

          popEffect(e);

          e.hp--;
          b.el.remove();
          bullets.splice(j, 1);

          if (e.hp <= 0) {
            e.remove();
            enemies.splice(i, 1);

            // ⭐ NEW SYSTEMS ADDED HERE
            score++;
            xp += 5;
            coins += 1;

            scoreDisplay.textContent = `Score: ${score}`;
            xpDisplay.textContent = `XP: ${xp}/${xpToNext} | Level: ${level}`;

            if (xp >= xpToNext) {
              xp -= xpToNext;
              xpToNext = Math.floor(xpToNext * 1.5);
              level++;

              const lvl = document.createElement('div');
              lvl.textContent = "LEVEL UP!";
              Object.assign(lvl.style, {
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%,-50%)',
                fontSize: '40px',
                color: 'yellow',
                zIndex: 999999
              });

              document.body.appendChild(lvl);
              setTimeout(() => lvl.remove(), 800);
            }
          }

          break;
        }
      }
    }

    raf = requestAnimationFrame(loop);
  }

  const onKeyDown = (e) => {
    const k = e.key.toLowerCase();
    keys.add(k);
  };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('click', onClick);
  raf = requestAnimationFrame(loop);

  // ⭐ SAFE SHOP (does NOT break speed or game)
  function openShop() {
    const shop = document.createElement('div');
    Object.assign(shop.style, {
      position: 'fixed',
      width: '100%',
      height: '100%',
      background: 'darkgreen',
      zIndex: 9999999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white'
    });

    const title = document.createElement('h1');
    title.textContent = "SHOP";
    shop.appendChild(title);

    const coinText = document.createElement('div');
    coinText.textContent = `Coins: ${coins}`;
    shop.appendChild(coinText);

    const close = document.createElement('button');
    close.textContent = "Close";
    close.onclick = () => shop.remove();
    shop.appendChild(close);

    document.body.appendChild(shop);
  }

  window.__openShop = openShop;

})();