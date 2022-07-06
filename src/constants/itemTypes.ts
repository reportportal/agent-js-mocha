/* eslint-disable @typescript-eslint/naming-convention */
export const entityType = {
  SUITE: 'suite',
  STEP: 'step',
  BEFORE_METHOD: 'BEFORE_METHOD',
  BEFORE_SUITE: 'BEFORE_SUITE',
  AFTER_METHOD: 'AFTER_METHOD',
  AFTER_SUITE: 'AFTER_SUITE',
}

export const hookTypes = {
  BEFORE_ALL: 'before all',
  BEFORE_EACH: 'before each',
  AFTER_ALL: 'after all',
  AFTER_EACH: 'after each',
}

export const hookTypesMap = {
  [hookTypes.BEFORE_EACH]: entityType.BEFORE_METHOD,
  [hookTypes.BEFORE_ALL]: entityType.BEFORE_SUITE,
  [hookTypes.AFTER_EACH]: entityType.AFTER_METHOD,
  [hookTypes.AFTER_ALL]: entityType.AFTER_SUITE,
}
