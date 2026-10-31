export function statusOf(device, now = Date.now()) {
  if (device.status === 'approved' && device.expiresAt && device.expiresAt <= now) return 'expired';
  return ['approved','pending','rejected'].includes(device.status) ? device.status : 'pending';
}
export function filteredDevices(devices, filter, query, now = Date.now()) {
  const term = query.trim().toLocaleLowerCase();
  return devices.filter(d => (filter === 'all' || (filter === 'watching' ? statusOf(d,now) === 'approved' && d.isWatching && now-(d.lastActiveAt||0)<120000 : statusOf(d,now) === filter)) &&
    (!term || [d.name,d.deviceId,d.platform,d.note,d.legacyDeviceId].some(value => String(value || '').toLocaleLowerCase().includes(term))))
    .sort((a,b) => (b.requestedAt || 0) - (a.requestedAt || 0));
}
export function approvalPatch(mode, days, now = Date.now()) {
  if (mode !== 'permanent' && mode !== 'scheduled') throw Error('Choose an access mode.');
  if (mode === 'scheduled' && (!Number.isInteger(days) || days < 1 || days > 3650)) throw Error('Duration must be 1–3650 days.');
  return {status:'approved',approvedAt:now,revokedAt:null,accessMode:mode,expiresAt:mode === 'permanent' ? null : now+days*86400000};
}
export function relativeTime(value, now = Date.now()) {
  if (!value) return 'Not recorded';
  const seconds = Math.max(0,Math.floor((now-value)/1000));
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds/60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds/3600)} hr ago`;
  return new Date(value).toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'});
}

export function csvCell(value) {
  let text=String(value??'');
  if (/^[=+@\-\t\r]/.test(text)) text="'"+text;
  return '"'+text.replaceAll('"','""')+'"';
}
