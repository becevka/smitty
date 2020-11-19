import Cache from "../src/Cache.js";
const T = 1e6, // Limit 16777216
    map = new Map(),
    cache = new Cache(T);
let t, w, r;

// Log function (with browser failsafe mode)
const L = (m, t) => {
    console.log(...(t? [m, '\x1b[33m', `${t[0]}s, ${t[1]/1e6}ms`, '\x1b[0m']:[m]));
}

// Benchmarking function (with browser failsafe mode)
const B = (() => process.hrtime)();

// Number formatting
const fnum = n => n.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');

// Warm up CPU
L(`Warming up CPU...`);
t = B();
for(let i = 0; i < 1e8; i++) 1 + Math.floor((1e7 - 1) * Math.random());
t = B(t);
L(`Warm up completed in`, t);

// Add Map entries
L(`\nSetting ${fnum(T)} entries in to the Map (while)...`);
w = T;
t = B();
while(w--) map.set(w, w + 1);
t = B(t);
L(`Setting entries in to the Map completed in`, t);
L(`Map length now: ${fnum(map.size)}`);

// Add Cache entries
L(`\nSetting ${fnum(T)} entries in to the Cache (while)...`);
w = T;
t = B();
while(w--) cache.add(w, w + 1);
t = B(t);
L(`Setting entries in to the Cache completed in`, t);
L(`Cache length now: ${fnum(map.size)}`);

// Update Map entries
L(`\nUpdating Map entries (while)...`);
w = T;
r = 0;
t = B();
while(w--) map.set(w, r++);
t = B(t);
L(`Updating of Map entries completed in`, t);

// Update Cache entries
L(`\nUpdating Cache entries (while)...`);
w = T;
r = 0;
t = B();
while(w--) cache.set(w, r++);
t = B(t);
L(`Updating of Cache entries completed in`, t);

// Get Map entries
L(`\nGetting Map entries (while)...`);
w = T;
t = B();
while(w--) map.get(w) + 1;
t = B(t);
L(`Getting of Map entries completed in`, t);

// Get Cache entries
L(`\nGetting Cache entries (while)...`);
w = T;
t = B();
while(w--) cache.get(w) + 1;
t = B(t);
L(`Getting of Cache entries completed in`, t);


// Delete Map entries
L(`\nDeleting ${fnum(T)} entries from the Map (while)...`);
w = T;
t = B();
while(w--) map.delete(w);
t = B(t);
L(`Deleting entries from the Map completed in`, t);
L(`Map length now: ${fnum(map.size)}`);

// Delete Map entries
L(`\nDeleting ${fnum(T)} entries from the Cache (while)...`);
w = T;
t = B();
while(w--) cache.remove(w);
t = B(t);
L(`Deleting entries from the Cache completed in`, t);
L(`Map length now: ${fnum(map.size)}`);

L(`\nCleaning up...`);
w = T;
map.clear();
cache.flush();
L(`Benchmark completed!`);
