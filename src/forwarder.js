class Forwarder {
    constructor(node) {
        this.links = [];
        this.fib = [];
        // dictionary of prefixes to links
        this.dict = [];
        this.pit = [];
        // in-network cache
        this.cache = [];
    };

    shouldForward(interest) {
        return !this.pit[interest.name.toUri()]
    };

    addLink(link) {
        this.links.push(link);
    }

    announcePrefix(prefix) {
        /* announce prefix to remaining neighbors */
        return (this.links.filter(function (link) {
            return !this.dict[prefix.toUri()].includes(link);
        }.bind(this))
            .map(function (link) {
                link.registerPrefix(this, prefix)
            }.bind(this)));
    }


    registerPrefix(link, prefix) {
        if (!this.fib.includes(prefix)) {
            this.fib.push(prefix);
            if (!this.dict[prefix.toUri()]) {
                this.dict[prefix.toUri()] = [link];
            }
            else {
                this.dict[prefix.toUri()].push(link);
            }
        }
    }

    sendInterest(src, interest) {
        var interestName = interest.name.toUri();
        var longestPrefixMatchIndex = this.findLongestPrefixMatch(interest.name);
        if (longestPrefixMatchIndex !== -1) {
            var longestPrefix = this.fib[longestPrefixMatchIndex];
            // TODO multipath forwarding
            var dst = this.dict[interestName][0];
            if (dst) {
              // interest aggregation
              if (!this.pit[interestName]) {
                  this.pit[interestName] = [src];
                  return dst.sendInterest(this, interest);
              }
              else {
                  this.pit[interestName].push(src);
              }
            }
        }
    }

    receiveInterest(link, interest) {
        var interestName = interest.name.toUri();
        if (!this.pit[interestName]) {
            this.pit[interestName] = [];
        }
        this.pit[interestName].push(link);
        // in-network cache lookup
        this.csLookup(interest);
        // TODO multipath forwarding
        var dst = this.dict[interestName][0];
        if (dst) {
            return dst.receiveInterest(interest);
        }
    }

    csLookup(interest) {
      var interestName = interest.name.toUri();
      // do the look up
      if (this.cache[interestName] !== undefined) {
        // serve data from cache
        this.sendData(interest.name, this.cache[interestName]);
      }
    };

    receiveData(link, data) {
        var links = this.pit[data.name.toUri()];
        // store data in cache
        this.cache[data.name.toUri()] = data;

        if (links) {
            var block = [];
            for (var link of links) {
                var n = link.receiveData(data)
                if (n) {
                    block.push(n);
                }
            }
        }
        if (block && block.length > 0) {
            return new Block(block);
        }
        return undefined;
    }

    sendData(interestName, data) {
        var intrestName = interestName.toUri();
        var links = this.pit[interestName];
        if (links) {
            var block = [];
            for (var link of links) {
                var  n = link.sendData(this, data)
                if (n) {
                    block.push(n);
                }

            }
            delete this.pit[interestName];
        }
        if (block && block.length > 0) {
            return new Block(block);
        }
        return undefined;
    }

    sendData(interestName, data) {
        var interestName = interestName.toUri();
        var links = this.pit[interestName];
        if (links) {
            var block = [];
            for (var link of links) {
                var  n = link.sendData(this, data)
                if (n) {
                    block.push(n);
                }
            }
            delete this.pit[interestName];
        }
        if (block && block.length > 0) {
            return new Block(block);
        }
        return undefined;
    }

    findLongestPrefixMatch(name) {
        var arrayOfNameComponents = name.toUri().split("/");
        var longestPrefixMatchIndex = -1;
        var maximumMatchedComponents = -1;
        var fibEntryCounter = -1;
        for (var fibEntry of this.fib) {
            fibEntryCounter += 1;
            var currentMatchedComponents = 0;
            var entryNameComponents = fibEntry.toUri().split("/");
            //console.log(entryNameComponents);
            for (var i = 0; i < arrayOfNameComponents.length; i++) {
                if (entryNameComponents[i] === arrayOfNameComponents[i]) {
                    // console.log(entryNameComponents[i]);
                    // console.log(arrayOfNameComponents[i]);
                    currentMatchedComponents += 1;
                }
                else {
                    currentMatchedComponents = -2;
                    break;
                }
            }
            if (currentMatchedComponents >= maximumMatchedComponents) {
                maximumMatchedComponents = currentMatchedComponents;
                longestPrefixMatchIndex = fibEntryCounter;
            }
        }
        return longestPrefixMatchIndex;
    }

}

class LocalForwarder extends Forwarder {
    constructor(node) {
        super(arguments[0]);
        this.node = node;
    };

    announcePrefix(prefix) {
        super.registerPrefix(this.node, prefix);
        return super.announcePrefix(prefix);
    };

    sendInterest(interest) {
        return super.sendInterest(this.node, interest);
    }
}

class Router extends Forwarder {
    constructor(node) {
        super(arguments[0]);
        this.node = node;
    }

    registerPrefix(src, prefix) {
        super.registerPrefix(src, prefix);
        return super.announcePrefix(prefix);
    }

    receiveInterest(link, interest) {
        return function() {
            if (this.shouldForward(interest)) {
                // TODO multi-path forwarding
                console.log(this.node.name + " forwarding Interest: " + JSON.stringify(interest)
                       + " to " + this.dict[interest.name.toUri()][0].name );
            }
            else {
                console.log(this.node.name + " aggregated Interest: " + JSON.stringify(interest));
            }
            return this.sendInterest(link, interest);
        }.bind(this);
    }

    receiveData(link, data) {
        return function() {
            var links = this.pit[data.name.toUri()];
            var links_str = "{ "
            for (var l of links) {
                links_str += ( l.name + ", ");
            }
            links_str = links_str.replaceAt([links_str.length - 2], " }");
            console.log(this.node.name + " forwarding Data: " + JSON.stringify(data) + " to "+ links_str);
            return this.sendData(data.name, data);
        }.bind(this);
    }
}
