export const rkColor = (text) => `\u001B[35m${text}\u001B[39m`;
export const rkLog = (text) => console.log(`${rkColor('⚡')}: ${text}`);
export const readyLog = (serviceName, port) => console.log(`${rkColor('⚡')}: ${serviceName ? `${rkColor(serviceName)} l` : 'L'}istening${port ? ` on port ${rkColor(port.toString())}` : ''}!\n`);
export const rkPluginLog = (name, text) => console.log(`${rkColor(`⚡${name}`)}: ${text}`);
