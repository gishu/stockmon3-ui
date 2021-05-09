import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Gain } from './viewModel/gain';

import { environment } from 'src/environments/environment';

import * as _ from 'lodash';
import { Dividend } from './viewModel/dividend';

@Injectable({
  providedIn: 'root',
})
export class StockmonService {
  constructor(private http: HttpClient) {}

  getGains(accountId: number, year: number) {
    let url =
      environment.stockmon3_service_base_url +
      `/accounts/${accountId}/gains/${year}`;
    return this.http
      .get(url)
      .toPromise()
      .then((res: any) => <Gain[]>res.data)
      .then((data) => {
        return data;
      });
  }

  getDividends(accountId: number, year: number) {
    let url =
      environment.stockmon3_service_base_url +
      `/accounts/${accountId}/dividends/${year}`;
    return this.http
      .get(url)
      .toPromise()
      .then((res: any) => <Dividend[]>res.data)
      .then((data) => {
        return data;
      });
  }

  getHoldings(accountId: number) {
    let url =
      environment.stockmon3_service_base_url +
      `/accounts/${accountId}/holdings`;
    return this.http
      .get(url)
      .toPromise()
      .then((res: any) => {
        return res.data;
      });
  }

  getQuotes(symbols: string[]) {
    let url =
      environment.stockmon3_service_base_url +
      `/quotes?symbols=` +
      encodeURIComponent(symbols.join(','));

    return this.http
      .get(url)
      .toPromise()
      .then((res: any) => {
        return res.quotes;
      });
  }
}
