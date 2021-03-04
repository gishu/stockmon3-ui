import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Gain } from "./domain/gain";

import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StockmonService {

  constructor(private http: HttpClient) { }

  getGains(accountId: number, year: number) {
    let url = environment.stockmon3_service_base_url + `/accounts/${accountId}/gains/${year}`;
    return this.http.get(url)
      .toPromise()
      .then((res: any) => <Gain[]>res.data)
      .then(data => { return data; })
  }
}
