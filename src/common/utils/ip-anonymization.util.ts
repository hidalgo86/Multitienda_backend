import { isIP } from 'net';

function anonymizeIpv4(ip: string): string | undefined {
  const parts = ip.split('.');
  if (parts.length !== 4) return undefined;

  const octets = parts.map((part) => Number(part));
  const isValidIpv4 = octets.every(
    (octet) => Number.isInteger(octet) && octet >= 0 && octet <= 255,
  );

  if (!isValidIpv4) return undefined;

  return `${octets[0]}.${octets[1]}.${octets[2]}.0`;
}

function anonymizeIpv6(ip: string): string {
  const withoutZone = ip.split('%')[0];
  const [head = '', tail = ''] = withoutZone.split('::');
  const headGroups = head.split(':').filter(Boolean);
  const tailGroups = tail.split(':').filter(Boolean);
  const missingGroups = withoutZone.includes('::')
    ? Math.max(0, 8 - headGroups.length - tailGroups.length)
    : 0;
  const groups = withoutZone.includes('::')
    ? [...headGroups, ...Array<string>(missingGroups).fill('0'), ...tailGroups]
    : withoutZone.split(':');

  if (groups.length !== 8) {
    return '::';
  }

  const visibleGroups = groups
    .slice(0, 3)
    .map((group) => Number.parseInt(group || '0', 16).toString(16))
    .join(':');

  return `${visibleGroups}::`;
}

export function anonymizeIp(ip?: string): string | undefined {
  const trimmedIp = ip?.trim();
  if (!trimmedIp) return undefined;

  const mappedIpv4 = trimmedIp.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i);
  if (mappedIpv4?.[1]) {
    return anonymizeIpv4(mappedIpv4[1]);
  }

  const detectedVersion = isIP(trimmedIp);
  if (detectedVersion === 4) {
    return anonymizeIpv4(trimmedIp);
  }

  if (detectedVersion === 6) {
    return anonymizeIpv6(trimmedIp);
  }

  return undefined;
}
