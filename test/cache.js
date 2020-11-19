import Cache from "../src/Cache.js";
import chai from "chai";

const s = chai.should();

describe('cache', function () {
    it('should init by capacity', function () {
        const cache = new Cache(10);
        cache.capacity.should.equals(10)
    });
    it('should throw if no key', function () {
        const cache = new Cache(2);
        cache.size().should.equals(0);
        s.throw(()=>cache.get("t1"), "Key t1 not found");
    });
    it('should add key', function () {
        const cache = new Cache(2);
        cache.size().should.equals(0);
        cache.add("t1", "test");
        cache.size().should.equals(1);
        cache.get("t1").should.equals("test");
    });
    it('should throw on add existing', function () {
        const cache = new Cache(2);
        cache.add("t1", "test");
        s.throw(()=>cache.add("t1", "test"), "Key t1 already exists");
    });
    it('should add up to capacity', function () {
        const cache = new Cache(2);
        cache.size().should.equals(0);
        cache.add("t1", "test");
        cache.add("t2", "test");
        cache.add("t3", "test");
        cache.size().should.equals(2);
    });
    it('should remove key', function () {
        const cache = new Cache(2);
        cache.add("t1", "test");
        cache.remove("t1");
        cache.size().should.equals(0);
        s.throw(()=>cache.get("t1"), "Key t1 not found");
    });
    it('should set key value', function () {
        const cache = new Cache(2);
        cache.add("t1", "test");
        cache.get("t1").should.equals("test");
        cache.set("t1", "testing");
        cache.get("t1").should.equals("testing");
    });
    it('should fail update not existing key', function () {
        const cache = new Cache(2);
        s.throw(()=>cache.set("t1", "testing"), "Key t1 not found");
        s.throw(()=>cache.remove("t1"), "Key t1 not found");
    });
    it('should remove LRU first', function () {
        const cache = new Cache(2);
        cache.add("t1", "test");
        cache.add("t2", "test");
        cache.add("t3", "test");
        s.throw(()=>cache.get("t1"), "Key t1 not found");
        s.not.throw(()=>cache.get("t2"));
        s.not.throw(()=>cache.get("t3"));
    });
    it('should promote LRU on get', function () {
        const cache = new Cache(2);
        cache.add("t1", "test");
        cache.add("t2", "test");
        cache.get("t1");
        cache.add("t3", "test");
        s.not.throw(()=>cache.get("t1"));
        s.throw(()=>cache.get("t2"), "Key t2 not found");
        s.not.throw(()=>cache.get("t3"));
    });
    it('should promote LRU on add existing', function () {
        const cache = new Cache(2);
        cache.add("t1", "test");
        cache.add("t2", "test");
        try {
            cache.add("t1", "test");
        } catch (e) {}
        cache.add("t3", "test");
        s.not.throw(()=>cache.get("t1"));
        s.throw(()=>cache.get("t2"), "Key t2 not found");
        s.not.throw(()=>cache.get("t3"));
    });
    it('should support expire', function (done) {
        const cache = new Cache(2);
        cache.add("t1", "test", 1);
        cache.expireSetItems.should.equals(1);
        setTimeout(() => {
            s.throw(()=>cache.get("t1"), "Key t1 not found");
            cache.expireSetItems.should.equals(0);
            done();
        }, 1100);
    });
    it('should allow add expired', function (done) {
        const cache = new Cache(2);
        cache.add("t1", "test", 1);
        setTimeout(() => {
            cache.add("t1", "test");
            s.not.throw(()=>cache.get("t1"));
            done();
        }, 1100);
    });
    it('should remove expired first', function (done) {
        const cache = new Cache(3);
        cache.add("t1", "test");
        cache.add("t2", "test", 1);
        setTimeout(() => {
            cache.lastCheck = 0; // to force check
            cache.add("t3", "test");
            // to let clean up finish
            setTimeout(() => {
                cache.add("t4", "test");
                s.not.throw(()=>cache.get("t1"));
                done();
            }, 100);
        }, 1100);
    });
});
