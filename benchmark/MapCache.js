import debug from "debug";

const log = debug('smitty:cache');

const EXPIRE_INTERVAL = 30000;

class Item {
    key;
    value;
    lastUsed;
    expire = -1;
}

class MapCache {

    constructor(capacity) {
        this.capacity = capacity;
        this.map = new Map();
        this.expireSetItems = 0;
        this.lastCheck = 0;
    }

    flush() {
        this.map.clear();
        this.expireSetItems = 0;
        return true;
    }

    size() {
        return this.map.size;
    }

    get(key) {
        const item = this._retrieve(key);
        this._pushItemUpfront(item);
        return item.value;
    }

    stat(key) {
        const item = this._retrieve(key);
        return {lastUsed: item.lastUsed, expire: item.expire};
    }

    add(key, value, expire) {
        // throws error if key exists
        this._checkExists(key);
        const newItem = new Item();
        newItem.value = value;
        newItem.key = key;
        this._setExpiration(expire, newItem);
        this._checkCapacity();
        newItem.lastUsed = Date.now();
        this.map.set(key, newItem);
        return true;
    }

    set(key, value, expire) {
        const item = this._retrieve(key);
        item.value = value;
        this._setExpiration(expire, item);
        this._pushItemUpfront(item);
        return true;
    }

    remove(key) {
        let item = this._retrieve(key);
        return this.map.delete(item.key);
    }

    _checkExists(key) {
        if (!this.map.has(key)) {
            return;
        }
        let existing;
        try {
            existing = this._retrieve(key);
        } catch (e) {
            existing = null;
        }
        if (existing != null) {
            // promote item in LRU
            this._pushItemUpfront(existing);
            throw new Error(`Key ${key} already exists`);
        }
    }

    _retrieve(key) {
        let item = this.map.get(key);
        // on read check that item isn't expired yet
        item = this._checkExpiration(item);
        if (item == null) {
            throw new Error(`Key ${key} not found`);
        }
        return item;
    }

    _setExpiration(expire, item) {
        if (expire && expire > 0) {
            item.expire = Date.now() + (expire * 1000);
            this.expireSetItems++;
        }
    }

    _checkExpiration(item) {
        if (item != null && item.expire >= 0 && item.expire < Date.now()) {
            this.map.delete(item.key);
            this.expireSetItems--;
            return null;
        }
        return item;
    }

    _checkCapacity() {
        //uses LRU feature of the cache for speed
        // potentially can remove LRU item while recent items could be expired already
        if (this.map.size >= this.capacity) {
            log("LRU Free Up");
            const key = this.map.keys().next().value;
            this.map.delete(key);
        }
        // async call to free up some space in cache while not blocking the main operation
        // only check if there is a chance to find some items to remove and not often than defined interval
        if (this.expireSetItems > 0 && this.lastCheck + EXPIRE_INTERVAL < Date.now()) {
            setImmediate(this._checkExpired.bind(this));
        }
    }


    _pushItemUpfront(item) {
        this.map.delete(item.key);
        this.map.set(item.key, item);
        item.lastUsed = Date.now();
    }

    _checkExpired() {
        this.lastCheck = Date.now();
        // free up either third of the cache or all expired, whichever is smaller
        const target = Math.min(this.capacity / 3, this.expireSetItems);
        let keys = this.map.keys();
        let key = keys.next().value;
        let count = 0;
        while (key != null) {
            const item = this._checkExpiration(this.map.get(key));
            if (item == null) {
                count++;
            }
            // for speed purposes do not process whole cache only until reach the cleaning target
            if (count >= target) {
                break;
            }
            key = keys.next().value;
        }
        log(`Freed up cache from ${count} expired items`);
    }

}

export default MapCache;
