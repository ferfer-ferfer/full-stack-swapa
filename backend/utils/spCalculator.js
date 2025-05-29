module.exports = function calculateSP(duration, role) {
    const rate = 0.2; // 1 SP for every 5 min
    return Math.ceil(duration * rate);
  };