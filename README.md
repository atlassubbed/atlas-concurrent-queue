# atlas-concurrent-queue

Async job queue that limits the number of concurrent jobs.

[![Travis](https://img.shields.io/travis/atlassubbed/atlas-concurrent-queue.svg)](https://travis-ci.org/atlassubbed/atlas-concurrent-queue)

---

## install

```
npm install --save atlas-concurrent-queue
```

## why

I was writing a totally legal file downloader and I needed to run the downloads in parallel, but not *all* at once otherwise we'd run into performance and spamming problems.

## examples


Let's assume we have some file downloading API and we're trying to write the downloaded files to our local file system. The queue's API is dead simple -- you instantiate a queue and then push jobs onto it:

```javascript
const ConcurrentQueue = require("atlas-concurrent-queue");
const { writeFile } = require("fs");
const downloadFile = require("./my-file-downloader");
const urls = require("./url-list");

const concurrency = 10
const queue = new ConcurrentQueue(concurrency);

// urls.length === 2000
for (let i = urls.length; i--;){
  queue.push(done => {
    downloadFile(urls[i], contents => {
      done();
      writeFile(`./downloads/file${i}.txt`, contents, () => {
        // no-op, don't care about result of write
      })
    })
  })
}
```

In the example above, we have 2000 download jobs, but no more than 10 are running at any given time. This helps keep us under the radar and prevents us from overloading our system. You might notice that we called `done()` *before* we started writing the files to our system. This means that the file-writing isn't actually limited in concurrency -- theoretically, we could have 2000 write jobs being attempted at once. This isn't good so, let's fix it:

```javascript
...
const downloadConcurrency = 10;
const writeConcurrency = 20;
const downloadQueue = new ConcurrentQueue(downloadConcurrency);
const writeQueue = new ConcurrentQueue(writeConcurrency);

// urls.length === 2000
for (let i = urls.length; i--;){
  downloadQueue.push(downloadDone => {
    downloadFile(urls[i], contents => {
      downloadDone();
      writeQueue.push(writeDone => {
        writeFile(`./downloads/file${i}.txt`, contents, writeDone)        
      })
    })
  })
}
```

Now, we won't be running more than 20 write jobs at any given time, in addition to limiting the concurrency of the download jobs. Don't forget to wrap your async functions with a `done` callback acceptor, because that's how the queue knows when to spin up the next one in line.

## caveats

There's no way to capture errors or results through the done callback. I wanted this queue to do as little work as possible. If you need to capture errors or results, do it at the scope you're writing your jobs in.