import {spring, inertia} from './motion-physics.mjs';

export const clamp = value => Math.max(0, Math.min(1, value));
export const durationSpring = (duration = 400, bounce = .2) => ({duration, bounce});

// Same WAAPI conversion as Motion: scale 100, 50 ms duration search,
// then linear() samples every ~10 ms rounded to four decimals.
export function springEasing(options) {
  const generator = spring({...options, keyframes: [0, 100]});
  let duration = 0;
  while (!generator.next(duration).done && duration < 20000) duration += 50;
  const count = Math.max(Math.round(duration / 10), 2);
  const values = Array.from({length: count}, (_, i) =>
    Math.round(generator.next(duration * i / (count - 1)).value / 100 * 10000) / 10000);
  return {duration, easing: `linear(${values.join(', ')})`};
}

// Analytic evaluation, without an Euler integration step or endpoint normalization.
// Retargeting physical springs carries their instantaneous velocity.
export function springChannel(initial, render, options, reduced, onComplete) {
  let value = initial, target = initial, generator, start = 0, raf = 0;
  const sample = now => {
    if (!generator) return {done: true, value, velocity: 0};
    const t = Math.max(0, Math.round(now - start));
    const state = generator.next(t);
    value = state.value;
    return {...state, velocity: state.done ? 0 : generator.velocity(t)};
  };
  const tick = now => {
    raf = 0;
    const state = sample(now);
    render(state.value);
    if (!state.done) raf = requestAnimationFrame(tick);
    else {generator = undefined; onComplete?.(target);}
  };
  const set = (next, {delay = 0, from} = {}) => {
    if (next === target && from === undefined) return;
    const now = performance.now(), state = sample(now);
    cancelAnimationFrame(raf);
    target = next;
    value = from ?? state.value;
    if (reduced.matches) {
      generator = undefined; render(value = next); onComplete?.(next); return;
    }
    generator = spring({...options, keyframes: [value, next], velocity: from === undefined ? state.velocity : 0});
    start = now + delay;
    render(value);
    raf = requestAnimationFrame(tick);
  };
  set.finish = () => {cancelAnimationFrame(raf); generator = undefined; render(value = target); onComplete?.(target);};
  set.cancel = () => {cancelAnimationFrame(raf); sample(performance.now()); generator = undefined;};
  render(initial);
  return set;
}

// Framer PanSession's 100 ms history window, including its stale-origin guard.
export function panVelocity(history) {
  if (history.length < 2) return 0;
  const last = history.at(-1);
  let i = history.length - 1, point;
  while (i >= 0) {
    point = history[i--];
    if (last.timestamp - point.timestamp > 100) break;
  }
  if (point === history[0] && history.length > 2 && last.timestamp - point.timestamp > 200) point = history[1];
  const seconds = (last.timestamp - point.timestamp) / 1000;
  return seconds ? (last.x - point.x) / seconds : 0;
}

// Framer aD + VisualElementDragControls: no blend back to auto speed.
// The magnitude of the measured frame velocity gates the handoff, in either direction.
export class TickerMotion {
  position = 0;
  velocity = 0;
  updatedAt = 0;
  momentum = null;
  release(position, velocity, now) {
    this.position = position;
    this.velocity = velocity;
    this.updatedAt = now;
    this.momentum = {start: now, generator: inertia({keyframes: [position], velocity, power: .8, timeConstant: 750, restDelta: 1, restSpeed: 10})};
  }
  stop() {this.momentum = null; this.velocity = 0;}
  step(now, delta, speed) {
    // MotionValue stops reporting velocity after a frame has been stale for 30 ms.
    if (this.momentum && now - this.updatedAt > 30) this.velocity = 0;
    if (this.momentum && Math.abs(this.velocity) < Math.abs(speed)) this.stop();
    if (this.momentum) {
      const previous = this.position;
      const state = this.momentum.generator.next(Math.max(0, Math.round(now - this.momentum.start)));
      this.position = state.value;
      this.velocity = delta ? (this.position - previous) * 1000 / Math.min(delta, 30) : 0;
      if (state.done) this.stop();
    } else {
      this.position -= speed * delta / 1000;
      this.velocity = -speed;
    }
    this.updatedAt = now;
    return this.position;
  }
}

export const wrapPosition = (position, width) => width ? ((position % width) + width) % width - width : 0;
export const mixColor = (from, to, progress) => from.map((channel, i) =>
  Math.round(Math.sqrt(Math.max(0, channel * channel + progress * (to[i] * to[i] - channel * channel)))));
