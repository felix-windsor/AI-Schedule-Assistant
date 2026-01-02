/**
 * 时区验证工具
 * 验证 IANA 时区标识符是否有效
 */

// 常见的 IANA 时区列表（不完整，但覆盖主要时区）
const VALID_TIMEZONES = [
  // 亚洲
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Asia/Hong_Kong',
  'Asia/Singapore',
  'Asia/Seoul',
  'Asia/Dubai',
  'Asia/Kolkata',
  // 欧洲
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Moscow',
  // 美洲
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Toronto',
  'America/Sao_Paulo',
  // 澳洲
  'Australia/Sydney',
  'Australia/Melbourne',
  // UTC
  'UTC',
];

/**
 * 验证时区字符串是否为有效的 IANA 时区标识符
 * @param {string} timezone - 时区字符串
 * @returns {boolean} 是否为有效时区
 */
function isValidTimezone(timezone) {
  if (!timezone || typeof timezone !== 'string') {
    return false;
  }

  // 基本格式检查：应该包含 / 分隔符（UTC 除外）
  if (timezone === 'UTC') {
    return true;
  }

  if (!timezone.includes('/')) {
    return false;
  }

  // 检查是否在已知列表中
  if (VALID_TIMEZONES.includes(timezone)) {
    return true;
  }

  // 更宽松的验证：符合 IANA 时区命名规范
  // 格式：Continent/City 或 Region/City
  const timezonePattern = /^[A-Z][a-z]+\/[A-Z][a-z_]+$/;
  return timezonePattern.test(timezone);
}

/**
 * 验证 ISO 8601 时间格式（必须包含时区）
 * @param {string} dateTime - ISO 8601 时间字符串
 * @returns {boolean} 是否为有效格式
 */
function isValidISO8601WithTimezone(dateTime) {
  if (!dateTime || typeof dateTime !== 'string') {
    return false;
  }

  // 匹配格式：YYYY-MM-DDTHH:mm:ss+HH:mm 或 YYYY-MM-DDTHH:mm:ss-HH:mm
  const isoPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/;
  
  if (!isoPattern.test(dateTime)) {
    return false;
  }

  // 验证日期是否有效
  try {
    const date = new Date(dateTime);
    return !isNaN(date.getTime());
  } catch (error) {
    return false;
  }
}

module.exports = {
  isValidTimezone,
  isValidISO8601WithTimezone,
  VALID_TIMEZONES,
};

