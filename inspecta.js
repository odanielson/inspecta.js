// Copyright 2013, odanielson@github.com
// MIT-license

Graph = function(container, width, height, infobox) {
    this.container = container;
    this.infobox = infobox;
    this.height = height;
    this.width = width;
    this.margin = 4;

    this.container = d3.select(container).append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(2,2)");


}

Graph.prototype.select_node = function(node) {

    data = {'title': node.type,
            'infolist': node.infolist }
    var html_info = new EJS({url: '/static/application/infobox.ejs'}).render(data)
    $("#header").html(html_info);

}

Graph.prototype.update = function(dataset) {
    console.log(dataset);
    var pack = d3.layout.pack()
        .size([this.width - this.margin , this.height - this.margin])
        .value(function(d) { return d.size; })


    var format = d3.format(",d");

    var nodes = this.container.datum(dataset.nodes).selectAll("g")
        .data(pack.nodes, function(d) { return d.id;});

    var g_enter = nodes.enter().append("g")
        .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })

    g_enter
        .append("circle")
        .attr("class", function(d) { return d.classname; })
        .attr("r", function(d) { return d.r; })

    g_enter
        .append("text")
        .attr("dy", ".3em")
        .style("text-anchor", "middle")
        .text(function(d) { return d.name; });

    nodes.transition()
        .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
        .select("circle")
        .attr("class", function(d) { return d.classname; })
        .attr("r", function(d) { return d.r; })

    nodes.exit().remove("g");

    console.log(dataset)
    var getPos = function(id) {
        return dataset.all_nodes[id].x + "," + dataset.all_nodes[id].y;
    }
    // Do something with dataset.links to.
    var links = this.container.selectAll("path").data(dataset.links, function(d) { return d.id;})
    console.log(links);
    links.enter()
        .append("path")
        .attr("class", "link")
        .attr("d", function(d) { return "M" + getPos(d.src) + " L" + getPos(d.dst);})

    links.transition()
        .attr("d", function(d) { return "M" + getPos(d.src) + " L" + getPos(d.dst);})

    links.exit().remove();
    console.log(dataset.links)

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
            console.log("deleting " + child);
            delete this.nodes[child];
        }
        console.log("deleting " + id);
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
