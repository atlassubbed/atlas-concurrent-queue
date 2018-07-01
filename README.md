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


Let's assume we have some file downloading API and we're trying to upload the downloaded files to our personal server. The queue's API is dead simple -- you instantiate a queue and then push jobs onto it:

```javascript
const ConcurrentQueue = require("atlas-concurrent-queue");
const downloadFile = require("./my-file-downloader");
const uploadFile = require("./my-file-uploader");
const urls = require("./url-list");
const destinationUrl = require("./dest-url")

const concurrency = 10
const queue = new ConcurrentQueue(concurrency);

// urls.length === 2000
for (let i = urls.length; i--;){
  queue.push(done => {
    downloadFile(urls[i], contents => {
      done();
      uploadFile(`${destinatonUrl}?index=${i}`, contents, () => {
        // no-op, don't care about result of write
      })
    })
  })
}
```

In the example above, we have 2000 download jobs, but no more than 10 are running at any given time. This helps keep us under the radar and prevents us from overloading our system. You might notice that we called `done()` *before* we started uploading the files to our server. This means that the uploading isn't actually limited in concurrency; we could easily have more than 10 uploads being attempted at once if our personal server is weak. This isn't good so, let's fix it by adding a second queue:

```javascript
...
const downloadConcurrency = 10;
const uploadConcurrency = 5;
const downloadQueue = new ConcurrentQueue(downloadConcurrency);
const uploadQueue = new ConcurrentQueue(uploadConcurrency);

// urls.length === 2000
for (let i = urls.length; i--;){
  downloadQueue.push(downloadDone => {
    downloadFile(urls[i], contents => {
      downloadDone();
      uploadQueue.push(uploadDone => {
        uploadFile(`${destinatonUrl}?index=${i}`, contents, uploadDone)        
      })
    })
  })
}
```

Now, we won't be running more than 5 upload jobs at any given time, in addition to limiting the concurrency of the download jobs.

## caveats

#### capturing errors and data

There's no way to capture errors or results through the done callback. I wanted this queue to do as little work as possible. If you need to capture errors or results, do it at the scope you're writing your jobs in.

#### `done` callback

Don't forget to wrap your async functions with a `done` callback acceptor, because that's how the queue knows when to spin up the next job in the line.

#### streams

You might have noticed we aren't using streams in the examples above. This is for simplicity. With tasks like this, it's better to use streams to limit your memory usage. 
