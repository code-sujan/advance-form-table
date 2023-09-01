const configOptions = {
    selectedClass: 'selectedCell',
    useOnClass: [],
    skipClass: [],
    handleCopy: false,
    handleDelete: false,
    textRetriever: (x) => x.textContent,
    scrollableElemRetriever : () => window,
    summaryClass: 'table-selector-summary-display',
    scrollXFix: 0,
    scrollYFix: 0
}

const useTableSelector = (config = {}) => {
    config = {...configOptions, ...config};
    let selection = [];
    let count = 1;
    let selectedClass = config.selectedClass;
    let lastActiveTableId = "";

    const Multiplier = 100000;
    const Auto_Table_Id_Prefix = `auto-table-id-for-copy-`;

    document.body.addEventListener('mousedown', (e) => {
        if (!e.ctrlKey && !e.target.closest(`.${config.summaryClass}`)) {
            selection = [];
            count = 1;
            if (lastActiveTableId.startsWith(Auto_Table_Id_Prefix)) {
                let prevTableElem = document.getElementById(lastActiveTableId);
                prevTableElem.id = "";
            }
            emitSummaryInfo(lastActiveTableId);
            lastActiveTableId = "";
            Array.from(document.querySelectorAll("." + selectedClass)).forEach(x => x.classList.remove(selectedClass));
            return;
        }

        let targetElem = e.target;
        let tdElem = (targetElem.tagName === ('td' || 'th')) ? targetElem : targetElem.closest("td, th");
        if (!tdElem) return;
        let tableElem = tdElem.closest('table');
        if (!tableElem) return;
        e.preventDefault();

        let tableId = tableElem.id;
        if (!tableId) {
            tableId = `${Auto_Table_Id_Prefix}${count}`
            tableElem.id = tableId;
        }
        lastActiveTableId = tableId;
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
        let tdElem = (targetElem.tagName === ('td' || 'th')) ? targetElem : targetElem.closest("td, th");
        if (!tdElem) return;
        let tableElem = tdElem.closest('table');
        if (!tableElem) return;
        let tableId = tableElem.id;
        if (!selection[tableId] || !selection[tableId].start) return;
        e.preventDefault();

        let trElem = tdElem.closest("tr");
        addSelectionEndIndex(tableId, trElem.rowIndex, tdElem.cellIndex);
    });

    document.body.addEventListener('keydown', (ev) => {
        if (!ev.shiftKey || !lastActiveTableId) return;
        if (ev.code !== "ArrowLeft" && ev.code !== "ArrowRight" && ev.code !== "ArrowUp" && ev.code !== "ArrowDown") return;
        let selected = getActiveSection(lastActiveTableId);
        const tableElem = document.querySelector(`#${lastActiveTableId}`);
        const maxCellIndex = tableElem.rows[rowIndex(selected.end)].cells.length - 1;
        const maxRowIndex = tableElem.rows.length - 1;
        if (ev.code === "ArrowLeft") {
            selected.prevEnd = selected.end;
            if (cellIndex(selected.end) === 0) return;
            selected.end = rowIndex(selected.end) * Multiplier + cellIndex(selected.end) - 1;
        }
        if (ev.code === "ArrowRight") {
            let selected = getActiveSection(lastActiveTableId);
            selected.prevEnd = selected.end;
            if (cellIndex(selected.end) === maxCellIndex) return;
            selected.end = rowIndex(selected.end) * Multiplier + cellIndex(selected.end) + 1;
        }
        if (ev.code === "ArrowUp") {
            selected.prevEnd = selected.end;
            if (rowIndex(selected.end) === 1) return;
            selected.end -= Multiplier;
        }
        if (ev.code === "ArrowDown") {
            let selected = getActiveSection(lastActiveTableId);
            if (rowIndex(selected.end) === maxRowIndex) return;
            selected.prevEnd = selected.end;
            selected.end += Multiplier
        }
        displaySelectedCell(lastActiveTableId);
    });

    if (config.handleCopy) {
        document.body.addEventListener('copy', (ev) => {
            if(ev.target.closest(`.${config.summaryClass}`)) return;
            const tableId = lastActiveTableId;
            if (!selection[tableId]) return;
            ev.clipboardData.setData('text/plain', getSelectedValues(tableId));
            ev.preventDefault();
        })
    }

    if (config.handleDelete) {
        document.body.addEventListener('keydown', (ev) => {
            if (ev.key === 'Delete') {
                let tableId = lastActiveTableId;
                const selected = selection[tableId];
                if (!selected) return;
                ev.preventDefault();
                let selectedElems = getCells(tableId, selected.start, selected.end);
                Array.from(selectedElems).forEach(cell => {
                    let elem = getElemToPaste(cell);
                    if (elem.type === 'checkbox') elem.checked = false;
                    if (elem.type === 'radio') {
                        Array.from(getRadioElems(cell, elem.name)).forEach(x => x.checked = false);
                    } else {
                        elem.value = null;
                    }
                })
            }
        })
    }

    function getActiveSection(tableId) {
        return selection[tableId];
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
            end: rowIndex * Multiplier + cellIndex,
            prevEnd: null
        }
        lastActiveTableId = tableId;
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

        const tableElem = document.querySelector(`#${lastActiveTableId}`);
        let lastCell = tableElem.rows[rowIndex(selected.end)].cells[cellIndex(selected.end)];
        emitSummaryInfo(tableId, elems);
        MakeVisibleOnViewPort(lastCell);
    }

    function emitSummaryInfo(tableId, cells) {
        const result = {
            tableId: tableId,
            sum: 0,
            average: 0,
            count: 0,
            hasValue: false
        };
        if (cells && cells.length > 1) {
            let list = Array.from(cells).map(x => Number.parseFloat(getValueFromCell(x, config.textRetriever)));
            const count = list.length;
            list = list.filter(x => !isNaN(x));
            const numCount = list.length;
            const sum = list.reduce((res, item) => res + item, 0);
            result.average = sum / numCount;
            result.sum = sum;
            result.count = count;
            result.hasValue = true;
        }
        document.dispatchEvent(new CustomEvent('selected-summary', {detail: result, bubbles: true}));
    }

    function getCells(tableId, start, end) {
        let list = getRowWiseCells(tableId, start, end);
        return list.reduce((list, x) => list.concat(x), []);
    }

    function getRowWiseCells(tableId, start, end) {
        const tableElem = document.querySelector(`#${tableId}`);
        let arr = [];
        if (!start) return arr;
        if (!end || start === end) {
            arr[rowIndex(start)] = tableElem.rows[rowIndex(start)].cells[cellIndex(start)];
            return arr;
        } else {
            const maxRow = Math.max(rowIndex(start), rowIndex(end));
            const minRow = Math.min(rowIndex(start), rowIndex(end));

            const maxCell = Math.max(cellIndex(start), cellIndex(end));
            const minCell = Math.min(cellIndex(start), cellIndex(end));

            return Array.from(tableElem.rows).filter(x => x.rowIndex <= maxRow && x.rowIndex >= minRow)
                .map(x => arr[x.rowIndex] = Array.from(x.cells).filter(x => x.cellIndex >= minCell && x.cellIndex <= maxCell));
        }
    }

    function getSelectedCells(tableId) {
        const selected = selection[tableId];
        if (!selected) return null;
        return getCells(tableId, selected.start, selected.end);
    }

    function getSelectedValues(tableId) {
        const selected = selection[tableId];
        const selectedElems = getRowWiseCells(tableId, selected.start, selected.end);
        let rowWiseValues = selectedElems.map(x => x.map(x => getValueFromCell(x)).join('\t'));
        return rowWiseValues.join("\r\n");
    }

    function getValueFromCell(elem) {
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
        return config.textRetriever(elem);
    }

    function getRadioElems(parentElem, name) {
        return parentElem.querySelectorAll(`input[name="${name}"]`);
    }

    const rowIndex = (value) => parseInt(value / Multiplier);
    const cellIndex = (value) => value % Multiplier;
    const getWidth = (elem) => elem.offsetWidth ?? elem.innerWidth;
    const getHeight = (elem) => elem.offsetHeight ?? elem.innerHeight;

    function MakeVisibleOnViewPort(elem) {
        let data = elem.getBoundingClientRect();
        let scrollableElem = config.scrollableElemRetriever();
        let top = data.top;
        let left = data.left;
        let bottom = data.bottom;
        let right = data.right;
        if(scrollableElem !== window){
            let scrollElemData = scrollableElem.getBoundingClientRect();
            top -= scrollElemData.top;
            left -= scrollElemData.left;
            right -= scrollElemData.left;
            bottom -= scrollElemData.top;
        }
        const windowHeight = getHeight(config.scrollableElemRetriever());
        const windowWidth = getWidth(config.scrollableElemRetriever());
        if (left - data.width <= 0) scrollLeft(left-data.width);
        else if (top - data.height <= 0) scrollUp((top-data.height));
        else if (Math.floor(right) + data.width >= windowWidth) scrollRight((Math.floor(right) + data.width) - windowWidth);
        else if (bottom + data.height >= windowHeight) scrollDown((bottom + data.height) - windowHeight);
    }

    function scrollLeft(value) {
        config.scrollableElemRetriever().scrollBy({
            top: 0,
            left: value,
            behavior: "smooth"
        });
    }

    function scrollUp(value) {
        config.scrollableElemRetriever().scrollBy({
            top: value,
            left: 0,
            behavior: "smooth"
        });
    }

    function scrollRight(value) {
        config.scrollableElemRetriever().scrollBy({
            top: 0,
            left: value,
            behavior: "smooth"
        });
    }

    function scrollDown(value) {
        config.scrollableElemRetriever().scrollBy({
            top: value,
            left: 0,
            behavior: "smooth"
        });
    }

    return {
        getSelectedCells,
        getSelectedValues
    };
}

export default useTableSelector;
