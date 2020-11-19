import debug from "debug";

const log = debug('smitty:cache');

class Item {
    next;
    prev;
    key;
    value;
    lastUsed;
    expire = -1;
}

const EXPIRE_INTERVAL = 30000;

class ObjectCache {

    constructor(capacity) {
        this.capacity = capacity;
        this.map = {};
        this.head = new Item();
        this.tail = new Item();
        this.head.next = this.tail;
        this.tail.prev = this.head;
        this.expireSetItems = 0;
        this.lastCheck = 0;
    }

    flush() {
        this.map = {};
        this.head.next = this.tail;
        this.tail.prev = this.head;
        this.expireSetItems = 0;
        return true;
    }

    size() {
        return this.map.length;
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
        this._addItem(newItem);
        this.map[key] = newItem;
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
        this._removeItem(item);
        delete this.map[item.key];
    }

    _checkExists(key) {
        if (this.map[key] == null) {
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
        let item = this.map[key];
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
            this._removeItem(item);
            delete this.map[item.key];
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
            const item = this.tail.prev;
            delete this[item.key];
            this._removeItem(item);
        }
        // async call to free up some space in cache while not blocking the main operation
        // only check if there is a chance to find some items to remove and not often than defined interval
        if (this.expireSetItems > 0 && this.lastCheck + EXPIRE_INTERVAL < Date.now()) {
            setImmediate(this._checkExpired.bind(this));
        }
    }

    _removeItem(item) {
        const prev = item.prev;
        const next = item.next;
        prev.next = next;
        next.prev = prev;
    }

    _addItem(item) {
        item.prev = this.head;
        item.next = this.head.next;
        this.head.next.prev = item;
        this.head.next = item;
        item.lastUsed = Date.now();
    }

    _pushItemUpfront(item) {
        this._removeItem(item);
        this._addItem(item);
    }

    _checkExpired() {
        this.lastCheck = Date.now();
        // free up either third of the cache or all expired, whichever is smaller
        const target = Math.min(this.capacity / 3, this.expireSetItems);
        let item = this.tail.prev;
        let count = 0;
        while (item != null) {
            item = this._checkExpiration(item);
            if (item == null) {
                count++;
            }
            // for speed purposes do not process whole cache only until reach the cleaning target
            if (count >= target) {
                break;
            }
            item = item.prev;
        }
        log(`Freed up cache from ${count} expired items`);
    }

}

export default ObjectCache;