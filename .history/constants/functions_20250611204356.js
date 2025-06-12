
export const getSafeEmail = (email) =>
  email ? email.toLowerCase().replace(/\./g, "_").replace(/@/g, "_") : "";