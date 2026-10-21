export type AccessRow = {
  tokenIdentifier?: string;
  isFixture?: boolean;
  slug?: string;
};

export function sessionOwnedByOther(
  rows: readonly AccessRow[],
  callerToken: string | undefined,
): boolean {
  return rows.some(
    (row) =>
      typeof row.tokenIdentifier === "string" &&
      row.tokenIdentifier.length > 0 &&
      row.tokenIdentifier !== callerToken,
  );
}

/** A signed-out caller only sees a row that has never been linked to Google. */
export function visibleSessionRow(
  row: AccessRow,
  callerToken: string | undefined,
): boolean {
  if (!row.tokenIdentifier) {
    return true;
  }
  return callerToken !== undefined && row.tokenIdentifier === callerToken;
}

/** Guest rows can move onto the signed-in profile. Fixtures and linked accounts stay put. */
export function isMergeableGuest(row: AccessRow): boolean {
  return !row.tokenIdentifier && !row.isFixture && !row.slug;
}

export function guestChipsWin(
  canonical: { languages: readonly string[]; updatedAt?: number },
  guest: { languages: readonly string[]; updatedAt?: number },
): boolean {
  if (guest.languages.length === 0) {
    return false;
  }
  if (canonical.languages.length === 0) {
    return true;
  }
  return (guest.updatedAt ?? 0) > (canonical.updatedAt ?? 0);
}

export function preferGuestCv(
  canonical: { cvStorageId?: string; updatedAt?: number },
  guest: { cvStorageId?: string; updatedAt?: number },
): boolean {
  if (!guest.cvStorageId) {
    return false;
  }
  if (!canonical.cvStorageId) {
    return true;
  }
  if (guest.cvStorageId === canonical.cvStorageId) {
    return false;
  }
  return (guest.updatedAt ?? 0) > (canonical.updatedAt ?? 0);
}
