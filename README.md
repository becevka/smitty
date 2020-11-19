Smitty
======

**Smitty** is simple distributable cache with sharding by design.

## Structure
Cache namespaces are configured in config.json and could be run on separate nodes.
Access to the case by name is made through the "cluster controller" node.
Cluster controller is available over HTTP and supports REST API.

## Installation
```cd to smitty code directory```
```npm install```


## Running
Running server.js (npm start) will start nodes according to config.json.
Each node creates a named cache with predefined capacity.
Nodes could be started on separate ports or separate machines.
Nodes are registered in the cluster controller, and the controller becomes available on a separate port according to config.
Controler and nodes could be run in monolithic mode, as one web app.

## Using Cache Client
Starting client.js (npm run client) will start interactive client connection to cache web server.
Commands:
```
    use {namespace} - selects namespace
    ns - show current namespace
    get {key} - retrieves value by key
    info - shows cache info
    flush - flushes cache
    remove {key} - deletes value by key
    add {key} {expire} {value} - adds value by key with expiration
    add {key} {value} - adds value by key
    set {key} {expire} {value} - sets value by key with expiration
    set {key} {value} - sets value by key
    exit, \q - close shell and exit
    help, \? - print this usage
    clear, \c - clear the terminal screen
```

## Cluster REST API

**GET** /:namespace/:key

    retrieves the value by key and promotes the key in LRU queue
    if key already expired makes sure that key is removed
    if key not found or expired returns 404 error
    
**POST** /:namespace/:key 
        {value, expiration}
    
    creates the key - value pair
    if key exists promotes the key in LRU queue and returns 400 error
        
**PUT** /:namespace/:key 
            {value, expiration}
            
     updates the key - value pair
     if key not found or expired returns 404 error
     
**DELETE** /:namespace/:key  

    removes key - value pair
    if key not found or expired returns 404 error
    
**GET** /manage/:namespace/info
    
    shows the cache info
    
**POST** /manage/:namespace/flush

    empties out the cache   
    
## Capacity management
Caches are using LRU priority for removing items when the cache reaches defined capacity.
Periodically (currently not more often than 30 sec), the cache is scanned for expired items.
If there is a pressure of new items on the low capacity cache, the probability of removing LRU items 
while some recently used items already expired is relatively high. 

## TODO
- configure expiration check interval
- dynamic capacity management
- cache initialization from the file
- cache serialization to the file
- distributable packages and auto registration of nodes
- docker templates
- nodes monitoring and failover
- remote nodes management
- HTTP2 ? socket? connections to nodes

## License

http://becevka.mit-license.org/









