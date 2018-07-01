const { describe, it } = require("mocha")
const { expect } = require("chai")
const ConcurrentQueue = require("../src/ConcurrentQueue")
const { asyncCall } = require("./helpers")

describe("ConcurrentQueue", function(){
  it("should throw error if not given a positive number of max parallel jobs to run", function(){
    const invalidConcurrencies = [NaN, -12, 0, true, {}, new Date(), "", /reg/, () => {}, undefined, null]
    invalidConcurrencies.forEach(concurrency => {
      expect(() => new ConcurrentQueue(concurrency)).to.throw("concurrency of at least 1 required")
    })
  })
  it("should only run a specified number of async jobs at any given time", function(testDone){
    const concurrency = 5, numJobs = 20
    let numRunning = 0;
    const queue = new ConcurrentQueue(concurrency)
    for (let i = 1; i <= numJobs; i++){
      queue.push(done => {
        // every job except the first 4 should have 4 other friends running in parallel.
        expect(++numRunning).to.equal(i < 5 ? i : 5)
        asyncCall(() => {
          numRunning--, done()
          if (i === numJobs) testDone();
        })
      })
    }
  })
  it("should call the allDone callback when all jobs are done", function(testDone){
    const concurrency = 5, numJobs = 20
    let numFinished = 0;
    const queue = new ConcurrentQueue(concurrency, () => {
      expect(numFinished).to.equal(numJobs);
      testDone()
    })
    for (let i = 0; i < numJobs; i++){
      queue.push(done => {
        asyncCall(() => {
          numFinished++, done()
        })
      })
    }
  })
  it("should pick the next job based on the order they were received", function(testDone){
    const concurrency = 1, numJobs = 5
    const expectedOrder = Array(numJobs).fill().map((e,i) => i);
    let order = [];
    const queue = new ConcurrentQueue(concurrency, () => {
      expect(order).to.deep.equal(expectedOrder)
      testDone();
    })
    for (let i = 0; i < numJobs; i++){
      queue.push(done => {
        asyncCall(() => {
          order.push(i), done();
        })
      })
    }
  })
})
