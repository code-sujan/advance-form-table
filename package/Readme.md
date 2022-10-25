# Table Data Selector
> `Table Data Selector` is a library that helps to select data, copy or delete from table / form on table.
Copied data can be directly pasted to excel.
It also provides selected cells and selected values which can be used as needed.

Demo : https://advance-form-table.netlify.app

## Installation

> npm
   ```npm
   npm i "table-data-selector"
   ```
> Yarn
   ```yarn
   yarn add "table-data-selector"
   ```

## Usages
```js
window.addEventListener("DOMContentLoaded", (ev) => {
        const tableSelector = useTableSelector();
    })

```

### Config Options
```js
{
    selectedClass : null,   // class applied on selected cell
    useOnClass : [],        // not applied yet
    skipClass : [],         // not applied yet
    handleCopy : false,     // handle copy event when set true
    handleDelete : false    // handle delete keypress when set true
}

```

### Exposed Methods
```js

/*
* @param {string} tableId
* @returns {Array}
*/
getSelectedCells(tableId);

/*
* @param {string} tableId
* @param { type: Function, default : (elem) => elem.textContent} textRetriever
* @returns {string}
*/
getSelectedValues(tableId, textRetriever = null);

```
