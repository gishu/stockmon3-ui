import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Gain } from './viewModel/gain';

import { environment } from 'src/environments/environment';

import * as _ from 'lodash';

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
    let url = environment.stockmon3_service_base_url + `/quotes`;

    return this.http
      .post(url, { symbols: symbols })
      .toPromise()
      .then((res: any) => {
        return res.quotes;
      });
  }
}
