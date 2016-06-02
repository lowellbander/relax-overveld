class Forwarder {
    constructor(node) {
        this.links = [];
        this.fib = [];
        // dictionary of prefixes to links
        this.dict = [];
        this.pit = [];
        // in-network cache
        this.cache = [];
        // broadcast strategy
        this.broadcast = false;
        // Interest counters
        this.InterestsReceived = 0;
        this.InterestsDropped = 0;
        this.InterestsForwarded = 0;
        // Data counters
        this.DataReceived = 0;
        this.DataDropped = 0;
        this.DataForwarded = 0;
    };

    setBroadcastStrategy(attr) {
      this.broadcast = attr;
    };

    shouldForward(interest) {
        return !this.pit[interest.name.toUri()]
    };

    addLink(link) {
        this.links.push(link);
    }

    announcePrefix(src, prefix) {
        for (var link of this.links) {
            // do not forward to any link we learned this from
            if (!this.dict[prefix.toUri()].includes(link))
            {
                link.registerPrefix(this, prefix);
            }
        }
    }

    registerPrefix(link, prefix) {
        if (!this.dict[prefix.toUri()]) {
            this.dict[prefix.toUri()] = [link];
            this.fib.push(prefix);
        }
        else if (!this.dict[prefix.toUri()].includes(link)) {
            this.dict[prefix.toUri()].push(link);
            this.fib.push(prefix);
        }
    }

    sendInterest(src, interest) {
        var interestName = interest.name.toUri();
        var longestPrefixMatchIndex = this.findLongestPrefixMatch(interest.name);
        if (longestPrefixMatchIndex !== -1) {
            var longestPrefix = this.fib[longestPrefixMatchIndex];
            // multipath forwarding
            if (this.broadcast) {
              this.InterestsForwarded++;
              this.broadcastInterest(src, interest);
            }
            else {
                var dst = this.dict[interestName][0];
                if (dst) {
                  // interest aggregation
                  if (!this.pit[interestName]) {
                      this.pit[interestName] = [src];
                      this.InterestsForwarded++;
                      return dst.sendInterest(this, interest);
                  }
                  else {
                      this.pit[interestName].push(src);
                  }
                }
            }
        }
        else {
          this.InterestsDropped++;
        }
    }

    broadcastInterest(src, interest) {
      var interestName = interest.name.toUri();
      for (var link of this.links) {
        if (link !== src) {
          console.log(link);
          if (!this.pit[interestName]) {
              this.pit[interestName] = [link];
              console.log("sending to: " + link);
              //this.links[link].sendInterest(this, interest);
          }
          else {
              var element = [];
              element.push(this.pit[interestName]);
              console.log("Element: " + element.toString());
              //var elementToPush = element.push(link);
              element.push(link);
              this.pit[interestName] = element;
              console.log("Pit state: " + element.toString());
              //this.links[link].sendInterest(this, interest);
          }
        }
      }
    };

    receiveInterest(link, interest) {
        var interestName = interest.name.toUri();
        this.InterestsReceived++;
        interest.incrementHopCount();
        if (!this.pit[interestName]) {
            this.pit[interestName] = [];
        }
        this.pit[interestName].push(link);
        // in-network cache lookup
        this.InterestsForwarded++;
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
        return super.announcePrefix(this.node, prefix);
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
        return super.announcePrefix(src, prefix);
    }

    receiveInterest(link, interest) {
        return function() {
            this.InterestsReceived++;
            if (this.shouldForward(interest)) {
                // TODO multi-path forwarding
                interest.incrementHopCount();
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
