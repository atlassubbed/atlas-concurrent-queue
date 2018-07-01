const isNontrivial = n => !isNaN(n) && typeof n === "number" && n >= 1;

module.exports = { isNontrivial }
