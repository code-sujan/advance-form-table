const configOptions = {
    selectedClass : 'selectedCell',
    useOnClass : [],
    skipClass : [],
    handleCopy : false,
    handleDelete : false
}

function useTableSelector(config = {}) {
   config = { ...configOptions, ...config};
    let selection = [];
    let count = 1;
    let selectedClass = config.selectedClass;

    const Multiplier = 100000;

    document.body.addEventListener('mousedown', (e) => {
        if (!e.ctrlKey) {
            selection = [];
            count = 1;
            Array.from(document.querySelectorAll("." + selectedClass)).forEach(x => x.classList.remove(selectedClass));
            return;
        }

        let targetElem = e.target;
        let tdElem = (targetElem.tagName === 'td') ? targetElem :  targetElem.closest("td");
        if (!tdElem) return;
        let tableElem = tdElem.closest('table');
        if (!tableElem) return;
        e.preventDefault();

        let tableId = tableElem.id;
        if (!tableId) {
            tableId = `auto-table-id-for-copy-${count}`
            tableElem.id = tableId;
        }
        count++;

        let trElem = tdElem.closest("tr");
        let selected = selection[tableId];
        if (selected?.start) {
            let preSelectedElems = getCells(tableId, selected.start, selected.end);
            Array.from(preSelectedElems).forEach(x => x.classList.remove(selectedClass));
        }
        addSelectionStartIndex(tableId, trElem.rowIndex, tdElem.cellIndex);
    });

    document.body.addEventListener('mouseover', (e) => {
        if (!e.ctrlKey) return;
        if (!e.buttons) return;
        let targetElem = e.target;
        let tdElem = (targetElem.tagName === 'td') ? targetElem :  targetElem.closest("td");
        if (!tdElem) return;
        let tableElem = tdElem.closest('table');
        if (!tableElem) return;
        let tableId = tableElem.id;
        if (!selection[tableId] || !selection[tableId].start) return;
        e.preventDefault();

        let trElem = tdElem.closest("tr");
        addSelectionEndIndex(tableId, trElem.rowIndex, tdElem.cellIndex);
    });

    if(config.handleCopy){
        document.body.addEventListener('copy', (ev) => {
            let target = ev.target;
            if(target.tagName !== 'table'){
                target = target.closest('table');
            }
            if(!target) return;
            const tableId = target.id;
            if(!selection[tableId]) return;
            ev.clipboardData.setData('text/plain', getSelectedValues(tableId));
            ev.preventDefault();
        })
    }

    if(config.handleDelete){
        document.body.addEventListener('keydown', (ev) => {
            if(ev.key === 'Delete'){
                let target = ev.target;
                if(target.tagName !== 'table'){
                    target = target.closest('table');
                }
                if(!target) return;
                const tableId = target.id;
                const selected = selection[tableId];
                if(!selected) return;
                ev.preventDefault();
                let selectedElems = getCells(tableId, selected.start, selected.end);
                Array.from(selectedElems).forEach(cell => {
                    let elem = getElemToPaste(cell);
                    if(elem.type === 'checkbox') elem.checked = false;
                    if (elem.type === 'radio') {
                        Array.from(getRadioElems(cell, elem.name)).forEach(x => x.checked = false);
                    } else {
                        elem.value = null;
                    }
                })
            }
        })
    }

    function getElemToPaste(elem) {
        const inputElems = elem.getElementsByTagName('input');
        if (inputElems.length > 0) return inputElems[0];

        const selectElems = elem.getElementsByTagName('select');
        if (selectElems.length > 0) return selectElems[0];
    }


    function addSelectionStartIndex(tableId, rowIndex, cellIndex) {
        selection[tableId] = {
            start: rowIndex * Multiplier + cellIndex,
            end: null,
            prevEnd: null
        }
        displaySelectedCell(tableId);
    }

    function addSelectionEndIndex(tableId, rowIndex, cellIndex) {
        selection[tableId].prevEnd = selection[tableId].end;
        selection[tableId].end = rowIndex * Multiplier + cellIndex;
        if (selection[tableId].end === selection[tableId].prevEnd) return;
        displaySelectedCell(tableId);
    }

    function displaySelectedCell(tableId) {
        let selected = selection[tableId];
        if (selected.prevEnd) {
            let removedElems = getCells(tableId, selected.start, selected.prevEnd);
            Array.from(removedElems).forEach(x => x.classList.remove(selectedClass));
        }
        let elems = getCells(tableId, selected.start, selected.end);
        Array.from(elems).forEach(x => x.classList.add(selectedClass));
    }

    function getCells(tableId, start, end) {
        return getRowWiseCells(tableId, start, end)
            .reduce((list, x) => list.concat(x), []);
    }

    function getRowWiseCells(tableId, start, end) {
        const tableElem = document.querySelector(`#${tableId}`);
        let arr = [];
        if (!start) return arr;
        if (!end || start === end) {
            arr[rowIndex(start)] = tableElem.rows[rowIndex(start)].cells[cellIndex(start)];
        } else {
            const maxRow = Math.max(rowIndex(start), rowIndex(end));
            const minRow = Math.min(rowIndex(start), rowIndex(end));

            const maxCell = Math.max(cellIndex(start), cellIndex(end));
            const minCell = Math.min(cellIndex(start), cellIndex(end));

            return Array.from(tableElem.rows).filter(x => x.rowIndex <= maxRow && x.rowIndex >= minRow)
                .map(x => arr[x.rowIndex] = Array.from(x.cells).filter(x => x.cellIndex >= minCell && x.cellIndex <= maxCell));
        }
    }

    function getSelectedCells(tableId){
        const selected = selection[tableId];
        if(!selected) return null;
        return getCells(tableId, selected.start, selected.end);
    }
    
    function getSelectedValues(tableId, textRetriver = null) {
        const selected = selection[tableId];
        const selectedElems = getRowWiseCells(tableId, selected.start, selected.end);
        let rowWiseValues = selectedElems.map(x => x.map(x => getValueFromCell(x, textRetriver)).join('\t'));
        return rowWiseValues.join("\r\n");
    }

    function getValueFromCell(elem, textRetriever) {
        let inputElem = elem.querySelector("input");
        if (inputElem) {
            if (inputElem.type === 'checkbox') return (inputElem.checked).toString();
            if (inputElem.type === 'radio') {
                let radioElems = getRadioElems(elem, inputElem.name);
                return Array.from(radioElems).filter(x => x.checked)?.value;
            }
            return inputElem.value;
        }

        let selectElem = elem.querySelector("select");
        if (selectElem) return selectElem.options[selectElem.selectedIndex].text;
        textRetriever ??= (x) => x.textContent;
        return textRetriever(elem);
    }

    function getRadioElems(parentElem, name) {
        return parentElem.querySelectorAll(`input[name="${name}"]`);
    }

    const rowIndex = (value) => parseInt(value / Multiplier);
    const cellIndex = (value) => value % Multiplier;

    return {
        getSelectedCells,
        getSelectedValues
    };
}


