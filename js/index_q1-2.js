import { join } from './utils.js';

function buildTimeGraph(reviews, orders) {
    const svg = d3.select("#g2");
    const dataset = join(orders, reviews, "order_id", "order_id", function(review, order) {
        const delivered = Date.parse(order["order_delivered_customer_date"]);
        const estimated = Date.parse(order["order_estimated_delivery_date"]);
        return {
            review_score: review.review_score,
            days_delayed: Math.floor((delivered - estimated) / 86_400_000),
        };
    });

    const counts = {};
    dataset.map(data => data["days_delayed"])
        .filter(days => !isNaN(days))
        .forEach(num => counts[num] = counts[num] ? counts[num] + 1 : 1);

    console.log(counts);
    // const groups = d3.nest() // nest function allows to group the calculation per level of a factor
    //     .key(d => d.review_score)
    //     .entries(dataset);

    svg.selectAll(".line")
        .data(groups["4"])
        .enter()
        .append("path")
        .attr("fill", "none")
        .attr("stroke", function(d){ return color(d.key) })
        .attr("stroke-width", 1.5)
        .attr("d", function(d){
            return d3.line()
                .x(function(d) { return x(d.days_delayed); })
                .y(function(d) { return y(+d.n); })
                (d.values)
        })

}

async function run() {
    const dataReviews = await d3.csv("files/olist_order_reviews_dataset.csv");
    const dataOrders = await d3.csv("files/olist_orders_dataset.csv");
    buildTimeGraph(dataReviews, dataOrders);
}

run();