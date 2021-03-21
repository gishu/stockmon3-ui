import { BigNumber } from 'bignumber.js';

export function asPercent(number : any) {
    if (!(number instanceof BigNumber)) {
        number = new BigNumber(number)
    }
    return number.decimalPlaces(4).toNumber();
}

export function asCurrency(number : any) {
    if (!(number instanceof BigNumber)) {
      number = new BigNumber(number)
    }
    return number.decimalPlaces(2).toNumber();
  }
  