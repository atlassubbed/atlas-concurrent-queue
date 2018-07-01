const { isNontrivial } = require("./util")

module.exports = class ConcurrentQueue {
  constructor(concurrency, allDone){
    if (!isNontrivial(concurrency)) 
      throw new Error("concurrency of at least 1 required");
    let queue = [], active = 0, curJob;
    const next = () => {
      if (!active && !queue.length) return allDone && allDone();
      if (active < concurrency && (curJob = queue.shift()))
        ++active && curJob(() => next(active--));
    }
    this.push = job => queue.push(job) && next()
  }
}
