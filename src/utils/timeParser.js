const timeUnits = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

const parseDuration = (value) => {
  if (!value || typeof value !== "string") return null;

  const match = value.trim().toLowerCase().match(/^(\d+)([smhd])$/);
  if (!match) return null;

  const amount = Number(match[1]);
  const unit = match[2];
  if (!amount || amount <= 0) return null;

  return amount * timeUnits[unit];
};

const formatDuration = (milliseconds) => {
  if (!Number.isFinite(milliseconds) || milliseconds <= 0) return "Bilinmeyen";
  if (milliseconds % timeUnits.d === 0) return `${milliseconds / timeUnits.d}d`;
  if (milliseconds % timeUnits.h === 0) return `${milliseconds / timeUnits.h}h`;
  if (milliseconds % timeUnits.m === 0) return `${milliseconds / timeUnits.m}m`;
  return `${Math.round(milliseconds / timeUnits.s)}s`;
};

module.exports = {
  parseDuration,
  formatDuration,
};
