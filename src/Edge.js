/**
 * Created by lowellbander on 5/27/16.
 */

class Edge {
    constructor(p1, p2, optCapacity) {
        this.p1 = p1;
        this.p2 = p2;
        this.numPackets = 0;
        this.name = 'Edge' + getEdgeID();
        this.capacity = optCapacity || 1;
        this.dst = null;
        this.angleOffset = 0;
    }

    reset() {
        this.numPackets = 0;
    }
    
    involvesNode(p) {
        return p === this.p1 || p === this.p2;
    }
    
    nodes() {
        return {
            node1: this.p1,
            node2: this.p2,
        };
    }
    
    draw(context) {
        context.beginPath();
        context.moveTo(this.p1.x, this.p1.y);
        context.lineWidth = 5;
        context.strokeStyle = (this.numPackets === 0) ? 'gray' : 'lime';
        context.lineTo(this.p2.x, this.p2.y);
        context.closePath();
        context.stroke();

        if (this.numPackets !== 0) {
            var angle = Math.atan2(this.p2.y - this.p1.y, this.p2.x - this.p1.x);
            angle += (this.dst === this.p1) ? Math.PI : 0;

            context.beginPath();
            var dist = 25;
            var p1x = this.p1.x - dist * Math.cos(angle + Math.PI / 2);
            var p1y = this.p1.y - dist * Math.sin(angle + Math.PI / 2);
            var p2x = this.p2.x - dist * Math.cos(angle + Math.PI / 2);
            var p2y = this.p2.y - dist * Math.sin(angle + Math.PI / 2);
            context.moveTo(p1x, p1y);
            context.lineTo(p2x, p2y);
            context.closePath();
            context.stroke();
            
            Triangle.draw({
                context: context,
                width: 30,
                x: this.dst.x - dist * Math.cos(angle + Math.PI / 2),
                y: this.dst.y - dist * Math.sin(angle + Math.PI / 2),
                angle: angle,
                color: 'lime',
            });
        }
    }
    
    serialize() {
        return [this.p1.name, this.p2.name].join(' ');
    }

    registerPrefix(src, announcement) {
        var dst = (src == this.p1.forwarder) ? this.p2.forwarder : this.p1.forwarder;
        console.log(src.node.name + " announcing " + announcement.prefix.toUri() + " to " + dst.node.name);
        return dst.registerPrefix(this, announcement);
    };

    sendInterest(src, interest) {
        this.dst = (src == this.p1.forwarder) ? this.p2 : this.p1;
        var dst = this.dst.forwarder;
        
        this.numPackets++;
        if (this.numPackets <= this.capacity) {
            return dst.receiveInterest(this, interest);
        }
    };

    sendData(src, data) {
        this.dst = (src == this.p1.forwarder) ? this.p2 : this.p1;
        var dst = this.dst.forwarder;
        
        this.numPackets++;
        if (this.numPackets <= this.capacity) {
            return dst.receiveData(this, data);
        }
    };
}