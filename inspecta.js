// Copyright 2013, odanielson@github.com
// MIT-license

Graph = function(container, width, height, infobox) {
    this.infobox = infobox;
    this.height = height;
    this.width = width;
    this.margin = 4;

    this.container = d3.select(container).append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(2,2)");

    this.selectCallbacks = {};

}

Graph.prototype.registerSelectCallback = function(name, callback) {
    this.selectCallbacks[name] = callback;
}

Graph.prototype.selectNode = function(node) {
    for (var key in this.selectCallbacks) {
        this.selectCallbacks[key](node);
    }
}

Graph.prototype.update = function(dataset) {
    console.log("new update")
    var pack = d3.layout.pack()
        .size([this.width - this.margin , this.height - this.margin])
        .value(function(d) { return d.size; })


    var format = d3.format(",d");

    var nodes = this.container.datum(dataset.nodes).selectAll("g")
        .data(pack.nodes, function(d) { return d.id;});

    var g_enter = nodes.enter().append("g")
        .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })

    var me = this;
    g_enter
        .append("circle")
        .attr("class", function(d) { return d.classname; })
        .attr("r", function(d) { return d.r; })
        .on("click", function(d, i) { me.selectNode(d); })

    g_enter
        .append("text")
        .attr("dy", ".3em")
        .style("text-anchor", "middle")
        .text(function(d) { return ((d.children.length == 0) ? d.name : "") });

    nodes.transition()
        .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
        .select("circle")
        .attr("class", function(d) { return d.classname; })
        .attr("r", function(d) { return d.r; })

    nodes.exit().remove("g");

    var getPos = function(id) {
        return dataset.all_nodes[id].x + "," + dataset.all_nodes[id].y;
    }

    var getPoint = function(id) {
        return [dataset.all_nodes[id].x, dataset.all_nodes[id].y];
    }

    var computeControlPoint = function(link) {
        var p1 = getPoint(link.src);
        var p2 = getPoint(link.dst);
        var v = Subtract(p2, p1);
        var v_n = Normalize(v);
        var orto = RotateLeft(v_n);
        var r = Norm(v) * 0.2;
        var c = Add(Add(p1, Multiply(v, 0.5)), Multiply(orto, r));
        return c[0] + "," + c[1];
    }

    var createLink = function(link) {
        return "M" + getPos(link.src) + "Q " + computeControlPoint(link) + " " + getPos(link.dst);
    }

    // Do something with dataset.links to.
    var links = this.container.selectAll("path").data(dataset.links, function(d) { return d.id;})

    links.enter()
        .append("path")
        .attr("class", "link")
        .attr("d", function(d) { return createLink(d); });

    links.transition()
        .attr("d", function(d) { return createLink(d); });

    links.exit().remove();

}

World = function() {
    this.nodes = {0: {"name": "",
                      "children_id": {}}
                 }
    this.links = {}

    World.prototype.addLink = function(link) {
        this.links[link.id] = link;
    }

    World.prototype.deleteLink = function(id) {
        delete this.links[id];
    }

    World.prototype.addNode = function(node) {
        node.children_id = {};
        this.nodes[node.id] = node;
        if (node.parent) {
            this.nodes[node.parent].children_id[node.id] = true;
        } else {
            this.nodes[0].children_id[node.id] = true;
        }
    }

    World.prototype.deleteNode = function(id) {
        for (var parent in this.nodes) {
            delete this.nodes[parent].children_id[id];
        }
        for (var child in this.nodes[id].children_id) {
            delete this.nodes[child];
        }
        delete this.nodes[id];
    }

    World.prototype.hashToList = function(hash) {
        var list = [];
        for (var key in hash) {
            list.push(hash[key]);
        }
        return list;
    }

    World.prototype.generateNode = function(id) {
        var node = this.nodes[id];
        node.children = [];
        for (var child in node.children_id) {
            node.children.push(this.generateNode(child));
        }
        return node;
    }

    World.prototype.generateGraphDataset = function() {
        return {"nodes": this.generateNode(0),
                "links": this.hashToList(this.links),
                "all_nodes": this.nodes}
    }
}
