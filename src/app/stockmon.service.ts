import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Gain } from "./domain/gain";

@Injectable({
  providedIn: 'root'
})
export class StockmonService {

  constructor(private http: HttpClient) { }

  getGains(accountId: number, year: number) {
    return this.http.get(`http://localhost:8000/accounts/${accountId}/gains/${year}`)
      .toPromise()
      .then((res: any) => <Gain[]>res.data)
      .then(data => { return data; })
  }
}
