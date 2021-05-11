import { join } from './utils.js';

function buildTimeGraph(reviews, orders) {
    const groups = d3.nest()
        .key(d => d.review_score)
        .entries(join(orders, reviews, "order_id", "order_id", function(review, order) {
            const delivered = Date.parse(order["order_delivered_customer_date"]);
            const estimated = Date.parse(order["order_estimated_delivery_date"]);
            return {
                review_score: review.review_score,
                days_delayed: Math.floor((delivered - estimated) / 86_400_000),
            };
        }))
        .map(function (group) {
            const counts = {};
            group.values.map(data => data["days_delayed"])
                .filter(days => !isNaN(days))
                .forEach(num => counts[num] = counts[num] ? counts[num] + 1 : 1);
            return {review_score: group.key, scores: counts};
        });

    const dataset = groups.flatMap(group => {
        return Object.entries(group.scores).map(entry => ({
            review_score: group.review_score,
            x: parseInt(entry[0]),
            y: entry[1],
        }));
    });

    const sumstat = d3.nest().key(d => d.review_score).entries(dataset);
    Object.values(sumstat).forEach(entry => entry.values.sort((a, b) => a.x - b.x));

    const svg = d3.select("#g2");
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
            .call(d3.axisBottom(xScale));

        g.append("g")
            .call(d3.axisLeft(yScale).tickFormat(d => d + "").ticks(11))
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
            .text('Ocorrências');

        svg.append('text')
            .attr('x', width / 2 + margin)
            .attr('y', 40)
            .attr('text-anchor', 'middle')
            .text('Diferença entre o tempo estimado e o tempo de entrega (dias)');

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
                .x(d => xScale(d.x))
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
                .text("Avaliação: " + actual.key);
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

async function run() {
    const dataReviews = await d3.csv("files/olist_order_reviews_dataset.csv");
    const dataOrders = await d3.csv("files/olist_orders_dataset.csv");
    buildTimeGraph(dataReviews, dataOrders);
}

run();