import { state } from './state.js';
import { hexToRgba } from './utils.js';
const { Engine, Render, Runner, Bodies, Body, World, Mouse, MouseConstraint } = Matter;



let taskBodies = {};


const canvasWrap = document.querySelector('.canvas-wrap');
const canvas = document.getElementById('physics-canvas');

function getSize() {
  return { w: canvasWrap.clientWidth, h: canvasWrap.clientHeight };
}

const engine = Engine.create({ gravity: { y: 1.5 } });
const { world } = engine;

let { w, h } = getSize();
canvas.width = w;
canvas.height = h;

const render = Render.create({
  canvas,
  engine,
  options: {
    width: w,
    height: h,
    background: 'transparent',
    wireframes: false,
  },
});



Render.run(render);
const runner = Runner.create();
Runner.run(runner, engine);

let floor, wallL, wallR, ceiling;
function createBounds() {
  if (floor) World.remove(world, [floor, wallL, wallR, ceiling]);
  const { w, h } = getSize();
  floor = Bodies.rectangle(w / 2, h + 25, w + 100, 50, { isStatic: true, render: { fillStyle: 'transparent' } });
  wallL = Bodies.rectangle(-25, h / 2, 50, h + 100, { isStatic: true, render: { fillStyle: 'transparent' } });
  wallR = Bodies.rectangle(w + 25, h / 2, 50, h + 100, { isStatic: true, render: { fillStyle: 'transparent' } });
  ceiling = Bodies.rectangle(w / 2, -200, w + 100, 50, { isStatic: true, render: { fillStyle: 'transparent' } });
  World.add(world, [floor, wallL, wallR, ceiling]);
}
createBounds();

const mouse = Mouse.create(canvas);
const mouseConstraint = MouseConstraint.create(engine, {
  mouse,
  constraint: { stiffness: 0.2, render: { visible: false } },
});
World.add(world, mouseConstraint);

const BLOCK_W = 260;
const BLOCK_H = 80;

export function addBlock(task) {
  const { w } = getSize();
  const x = task.x ?? (Math.random() * (w - BLOCK_W) + BLOCK_W / 2);
  const y = task.y ?? -BLOCK_H;
  const color = task.color || '#a78bfa';

  const body = Bodies.rectangle(x, y, BLOCK_W, BLOCK_H, {
    restitution: 0.3,
    friction: 0.8,
    render: {
      fillStyle: hexToRgba(color, 0.45),
      strokeStyle: color,
      lineWidth: 2,
    },
  });

  if (task.angle != null) Body.setAngle(body, task.angle);
  if (task.x != null && task.y != null) {
    Body.setPosition(body, { x: task.x, y: task.y });
    Body.setVelocity(body, { x: 0, y: 0 });
  }

  body.taskId = task.id;
  World.add(world, body);
  taskBodies[task.id] = body;
}

export function removeBlock(taskId) {
  const body = taskBodies[taskId];
  if (body) { World.remove(world, body); delete taskBodies[taskId]; }
  document.getElementById('label-' + taskId)?.remove();
}

window.addEventListener('resize', () => {
  const { w, h } = getSize();
  canvas.width = w;
  canvas.height = h;
  render.options.width = w;
  render.options.height = h;
  render.canvas.width = w;
  render.canvas.height = h;
  createBounds();

  // 画面外に出たブロックを画面内に戻す
  state.tasks.forEach(task => {
    const body = taskBodies[task.id];
    if (!body) return;
    const { x, y } = body.position;
    const clampedX = Math.max(BLOCK_W / 2, Math.min(w - BLOCK_W / 2, x));
    const clampedY = Math.min(h - BLOCK_H / 2, y);
    if (clampedX !== x || clampedY !== y) {
      Body.setPosition(body, { x: clampedX, y: clampedY });
      Body.setVelocity(body, { x: 0, y: 0 });
    }
  });
});

export {
  engine,
  world,
  render,
  canvas,
  taskBodies,
  BLOCK_W,
  BLOCK_H,
  getSize,
  createBounds,
};