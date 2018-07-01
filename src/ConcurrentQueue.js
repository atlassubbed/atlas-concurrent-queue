module.exports = class ConcurrentQueue {
  constructor(concurrency, allDone){
    if (!concurrency) throw new Error("non-zero concurrency required");
    let queue = [], active = 0, curJob;
    const next = () => {
      if (!active && !queue.length) return allDone && allDone();
      if (active < concurrency && (curJob = queue.shift()))
        ++active && curJob(() => next(active--));
    }
    this.push = job => queue.push(job) && next()
  }
}
