function plot(dataset) {
    const svg = d3.select("#g1");
    const margin = 60;
    const width = svg.attr("width") - 2 * margin;
    const height = svg.attr("height") - 2 * margin;

    const xScale = d3.scaleBand().range([0, width]).padding(0.4),
        yScale = d3.scaleLinear().range([height, 0]);

    function buildGraph(svg) {
        const g = svg.append("g")
            .attr("transform", "translate(" + 100 + "," + 100 + ")");

        xScale.domain(items.map(item => item.name));
        yScale.domain([0, d3.max(relItems, (item) => item.value)]);

        g.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(xScale));

        g.append("g")
            .call(d3.axisLeft(yScale).tickFormat(d => d + "%").ticks(11))
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
            .text('Porcentagem (%)')

        svg.append('text')
            .attr('x', width / 2 + margin)
            .attr('y', 40)
            .attr('text-anchor', 'middle')
            .text('Avaliação dos usuários')

        return g;
    }

    function buildData(g, dataset) {
        const barGroups = g.selectAll(".bar").data(relItems).enter().append("g")

        barGroups.append('text')
            .attr('x', (d) => xScale(d.name) + xScale.bandwidth() / 2)
            .attr('y', (d) => yScale(d.value) - 10)
            .attr('text-anchor', 'middle')
            .text((d) => d.value.toFixed(2) + "%");

        barGroups.append("rect")
            .attr("class", "bar")
            .attr("x", d => xScale(d.name))
            .attr("y", d => yScale(d.value))
            .attr("width", xScale.bandwidth())
            .attr("height", d => height - yScale(d.value))

        barGroups
            .on("mouseenter", function (actual, i) {
                d3.select(this)
                    .transition()
                    .duration(300)
                    .attr('opacity', 0.6)

                d3.select(this).append('text')
                    .attr("class", "absolute")
                    .attr('x', (a) => xScale(a.name) + xScale.bandwidth() / 2)
                    .attr('y', (a) => yScale(a.value) + 30)
                    .attr('fill', 'white')
                    .attr('text-anchor', 'middle')
                    .text(dataset[i].value);
                })
                .on("mouseleave", function (actual, i) {
                    d3.select(this)
                        .transition()
                        .duration(300)
                        .attr('opacity', 1);

                    d3.selectAll('.absolute').remove()
            })


    }

    const counts = {};
    dataset.map(data => data["review_score"])
        .forEach(num => counts[num] = counts[num] ? counts[num] + 1 : 1);

    const items = Object.keys(counts).map(key => ({name: key, value: counts[key]}));
    items.sort((first, second) => {
        return parseInt(second.key) - parseInt(first.key);
    });

    const total = items.map(item => item.value).reduce((a, v) => a + v);
    const relItems = items.map(item => ({name: item.name, value: 100 * (item.value / total)}));

    const g = buildGraph(svg);
    buildData(g, items);
}

export async function run() {
    const data = await d3.csv("files/olist_order_reviews_dataset.csv");
    plot(data);
}
