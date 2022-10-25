const tableElem = document.querySelector("#table");
tableElem.addEventListener('paste', (e) => {
    if (!e.clipboardData) return;
    const dataArr = getPastedData(e);
    if (dataArr.length === 1 && dataArr[0].length === 1) return;
    e.preventDefault();

    const target = e.target;
    const tdElem = target.closest("td");
    const targetCellIndex = tdElem.cellIndex;
    const trElem = tdElem.closest("tr");
    const targetRowIndex = trElem.rowIndex;

    addTableRowIfNecessary(targetRowIndex, dataArr.length);
    pasteData(dataArr, targetRowIndex, targetCellIndex);
})

function getPastedData(e) {
    let rawData = e.clipboardData.getData("text/plain");
    const rowData = rawData.split("\r\n");
    let arr = [];
    rowData.forEach((x, index) => {
        arr[index] = [];
        const colData = x.split("\t");
        colData.forEach(col => arr[index].push(col));
    });
    return arr;
}

function getElemToPaste(elem) {
    const inputElems = elem.getElementsByTagName('input');
    if (inputElems.length > 0) return inputElems[0];

    const selectElems = elem.getElementsByTagName('select');
    if (selectElems.length > 0) return selectElems[0];
}

function addTableRowIfNecessary(targetRowIndex, dataLength) {
    if (tableElem.rows.length < targetRowIndex + dataLength) {
        const rowToAdd = targetRowIndex + dataLength - tableElem.rows.length;
        let rowToClone = tableElem.rows[targetRowIndex];
        let cloneRow = rowToClone.cloneNode(true);

        Array.from(cloneRow.cells).forEach(col => {
            let elem = getElemToPaste(col);
            if(elem.type === 'checkbox') elem.checked = false;
            if (elem.type === 'radio') {
                Array.from(getRadioElems(col, elem.name)).forEach(x => x.checked = false);
            } else {
                elem.value = null;
            }
        });

        for (let i = 1; i <= rowToAdd; i++) {
            let row = cloneRow.cloneNode(true);
            rowToClone.parentNode.appendChild(row);
            updateNameOfElem(row);
            row = cloneRow.cloneNode(true);
        }
    }
}

function pasteData(dataArr, targetRowIndex, targetCellIndex) {
    dataArr.forEach((row, index) => {
        row.forEach((col, colIndex) => {
            let elem = tableElem.rows[targetRowIndex + index].cells[targetCellIndex + colIndex];
            let pasteElem = getElemToPaste(elem);
            if (pasteElem.type === 'checkbox') {
                pasteElem.value = pasteElem.checked = (col && col.toLowerCase() != "false" && col.toLowerCase() != "no");
            }
            if (pasteElem.type === "radio") {
                let radioElems = getRadioElems(elem, pasteElem.name);
                let toBeCheckedElem = Array.from(radioElems).find(x => x.value.toLowerCase() === col.toLowerCase());
                if (toBeCheckedElem) toBeCheckedElem.checked = true;
            } else {
                pasteElem.value = col;
            }
        })
    })
}

function getRadioElems(parentElem, name) {
    return parentElem.querySelectorAll(`input[name="${name}"]`);
}

function updateNameOfElem(row){
    Array.from(row.cells).forEach(col => {
        let elem = getElemToPaste(col);
        if (elem.type === 'radio') {
            Array.from(getRadioElems(col, elem.name)).forEach(x => x.name = x.name + "." + row.rowIndex);
        } else {
            elem.name = elem.name + "." + row.rowIndex;
        }
    });
}