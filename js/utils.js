export function join(lookupTable, mainTable, lookupKey, mainKey, select) {
    const l = lookupTable.length,
        m = mainTable.length,
        lookupIndex = [],
        output = [];
    for (let i = 0; i < l; i++) { // loop through l items
        const row = lookupTable[i];
        lookupIndex[row[lookupKey]] = row; // create an index for lookup table
    }
    for (let j = 0; j < m; j++) { // loop through m items
        const y = mainTable[j];
        const x = lookupIndex[y[mainKey]]; // get corresponding row from lookupTable
        output.push(select(y, x)); // select only the columns you need
    }
    return output;
}