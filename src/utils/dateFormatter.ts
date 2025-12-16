/**
 * Огноог монгол форматаар харуулах utility функцүүд
 */

/**
 * Огноог монгол форматаар харуулах (бүрэн)
 * Жишээ: "2025 оны 12 сарын 17, 10:30"
 */
export const formatDateMN = (dateString: string | Date | null | undefined): string => {
  if (!dateString) return 'Огноо байхгүй';

  try {
    const date = new Date(dateString);

    // Invalid date шалгах
    if (isNaN(date.getTime())) {
      console.warn('Invalid date:', dateString);
      return 'Буруу огноо';
    }

    return date.toLocaleString('mn-MN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Огноо алдаатай';
  }
};

/**
 * Зөвхөн огноо (цаг минутгүй)
 * Жишээ: "2025 оны 12 сарын 17"
 */
export const formatDateOnlyMN = (dateString: string | Date | null | undefined): string => {
  if (!dateString) return 'Огноо байхгүй';

  try {
    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
      return 'Буруу огноо';
    }

    return date.toLocaleDateString('mn-MN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return 'Огноо алдаатай';
  }
};

/**
 * Богино формат
 * Жишээ: "17.12.2025"
 */
export const formatDateShortMN = (dateString: string | Date | null | undefined): string => {
  if (!dateString) return '-';

  try {
    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
      return '-';
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}.${month}.${year}`;
  } catch {
    return '-';
  }
};

/**
 * Цаг минут
 * Жишээ: "10:30"
 */
export const formatTimeMN = (dateString: string | Date | null | undefined): string => {
  if (!dateString) return '-';

  try {
    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
      return '-';
    }

    return date.toLocaleTimeString('mn-MN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '-';
  }
};

/**
 * Огноо + цаг богино формат
 * Жишээ: "17.12.2025 10:30"
 */
export const formatDateTimeMN = (dateString: string | Date | null | undefined): string => {
  if (!dateString) return '-';

  try {
    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
      return '-';
    }

    const dateStr = formatDateShortMN(date);
    const timeStr = formatTimeMN(date);

    return `${dateStr} ${timeStr}`;
  } catch {
    return '-';
  }
};

/**
 * Харьцуулсан огноо (relative time)
 * Жишээ: "2 цагийн өмнө", "3 өдрийн өмнө"
 */
export const formatRelativeTimeMN = (dateString: string | Date | null | undefined): string => {
  if (!dateString) return 'Огноо байхгүй';

  try {
    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
      return 'Буруу огноо';
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Яг одоо';
    if (diffMins === 1) return '1 минутын өмнө';
    if (diffMins < 60) return `${diffMins} минутын өмнө`;
    if (diffHours === 1) return '1 цагийн өмнө';
    if (diffHours < 24) return `${diffHours} цагийн өмнө`;
    if (diffDays === 1) return 'Өчигдөр';
    if (diffDays < 30) return `${diffDays} өдрийн өмнө`;

    return formatDateOnlyMN(date);
  } catch {
    return 'Огноо алдаатай';
  }
};
