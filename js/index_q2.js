import { join } from './utils.js';

function plot(items, orders, products) {
    const d0 = join(orders, items, "order_id", "order_id", function(item, order) {
        return {
            time: new Date(Date.parse(order["order_purchase_timestamp"])),
            product_id: item["product_id"],
        };
    });

    const d1 = join(products, d0, "product_id", "product_id", function(d, product) {
        const rawType = product["product_category_name"];
        let type;
        if (rawType.startsWith("construcao")) type = "construcao";
        else if (rawType.startsWith("fashion")) type = "fashion";
        else if (rawType.startsWith("moveis")) type = "moveis";
        else if (rawType.startsWith("livros")) type = "livros";
        else if (rawType.startsWith("consoles")) type = "informatica";
        else if (rawType.startsWith("dvds")) type = "informatica";
        else if (rawType.startsWith("eletro")) type = "informatica";
        else if (rawType.startsWith("informatica")) type = "informatica";
        else if (rawType.startsWith("pc")) type = "informatica";
        else if (rawType.startsWith("portateis")) type = "informatica";
        else if (rawType.startsWith("tablets")) type = "informatica";
        else type = rawType;

        return {time: d["time"], type: type};
    });

    const groups = d3.nest()
        .key(d => d.type)
        .entries(d1)
        .map(function (group) {
            const counts = {};
            group.values.map(data => data["time"].toDateString())
                .forEach(num => counts[num] = counts[num] ? counts[num] + 1 : 1);
            return {type: group.key, counts: counts};
        });

    const dataset = groups.flatMap(group => {
        return Object.entries(group.counts).map(entry => ({
            type: group.type,
            x: new Date(entry[0]),
            y: entry[1],
        }));
    });

    const sumstat = d3.nest().key(d => d.type).entries(dataset);
    Object.values(sumstat).forEach(entry => entry.values.sort((a, b) => b.x.getTime() - a.x.getTime()));

    const svg = d3.select("#g3");
    const margin = 60;
    const width = svg.attr("width") - 2 * margin;
    const height = svg.attr("height") - 2 * margin;

    const xScale = d3.scaleLinear().range([0, width]),
        yScale = d3.scaleLinear().range([height, 0]);

    function buildGraph(svg) {
        const g = svg.append("g")
            .attr("transform", "translate(" + 100 + "," + 100 + ")");

        xScale.domain(d3.extent(dataset, d => d.x));
        yScale.domain([0, d3.max(dataset, d => d.y)]);

        g.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(xScale).tickFormat((d, i) => new Date(d).getFullYear()).ticks(3));

        g.append("g")
            .call(d3.axisLeft(yScale).tickFormat(d => d + "").ticks(5))
            .append("text")
            .attr("y", 6)
            .attr("dy", "0.71em")
            .attr("text-anchor", "end")
            .text("value");

        svg.append('text')
            .attr('x', -(height / 2) - margin)
            .attr('y', margin / 2.4)
            .attr('transform', 'rotate(-90)')
            .attr('text-anchor', 'middle')
            .text('Número de compras');

        svg.append('text')
            .attr('x', width / 2 + margin)
            .attr('y', 40)
            .attr('text-anchor', 'middle')
            .text('Tempo');

        return g;
    }

    function buildData(g, dataset, sumstat) {
        const color = d3.scaleOrdinal()
            .domain(sumstat.map(d => d.key))
            .range(['#e41a1c','#377eb8','#4daf4a','#984ea3','#ff7f00'])

        const lines = g.selectAll(".line").data(sumstat).enter().append("g");

        lines.append("path")
            .attr("fill", "none")
            .attr("stroke", d => color(d.key))
            .attr("stroke-width", 2)
            .attr("d", d => d3.line()
                .x(d => xScale(d.x.getTime()))
                .y(d => yScale(d.y))
                (d.values));

        lines.on("mouseenter", function (actual, i) {
            d3.select(this)
                .transition()
                .duration(300)
                .attr('opacity', 0.6)

            const coordinates = d3.mouse(this);
            d3.select(this).append('text')
                .attr("class", "legend")
                .attr('x', coordinates[0] + 50)
                .attr('y', coordinates[1])
                .attr('fill', 'black')
                .attr('background-color', 'gray')
                .attr('text-anchor', 'middle')
                .text("Categoria: " + actual.key);
        })
            .on("mouseleave", function (actual, i) {
                d3.select(this)
                    .transition()
                    .duration(300)
                    .attr('opacity', 1);

                d3.selectAll('.legend').remove()
            })
    }

    const g = buildGraph(svg);
    buildData(g, dataset, sumstat);
}

export async function run() {
    const dataItems = await d3.csv("files/olist_order_items_dataset.csv");
    const dataOrders = await d3.csv("files/olist_orders_dataset.csv");
    const dataProducts = await d3.csv("files/olist_products_dataset.csv");
    plot(dataItems, dataOrders, dataProducts);
}
