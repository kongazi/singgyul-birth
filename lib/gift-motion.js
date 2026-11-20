export function initGiftMotion(story, stage) {
  'use strict';
  const canvas = stage.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
  const categories = ['gamepad', 'microphone', 'clapperboard'];
  const images = {};
  for (const name of ['coin', ...categories, 'box-open', 'box-closed', 'letter']) {
    const image = new Image();
    image.src = '/assets/gift-guide/refined/' + (name === 'box-open' ? 'box-open-v2' : name) + '.png';
    image.onload = requestFrame;
    images[name] = image;
  }

  const clamp = v => Math.max(0, Math.min(1, v));
  const mix = (a, b, t) => a + (b - a) * t;
  function ease(p, start, end) {
    const t = clamp((p - start) / (end - start));
    return t * t * (3 - 2 * t);
  }
  function arc(a, control, b, t) {
    return mix(mix(a, control, t), mix(control, b, t), t);
  }
  function band(p, a, b, c, d) {
    return ease(p, a, b) * (1 - ease(p, c, d));
  }

  // All coordinates below use the stage's CSS pixels, including on Retina screens.
  let width = 0, height = 0, shown = 0, target = 0, frame = 0, lastTime = 0;
  function measure() {
    width = stage.clientWidth;
    height = stage.clientHeight;
    const density = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * density);
    canvas.height = Math.round(height * density);
    ctx.setTransform(density, 0, 0, density, 0, 0);
    ctx.imageSmoothingQuality = 'high';
    syncPosition();
  }
  function readPosition() {
    const distance = story.offsetHeight - height;
    return distance > 0 ? clamp((parseFloat(getComputedStyle(stage).top) - story.getBoundingClientRect().top) / distance) : 0;
  }
  function syncPosition() {
    target = shown = readPosition();
    lastTime = 0;
    requestFrame();
  }
  function requestFrame() {
    if (!frame && !motionPreference.matches) frame = requestAnimationFrame(tick);
  }
  function tick(time) {
    frame = 0;
    if (!width || !height || motionPreference.matches) return;
    const dt = lastTime ? Math.min(64, time - lastTime) : 16.7;
    lastTime = time;
    // Brief damping smooths discrete wheel ticks without taking over native scroll.
    const delta = target - shown;
    shown = Math.abs(delta) < .00025 || Math.abs(delta) > .19
      ? target : shown + delta * (1 - Math.exp(-dt / 42));
    paint(shown);
    if (shown !== target) requestFrame();
    else lastTime = 0;
  }
  function stamp(name, x, y, w, angle = 0, alpha = 1) {
    const im = images[name];
    if (!im.naturalWidth || alpha < .002 || w <= 0) return;
    const h = w * im.naturalHeight / im.naturalWidth;
    ctx.save();
    ctx.globalAlpha = clamp(alpha);
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.drawImage(im, -w / 2, -h / 2, w, h);
    ctx.restore();
  }
  function shadow(x, y, radius, opacity) {
    if (opacity < .002) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(radius, radius * .105);
    const ink = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    ink.addColorStop(0, 'rgba(105,65,23,' + opacity + ')');
    ink.addColorStop(1, 'rgba(105,65,23,0)');
    ctx.fillStyle = ink;
    ctx.fillRect(-1, -1, 2, 2);
    ctx.restore();
  }
  // Rotate the transparent assets directly without drawing an artificial rim.
  function turn(name, x, y, coinWidth, giftWidth, phase, tilt) {
    const face = Math.abs(Math.cos(phase * Math.PI));
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(tilt);
    if (phase <= .5 && images.coin.naturalWidth) {
      ctx.scale(Math.max(face, .008), 1);
      stamp('coin', 0, 0, coinWidth);
    } else if (images[name].naturalWidth) {
      const opening = ease(phase, .5, .61);
      const h = giftWidth * images[name].naturalHeight / images[name].naturalWidth;
      ctx.scale(Math.max(.008, face), mix(coinWidth / h, 1, ease(phase,.5,.79)));
      stamp(name, 0, 0, giftWidth, 0, mix(.18, 1, opening));
    }
    ctx.restore();
  }
  const captions = Array.from(stage.querySelectorAll('[data-copy]'));
  const copy = Object.fromEntries(captions.map(el => [el.dataset.copy, el]));
  function textAt(id, x, y, maxWidth, alpha, travel = 0) {
    const el = copy[id];
    el.style.width = maxWidth + 'px';
    el.style.opacity = clamp(alpha);
    el.style.transform = 'translate(' + x + 'px,' + (y + travel) + 'px) translate(-50%,-50%)';
  }

  function paint(p) {
    ctx.clearRect(0, 0, width, height);
    const mobile = width <= 900;
    const cx = width * .5, cy = height * (mobile ? .408 : .475);
    const unit = Math.min(width * (mobile ? .51 : .243), height * .40, 385);
    const lane = Math.min(width * (mobile ? .32 : .249), 415);
    const gate = ease(p, .115, .343);
    const float = Math.sin(gate * Math.PI);
    const lift = ease(p,.125,.28);
    const boxIn = ease(p, .485, .609);
    const packageExit = ease(p, .913, 1);
    const baseW = Math.min(unit * (mobile ? 1.15 : 1.09), height*.44);
    const floor = height * (mobile ? .681 : .714) + (1-boxIn) * height * .27 - packageExit * height * .17;
    const impact = band(p,.765,.775,.775,.805) * baseW * .013;
    const foot = floor + impact;
    const openW = baseW * .939;
    const openH = openW * .99;
    const boxY = foot - openH/2;
    const mouthY = foot - openH * .64;
    const bodyShow = ease(p,.485,.538);

    const openAlpha = bodyShow;
    const angles = [-.16,.05,.13];
    shadow(cx, cy + unit*.60, unit*.48*(1-.22*lift), .16*(1-ease(p,.14,.27)));
    shadow(cx, foot + baseW * .016, baseW*.66, .15*bodyShow);
    // One continuous ribbon-free body, including its naturally joined rim.
    const drawBox = () => {
      const box = images['box-open'];
      if (!box.naturalWidth) return;
      ctx.save();
      ctx.globalAlpha = openAlpha;
      ctx.drawImage(box, cx-openW/2, boxY-openH/2, openW, openH);
      ctx.restore();
    };
    drawBox();

    // Outer coins peel out from behind the middle coin, with small phase offsets.
    for (const i of [0,2,1]) {
      const side = i-1;
      const lag = [0,.012,.024][i];
      const phase = ease(p,.162+lag,.353+lag);
      const x = cx + side * lane * gate;
      const y = cy - float * unit*(side===0?.11:.20) + side*unit*.026*float;
      const coinW = unit * mix(1,.70,gate);
      const giftW = mobile ? width*[.268,.154,.248][i] : unit*[.76,.435,.69][i];
      const tilt = side*.115*float + angles[i]*(Math.sin(phase*Math.PI));
      // Covered copies stay hidden until the silhouettes start to separate.
      if (side && gate === 0) continue;
      const start = .523 + i * .024;
      const t = ease(p,start,start+.147);
      if (t === 0) {
        turn(categories[i], x,y,coinW,giftW,phase,tilt);
      } else if (t < 1) {
        // Approach the mouth on a curve, then drop straight behind its near lip.
        const tuckX = cx + side * openW * .115;
        const approach = ease(t,0,.69);
        const sink = ease(t,.59,1);
        const fx = arc(x, x + side * unit * .10, tuckX, approach);
        const fy = arc(y, y-unit*(side===0?.15:.23), mouthY-openW*.22, approach) + openW*.48*sink;
        const angle = side * (Math.sin(approach*Math.PI)*.26 - .08*approach);
        ctx.save();
        if (sink > 0) {
          // Once inside the box, hide everything below the front rim,
          // including pixels that would extend beyond the box's bottom.
          ctx.beginPath();
          ctx.rect(0, 0, width, Math.max(0, boxY - openH * .095));
          ctx.clip();
        }
        stamp(categories[i], fx, fy, giftW*mix(1,.46,t), angle);
        ctx.restore();
      }
    }
    // Reuse the same box's front pixels so the rim remains exactly aligned.
    ctx.save();
    ctx.beginPath();
    ctx.rect(cx-openW/2, boxY-openH*.095, openW, openH*.595);
    ctx.clip();
    drawBox();
    ctx.restore();

    // Keep the open box body for the entire sequence. Only its matching-size
    // lid moves; never replace or fade the body into a different closed box.
    const down = ease(p,.705,.80);
    const lid = images['box-closed'];
    if (p > .68 && lid.naturalWidth) {
      const lidW = openW * .99;
      const topH = openH * .315;
      const rimH = openH * .15;
      const seatedY = boxY - openH * .435;
      const travel = (1-down) * height;
      ctx.drawImage(lid,
        lid.naturalWidth * .025, lid.naturalHeight * .045,
        lid.naturalWidth * .95, lid.naturalHeight * .495,
        cx - lidW/2, seatedY - travel, lidW, topH);
      // Keep the top unchanged; deepen only the front skirt over the body.
      ctx.drawImage(lid,
        lid.naturalWidth * .025, lid.naturalHeight * .54,
        lid.naturalWidth * .95, lid.naturalHeight * .12,
        cx - lidW/2, seatedY - travel + topH, lidW, rimH);
    }
    const arrive = ease(p,.773,.87);
    if (arrive) {
      const x = arc(cx + baseW*.98,cx + baseW*.64,cx + baseW*.34,arrive);
      const y = arc(foot - baseW*.58,foot - baseW*.73,foot - baseW*.20,arrive);
      stamp('letter',x,y,baseW*.56,mix(.24,-.085,arrive),ease(p,.773,.813));
    }
    const startText = 1-ease(p,.085,.158);
    const catText = band(p,.34,.395,.475,.51);
    const packText = band(p,.541,.589,.688,.741);
    const finalText = band(p,.801,.85,.918,.989);
    const sideW = mobile ? width - 40 : Math.min(width*.27, 360);
    textAt('coin',mobile?cx:width*.205,mobile?height*.16:cy,sideW,startText,-12*(1-startText));
    textAt('budget',mobile?cx:width*.798,mobile?height*.76:cy,sideW,startText,-12*(1-startText));
    for(let i=0;i<3;i++) {
      const enter = ease(p,.326+i*.012,.388+i*.012);
      textAt(categories[i],cx+(i-1)*lane,cy+unit*(mobile?.61:.55),width*.28,enter*(1-ease(p,.48,.52)),10*(1-enter));
    }
    textAt('pick',cx,mobile?height*.716:cy+unit*.85,width*.88,catText,8*(1-ease(p,.34,.404)));
    textAt('pack',cx,foot+baseW*.14,width*.89,packText,7*(1-ease(p,.541,.589)));
    textAt('finish',mobile?cx:width*.205,mobile?height*.16:cy,sideW,finalText,12*(1-ease(p,.801,.85))-packageExit*24);
    textAt('send',mobile?cx:width*.798,mobile?height*.80:cy,sideW,finalText,12*(1-ease(p,.812,.862))-packageExit*24);
  }
  const snow = stage.querySelector('.snow');
  for(let i=0;i<14;i++) {
    const dot=document.createElement('i');
    dot.style.left=((i*37+9)%100)+'%';
    dot.style.animationDelay=-(i*2.47)+'s';
    dot.style.animationDuration=(12+i%6)+'s';
    snow.append(dot);
  }
  const onScroll = () => {target=readPosition();requestFrame();};
  window.addEventListener('scroll',onScroll,{passive:true});
  window.addEventListener('resize',measure);
  window.addEventListener('pageshow',measure);
  motionPreference.addEventListener('change',measure);
  measure();
  return () => {
    cancelAnimationFrame(frame);
    window.removeEventListener('scroll',onScroll);
    window.removeEventListener('resize',measure);
    window.removeEventListener('pageshow',measure);
    motionPreference.removeEventListener('change',measure);
    Object.values(images).forEach(image => {image.onload = null;});
    snow.replaceChildren();
  };
}
