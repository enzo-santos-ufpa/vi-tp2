import { run as runQ1_1 } from './index_q1-1.js';
import { run as runQ1_2 } from './index_q1-2.js';
import { run as runQ2 } from './index_q2.js';

async function run() {
    await runQ1_1();
    await runQ1_2();
    await runQ2();

    document.getElementById("msg").innerHTML = ""
}

run();