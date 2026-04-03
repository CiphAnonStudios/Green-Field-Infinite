(() => {
  if (window.__wasdBlockCleanup) window.__wasdBlockCleanup();

  const size = 40;
  const speed = 300;
  const bulletSpeed = 500;

  let level = 1;

  // Score counter
  let score = 0; // score
  const scoreDisplay = document.createElement('div');
  Object.assign(scoreDisplay.style, { //score style
    position: 'fixed',
    top: '10px',
    left: '10px',
    color: 'white',
    fontSize: '20px',
    fontFamily: 'sans-serif',
    zIndex: 2147483651, // Now above enemies!
    textShadow: '0 0 4px black'
  });
  scoreDisplay.textContent = `Score: ${score}`;
  document.body.appendChild(scoreDisplay);

  // Background block 🟩
  const bgBlock = document.createElement('div');
  Object.assign(bgBlock.style, { // background style
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
  Object.assign(block.style, { // player style
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

  // Text inside player
  const textSpan = document.createElement('span');
  textSpan.innerText = "| |";
  textSpan.style.color = "black";
  textSpan.style.fontSize = "14px";
  textSpan.style.fontFamily = "sans-serif";
  textSpan.style.position = "relative";
  textSpan.style.webkitTextStroke = "2px black";
  block.appendChild(textSpan);
  document.body.appendChild(block);

  // Start position (centered)
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

    // bullet
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
    if (score >= 50) { // Only spawn ghosts after score 50!
      types.push('Ghost');
    }
    if (score >= 100) {
      types.push('Leech');
    }
    const type = types[Math.floor(Math.random() * types.length)];
    const enemy = document.createElement('div');
    enemy.className = `enemy-${type}`;
    let enemyZIndex = 2147483648; // Default enemy z-index
    Object.assign(enemy.style, {
      position: 'fixed',
      width: size + 'px',
      height: size + 'px',
      border: '2px solid black',
      borderRadius: '6px',
      boxShadow: '0 6px 16px rgba(0,0,0,.35)',
      pointerEvents: 'none'
    });

    if (type === 'Zombie') { // zombie enemy
      enemy.style.background = 'rgba(0,100,0,1)';
      enemy.hp = 1;
      enemy.speed = 100;
      enemy.style.zIndex = enemyZIndex;
    }
    if (type === 'Tank') { // tank enemy
      enemy.style.background = 'darkred';
      enemy.style.width = "70px";
      enemy.style.height = "70px";
      enemy.hp = 5;
      enemy.speed = 75;
      enemy.style.zIndex = enemyZIndex;
    }
    if (type === 'Speedy') { // speedy enemy
      enemy.style.background = 'blue';
      enemy.style.width = "35px";
      enemy.style.height = "35px";
      enemy.hp = 1;
      enemy.speed = 250;
      enemy.style.zIndex = enemyZIndex;
    }
    if (type === 'Ghost') { // ghost enemy
      enemy.style.background = 'white';
      enemy.hp = 2;
      enemy.speed = 200;
      enemy.style.opacity = .1;
      enemy.immunityChance = 0.8; // 80% chance
      enemy.style.zIndex = 2147483646; // Lower than other enemies
    }
    if (type === 'Leech') { // leech enemy
      enemy.style.background = '#636B2F';
      enemy.hp = 1;
      enemy.style.width = "15px";
      enemy.style.height = "15px";
      enemy.speed = 400;
      enemy.style.zIndex = enemyZIndex;
    }
    // spawn outside screen
    const side = Math.floor(Math.random() * 4);
    let ex, ey;
    if (side === 0) { ex = -size; ey = Math.random() * window.innerHeight; }
    if (side === 1) { ex = window.innerWidth + size; ey = Math.random() * window.innerHeight; }
    if (side === 2) { ex = Math.random() * window.innerWidth; ey = -size; }
    if (side === 3) { ex = Math.random() * window.innerWidth; ey = window.innerHeight + size; }

    enemy.x = ex;
    enemy.y = ey;
    enemy.type = type;

    enemy.style.left = ex + 'px';
    enemy.style.top = ey + 'px';
    document.body.appendChild(enemy);
    enemies.push(enemy);
  }

  // Pop effect only for a hit!
  function popEffect(el) {
    el.style.transition = "transform 0.1s ease";
    el.style.transform = "scale(1.3)";
    setTimeout(() => {
      el.style.transform = "scale(1)";
    }, 100);
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

    // Player movement
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

    // Move text slightly based on keys
    let offsetX = 0, offsetY = 0;
    if (keys.has('w')) offsetY -= 5;
    if (keys.has('s')) offsetY += 5;
    if (keys.has('a')) offsetX -= 5;
    if (keys.has('d')) offsetX += 5;
    textSpan.style.left = offsetX + "px";
    textSpan.style.top = offsetY + "px";

    // Bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.x += b.dx * bulletSpeed * dt;
      b.y += b.dy * bulletSpeed * dt;
      b.el.style.left = b.x + 'px';
      b.el.style.top = b.y + 'px';
      if (b.x < -20 || b.y < -20 || b.x > window.innerWidth + 20 || b.y > window.innerHeight + 20) {
        b.el.remove();
        bullets.splice(i, 1);
      }
    }

    // Enemies
    const playerRect = block.getBoundingClientRect();
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      const dx = playerRect.left - e.x;
      const dy = playerRect.top - e.y;
      const len = Math.hypot(dx, dy);
      const vx = (dx / len) * e.speed * dt;
      const vy = (dy / len) * e.speed * dt;

      e.x += vx;
      e.y += vy;
      e.style.left = e.x + 'px';
      e.style.top = e.y + 'px';

      // Collision with player
      const er = e.getBoundingClientRect();
      if (er.left < playerRect.right &&
          er.right > playerRect.left &&
          er.top < playerRect.bottom &&
          er.bottom > playerRect.top) {

        paused = true;
        cancelAnimationFrame(raf);

        // Make a full-screen overlay (Game Over page)
        const gameOverScreen = document.createElement('div');

        // Create a new <img> element
const newLogoImage = document.createElement("img");

// Set the source of the image file
newLogoImage.src = "GreenField Infinite title.png";

// Set alternative text for screen readers
newLogoImage.alt = "A descriptive text for your image";

// Add the image to the body of the document
document.body.appendChild(newLogoImage);

       
        // Clone of player block for Game Over screen
        const extraDiv = document.createElement('div');
        Object.assign(extraDiv.style, { // game over character
          width: size + "px",
          height: size + "px",
          background: "tan",
          border: "2px solid black",
          borderRadius: "6px",
          marginTop: "30px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "14px",
          fontFamily: "sans-serif",
          color: "black",
          position: "absolute",
          overflow: "hidden",
          top: "310px",
          zIndex: "2"
        });

        // Eyes inside the extraDiv
        const extraText = document.createElement('span');
        extraText.textContent = "| |";
        extraText.style.position = "relative";
        extraText.style.webkitTextStroke = "2px black";
        extraDiv.appendChild(extraText);

        // Shadow oval under the block
        const shadow = document.createElement('div');
        Object.assign(shadow.style, {
          width: "100px",
          height: "30px",
          background: "darkgreen",
          borderRadius: "50%",
          marginTop: "10px",
          opacity: 0.6
        });

        const ytText = document.createElement('div');
        ytText.textContent = "Sub 2 @ItsToonyTime";
        Object.assign(ytText.style, {
          position: "absolute",
          bottom: "20px",
          left: "20px",
          fontSize: "22px",
          fontWeight: "bold",
          color: "black",
          textShadows: "2px 2px 6px"
        });

        gameOverScreen.appendChild(extraDiv);
        gameOverScreen.appendChild(shadow);
        gameOverScreen.appendChild(ytText);

        Object.assign(gameOverScreen.style, {
          position: 'fixed',
          left: '0',
          top: '0',
          width: '100%',
          height: '100%',
          background: 'green',
          color: 'black',
          fontSize: '40px',
          fontFamily: 'sans-serif',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          fontWeight: "bold",
          justifyContent: 'center',
          zIndex: 2147483655
        });

        // 🔥 Make eyes follow the mouse
        window.addEventListener("mousemove", (e) => {
          const rect = extraDiv.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;

          const dx = e.clientX - centerX;
          const dy = e.clientY - centerY;

          const maxOffset = 6;
          const angle = Math.atan2(dy, dx);
          const offsetX = Math.cos(angle) * maxOffset;
          const offsetY = Math.sin(angle) * maxOffset;

          extraText.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
        });

        // ✨ Blink effect
        setInterval(() => {
          extraText.textContent = "— —"; // eyes closed
          setTimeout(() => {
            extraText.textContent = "| |"; // eyes open
          }, 100);
        }, 3000); // blink every 3s

        for (const b of bullets) {
          if (b.el && b.el.remove)
            b.el.remove();
        }
        bullets.length = 0;

        for (const e of enemies) {
          if (e && e.remove)
            e.remove();
        }
        enemies.length = 0;

        const gameOverText = document.createElement('div');
        gameOverText.textContent = "GAME OVER";

        const scoreText = document.createElement('div');
        scoreText.textContent = `Final Score: ${score}`;
        scoreText.style.fontSize = "24px";
        scoreText.style.marginTop = "20px";

        const restartBtn = document.createElement('button');
        restartBtn.textContent = "Restart";
        Object.assign(restartBtn.style, {
          background: "white",
          marginTop: "30px",
          padding: "10px 20px",
          fontSize: "20px",
          borderRadius: "8px",
          border: "2px solid black",
          cursor: "pointer"
        });

        restartBtn.style.transition = 'transform 0.1s ease-in-out';

        restartBtn.addEventListener('mouseover', () => {
          // Scale the button up on hover
          restartBtn.style.transform = 'scale(1.1)';
        });

        restartBtn.addEventListener('mouseout', () => {
          // Reset the scale to original size
          restartBtn.style.transform = 'scale(1)';
        });

        restartBtn.onclick = () => {
          gameOverScreen.remove();
          enemies.length = 0;
          bullets.length = 0;
          score = 0;
          scoreDisplay.textContent = "Score: 0";
          // Reset player to center of screen
          x = window.innerWidth / 2 - size / 2;
          y = window.innerHeight / 2 - size / 2;
          block.style.left = x + "px";
          block.style.top = y + "px";
          paused = false;
          last = performance.now();
          raf = requestAnimationFrame(loop);
        };

        gameOverScreen.appendChild(gameOverText);
        gameOverScreen.appendChild(scoreText);
        gameOverScreen.appendChild(restartBtn);
        document.body.appendChild(gameOverScreen);
      }

      // Blue enemy trail
      if (e.type === 'Speedy') {
        const trail = e.cloneNode(true);
        trail.style.opacity = '.2';
        trail.style.transition = 'opacity 0.2s linear';
        document.body.appendChild(trail);
        trail.style.left = e.x + 'px';
        trail.style.top = e.y + 'px';
        setTimeout(() => trail.style.opacity = '0', 10);
        setTimeout(() => trail.remove(), 250);
      }

      // Bullet collision
      for (let j = bullets.length - 1; j >= 0; j--) {
        const b = bullets[j];
        const br = b.el.getBoundingClientRect();
        const er2 = e.getBoundingClientRect();
        if (br.left < er2.right && br.right > er2.left && br.top < er2.bottom && br.bottom > er2.top) {

          // GHOST LOGIC: bullet passes through, bullet keeps going!
          if (e.type === 'Ghost') {
            if (Math.random() < (e.immunityChance || 0.8)) {
              // Bullet passes through: do NOT damage ghost, do NOT animate, do NOT remove bullet
              continue;
            }
          }

          // Only pop effect if actually hit!
          popEffect(e);

          // Normal collision!
          e.hp -= 1;
          b.el.remove();
          bullets.splice(j, 1);
          if (e.hp <= 0) {
            e.remove();
            enemies.splice(i, 1);
            score++;
            scoreDisplay.textContent = `Score: ${score}`;
          }
          break;
        }
      }
    }

    raf = requestAnimationFrame(loop);
  }

  function setAllOpacity(value) {
    block.style.opacity = value;
    bgBlock.style.opacity = value;
    for (const b of bullets) {
      b.el.style.opacity = value;
    }
  }

  const onKeyDown = (e) => {
    const k = e.key.toLowerCase();
    if (['w', 'a', 's', 'd', 'escape'].includes(k)) {
      keys.add(k);
      e.preventDefault();
      if (k === 'escape') {
        paused = !paused;
        if (!paused) {
          last = performance.now();
          raf = requestAnimationFrame(loop);
        }
      }
    }
  };

  window.addEventListener('keydown', onKeyDown, { capture: true });
  window.addEventListener('keyup', onKeyUp, { capture: true });
  window.addEventListener('click', onClick, { capture: true });
  raf = requestAnimationFrame(loop);

  function cleanup() {
    if (raf) cancelAnimationFrame(raf);
    window.removeEventListener('keydown', onKeyDown, { capture: true });
    window.removeEventListener('keyup', onKeyUp, { capture: true });
    window.removeEventListener('click', onClick, { capture: true });
    block.remove();
    bgBlock.remove();
    scoreDisplay.remove();
    for (const b of bullets) b.el.remove();
    for (const e of enemies) e.remove();
    delete window.__wasdBlockCleanup;
    console.log('WASD block removed.');
  }
  window.__wasdBlockCleanup = cleanup;
})();
