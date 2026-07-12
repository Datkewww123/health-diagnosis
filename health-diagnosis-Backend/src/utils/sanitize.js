const escapeLike = (str) => str.replace(/[%_[\]]/g, '\\$&');
module.exports = { escapeLike };
